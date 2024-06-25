import { Inject, Injectable } from '@nestjs/common';
import { SQL, and, count, eq } from 'drizzle-orm';

import { DrizzleClient, DrizzleTransaction } from 'src/drizzle/drizzle.client';
import { PaginationOptions } from 'src/pagination/models/pagination-options.model';
import { Page } from 'src/pagination/models/page.model';
import { treatmentMedicamentTakingScheduleTable } from './treatment-medicament-taking-schedule.table';

export type TreatmentMedicamentTakingSchedule =
  typeof treatmentMedicamentTakingScheduleTable.$inferSelect;
export type TreatmentMedicamentTakingScheduleCreation =
  typeof treatmentMedicamentTakingScheduleTable.$inferInsert;
export type TreatmentMedicamentTakingScheduleReplacement =
  TreatmentMedicamentTakingScheduleCreation;

export class TreatmentMedicamentTakingScheduleNotFoundError extends Error {}

export abstract class TreatmentMedicamentTakingScheduleFilter {
  abstract toSql(transaction: DrizzleTransaction): SQL<unknown> | undefined;
}

export class TreatmentMedicamentTakingScheduleUniqueTrait extends TreatmentMedicamentTakingScheduleFilter {
  private readonly condition: SQL<unknown> | undefined;

  constructor(id: TreatmentMedicamentTakingSchedule['id']) {
    super();

    this.condition = eq(treatmentMedicamentTakingScheduleTable.id, id);
  }

  toSql(): SQL<unknown> | undefined {
    return this.condition;
  }
}

export class FilterByTreatmentMedicamentTakingScheduleFields extends TreatmentMedicamentTakingScheduleFilter {
  constructor(
    private expectedTreatmentMedicamentTakingSchedule: Partial<TreatmentMedicamentTakingSchedule>,
  ) {
    super();
  }

  toSql(): SQL<unknown> | undefined {
    return and(
      ...Object.entries(this.expectedTreatmentMedicamentTakingSchedule)
        .filter(([, fieldValue]) => fieldValue !== undefined)
        .map(([fieldName, fieldValue]) =>
          eq(
            treatmentMedicamentTakingScheduleTable[
              fieldName as keyof TreatmentMedicamentTakingSchedule
            ],
            fieldValue,
          ),
        ),
    );
  }
}

@Injectable()
export class TreatmentMedicamentTakingScheduleRepository {
  constructor(
    @Inject('DRIZZLE_CLIENT')
    private readonly drizzleClient: DrizzleClient,
  ) {}

  async createMany(
    treatmentMedicamentTakingScheduleCreations: TreatmentMedicamentTakingScheduleCreation[],
    transaction?: DrizzleTransaction,
  ): Promise<TreatmentMedicamentTakingSchedule[]> {
    if (transaction === undefined) {
      return await this.drizzleClient.transaction(async (transaction) => {
        return await this.createMany(
          treatmentMedicamentTakingScheduleCreations,
          transaction,
        );
      });
    }
    const treatmentMedicamentTakingSchedules = await transaction
      .insert(treatmentMedicamentTakingScheduleTable)
      .values(treatmentMedicamentTakingScheduleCreations)
      .returning();

    return treatmentMedicamentTakingSchedules;
  }

  async create(
    treatmentMedicamentTakingScheduleCreation: TreatmentMedicamentTakingScheduleCreation,
    transaction?: DrizzleTransaction,
  ): Promise<TreatmentMedicamentTakingSchedule> {
    if (transaction === undefined) {
      return await this.drizzleClient.transaction(async (transaction) => {
        return await this.create(
          treatmentMedicamentTakingScheduleCreation,
          transaction,
        );
      });
    }

    const [treatmentMedicamentTakingSchedule] = await this.createMany(
      [treatmentMedicamentTakingScheduleCreation],
      transaction,
    );
    return treatmentMedicamentTakingSchedule;
  }

  async findPage(
    paginationOptions: PaginationOptions,
    filters: TreatmentMedicamentTakingScheduleFilter[] = [],
    transaction?: DrizzleTransaction,
  ): Promise<Page<TreatmentMedicamentTakingSchedule>> {
    if (transaction === undefined) {
      return await this.drizzleClient.transaction(async (transaction) => {
        return await this.findPage(paginationOptions, filters, transaction);
      });
    }
    const filteredTreatmentMedicamentTakingSchedulesQuery = transaction
      .select()
      .from(treatmentMedicamentTakingScheduleTable)
      .where(and(...filters.map((filter) => filter.toSql(transaction))))
      .as('filtered_treatment_medicaments');

    const filteredTreatmentMedicamentTakingSchedulesPage = await transaction
      .select()
      .from(filteredTreatmentMedicamentTakingSchedulesQuery)
      .offset(
        (paginationOptions.pageIndex - 1) * paginationOptions.itemsPerPage,
      )
      .limit(paginationOptions.itemsPerPage);

    const [{ filteredTreatmentMedicamentTakingSchedulesCount }] =
      await transaction
        .select({
          filteredTreatmentMedicamentTakingSchedulesCount: count(
            filteredTreatmentMedicamentTakingSchedulesQuery.id,
          ),
        })
        .from(filteredTreatmentMedicamentTakingSchedulesQuery);

    return {
      items: filteredTreatmentMedicamentTakingSchedulesPage,
      ...paginationOptions,
      pageCount: Math.ceil(
        filteredTreatmentMedicamentTakingSchedulesCount /
          paginationOptions.itemsPerPage,
      ),
      itemCount: filteredTreatmentMedicamentTakingSchedulesCount,
    };
  }

  async findAll(
    filters: TreatmentMedicamentTakingScheduleFilter[] = [],
    transaction?: DrizzleTransaction,
  ): Promise<TreatmentMedicamentTakingSchedule[]> {
    if (transaction === undefined) {
      return await this.drizzleClient.transaction(async (transaction) => {
        return await this.findAll(filters, transaction);
      });
    }
    return await transaction
      .select()
      .from(treatmentMedicamentTakingScheduleTable)
      .where(and(...filters.map((filter) => filter.toSql(transaction))));
  }

  async findOne(
    treatmentMedicamentTakingScheduleUniqueTrait: TreatmentMedicamentTakingScheduleUniqueTrait,
    filters: TreatmentMedicamentTakingScheduleFilter[] = [],
    transaction?: DrizzleTransaction,
  ): Promise<TreatmentMedicamentTakingSchedule | null> {
    if (transaction === undefined) {
      return await this.drizzleClient.transaction(async (transaction) => {
        return await this.findOne(
          treatmentMedicamentTakingScheduleUniqueTrait,
          filters,
          transaction,
        );
      });
    }
    const [treatmentMedicamentTakingSchedule = null] = await transaction
      .select()
      .from(treatmentMedicamentTakingScheduleTable)
      .where(
        and(
          treatmentMedicamentTakingScheduleUniqueTrait.toSql(),
          ...filters.map((filter) => filter.toSql(transaction)),
        ),
      );

    return treatmentMedicamentTakingSchedule;
  }

  async replace(
    treatmentMedicamentTakingScheduleUniqueTrait: TreatmentMedicamentTakingScheduleUniqueTrait,
    treatmentMedicamentTakingScheduleReplacement: TreatmentMedicamentTakingScheduleReplacement,
    transaction?: DrizzleTransaction,
  ): Promise<TreatmentMedicamentTakingSchedule> {
    if (transaction === undefined) {
      return await this.drizzleClient.transaction(async (transaction) => {
        return await this.replace(
          treatmentMedicamentTakingScheduleUniqueTrait,
          treatmentMedicamentTakingScheduleReplacement,
          transaction,
        );
      });
    }
    if (!(await this.findOne(treatmentMedicamentTakingScheduleUniqueTrait))) {
      throw new TreatmentMedicamentTakingScheduleNotFoundError();
    }

    const [treatmentMedicamentTakingSchedule] = await transaction
      .update(treatmentMedicamentTakingScheduleTable)
      .set(treatmentMedicamentTakingScheduleReplacement)
      .where(treatmentMedicamentTakingScheduleUniqueTrait.toSql())
      .returning();

    return treatmentMedicamentTakingSchedule;
  }

  async deleteMany(
    filters: TreatmentMedicamentTakingScheduleFilter[],
    transaction?: DrizzleTransaction,
  ): Promise<TreatmentMedicamentTakingSchedule[]> {
    if (transaction === undefined) {
      return await this.drizzleClient.transaction(async (transaction) => {
        return await this.deleteMany(filters, transaction);
      });
    }
    const treatmentMedicamentTakingSchedules = await transaction
      .delete(treatmentMedicamentTakingScheduleTable)
      .where(and(...filters.map((filter) => filter.toSql(transaction))))
      .returning();

    return treatmentMedicamentTakingSchedules;
  }

  async delete(
    treatmentMedicamentTakingScheduleUniqueTrait: TreatmentMedicamentTakingScheduleUniqueTrait,
    transaction?: DrizzleTransaction,
  ): Promise<TreatmentMedicamentTakingSchedule> {
    if (transaction === undefined) {
      return await this.drizzleClient.transaction(async (transaction) => {
        return await this.delete(
          treatmentMedicamentTakingScheduleUniqueTrait,
          transaction,
        );
      });
    }
    if (!(await this.findOne(treatmentMedicamentTakingScheduleUniqueTrait))) {
      throw new TreatmentMedicamentTakingScheduleNotFoundError();
    }

    const [treatmentMedicamentTakingSchedule] = await transaction
      .delete(treatmentMedicamentTakingScheduleTable)
      .where(treatmentMedicamentTakingScheduleUniqueTrait.toSql())
      .returning();

    return treatmentMedicamentTakingSchedule;
  }
}
