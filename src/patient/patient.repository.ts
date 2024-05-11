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

export type Patient = Omit<User, 'role'> &
  Omit<typeof patientTable.$inferSelect, 'id'>;
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
              this.expectedPatient.age
                ? eq(patientTable.age, this.expectedPatient.age)
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

        return this.buildPatientEntity(user, patient);
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

        return this.buildPatientEntity(user, patient);
      },
    );
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

        const [patient] = await transaction
          .update(patientTable)
          .set(patientReplacement)
          .where(eq(patientTable.id, user.id))
          .returning();

        return this.buildPatientEntity(user, patient);
      },
    );
  }

  private buildPatientEntity(
    user: User,
    rawPatient: typeof patientTable.$inferSelect,
  ): Patient {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { role, ...userWithoutRole } = user;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...rawPatientWithoutId } = rawPatient;

    return {
      ...userWithoutRole,
      ...rawPatientWithoutId,
    };
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

        await transaction
          .delete(patientTable)
          .where(eq(patientTable.id, patient.id));
        await this.userRepository.delete(patientUniqueTrait, transaction);

        return patient;
      },
    );
  }
}
