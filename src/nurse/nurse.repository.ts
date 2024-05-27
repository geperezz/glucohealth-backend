import { Inject, Injectable } from '@nestjs/common';

import { DrizzleClient, DrizzleTransaction } from 'src/drizzle/drizzle.client';
import { PaginationOptions } from 'src/pagination/models/pagination-options.model';
import { Page } from 'src/pagination/models/page.model';
import {
  FilterByUserFields,
  User,
  UserCreation,
  UserFilter,
  UserRepository,
  UserUniqueTrait,
} from 'src/user/user.repository';
import { MailerService } from '@nestjs-modules/mailer';

export type Nurse = Omit<User, 'role'>;
export type NurseCreation = Omit<UserCreation, 'role'>;
export type NurseReplacement = NurseCreation;

export abstract class NurseRepositoryError extends Error {}
export class NurseNotFoundError extends NurseRepositoryError {}
export class MailNotSentError extends NurseRepositoryError {}

export type NurseFilter = UserFilter;
export const NurseFilter = UserFilter;

export type NurseUniqueTrait = UserUniqueTrait;
export const NurseUniqueTrait = UserUniqueTrait;

export type FilterByNurseFields = FilterByUserFields;
export const FilterByNurseFields = FilterByUserFields;

@Injectable()
export class NurseRepository {
  constructor(
    @Inject('DRIZZLE_CLIENT')
    private readonly drizzleClient: DrizzleClient,
    private readonly userRepository: UserRepository,
    private readonly mailerService: MailerService,
  ) {}

  async create(
    nurseCreation: NurseCreation,
    transaction?: DrizzleTransaction,
  ): Promise<Nurse> {
    return await (transaction ?? this.drizzleClient).transaction(
      async (transaction) => {
        const user = await this.userRepository.create(
          {
            ...nurseCreation,
            role: 'nurse',
          },
          transaction,
        );

        try {
          await this.mailerService.sendMail({
            to: user.email,
            subject: `Registro GlucoHealth`,
            template: './signup',
            context: {
              name: user.fullName,
              role: 'enfermero/a',
              email: user.email,
              password: nurseCreation.password,
            },
          });
        } catch (error) {
          throw new MailNotSentError(undefined, { cause: error });
        }

        return this.buildNurse(user);
      },
    );
  }

  async findPage(
    paginationOptions: PaginationOptions,
    filters: NurseFilter[] = [],
    transaction?: DrizzleTransaction,
  ): Promise<Page<Nurse>> {
    return await (transaction ?? this.drizzleClient).transaction(
      async (transaction) => {
        const filteredUsersPage = await this.userRepository.findPage(
          paginationOptions,
          [...filters, new FilterByUserFields({ role: 'nurse' })],
          transaction,
        );

        return {
          ...filteredUsersPage,
          items: await Promise.all(
            filteredUsersPage.items.map(
              async (user) =>
                (await this.findOne(NurseUniqueTrait.fromId(user.id)))!,
            ),
          ),
        };
      },
    );
  }

  async findOne(
    nurseUniqueTrait: NurseUniqueTrait,
    filters: NurseFilter[] = [],
    transaction?: DrizzleTransaction,
  ): Promise<Nurse | null> {
    return await (transaction ?? this.drizzleClient).transaction(
      async (transaction) => {
        const user = await this.userRepository.findOne(
          nurseUniqueTrait,
          [...filters, new FilterByUserFields({ role: 'nurse' })],
          transaction,
        );
        if (!user) {
          return null;
        }

        return this.buildNurse(user);
      },
    );
  }

  private buildNurse(user: User): Nurse {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { role, ...userWithoutRole } = user;

    return {
      ...userWithoutRole,
    };
  }

  async replace(
    nurseUniqueTrait: NurseUniqueTrait,
    nurseReplacement: NurseReplacement,
    transaction?: DrizzleTransaction,
  ): Promise<Nurse> {
    return await (transaction ?? this.drizzleClient).transaction(
      async (transaction) => {
        if (!(await this.findOne(nurseUniqueTrait))) {
          throw new NurseNotFoundError();
        }

        const user = await this.userRepository.replace(
          nurseUniqueTrait,
          {
            ...nurseReplacement,
            role: 'nurse',
          },
          transaction,
        );

        return (await this.findOne(NurseUniqueTrait.fromId(user.id)))!;
      },
    );
  }

  async delete(
    nurseUniqueTrait: NurseUniqueTrait,
    transaction?: DrizzleTransaction,
  ): Promise<Nurse> {
    return await (transaction ?? this.drizzleClient).transaction(
      async (transaction) => {
        const nurse = await this.findOne(nurseUniqueTrait);
        if (!nurse) {
          throw new NurseNotFoundError();
        }

        await this.userRepository.delete(nurseUniqueTrait, transaction);

        return nurse;
      },
    );
  }
}
