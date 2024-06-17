import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as OneSignal from '@onesignal/node-onesignal';

import { DrizzleClient, DrizzleTransaction } from 'src/drizzle/drizzle.client';
import {
  Medicament,
  MedicamentRepository,
} from 'src/medicament/medicament.repository';
import { PaginationOptions } from 'src/pagination/models/pagination-options.model';
import { PatientMedicamentScheduleService } from 'src/patient/patient-medicament-schedule/patient-medicament-schedule.service';
import { PatientMedicamentSchedule } from 'src/patient/patient-medicament-schedule/schemas/schedule.schema';
import { Patient, PatientRepository } from 'src/patient/patient.repository';
import {
  FilterByTreatmentFields,
  TreatmentRepository,
} from 'src/treatment/treatment.repository';

@Injectable()
export class PushNotificationsService {
  private oneSignalClient: OneSignal.DefaultApi;

  constructor(
    @Inject('DRIZZLE_CLIENT')
    private readonly drizzleClient: DrizzleClient,
    private readonly patientRepository: PatientRepository,
    private readonly patientMedicamentScheduleService: PatientMedicamentScheduleService,
    private readonly medicamentRepository: MedicamentRepository,
    private readonly treatmentRepository: TreatmentRepository,
  ) {
    const config = OneSignal.createConfiguration({
      restApiKey: 'MWNkMWY0YWQtNmUwNS00NzM2LTg3ZTgtYWQ2NWRkYTYzZTcx',
    });

    this.oneSignalClient = new OneSignal.DefaultApi(config);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async sendPushNotifications(): Promise<void> {
    return await this.drizzleClient.transaction(async (transaction) => {
      let { pageIndex, pageCount } = await this.patientRepository.findPage(
        new PaginationOptions(1, 1),
        [],
        transaction,
      );
      const now = new Date(Date.now());

      while (pageIndex <= pageCount) {
        const { items } = await this.patientRepository.findPage(
          new PaginationOptions(pageIndex, pageCount),
          [],
          transaction,
        );

        await Promise.all(
          items.map(async (patient) => {
            await this.sendPushNotificationTo(patient, now, transaction);
          }),
        );
      }
    });
  }

  private async sendPushNotificationTo(
    patient: Patient,
    now: Date,
    transaction: DrizzleTransaction,
  ): Promise<void> {
    const [treatment] = (await this.treatmentRepository.findAll([
      new FilterByTreatmentFields({ patientId: patient.id }),
    ]))!;
    const schedule = await this.patientMedicamentScheduleService.findOne(
      patient.id,
      now,
      transaction,
    );

    await Promise.all(
      schedule.map(async (medicamentSchedule) => {
        const medicamentTakingToBeNotified =
          this.findTheMedicamentTakingToBeNotified(medicamentSchedule, now);
        if (!medicamentTakingToBeNotified) {
          return;
        }

        const wasAlreadyNotified = await this.wasAlreadyNotified(
          patient,
          medicamentSchedule.medicamentId,
          medicamentTakingToBeNotified.expectedTakingTimestamp,
        );
        if (wasAlreadyNotified) {
          return;
        }

        const medicament = (await this.medicamentRepository.findOne({
          id: medicamentSchedule.medicamentId,
        }))!;
        const treatmentMedicament = treatment.medicaments.find(
          (treatmentMedicament) =>
            treatmentMedicament.medicamentId === medicament.id,
        )!;
        const pushNotification = this.buildPushNotification(
          patient,
          medicament,
          treatmentMedicament.dose,
        );
        await this.oneSignalClient.createNotification(pushNotification);

        await this.markMedicamentTakingAsNotified(
          patient.id,
          medicamentSchedule.medicamentId,
          medicamentTakingToBeNotified.expectedTakingTimestamp,
        );
      }),
    );
  }

  private findTheMedicamentTakingToBeNotified(
    medicamentSchedule: PatientMedicamentSchedule,
    now: Date,
  ) {
    return medicamentSchedule.schedule
      .filter(
        (medicamentTaking) => medicamentTaking.actualTakingTimestamp === null,
      )
      .find((medicamentTaking) => {
        const MILLISECONDS_IN_A_MINUTE = 60_000;

        const expectedTakingTimestampPlus30Min = new Date(
          medicamentTaking.expectedTakingTimestamp.getUTCMilliseconds() +
            30 * MILLISECONDS_IN_A_MINUTE,
        );

        return (
          medicamentTaking.expectedTakingTimestamp <= now &&
          now <= expectedTakingTimestampPlus30Min
        );
      });
  }

  private async wasAlreadyNotified(
    patient: Patient,
    medicamentId: Medicament['id'],
    expectedTakingTimestamp: Date,
  ): Promise<boolean> {
    const oneSignalUser = await this.oneSignalClient.getUser(
      'ede82b86-6db6-4985-8e4d-4f01dd961baf',
      'external_id',
      `${patient.id}`,
    );
    if (!oneSignalUser.properties?.tags?.takenMedicaments) {
      return false;
    }

    const takenMedicaments = JSON.parse(
      oneSignalUser.properties?.tags?.takenMedicaments,
    );
    return takenMedicaments.includes(
      (medicamentTaken: {
        medicamentId: Medicament['id'];
        expectedTakingTimestamp: string;
      }) =>
        medicamentTaken.medicamentId === medicamentId &&
        medicamentTaken.expectedTakingTimestamp ===
          expectedTakingTimestamp.toISOString(),
    );
  }

  private buildPushNotification(
    patient: Patient,
    medicament: Medicament,
    dose: string,
  ): OneSignal.Notification {
    const pushNotification = new OneSignal.Notification();
    pushNotification.app_id = 'ede82b86-6db6-4985-8e4d-4f01dd961baf';
    pushNotification.headings = {
      es: `Ya es hora de consumir tu dósis de ${medicament.tradeName ?? medicament.genericName}`,
    };
    pushNotification.contents = {
      es: `Te corresponde consumir ${dose} de ${medicament.tradeName ?? medicament.genericName}`,
    };
    pushNotification.include_aliases = {
      external_id: [`${patient.id}`],
    };
    pushNotification.target_channel = 'push';

    return pushNotification;
  }

  private async markMedicamentTakingAsNotified(
    patientId: Patient['id'],
    medicamentId: Medicament['id'],
    expectedTakingTimestamp: Date,
  ): Promise<void> {
    const oneSignalUser = await this.oneSignalClient.getUser(
      'ede82b86-6db6-4985-8e4d-4f01dd961baf',
      'external_id',
      `${patientId}`,
    );

    const takenMedicaments = oneSignalUser.properties?.tags?.takenMedicaments
      ? JSON.parse(oneSignalUser.properties?.tags?.takenMedicaments)
      : [];
    takenMedicaments.push({
      medicamentId,
      expectedTakingTimestamp: expectedTakingTimestamp.toISOString(),
    });

    await this.oneSignalClient.updateUser(
      'ede82b86-6db6-4985-8e4d-4f01dd961baf',
      'external_id',
      `${patientId}`,
      {
        properties: {
          tags: {
            takenMedicaments: JSON.stringify(takenMedicaments),
          },
        },
      },
    );
  }
}
