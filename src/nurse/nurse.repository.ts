import { Inject, Injectable } from '@nestjs/common';
import { and, count, eq } from 'drizzle-orm';
import * as generator from 'generate-password';
import * as bcrypt from 'bcrypt';

import { DrizzleClient, DrizzleTransaction } from 'src/drizzle/drizzle.client';
import { nurseTable } from './nurse.table';
import { PaginationOptions } from 'src/pagination/models/pagination-options.model';
import { Page } from 'src/pagination/models/page.model';

export type Nurse = typeof nurseTable.$inferSelect;
export type NurseUniqueTrait = {
  id?: Nurse['id'];
  email?: Nurse['email'];
  nationalId?: Nurse['nationalId'];
};
export type NurseCreation = Omit<typeof nurseTable.$inferInsert, 'password'> & {
  password?: (typeof nurseTable.$inferInsert)['password'];
};
export type NurseUpdate = Partial<NurseCreation>;

export class NurseNotFoundError extends Error {}

export type NurseFilters = Partial<Nurse>;

@Injectable()
export class NurseRepository {
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
    nurseCreation: NurseCreation,
    transaction?: DrizzleTransaction,
  ): Promise<Nurse> {
    return await (transaction ?? this.drizzleClient).transaction(
      async (transaction) => {
        const [nurse] = await transaction
          .insert(nurseTable)
          .values({
            ...nurseCreation,
            password: this.hashPassword(
              nurseCreation.password ?? this.generateRandomPassword(),
            ),
          })
          .returning();

        return nurse;
      },
    );
  }

  async findPage(
    paginationOptions: PaginationOptions,
    filters: NurseFilters,
    transaction?: DrizzleTransaction,
  ): Promise<Page<Nurse>> {
    return await (transaction ?? this.drizzleClient).transaction(
      async (transaction) => {
        const filteredNursesQuery = transaction
          .select()
          .from(nurseTable)
          .where(
            and(
              ...Object.entries(filters)
                .filter(([, fieldValue]) => fieldValue !== undefined)
                .map(([fieldName, fieldValue]) =>
                  eq(nurseTable[fieldName as keyof Nurse], fieldValue),
                ),
            ),
          )
          .as('filtered_nurses');

        const filteredNursesPage = await transaction
          .select()
          .from(filteredNursesQuery)
          .offset(
            (paginationOptions.pageIndex - 1) * paginationOptions.itemsPerPage,
          )
          .limit(paginationOptions.itemsPerPage);

        const [{ filteredNursesCount }] = await transaction
          .select({
            filteredNursesCount: count(filteredNursesQuery.id),
          })
          .from(filteredNursesQuery);

        return {
          items: filteredNursesPage,
          ...paginationOptions,
          pageCount: Math.ceil(
            filteredNursesCount / paginationOptions.itemsPerPage,
          ),
          itemCount: filteredNursesCount,
        };
      },
    );
  }

  private buildFilterConditionFromUniqueTrait(
    nurseUniqueTrait: NurseUniqueTrait,
  ) {
    if (nurseUniqueTrait.id) {
      return eq(nurseTable.id, nurseUniqueTrait.id);
    }
    if (nurseUniqueTrait.email) {
      return eq(nurseTable.email, nurseUniqueTrait.email);
    }
    return eq(nurseTable.nationalId, nurseUniqueTrait.nationalId!);
  }

  async findOne(
    nurseUniqueTrait: NurseUniqueTrait,
    transaction?: DrizzleTransaction,
  ): Promise<Nurse | null> {
    return await (transaction ?? this.drizzleClient).transaction(
      async (transaction) => {
        const [nurse = null] = await transaction
          .select()
          .from(nurseTable)
          .where(this.buildFilterConditionFromUniqueTrait(nurseUniqueTrait));

        return nurse;
      },
    );
  }

  async update(
    nurseUniqueTrait: NurseUniqueTrait,
    nurseUpdate: NurseUpdate,
    transaction?: DrizzleTransaction,
  ): Promise<Nurse> {
    return await (transaction ?? this.drizzleClient).transaction(
      async (transaction) => {
        if (!(await this.findOne(nurseUniqueTrait))) {
          throw new NurseNotFoundError();
        }

        const [nurse] = await transaction
          .update(nurseTable)
          .set({
            ...nurseUpdate,
            password: nurseUpdate.password
              ? this.hashPassword(nurseUpdate.password)
              : undefined,
          })
          .where(this.buildFilterConditionFromUniqueTrait(nurseUniqueTrait))
          .returning();

        return nurse;
      },
    );
  }

  async delete(
    nurseUniqueTrait: NurseUniqueTrait,
    transaction?: DrizzleTransaction,
  ): Promise<Nurse> {
    return await (transaction ?? this.drizzleClient).transaction(
      async (transaction) => {
        if (!(await this.findOne(nurseUniqueTrait))) {
          throw new NurseNotFoundError();
        }

        const [nurse] = await transaction
          .delete(nurseTable)
          .where(this.buildFilterConditionFromUniqueTrait(nurseUniqueTrait))
          .returning();

        return nurse;
      },
    );
  }
}
