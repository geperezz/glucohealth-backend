import { Inject, Injectable } from '@nestjs/common';
import * as cronParser from 'cron-parser';

import { PatientMedicamentSchedule } from './schemas/schedule.schema';
import {
  Patient,
  PatientRepository,
  PatientUniqueTrait,
} from 'src/patient/patient.repository';
import { DrizzleClient, DrizzleTransaction } from 'src/drizzle/drizzle.client';
import { TreatmentMedicament } from 'src/treatment/treatment-medicament/treatment-medicament.repository';
import {
  FilterByPatientMedicamentTakenFields,
  PatientMedicamentTakenRepository,
} from '../patient-medicament-taken/patient-medicament-taken.repository';

export class SchedulesServiceError extends Error {}
export class PatientNotFoundError extends SchedulesServiceError {}

@Injectable()
export class PatientMedicamentScheduleService {
  constructor(
    @Inject('DRIZZLE_CLIENT')
    private readonly drizzleClient: DrizzleClient,
    private readonly patientRepository: PatientRepository,
    private readonly patientMedicamentTakenRepositorry: PatientMedicamentTakenRepository,
  ) {}

  async findOne(
    patientId: Patient['id'],
    scheduleDate: Date,
    transaction?: DrizzleTransaction,
  ): Promise<PatientMedicamentSchedule[]> {
    return await (transaction ?? this.drizzleClient).transaction(
      async (transaction) => {
        const patient = await this.patientRepository.findOne(
          PatientUniqueTrait.fromId(patientId),
          [],
          transaction,
        );
        if (!patient) {
          throw new PatientNotFoundError();
        }

        return await Promise.all(
          patient.treatment.medicaments.map(async (medicament) => {
            const schedule = await this.getScheduleDetails(
              patient,
              medicament,
              scheduleDate,
              transaction,
            );

            return {
              medicamentId: medicament.medicamentId,
              schedule,
            };
          }),
        );
      },
    );
  }

  private async getScheduleDetails(
    patient: Patient,
    medicament: Omit<TreatmentMedicament, 'treatmentId'>,
    scheduleDate: Date,
    transaction: DrizzleTransaction,
  ) {
    if (scheduleDate < medicament.takingSchedulesStartingTimestamp) {
      return [];
    }
    if (
      medicament.takingSchedulesEndingTimestamp &&
      scheduleDate > medicament.takingSchedulesEndingTimestamp
    ) {
      return [];
    }

    const schedule = await Promise.all(
      medicament.takingSchedules.map(async ({ takingSchedule }) => {
        const takings = cronParser.parseExpression(takingSchedule, {
          currentDate: medicament.takingSchedulesStartingTimestamp,
          endDate: medicament.takingSchedulesEndingTimestamp ?? scheduleDate,
        });

        const schedule = [];
        while (takings.hasNext()) {
          const currentTakingTimestamp = takings.next().toDate();
          if (
            scheduleDate.toDateString() ===
            currentTakingTimestamp.toDateString()
          ) {
            schedule.push({
              expectedTakingTimestamp: currentTakingTimestamp,
              actualTakingTimestamp: await this.getActualTakingTimestamp(
                patient,
                medicament,
                scheduleDate,
                transaction,
              ),
            });
          }
        }
        return schedule;
      }),
    );

    return schedule.flat();
  }

  private async getActualTakingTimestamp(
    patient: Patient,
    medicament: Omit<TreatmentMedicament, 'treatmentId'>,
    scheduleDate: Date,
    transaction: DrizzleTransaction,
  ): Promise<Date | null> {
    const allTakings = await this.patientMedicamentTakenRepositorry.findAll(
      [
        new FilterByPatientMedicamentTakenFields({
          patientId: patient.id,
          medicamentId: medicament.medicamentId,
        }),
      ],
      transaction,
    );
    const taking = allTakings.find((taking) => {
      const MILLISECONDS_IN_A_MINUTE = 60_000;

      const takingTimestampPlus30Min = new Date(
        taking.takingTimestamp.getUTCMilliseconds() +
          30 * MILLISECONDS_IN_A_MINUTE,
      );

      return (
        taking.takingTimestamp <= scheduleDate &&
        scheduleDate <= takingTimestampPlus30Min
      );
    });

    return taking?.takingTimestamp ?? null;
  }
}
