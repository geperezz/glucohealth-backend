import { Inject, Injectable } from '@nestjs/common';
import { SQL, and, count, eq } from 'drizzle-orm';

import { DrizzleClient, DrizzleTransaction } from 'src/drizzle/drizzle.client';
import { patientMedicamentTakenTable } from './patient-medicament-taken.table';
import { PaginationOptions } from 'src/pagination/models/pagination-options.model';
import { Page } from 'src/pagination/models/page.model';
import {
  PatientNotFoundError,
  PatientRepository,
  PatientUniqueTrait,
} from '../patient.repository';

export type PatientMedicamentTaken =
  typeof patientMedicamentTakenTable.$inferSelect;
export type PatientMedicamentTakenCreation =
  typeof patientMedicamentTakenTable.$inferInsert;
export type PatientMedicamentTakenReplacement = PatientMedicamentTakenCreation;

export class PatientMedicamentTakenNotFoundError extends Error {}

export abstract class PatientMedicamentTakenFilter {
  abstract toSql(transaction: DrizzleTransaction): SQL<unknown> | undefined;
}

export class PatientMedicamentTakenUniqueTrait extends PatientMedicamentTakenFilter {
  private readonly condition: SQL<unknown>;

  constructor(id: PatientMedicamentTaken['id']) {
    super();

    this.condition = eq(patientMedicamentTakenTable.id, id);
  }

  toSql(): SQL<unknown> {
    return this.condition;
  }
}

export class FilterByPatientMedicamentTakenFields extends PatientMedicamentTakenFilter {
  constructor(
    private expectedPatientMedicamentTaken: Partial<PatientMedicamentTaken>,
  ) {
    super();
  }

  toSql(): SQL<unknown> | undefined {
    return and(
      ...Object.entries(this.expectedPatientMedicamentTaken)
        .filter(([, fieldValue]) => fieldValue !== undefined)
        .map(([fieldName, fieldValue]) =>
          eq(
            patientMedicamentTakenTable[
              fieldName as keyof PatientMedicamentTaken
            ],
            fieldValue,
          ),
        ),
    );
  }
}

@Injectable()
export class PatientMedicamentTakenRepository {
  constructor(
    @Inject('DRIZZLE_CLIENT')
    private readonly drizzleClient: DrizzleClient,
    private readonly patientRepository: PatientRepository,
  ) {}

  async create(
    patientMedicamentTakenCreation: PatientMedicamentTakenCreation,
    transaction?: DrizzleTransaction,
  ): Promise<PatientMedicamentTaken> {
    if (transaction === undefined) {
      return await this.drizzleClient.transaction(async (transaction) => {
        return await this.create(patientMedicamentTakenCreation, transaction);
      });
    }
    const patient = await this.patientRepository.findOne(
      PatientUniqueTrait.fromId(patientMedicamentTakenCreation.patientId),
      [],
      transaction,
    );
    if (!patient) {
      throw new PatientNotFoundError();
    }

    const [patientMedicamentTaken] = await transaction
      .insert(patientMedicamentTakenTable)
      .values(patientMedicamentTakenCreation)
      .returning();

    return patientMedicamentTaken;
  }

  async findPage(
    paginationOptions: PaginationOptions,
    filters: PatientMedicamentTakenFilter[] = [],
    transaction?: DrizzleTransaction,
  ): Promise<Page<PatientMedicamentTaken>> {
    if (transaction === undefined) {
      return await this.drizzleClient.transaction(async (transaction) => {
        return await this.findPage(paginationOptions, filters, transaction);
      });
    }
    const filteredPatientMedicamentTakenQuery = transaction
      .select()
      .from(patientMedicamentTakenTable)
      .where(and(...filters.map((filter) => filter.toSql(transaction))))
      .as('filtered_patient_medicaments_taken');

    const filteredPatientMedicamentTakenPage = await transaction
      .select()
      .from(filteredPatientMedicamentTakenQuery)
      .offset(
        (paginationOptions.pageIndex - 1) * paginationOptions.itemsPerPage,
      )
      .limit(paginationOptions.itemsPerPage);

    const [{ filteredPatientMedicamentTakensCount }] = await transaction
      .select({
        filteredPatientMedicamentTakensCount: count(
          filteredPatientMedicamentTakenQuery.patientId,
        ),
      })
      .from(filteredPatientMedicamentTakenQuery);

    return {
      items: filteredPatientMedicamentTakenPage,
      ...paginationOptions,
      pageCount: Math.ceil(
        filteredPatientMedicamentTakensCount / paginationOptions.itemsPerPage,
      ),
      itemCount: filteredPatientMedicamentTakensCount,
    };
  }

  async findAll(
    filters: PatientMedicamentTakenFilter[] = [],
    transaction?: DrizzleTransaction,
  ): Promise<PatientMedicamentTaken[]> {
    if (transaction === undefined) {
      return await this.drizzleClient.transaction(async (transaction) => {
        return await this.findAll(filters, transaction);
      });
    }
    return await transaction
      .select()
      .from(patientMedicamentTakenTable)
      .where(and(...filters.map((filter) => filter.toSql(transaction))));
  }

  async findOne(
    patientMedicamentTakenUniqueTrait: PatientMedicamentTakenUniqueTrait,
    filters: PatientMedicamentTakenFilter[] = [],
    transaction?: DrizzleTransaction,
  ): Promise<PatientMedicamentTaken | null> {
    if (transaction === undefined) {
      return await this.drizzleClient.transaction(async (transaction) => {
        return await this.findOne(
          patientMedicamentTakenUniqueTrait,
          filters,
          transaction,
        );
      });
    }
    const [patientMedicamentTaken = null] = await transaction
      .select()
      .from(patientMedicamentTakenTable)
      .where(
        and(
          ...filters.map((filter) => filter.toSql(transaction)),
          patientMedicamentTakenUniqueTrait.toSql(),
        ),
      );
    return patientMedicamentTaken;
  }

  async replace(
    patientMedicamentTakenUniqueTrait: PatientMedicamentTakenUniqueTrait,
    patientMedicamentTakenReplacement: PatientMedicamentTakenReplacement,
    transaction?: DrizzleTransaction,
  ): Promise<PatientMedicamentTaken> {
    if (transaction === undefined) {
      return await this.drizzleClient.transaction(async (transaction) => {
        return await this.replace(
          patientMedicamentTakenUniqueTrait,
          patientMedicamentTakenReplacement,
          transaction,
        );
      });
    }
    if (
      !(await this.findOne(patientMedicamentTakenUniqueTrait, [], transaction))
    ) {
      throw new PatientMedicamentTakenNotFoundError();
    }

    const patient = await this.patientRepository.findOne(
      PatientUniqueTrait.fromId(patientMedicamentTakenReplacement.patientId),
      [],
      transaction,
    );
    if (!patient) {
      throw new PatientNotFoundError();
    }

    const [patientMedicamentTaken] = await transaction
      .update(patientMedicamentTakenTable)
      .set(patientMedicamentTakenReplacement)
      .where(patientMedicamentTakenUniqueTrait.toSql())
      .returning();

    return patientMedicamentTaken;
  }

  async delete(
    patientMedicamentTakenUniqueTrait: PatientMedicamentTakenUniqueTrait,
    transaction?: DrizzleTransaction,
  ): Promise<PatientMedicamentTaken> {
    if (transaction === undefined) {
      return await this.drizzleClient.transaction(async (transaction) => {
        return await this.delete(
          patientMedicamentTakenUniqueTrait,
          transaction,
        );
      });
    }
    const patientMedicamentTaken = await this.findOne(
      patientMedicamentTakenUniqueTrait,
      [],
      transaction,
    );
    if (!patientMedicamentTaken) {
      throw new PatientMedicamentTakenNotFoundError();
    }

    await transaction
      .delete(patientMedicamentTakenTable)
      .where(patientMedicamentTakenUniqueTrait.toSql());

    return patientMedicamentTaken;
  }
}
