import { Inject, Injectable } from '@nestjs/common';
import { SQL, and, count, eq } from 'drizzle-orm';

import { DrizzleClient, DrizzleTransaction } from 'src/drizzle/drizzle.client';
import { PaginationOptions } from 'src/pagination/models/pagination-options.model';
import { Page } from 'src/pagination/models/page.model';
import { treatmentMedicamentTable } from './treatment-medicament.table';

export type TreatmentMedicament = typeof treatmentMedicamentTable.$inferSelect;
export type TreatmentMedicamentCreation =
  typeof treatmentMedicamentTable.$inferInsert;
export type TreatmentMedicamentReplacement = TreatmentMedicamentCreation;

export class TreatmentMedicamentNotFoundError extends Error {}

export abstract class TreatmentMedicamentFilter {
  abstract toSql(transaction: DrizzleTransaction): SQL<unknown> | undefined;
}

export class TreatmentMedicamentUniqueTrait extends TreatmentMedicamentFilter {
  private readonly condition: SQL<unknown> | undefined;

  constructor(
    treatmentId: TreatmentMedicament['treatmentId'],
    medicamentId: TreatmentMedicament['medicamentId'],
  ) {
    super();

    this.condition = and(
      eq(treatmentMedicamentTable.treatmentId, treatmentId),
      eq(treatmentMedicamentTable.medicamentId, medicamentId),
    );
  }

  toSql(): SQL<unknown> | undefined {
    return this.condition;
  }
}

export class FilterByTreatmentMedicamentFields extends TreatmentMedicamentFilter {
  constructor(
    private expectedTreatmentMedicament: Partial<TreatmentMedicament>,
  ) {
    super();
  }

  toSql(): SQL<unknown> | undefined {
    return and(
      ...Object.entries(this.expectedTreatmentMedicament)
        .filter(([, fieldValue]) => fieldValue !== undefined)
        .map(([fieldName, fieldValue]) =>
          eq(
            treatmentMedicamentTable[fieldName as keyof TreatmentMedicament],
            fieldValue,
          ),
        ),
    );
  }
}

@Injectable()
export class TreatmentMedicamentRepository {
  constructor(
    @Inject('DRIZZLE_CLIENT')
    private readonly drizzleClient: DrizzleClient,
  ) {}

  async createMany(
    treatmentMedicamentCreations: TreatmentMedicamentCreation[],
    transaction?: DrizzleTransaction,
  ): Promise<TreatmentMedicament[]> {
    return await (transaction ?? this.drizzleClient).transaction(
      async (transaction) => {
        const treatmentMedicaments = await transaction
          .insert(treatmentMedicamentTable)
          .values(treatmentMedicamentCreations)
          .returning();

        return treatmentMedicaments;
      },
    );
  }

  async create(
    treatmentMedicamentCreation: TreatmentMedicamentCreation,
    transaction?: DrizzleTransaction,
  ): Promise<TreatmentMedicament> {
    const [treatmentMedicament] = await this.createMany(
      [treatmentMedicamentCreation],
      transaction,
    );
    return treatmentMedicament;
  }

  async findPage(
    paginationOptions: PaginationOptions,
    filters: TreatmentMedicamentFilter[] = [],
    transaction?: DrizzleTransaction,
  ): Promise<Page<TreatmentMedicament>> {
    return await (transaction ?? this.drizzleClient).transaction(
      async (transaction) => {
        const filteredTreatmentMedicamentsQuery = transaction
          .select()
          .from(treatmentMedicamentTable)
          .where(and(...filters.map((filter) => filter.toSql(transaction))))
          .as('filtered_treatment_medicaments');

        const filteredTreatmentMedicamentsPage = await transaction
          .select()
          .from(filteredTreatmentMedicamentsQuery)
          .offset(
            (paginationOptions.pageIndex - 1) * paginationOptions.itemsPerPage,
          )
          .limit(paginationOptions.itemsPerPage);

        const [{ filteredTreatmentMedicamentsCount }] = await transaction
          .select({
            filteredTreatmentMedicamentsCount: count(
              filteredTreatmentMedicamentsQuery.treatmentId,
            ),
          })
          .from(filteredTreatmentMedicamentsQuery);

        return {
          items: filteredTreatmentMedicamentsPage,
          ...paginationOptions,
          pageCount: Math.ceil(
            filteredTreatmentMedicamentsCount / paginationOptions.itemsPerPage,
          ),
          itemCount: filteredTreatmentMedicamentsCount,
        };
      },
    );
  }

  async findAll(
    filters: TreatmentMedicamentFilter[] = [],
    transaction?: DrizzleTransaction,
  ): Promise<TreatmentMedicament[]> {
    return await (transaction ?? this.drizzleClient).transaction(
      async (transaction) => {
        return await transaction
          .select()
          .from(treatmentMedicamentTable)
          .where(and(...filters.map((filter) => filter.toSql(transaction))));
      },
    );
  }

  async findOne(
    treatmentMedicamentUniqueTrait: TreatmentMedicamentUniqueTrait,
    filters: TreatmentMedicamentFilter[] = [],
    transaction?: DrizzleTransaction,
  ): Promise<TreatmentMedicament | null> {
    return await (transaction ?? this.drizzleClient).transaction(
      async (transaction) => {
        const [treatmentMedicament = null] = await transaction
          .select()
          .from(treatmentMedicamentTable)
          .where(
            and(
              treatmentMedicamentUniqueTrait.toSql(),
              ...filters.map((filter) => filter.toSql(transaction)),
            ),
          );

        return treatmentMedicament;
      },
    );
  }

  async replace(
    treatmentMedicamentUniqueTrait: TreatmentMedicamentUniqueTrait,
    treatmentMedicamentReplacement: TreatmentMedicamentReplacement,
    transaction?: DrizzleTransaction,
  ): Promise<TreatmentMedicament> {
    return await (transaction ?? this.drizzleClient).transaction(
      async (transaction) => {
        if (!(await this.findOne(treatmentMedicamentUniqueTrait))) {
          throw new TreatmentMedicamentNotFoundError();
        }

        const [treatmentMedicament] = await transaction
          .update(treatmentMedicamentTable)
          .set(treatmentMedicamentReplacement)
          .where(treatmentMedicamentUniqueTrait.toSql())
          .returning();

        return treatmentMedicament;
      },
    );
  }

  async deleteMany(
    filters: TreatmentMedicamentFilter[],
    transaction?: DrizzleTransaction,
  ): Promise<TreatmentMedicament[]> {
    return await (transaction ?? this.drizzleClient).transaction(
      async (transaction) => {
        const treatmentMedicaments = await transaction
          .delete(treatmentMedicamentTable)
          .where(and(...filters.map((filter) => filter.toSql(transaction))))
          .returning();

        return treatmentMedicaments;
      },
    );
  }

  async delete(
    treatmentMedicamentUniqueTrait: TreatmentMedicamentUniqueTrait,
    transaction?: DrizzleTransaction,
  ): Promise<TreatmentMedicament> {
    return await (transaction ?? this.drizzleClient).transaction(
      async (transaction) => {
        if (!(await this.findOne(treatmentMedicamentUniqueTrait))) {
          throw new TreatmentMedicamentNotFoundError();
        }

        const [treatmentMedicament] = await transaction
          .delete(treatmentMedicamentTable)
          .where(treatmentMedicamentUniqueTrait.toSql())
          .returning();

        return treatmentMedicament;
      },
    );
  }
}
