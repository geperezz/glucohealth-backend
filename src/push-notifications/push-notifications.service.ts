import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as OneSignal from '@onesignal/node-onesignal';
import { DateTime } from 'luxon';

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
    try {
      return await this.drizzleClient.transaction(async (transaction) => {
        console.log('');
        console.log('Starting to send push notifications');
        let { pageIndex, pageCount, items } =
          await this.patientRepository.findPage(
            new PaginationOptions(1, 20),
            [],
            transaction,
          );

        const now = new Date(Date.now());

        do {
          await Promise.all(
            items.map(async (patient) => {
              await this.sendPushNotificationTo(patient, now, transaction);
            }),
          );

          ({ items } = await this.patientRepository.findPage(
            new PaginationOptions(++pageIndex, 20),
            [],
            transaction,
          ));
        } while (pageIndex <= pageCount);
        console.log('Finished to send push notifications');
      });
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  private async sendPushNotificationTo(
    patient: Patient,
    now: Date,
    transaction: DrizzleTransaction,
  ): Promise<void> {
    const [treatment] = (await this.treatmentRepository.findAll(
      [new FilterByTreatmentFields({ patientId: patient.id })],
      transaction,
    ))!;
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

        const medicament = (await this.medicamentRepository.findOne(
          {
            id: medicamentSchedule.medicamentId,
          },
          transaction,
        ))!;
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

        console.log(`Push notification sent to ${patient.fullName}`);
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
        const expectedTakingTimestampPlus30Min = new Date(
          medicamentTaking.expectedTakingTimestamp,
        );
        expectedTakingTimestampPlus30Min.setMinutes(
          medicamentTaking.expectedTakingTimestamp.getMinutes() + 30,
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
      en: `It's time to take your dose of ${medicament.tradeName ?? medicament.genericName}`,
      es: `Ya es hora de consumir tu dósis de ${medicament.tradeName ?? medicament.genericName}`,
    };
    pushNotification.contents = {
      en: `You have to take ${dose} of ${medicament.tradeName ?? medicament.genericName}`,
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
