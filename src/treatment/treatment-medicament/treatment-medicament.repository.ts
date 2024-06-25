import { Inject, Injectable } from '@nestjs/common';
import { SQL, and, count, eq, isNull } from 'drizzle-orm';
import { DateTime } from 'luxon';

import { DrizzleClient, DrizzleTransaction } from 'src/drizzle/drizzle.client';
import { PaginationOptions } from 'src/pagination/models/pagination-options.model';
import { Page } from 'src/pagination/models/page.model';
import { treatmentMedicamentTable } from './treatment-medicament.table';
import {
  FilterByTreatmentMedicamentTakingScheduleFields,
  TreatmentMedicamentTakingSchedule,
  TreatmentMedicamentTakingScheduleCreation,
  TreatmentMedicamentTakingScheduleRepository,
} from './treatment-medicament-taking-schedule/treatment-medicament-taking-schedule.repository';

export type TreatmentMedicament = Omit<
  typeof treatmentMedicamentTable.$inferSelect,
  'deletedAt'
> & {
  takingSchedules: Omit<
    TreatmentMedicamentTakingSchedule,
    'id' | 'treatmentMedicamentId'
  >[];
};
export type TreatmentMedicamentCreation = Omit<
  typeof treatmentMedicamentTable.$inferInsert,
  'deletedAt'
> & {
  takingSchedules: Omit<
    TreatmentMedicamentTakingScheduleCreation,
    'id' | 'treatmentMedicamentId'
  >[];
};
export type TreatmentMedicamentReplacement = TreatmentMedicamentCreation;

export class TreatmentMedicamentNotFoundError extends Error {}

export abstract class TreatmentMedicamentFilter {
  abstract toSql(transaction: DrizzleTransaction): SQL<unknown> | undefined;
}

export class TreatmentMedicamentUniqueTrait extends TreatmentMedicamentFilter {
  private readonly condition: SQL<unknown> | undefined;

  constructor(id: TreatmentMedicament['id']) {
    super();

    this.condition = eq(treatmentMedicamentTable.id, id);
  }

  toSql(): SQL<unknown> | undefined {
    return this.condition;
  }
}

export class FilterByTreatmentMedicamentFields extends TreatmentMedicamentFilter {
  constructor(
    private expectedTreatmentMedicament: Partial<
      Omit<TreatmentMedicament, 'deletedAt'>
    >,
  ) {
    super();
  }

  toSql(): SQL<unknown> | undefined {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { takingSchedules, ...filters } = this.expectedTreatmentMedicament;

    return and(
      ...Object.entries(filters)
        .filter(([, fieldValue]) => fieldValue !== undefined)
        .map(([fieldName, fieldValue]) =>
          fieldValue !== null
            ? eq(
                treatmentMedicamentTable[fieldName as keyof typeof filters],
                fieldValue,
              )
            : isNull(
                treatmentMedicamentTable[fieldName as keyof typeof filters],
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
    private readonly treatmentMedicamentTakingScheduleRepository: TreatmentMedicamentTakingScheduleRepository,
  ) {}

  async createMany(
    treatmentMedicamentCreations: TreatmentMedicamentCreation[],
    transaction?: DrizzleTransaction,
  ): Promise<TreatmentMedicament[]> {
    if (transaction === undefined) {
      return await this.drizzleClient.transaction(async (transaction) => {
        return await this.createMany(treatmentMedicamentCreations, transaction);
      });
    }
    return await Promise.all(
      treatmentMedicamentCreations.map(
        async (treatmentMedicamentCreation) =>
          await this.create(treatmentMedicamentCreation, transaction),
      ),
    );
  }

  async create(
    treatmentMedicamentCreation: TreatmentMedicamentCreation,
    transaction?: DrizzleTransaction,
  ): Promise<TreatmentMedicament> {
    if (transaction === undefined) {
      return await this.drizzleClient.transaction(async (transaction) => {
        return await this.create(treatmentMedicamentCreation, transaction);
      });
    }
    const [treatmentMedicament] = await transaction
      .insert(treatmentMedicamentTable)
      .values(treatmentMedicamentCreation)
      .returning();

    const takingSchedules =
      await this.treatmentMedicamentTakingScheduleRepository.createMany(
        treatmentMedicamentCreation.takingSchedules.map((takingSchedule) => ({
          ...takingSchedule,
          treatmentMedicamentId: treatmentMedicament.id,
        })),
        transaction,
      );

    return this.buildTreatmentMedicament(treatmentMedicament, takingSchedules);
  }

  private buildTreatmentMedicament(
    rawTreatmentMedicament: typeof treatmentMedicamentTable.$inferSelect,
    rawTakingSchedules: TreatmentMedicamentTakingSchedule[],
  ): TreatmentMedicament {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { deletedAt, ...rawTreatmentMedicamentWithoutDeletedAt } =
      rawTreatmentMedicament;
    const takingSchedules = rawTakingSchedules.map(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ({ id, treatmentMedicamentId, ...takingSchedule }) => takingSchedule,
    );
    return {
      ...rawTreatmentMedicamentWithoutDeletedAt,
      takingSchedules,
    };
  }

  async findPage(
    paginationOptions: PaginationOptions,
    filters: TreatmentMedicamentFilter[] = [],
    transaction?: DrizzleTransaction,
  ): Promise<Page<TreatmentMedicament>> {
    if (transaction === undefined) {
      return await this.drizzleClient.transaction(async (transaction) => {
        return await this.findPage(paginationOptions, filters, transaction);
      });
    }
    const filteredTreatmentMedicamentsQuery = transaction
      .select()
      .from(treatmentMedicamentTable)
      .where(
        and(
          ...filters.map(
            (filter) => filter.toSql(transaction),
            isNull(treatmentMedicamentTable.deletedAt),
          ),
        ),
      )
      .as('filtered_treatment_medicaments');

    const filteredRawTreatmentMedicamentsPage = await transaction
      .select({ id: filteredTreatmentMedicamentsQuery.id })
      .from(filteredTreatmentMedicamentsQuery)
      .offset(
        (paginationOptions.pageIndex - 1) * paginationOptions.itemsPerPage,
      )
      .limit(paginationOptions.itemsPerPage);
    const filteredTreatmentMedicamentsPage = await Promise.all(
      filteredRawTreatmentMedicamentsPage.map(
        async (rawTreatmentMedicament) =>
          (await this.findOne(
            new TreatmentMedicamentUniqueTrait(rawTreatmentMedicament.id),
            [],
            transaction,
          ))!,
      ),
    );

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
  }

  async findAll(
    filters: TreatmentMedicamentFilter[] = [],
    transaction?: DrizzleTransaction,
  ): Promise<TreatmentMedicament[]> {
    if (transaction === undefined) {
      return await this.drizzleClient.transaction(async (transaction) => {
        return await this.findAll(filters, transaction);
      });
    }
    const filteredRawTreatmentMedicamentsPage = await transaction
      .select({ id: treatmentMedicamentTable.id })
      .from(treatmentMedicamentTable)
      .where(
        and(
          ...filters.map((filter) => filter.toSql(transaction)),
          isNull(treatmentMedicamentTable.deletedAt),
        ),
      );
    return await Promise.all(
      filteredRawTreatmentMedicamentsPage.map(
        async (rawTreatmentMedicament) =>
          (await this.findOne(
            new TreatmentMedicamentUniqueTrait(rawTreatmentMedicament.id),
            [],
            transaction,
          ))!,
      ),
    );
  }

  async findOne(
    treatmentMedicamentUniqueTrait: TreatmentMedicamentUniqueTrait,
    filters: TreatmentMedicamentFilter[] = [],
    transaction?: DrizzleTransaction,
  ): Promise<TreatmentMedicament | null> {
    if (transaction === undefined) {
      return await this.drizzleClient.transaction(async (transaction) => {
        return await this.findOne(
          treatmentMedicamentUniqueTrait,
          filters,
          transaction,
        );
      });
    }
    const [treatmentMedicament = null] = await transaction
      .select()
      .from(treatmentMedicamentTable)
      .where(
        and(
          ...filters.map((filter) => filter.toSql(transaction)),
          treatmentMedicamentUniqueTrait.toSql(),
          isNull(treatmentMedicamentTable.deletedAt),
        ),
      );
    if (!treatmentMedicament) {
      return null;
    }

    const takingSchedules =
      await this.treatmentMedicamentTakingScheduleRepository.findAll(
        [
          new FilterByTreatmentMedicamentTakingScheduleFields({
            treatmentMedicamentId: treatmentMedicament.id,
          }),
        ],
        transaction,
      );

    return this.buildTreatmentMedicament(treatmentMedicament, takingSchedules);
  }

  async replace(
    treatmentMedicamentUniqueTrait: TreatmentMedicamentUniqueTrait,
    treatmentMedicamentReplacement: TreatmentMedicamentReplacement,
    transaction?: DrizzleTransaction,
  ): Promise<TreatmentMedicament> {
    if (transaction === undefined) {
      return await this.drizzleClient.transaction(async (transaction) => {
        return await this.replace(
          treatmentMedicamentUniqueTrait,
          treatmentMedicamentReplacement,
          transaction,
        );
      });
    }

    if (
      !(await this.findOne(treatmentMedicamentUniqueTrait, [], transaction))
    ) {
      throw new TreatmentMedicamentNotFoundError();
    }

    const [rawTreatmentMedicament] = await transaction
      .update(treatmentMedicamentTable)
      .set(treatmentMedicamentReplacement)
      .where(
        and(
          treatmentMedicamentUniqueTrait.toSql(),
          isNull(treatmentMedicamentTable.deletedAt),
        ),
      )
      .returning({ id: treatmentMedicamentTable.id });

    await this.treatmentMedicamentTakingScheduleRepository.deleteMany(
      [
        new FilterByTreatmentMedicamentTakingScheduleFields({
          treatmentMedicamentId: rawTreatmentMedicament.id,
        }),
      ],
      transaction,
    );
    await this.treatmentMedicamentTakingScheduleRepository.createMany(
      treatmentMedicamentReplacement.takingSchedules.map(
        (takingScheduleReplacement) => ({
          ...takingScheduleReplacement,
          treatmentMedicamentId: rawTreatmentMedicament.id,
        }),
      ),
      transaction,
    );

    return (await this.findOne(
      new TreatmentMedicamentUniqueTrait(rawTreatmentMedicament.id),
      [],
      transaction,
    ))!;
  }

  async deleteMany(
    filters: TreatmentMedicamentFilter[],
    transaction?: DrizzleTransaction,
  ): Promise<TreatmentMedicament[]> {
    if (transaction === undefined) {
      return await this.drizzleClient.transaction(async (transaction) => {
        return await this.deleteMany(filters, transaction);
      });
    }
    const treatmentMedicaments = await this.findAll(filters, transaction);

    await transaction
      .update(treatmentMedicamentTable)
      .set({ deletedAt: new Date(DateTime.now().toISO()) })
      .where(
        and(
          ...filters.map((filter) => filter.toSql(transaction)),
          isNull(treatmentMedicamentTable.deletedAt),
        ),
      );

    return treatmentMedicaments;
  }

  async delete(
    treatmentMedicamentUniqueTrait: TreatmentMedicamentUniqueTrait,
    transaction?: DrizzleTransaction,
  ): Promise<TreatmentMedicament> {
    if (transaction === undefined) {
      return await this.drizzleClient.transaction(async (transaction) => {
        return await this.delete(treatmentMedicamentUniqueTrait, transaction);
      });
    }
    const treatmentMedicament = await this.findOne(
      treatmentMedicamentUniqueTrait,
      [],
      transaction,
    );
    if (!treatmentMedicament) {
      throw new TreatmentMedicamentNotFoundError();
    }

    await transaction
      .update(treatmentMedicamentTable)
      .set({ deletedAt: new Date(DateTime.now().toISO()) })
      .where(isNull(treatmentMedicamentTable.deletedAt));

    return treatmentMedicament;
  }
}
