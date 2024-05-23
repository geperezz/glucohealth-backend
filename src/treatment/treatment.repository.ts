import { Inject, Injectable } from '@nestjs/common';
import { SQL, and, count, eq, isNull } from 'drizzle-orm';
import { DateTime } from 'luxon';

import { DrizzleClient, DrizzleTransaction } from 'src/drizzle/drizzle.client';
import { PaginationOptions } from 'src/pagination/models/pagination-options.model';
import { Page } from 'src/pagination/models/page.model';
import { treatmentTable } from './treatment.table';
import {
  FilterByTreatmentMedicamentFields,
  TreatmentMedicament,
  TreatmentMedicamentCreation,
  TreatmentMedicamentRepository,
} from './treatment-medicament/treatment-medicament.repository';

export type Treatment = Omit<
  typeof treatmentTable.$inferSelect,
  'deletedAt'
> & {
  medicaments: Omit<TreatmentMedicament, 'treatmentId'>[];
};
export type TreatmentCreation = Omit<
  typeof treatmentTable.$inferInsert,
  'deletedAt'
> & {
  medicaments: Omit<TreatmentMedicamentCreation, 'treatmentId'>[];
};
export type TreatmentReplacement = Omit<TreatmentCreation, 'patientId'>;

export class TreatmentNotFoundError extends Error {}

export abstract class TreatmentFilter {
  abstract toSql(transaction: DrizzleTransaction): SQL<unknown> | undefined;
}

export class TreatmentUniqueTrait extends TreatmentFilter {
  private readonly condition: SQL<unknown>;

  constructor(id: Treatment['id']) {
    super();

    this.condition = eq(treatmentTable.id, id);
  }

  toSql(): SQL<unknown> {
    return this.condition;
  }
}

export class FilterByTreatmentFields extends TreatmentFilter {
  constructor(private expectedTreatment: Partial<Treatment>) {
    super();
  }

  toSql(): SQL<unknown> | undefined {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { medicaments, ...treatmentFilters } = this.expectedTreatment;

    return and(
      ...Object.entries(treatmentFilters)
        .filter(([, fieldValue]) => fieldValue !== undefined)
        .map(([fieldName, fieldValue]) =>
          eq(
            treatmentTable[fieldName as keyof typeof treatmentFilters],
            fieldValue,
          ),
        ),
    );
  }
}

@Injectable()
export class TreatmentRepository {
  constructor(
    @Inject('DRIZZLE_CLIENT')
    private readonly drizzleClient: DrizzleClient,
    private readonly treatmentMedicamentRepository: TreatmentMedicamentRepository,
  ) {}

  async create(
    treatmentCreation: TreatmentCreation,
    transaction?: DrizzleTransaction,
  ): Promise<Treatment> {
    return await (transaction ?? this.drizzleClient).transaction(
      async (transaction) => {
        const [treatment] = await transaction
          .insert(treatmentTable)
          .values(treatmentCreation)
          .returning();

        const treatmentMedicaments =
          await this.treatmentMedicamentRepository.createMany(
            treatmentCreation.medicaments.map(
              (treatmentMedicamentCreation) => ({
                ...treatmentMedicamentCreation,
                treatmentId: treatment.id,
              }),
            ),
            transaction,
          );

        return this.buildTreatment(treatment, treatmentMedicaments);
      },
    );
  }

  async findPage(
    paginationOptions: PaginationOptions,
    filters: TreatmentFilter[] = [],
    transaction?: DrizzleTransaction,
  ): Promise<Page<Treatment>> {
    return await (transaction ?? this.drizzleClient).transaction(
      async (transaction) => {
        const filteredTreatmentsQuery = transaction
          .select()
          .from(treatmentTable)
          .where(
            and(
              ...filters.map((filter) => filter.toSql(transaction)),
              isNull(treatmentTable.deletedAt),
            ),
          )
          .as('filtered_treatments');

        const filteredRawTreatmentsPage = await transaction
          .select({ id: filteredTreatmentsQuery.id })
          .from(filteredTreatmentsQuery)
          .offset(
            (paginationOptions.pageIndex - 1) * paginationOptions.itemsPerPage,
          )
          .limit(paginationOptions.itemsPerPage);
        const filteredTreatmentsPage = await Promise.all(
          filteredRawTreatmentsPage.map(
            async (rawTreatment) =>
              (await this.findOne(
                new TreatmentUniqueTrait(rawTreatment.id),
                [],
                transaction,
              ))!,
          ),
        );

        const [{ filteredTreatmentsCount }] = await transaction
          .select({
            filteredTreatmentsCount: count(filteredTreatmentsQuery.id),
          })
          .from(filteredTreatmentsQuery);

        return {
          items: filteredTreatmentsPage,
          ...paginationOptions,
          pageCount: Math.ceil(
            filteredTreatmentsCount / paginationOptions.itemsPerPage,
          ),
          itemCount: filteredTreatmentsCount,
        };
      },
    );
  }

  async findAll(
    filters: TreatmentFilter[] = [],
    transaction?: DrizzleTransaction,
  ): Promise<Treatment[]> {
    return await (transaction ?? this.drizzleClient).transaction(
      async (transaction) => {
        const filteredRawTreatments = await transaction
          .select()
          .from(treatmentTable)
          .where(
            and(
              ...filters.map((filter) => filter.toSql(transaction)),
              isNull(treatmentTable.deletedAt),
            ),
          );

        const filteredTreatments = await Promise.all(
          filteredRawTreatments.map(
            async (rawTreatment) =>
              (await this.findOne(
                new TreatmentUniqueTrait(rawTreatment.id),
                [],
                transaction,
              ))!,
          ),
        );

        return filteredTreatments;
      },
    );
  }

  async findOne(
    treatmentUniqueTrait: TreatmentUniqueTrait,
    filters: TreatmentFilter[] = [],
    transaction?: DrizzleTransaction,
  ): Promise<Treatment | null> {
    return await (transaction ?? this.drizzleClient).transaction(
      async (transaction) => {
        const [treatment = null] = await transaction
          .select()
          .from(treatmentTable)
          .where(
            and(
              ...filters.map((filter) => filter.toSql(transaction)),
              treatmentUniqueTrait.toSql(),
              isNull(treatmentTable.deletedAt),
            ),
          );
        if (!treatment) {
          return null;
        }

        const treatmentMedicaments =
          await this.treatmentMedicamentRepository.findAll(
            [
              new FilterByTreatmentMedicamentFields({
                treatmentId: treatment.id,
              }),
            ],
            transaction,
          );

        return this.buildTreatment(treatment, treatmentMedicaments);
      },
    );
  }

  async replace(
    treatmentUniqueTrait: TreatmentUniqueTrait,
    treatmentReplacement: TreatmentReplacement,
    transaction?: DrizzleTransaction,
  ): Promise<Treatment> {
    return await (transaction ?? this.drizzleClient).transaction(
      async (transaction) => {
        if (!(await this.findOne(treatmentUniqueTrait, [], transaction))) {
          throw new TreatmentNotFoundError();
        }

        const [treatment] = await transaction
          .update(treatmentTable)
          .set(treatmentReplacement)
          .where(
            and(treatmentUniqueTrait.toSql(), isNull(treatmentTable.deletedAt)),
          )
          .returning();

        await this.treatmentMedicamentRepository.deleteMany(
          [
            new FilterByTreatmentMedicamentFields({
              treatmentId: treatment.id,
            }),
          ],
          transaction,
        );
        const treatmentMedicaments =
          await this.treatmentMedicamentRepository.createMany(
            treatmentReplacement.medicaments.map((treatmentMedicament) => ({
              ...treatmentMedicament,
              treatmentId: treatment.id,
            })),
            transaction,
          );

        return this.buildTreatment(treatment, treatmentMedicaments);
      },
    );
  }

  private buildTreatment(
    rawTreatment: typeof treatmentTable.$inferSelect,
    treatmentMedicaments: TreatmentMedicament[],
  ): Treatment {
    return {
      ...rawTreatment,
      medicaments: treatmentMedicaments.map(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ({ treatmentId, ...treatmentMedicament }) => treatmentMedicament,
      ),
    };
  }

  async delete(
    treatmentUniqueTrait: TreatmentUniqueTrait,
    transaction?: DrizzleTransaction,
  ): Promise<Treatment> {
    return await (transaction ?? this.drizzleClient).transaction(
      async (transaction) => {
        const treatment = await this.findOne(
          treatmentUniqueTrait,
          [],
          transaction,
        );
        if (!treatment) {
          throw new TreatmentNotFoundError();
        }

        await transaction
          .update(treatmentTable)
          .set({ deletedAt: new Date(DateTime.now().toISO()) })
          .where(eq(treatmentTable.id, treatment.id));

        return treatment;
      },
    );
  }
}
