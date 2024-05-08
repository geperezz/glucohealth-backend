import { Inject, Injectable } from '@nestjs/common';
import { and, count, eq, sql } from 'drizzle-orm';

import { DrizzleClient, DrizzleTransaction } from 'src/drizzle/drizzle.client';
import { medicamentTable } from './medicament.table';
import { PaginationOptions } from 'src/pagination/models/pagination-options.model';
import { Page } from 'src/pagination/models/page.model';
import { medicamentPresentationTable } from './medicament-presentation.table';
import { medicamentSideEffectTable } from './medicament-side-effect.table';

export type Medicament = typeof medicamentTable.$inferSelect & {
  presentations: (typeof medicamentPresentationTable.$inferSelect)['presentation'][];
  sideEffects: (typeof medicamentSideEffectTable.$inferSelect)['sideEffect'][];
};
export type MedicamentUniqueTrait = {
  id?: Medicament['id'];
  tradeName_genericName?: {
    tradeName: Medicament['tradeName'];
    genericName: Medicament['genericName'];
  };
};
export type MedicamentCreation = typeof medicamentTable.$inferInsert & {
  presentations: (typeof medicamentPresentationTable.$inferInsert)['presentation'][];
  sideEffects: (typeof medicamentSideEffectTable.$inferInsert)['sideEffect'][];
};
export type MedicamentReplacement = MedicamentCreation;
export type MedicamentFilters = Partial<
  Omit<Medicament, 'presentations' | 'sideEffects'>
>;

export class MedicamentNotFoundError extends Error {}

type QueryResult = typeof medicamentTable.$inferSelect & {
  presentations: (typeof medicamentPresentationTable.$inferSelect)[];
  sideEffects: (typeof medicamentSideEffectTable.$inferSelect)[];
};
function buildMedicamentFromQueryResult(queryResult: QueryResult): Medicament {
  return {
    ...queryResult,
    presentations: queryResult.presentations.map(
      (presentation) => presentation.presentation,
    ),
    sideEffects: queryResult.sideEffects.map(
      (sideEffect) => sideEffect.sideEffect,
    ),
  };
}

@Injectable()
export class MedicamentRepository {
  constructor(
    @Inject('DRIZZLE_CLIENT')
    private readonly drizzleClient: DrizzleClient,
  ) {}

  async create(
    medicamentCreation: MedicamentCreation,
    transaction?: DrizzleTransaction,
  ): Promise<Medicament> {
    return await (transaction ?? this.drizzleClient).transaction(
      async (transaction) => {
        const [medicament] = await transaction
          .insert(medicamentTable)
          .values(medicamentCreation)
          .returning({
            id: medicamentTable.id,
          });

        await transaction.insert(medicamentPresentationTable).values(
          medicamentCreation.presentations.map((presentation) => ({
            medicamentId: medicament.id,
            presentation,
          })),
        );

        await transaction.insert(medicamentSideEffectTable).values(
          medicamentCreation.sideEffects.map((sideEffect) => ({
            medicamentId: medicament.id,
            sideEffect,
          })),
        );

        return (await this.findOne({ id: medicament.id }, transaction))!;
      },
    );
  }

  async findPage(
    paginationOptions: PaginationOptions,
    filters: MedicamentFilters,
    transaction?: DrizzleTransaction,
  ): Promise<Page<Medicament>> {
    return await (transaction ?? this.drizzleClient).transaction(
      async (transaction) => {
        const filteredMedicamentsQuery = transaction
          .select({ id: medicamentTable.id })
          .from(medicamentTable)
          .where(
            and(
              ...Object.entries(filters)
                .filter(([, fieldValue]) => fieldValue !== undefined)
                .map(([fieldName, fieldValue]) =>
                  eq(
                    medicamentTable[fieldName as keyof typeof filters],
                    fieldValue !== null ? fieldValue : sql`NULL`,
                  ),
                ),
            ),
          )
          .as('filtered_medicaments');

        const filteredRawMedicamentsPage = await transaction
          .select()
          .from(filteredMedicamentsQuery)
          .offset(
            (paginationOptions.pageIndex - 1) * paginationOptions.itemsPerPage,
          )
          .limit(paginationOptions.itemsPerPage);

        const filteredMedicamentsPage = await Promise.all(
          filteredRawMedicamentsPage.map(
            async ({ id }) => (await this.findOne({ id }))!,
          ),
        );

        const [{ filteredMedicamentsCount }] = await transaction
          .select({
            filteredMedicamentsCount: count(filteredMedicamentsQuery.id),
          })
          .from(filteredMedicamentsQuery);

        return {
          items: filteredMedicamentsPage,
          ...paginationOptions,
          pageCount: Math.ceil(
            filteredMedicamentsCount / paginationOptions.itemsPerPage,
          ),
          itemCount: filteredMedicamentsCount,
        };
      },
    );
  }

  private buildFilterConditionFromUniqueTrait(
    medicamentUniqueTrait: MedicamentUniqueTrait,
  ) {
    if (medicamentUniqueTrait.id) {
      return eq(medicamentTable.id, medicamentUniqueTrait.id);
    }
    return and(
      eq(
        medicamentTable.tradeName,
        medicamentUniqueTrait.tradeName_genericName!.tradeName ?? sql`NULL`,
      ),
      eq(
        medicamentTable.genericName,
        medicamentUniqueTrait.tradeName_genericName!.genericName,
      ),
    );
  }

  async findOne(
    medicamentUniqueTrait: MedicamentUniqueTrait,
    transaction?: DrizzleTransaction,
  ): Promise<Medicament | null> {
    return await (transaction ?? this.drizzleClient).transaction(
      async (transaction) => {
        const [medicament = null] = await transaction
          .select()
          .from(medicamentTable)
          .where(
            this.buildFilterConditionFromUniqueTrait(medicamentUniqueTrait),
          );
        if (!medicament) {
          return null;
        }

        const presentations = await transaction
          .select()
          .from(medicamentPresentationTable)
          .where(eq(medicamentPresentationTable.medicamentId, medicament.id));

        const sideEffects = await transaction
          .select()
          .from(medicamentSideEffectTable)
          .where(eq(medicamentSideEffectTable.medicamentId, medicament.id));

        return buildMedicamentFromQueryResult({
          ...medicament,
          presentations,
          sideEffects,
        });
      },
    );
  }

  async replace(
    medicamentUniqueTrait: MedicamentUniqueTrait,
    medicamentReplacement: MedicamentReplacement,
    transaction?: DrizzleTransaction,
  ): Promise<Medicament> {
    return await (transaction ?? this.drizzleClient).transaction(
      async (transaction) => {
        const [medicament = null] = await transaction
          .update(medicamentTable)
          .set(medicamentReplacement)
          .where(
            this.buildFilterConditionFromUniqueTrait(medicamentUniqueTrait),
          )
          .returning({
            id: medicamentTable.id,
          });
        if (!medicament) {
          throw new MedicamentNotFoundError();
        }

        await transaction
          .delete(medicamentPresentationTable)
          .where(eq(medicamentPresentationTable.medicamentId, medicament.id));
        await transaction.insert(medicamentPresentationTable).values(
          medicamentReplacement.presentations.map((presentation) => ({
            medicamentId: medicament.id,
            presentation,
          })),
        );

        await transaction
          .delete(medicamentSideEffectTable)
          .where(eq(medicamentPresentationTable.medicamentId, medicament.id));
        await transaction.insert(medicamentSideEffectTable).values(
          medicamentReplacement.sideEffects.map((sideEffect) => ({
            medicamentId: medicament.id,
            sideEffect,
          })),
        );

        return (await this.findOne({ id: medicament.id }))!;
      },
    );
  }

  async delete(
    medicamentUniqueTrait: MedicamentUniqueTrait,
    transaction?: DrizzleTransaction,
  ): Promise<Medicament> {
    return await (transaction ?? this.drizzleClient).transaction(
      async (transaction) => {
        const medicament = await this.findOne(medicamentUniqueTrait);
        if (!medicament) {
          throw new MedicamentNotFoundError();
        }

        await transaction
          .delete(medicamentTable)
          .where(
            this.buildFilterConditionFromUniqueTrait(medicamentUniqueTrait),
          );

        return medicament;
      },
    );
  }
}
