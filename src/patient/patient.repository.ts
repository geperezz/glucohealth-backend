import { Inject, Injectable } from '@nestjs/common';
import { and, count, eq, sql } from 'drizzle-orm';
import * as generator from 'generate-password';
import * as bcrypt from 'bcrypt';

import { DrizzleClient, DrizzleTransaction } from 'src/drizzle/drizzle.client';
import { patientTable } from './patient.table';
import { PaginationOptions } from 'src/pagination/models/pagination-options.model';
import { Page } from 'src/pagination/models/page.model';

export type Patient = typeof patientTable.$inferSelect;
export type PatientUniqueTrait = {
  id?: Patient['id'];
  email?: Patient['email'];
  nationalId?: Patient['nationalId'];
};
export type PatientCreation = Omit<
  typeof patientTable.$inferInsert,
  'password'
> & {
  password?: (typeof patientTable.$inferInsert)['password'];
};
export type PatientUpdate = Partial<PatientCreation>;

export class PatientNotFoundError extends Error {}

export type PatientFilters = Partial<Patient>;

@Injectable()
export class PatientRepository {
  constructor(
    @Inject('DRIZZLE_CLIENT')
    private readonly drizzleClient: DrizzleClient,
  ) {}

  generateRandomPassword(): string {
    return generator.generate({
      length: 10,
      numbers: true,
    });
  }

  hashPassword(password: string): string {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
  }

  async create(
    patientCreation: PatientCreation,
    transaction?: DrizzleTransaction,
  ): Promise<Patient> {
    return await (transaction ?? this.drizzleClient).transaction(
      async (transaction) => {
        const [patient] = await transaction
          .insert(patientTable)
          .values({
            ...patientCreation,
            password: this.hashPassword(
              patientCreation.password ?? this.generateRandomPassword(),
            ),
          })
          .returning();

        return patient;
      },
    );
  }

  async findPage(
    paginationOptions: PaginationOptions,
    filters: PatientFilters,
    transaction?: DrizzleTransaction,
  ): Promise<Page<Patient>> {
    return await (transaction ?? this.drizzleClient).transaction(
      async (transaction) => {
        const filteredPatientsQuery = transaction
          .select()
          .from(patientTable)
          .where(
            and(
              ...Object.entries(filters)
                .filter(([, fieldValue]) => fieldValue !== undefined)
                .map(([fieldName, fieldValue]) =>
                  eq(
                    patientTable[fieldName as keyof Patient],
                    fieldValue !== null ? fieldValue : sql`NULL`,
                  ),
                ),
            ),
          )
          .as('filtered_patients');

        const filteredPatientsPage = await transaction
          .select()
          .from(filteredPatientsQuery)
          .offset(
            (paginationOptions.pageIndex - 1) * paginationOptions.itemsPerPage,
          )
          .limit(paginationOptions.itemsPerPage);

        const [{ filteredPatientsCount }] = await transaction
          .select({
            filteredPatientsCount: count(filteredPatientsQuery.id),
          })
          .from(filteredPatientsQuery);

        return {
          items: filteredPatientsPage,
          ...paginationOptions,
          pageCount: Math.ceil(
            filteredPatientsCount / paginationOptions.itemsPerPage,
          ),
          itemCount: filteredPatientsCount,
        };
      },
    );
  }

  private buildFilterConditionFromUniqueTrait(
    patientUniqueTrait: PatientUniqueTrait,
  ) {
    if (patientUniqueTrait.id) {
      return eq(patientTable.id, patientUniqueTrait.id);
    }
    return eq(patientTable.nationalId, patientUniqueTrait.nationalId!);
  }

  async findOne(
    patientUniqueTrait: PatientUniqueTrait,
    transaction?: DrizzleTransaction,
  ): Promise<Patient | null> {
    return await (transaction ?? this.drizzleClient).transaction(
      async (transaction) => {
        const [patient = null] = await transaction
          .select()
          .from(patientTable)
          .where(this.buildFilterConditionFromUniqueTrait(patientUniqueTrait));

        return patient;
      },
    );
  }

  async update(
    patientUniqueTrait: PatientUniqueTrait,
    patientUpdate: PatientUpdate,
    transaction?: DrizzleTransaction,
  ): Promise<Patient> {
    return await (transaction ?? this.drizzleClient).transaction(
      async (transaction) => {
        if (!(await this.findOne(patientUniqueTrait))) {
          throw new PatientNotFoundError();
        }

        const [patient] = await transaction
          .update(patientTable)
          .set({
            ...patientUpdate,
            password: patientUpdate.password
              ? this.hashPassword(patientUpdate.password)
              : undefined,
          })
          .where(this.buildFilterConditionFromUniqueTrait(patientUniqueTrait))
          .returning();

        return patient;
      },
    );
  }

  async delete(
    patientUniqueTrait: PatientUniqueTrait,
    transaction?: DrizzleTransaction,
  ): Promise<Patient> {
    return await (transaction ?? this.drizzleClient).transaction(
      async (transaction) => {
        if (!(await this.findOne(patientUniqueTrait))) {
          throw new PatientNotFoundError();
        }

        const [patient] = await transaction
          .delete(patientTable)
          .where(this.buildFilterConditionFromUniqueTrait(patientUniqueTrait))
          .returning();

        return patient;
      },
    );
  }
}
