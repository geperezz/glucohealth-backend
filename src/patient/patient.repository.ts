import { Inject, Injectable } from '@nestjs/common';
import { SQL, and, eq, inArray } from 'drizzle-orm';

import { DrizzleClient, DrizzleTransaction } from 'src/drizzle/drizzle.client';
import { patientTable } from './patient.table';
import { PaginationOptions } from 'src/pagination/models/pagination-options.model';
import { Page } from 'src/pagination/models/page.model';
import { userTable } from 'src/user/user.table';
import {
  FilterByUserFields,
  User,
  UserCreation,
  UserFilter,
  UserRepository,
  UserUniqueTrait,
} from 'src/user/user.repository';
import {
  FilterByTreatmentFields,
  Treatment,
  TreatmentRepository,
  TreatmentUniqueTrait,
} from 'src/treatment/treatment.repository';
import { DateTime } from 'luxon';

import { MailerService } from '@nestjs-modules/mailer';
import { MailNotSentError } from 'src/nurse/nurse.repository';

export type Patient = Omit<User, 'role'> &
  Omit<typeof patientTable.$inferSelect, 'id'> & {
    bmi: number | null;
    age: number | null;
    treatment: Omit<Treatment, 'patientId'>;
  };
export type PatientCreation = Omit<UserCreation, 'role' | 'password'> &
  Omit<typeof patientTable.$inferInsert, 'id'> & {
    password?: (typeof userTable.$inferInsert)['password'];
  };
export type PatientReplacement = PatientCreation;

export class PatientNotFoundError extends Error {}

export abstract class PatientFilter extends UserFilter {}

export const PatientUniqueTrait = UserUniqueTrait;
export type PatientUniqueTrait = UserUniqueTrait;

export class FilterByPatientFields extends PatientFilter {
  constructor(private expectedPatient: Partial<Patient>) {
    super();
  }

  toSql(transaction: DrizzleTransaction): SQL<unknown> | undefined {
    const filterByUserFields = new FilterByUserFields({
      ...this.expectedPatient,
      role: 'patient',
    });

    return and(
      filterByUserFields.toSql(),
      inArray(
        userTable.id,
        transaction
          .select({ id: patientTable.id })
          .from(patientTable)
          .where(
            and(
              this.expectedPatient.birthdate
                ? eq(patientTable.birthdate, this.expectedPatient.birthdate)
                : undefined,
              this.expectedPatient.weightInKg
                ? eq(patientTable.weightInKg, this.expectedPatient.weightInKg)
                : undefined,
              this.expectedPatient.heightInCm
                ? eq(patientTable.heightInCm, this.expectedPatient.heightInCm)
                : undefined,
            ),
          ),
      ),
    );
  }
}

@Injectable()
export class PatientRepository {
  constructor(
    @Inject('DRIZZLE_CLIENT')
    private readonly drizzleClient: DrizzleClient,
    private readonly userRepository: UserRepository,
    private readonly mailerService: MailerService,
    private readonly treatmentRepository: TreatmentRepository,
  ) {}

  async create(
    patientCreation: PatientCreation,
    transaction?: DrizzleTransaction,
  ): Promise<Patient> {
    return await (transaction ?? this.drizzleClient).transaction(
      async (transaction) => {
        const user = await this.userRepository.create(
          {
            ...patientCreation,
            role: 'patient',
          },
          transaction,
        );

        const [patient] = await transaction
          .insert(patientTable)
          .values({
            ...patientCreation,
            id: user.id,
          })
          .returning();

        const treatment = await this.treatmentRepository.create(
          { patientId: patient.id, medicaments: [] },
          transaction,
        );

        try {
          await this.mailerService.sendMail({
            to: user.email,
            subject: `Registro GlucoHealth`,
            template: './signup',
            context: {
              name: user.fullName,
              role: 'paciente',
              email: user.email,
              password: user.password,
            },
          });
        } catch (error) {
          throw new MailNotSentError(undefined, { cause: error });
        }

        return this.buildPatientEntity(user, patient, treatment);
      },
    );
  }

  async findPage(
    paginationOptions: PaginationOptions,
    filters: PatientFilter[] = [],
    transaction?: DrizzleTransaction,
  ): Promise<Page<Patient>> {
    return await (transaction ?? this.drizzleClient).transaction(
      async (transaction) => {
        const filteredUsersPage = await this.userRepository.findPage(
          paginationOptions,
          [...filters, new FilterByUserFields({ role: 'patient' })],
          transaction,
        );

        return {
          ...filteredUsersPage,
          items: await Promise.all(
            filteredUsersPage.items.map(
              async (user) =>
                (await this.findOne(PatientUniqueTrait.fromId(user.id)))!,
            ),
          ),
        };
      },
    );
  }

  async findOne(
    patientUniqueTrait: PatientUniqueTrait,
    filters: PatientFilter[] = [],
    transaction?: DrizzleTransaction,
  ): Promise<Patient | null> {
    return await (transaction ?? this.drizzleClient).transaction(
      async (transaction) => {
        const user = await this.userRepository.findOne(
          patientUniqueTrait,
          [...filters, new FilterByUserFields({ role: 'patient' })],
          transaction,
        );
        if (!user) {
          return null;
        }

        const [patient] = await transaction
          .select()
          .from(patientTable)
          .where(eq(patientTable.id, user.id));

        const [treatment] = await this.treatmentRepository.findAll(
          [new FilterByTreatmentFields({ patientId: patient.id })],
          transaction,
        );

        return this.buildPatientEntity(user, patient, treatment);
      },
    );
  }

  private buildPatientEntity(
    user: User,
    rawPatient: typeof patientTable.$inferSelect,
    treatment: Treatment,
  ): Patient {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { role, ...userWithoutRole } = user;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...rawPatientWithoutId } = rawPatient;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { patientId, ...treatmentWithoutPatientId } = treatment;

    const age = rawPatient.birthdate
      ? Math.floor(
          DateTime.now()
            .diff(DateTime.fromJSDate(rawPatient.birthdate), 'years')
            .toObject().years!,
        )
      : null;

    const bmi =
      rawPatient.weightInKg && rawPatient.heightInCm
        ? rawPatient.weightInKg / Math.pow(rawPatient.heightInCm / 100, 2)
        : null;

    return {
      ...userWithoutRole,
      ...rawPatientWithoutId,
      treatment: treatmentWithoutPatientId,
      age,
      bmi,
    };
  }

  async replace(
    patientUniqueTrait: PatientUniqueTrait,
    patientReplacement: PatientReplacement,
    transaction?: DrizzleTransaction,
  ): Promise<Patient> {
    return await (transaction ?? this.drizzleClient).transaction(
      async (transaction) => {
        if (!(await this.findOne(patientUniqueTrait))) {
          throw new PatientNotFoundError();
        }

        const user = await this.userRepository.replace(
          patientUniqueTrait,
          {
            ...patientReplacement,
            role: 'patient',
          },
          transaction,
        );

        await transaction
          .update(patientTable)
          .set(patientReplacement)
          .where(eq(patientTable.id, user.id));

        return (await this.findOne(PatientUniqueTrait.fromId(user.id)))!;
      },
    );
  }

  async delete(
    patientUniqueTrait: PatientUniqueTrait,
    transaction?: DrizzleTransaction,
  ): Promise<Patient> {
    return await (transaction ?? this.drizzleClient).transaction(
      async (transaction) => {
        const patient = await this.findOne(patientUniqueTrait);
        if (!patient) {
          throw new PatientNotFoundError();
        }

        await this.treatmentRepository.delete(
          new TreatmentUniqueTrait(patient.treatment.id),
        );
        await transaction
          .delete(patientTable)
          .where(eq(patientTable.id, patient.id));
        await this.userRepository.delete(patientUniqueTrait, transaction);

        return patient;
      },
    );
  }
}
