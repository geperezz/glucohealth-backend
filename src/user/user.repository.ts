import { Inject, Injectable } from '@nestjs/common';
import { SQL, and, count, eq, sql } from 'drizzle-orm';
import * as generator from 'generate-password';
import * as bcrypt from 'bcrypt';

import { DrizzleClient, DrizzleTransaction } from 'src/drizzle/drizzle.client';
import { userTable } from './user.table';
import { PaginationOptions } from 'src/pagination/models/pagination-options.model';
import { Page } from 'src/pagination/models/page.model';

export type User = typeof userTable.$inferSelect;
export type UserCreation = Omit<typeof userTable.$inferInsert, 'password'> & {
  password?: (typeof userTable.$inferInsert)['password'];
};
export type UserReplacement = UserCreation;

export class UserNotFoundError extends Error {}

export abstract class UserFilter {
  abstract toSql(transaction: DrizzleTransaction): SQL<unknown> | undefined;
}

export class UserUniqueTrait extends UserFilter {
  private constructor(private condition: SQL<unknown>) {
    super();
  }

  static fromId(id: User['id']): UserUniqueTrait {
    return new UserUniqueTrait(eq(userTable.id, id));
  }

  static fromNationalId(nationalId: User['nationalId']): UserUniqueTrait {
    return new UserUniqueTrait(eq(userTable.nationalId, nationalId));
  }

  static fromEmail(email: User['email']): UserUniqueTrait {
    return new UserUniqueTrait(eq(userTable.email, email));
  }

  toSql(): SQL<unknown> {
    return this.condition;
  }
}

export class FilterByUserFields extends UserFilter {
  constructor(private expectedUser: Partial<User>) {
    super();
  }

  toSql(): SQL<unknown> | undefined {
    return and(
      ...Object.entries(this.expectedUser)
        .filter(([, fieldValue]) => fieldValue !== undefined)
        .map(([fieldName, fieldValue]) =>
          eq(
            userTable[fieldName as keyof User],
            fieldValue !== null ? fieldValue : sql`NULL`,
          ),
        ),
    );
  }
}

@Injectable()
export class UserRepository {
  constructor(
    @Inject('DRIZZLE_CLIENT')
    private readonly drizzleClient: DrizzleClient,
  ) {}

  private generateRandomPassword(): string {
    return generator.generate({
      length: 10,
      numbers: true,
    });
  }

  private hashPassword(password: string): string {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
  }

  async create(
    userCreation: UserCreation,
    transaction?: DrizzleTransaction,
  ): Promise<User> {
    return await (transaction ?? this.drizzleClient).transaction(
      async (transaction) => {
        const passwordToUse =
          userCreation.password ?? this.generateRandomPassword();

        const [user] = await transaction
          .insert(userTable)
          .values({
            ...userCreation,
            password: this.hashPassword(passwordToUse),
          })
          .returning();

        return { ...user, password: passwordToUse };
      },
    );
  }

  async findPage(
    paginationOptions: PaginationOptions,
    filters: UserFilter[] = [],
    transaction?: DrizzleTransaction,
  ): Promise<Page<User>> {
    return await (transaction ?? this.drizzleClient).transaction(
      async (transaction) => {
        const filteredUsersQuery = transaction
          .select()
          .from(userTable)
          .where(and(...filters.map((filter) => filter.toSql(transaction))))
          .as('filtered_users');

        const filteredUsersPage = await transaction
          .select()
          .from(filteredUsersQuery)
          .offset(
            (paginationOptions.pageIndex - 1) * paginationOptions.itemsPerPage,
          )
          .limit(paginationOptions.itemsPerPage);

        const [{ filteredUsersCount: filteredUsersCount }] = await transaction
          .select({
            filteredUsersCount: count(filteredUsersQuery.id),
          })
          .from(filteredUsersQuery);

        return {
          items: filteredUsersPage,
          ...paginationOptions,
          pageCount: Math.ceil(
            filteredUsersCount / paginationOptions.itemsPerPage,
          ),
          itemCount: filteredUsersCount,
        };
      },
    );
  }

  async findOne(
    userUniqueTrait: UserUniqueTrait,
    filters: UserFilter[] = [],
    transaction?: DrizzleTransaction,
  ): Promise<User | null> {
    return await (transaction ?? this.drizzleClient).transaction(
      async (transaction) => {
        const [user = null] = await transaction
          .select()
          .from(userTable)
          .where(
            and(
              userUniqueTrait.toSql(),
              ...filters.map((filter) => filter.toSql(transaction)),
            ),
          );

        return user;
      },
    );
  }

  async replace(
    userUniqueTrait: UserUniqueTrait,
    userReplacement: UserReplacement,
    transaction?: DrizzleTransaction,
  ): Promise<User> {
    return await (transaction ?? this.drizzleClient).transaction(
      async (transaction) => {
        if (!(await this.findOne(userUniqueTrait))) {
          throw new UserNotFoundError();
        }

        const [user] = await transaction
          .update(userTable)
          .set({
            ...userReplacement,
            password: userReplacement.password
              ? this.hashPassword(userReplacement.password)
              : undefined,
          })
          .where(userUniqueTrait.toSql())
          .returning();

        return user;
      },
    );
  }

  async delete(
    userUniqueTrait: UserUniqueTrait,
    transaction?: DrizzleTransaction,
  ): Promise<User> {
    return await (transaction ?? this.drizzleClient).transaction(
      async (transaction) => {
        if (!(await this.findOne(userUniqueTrait))) {
          throw new UserNotFoundError();
        }

        const [user] = await transaction
          .delete(userTable)
          .where(userUniqueTrait.toSql())
          .returning();

        return user;
      },
    );
  }
}
