import { Inject } from '@nestjs/common';
import { UserRepository, UserUniqueTrait } from 'src/user/user.repository';
import { DrizzleClient, DrizzleTransaction } from './drizzle.client';
import { adminSeeds } from './seeds/admin.seeds';

export class DrizzleSeeder {
  constructor(
    @Inject('DRIZZLE_CLIENT')
    private readonly drizzleClient: DrizzleClient,
    private readonly userRepository: UserRepository,
  ) {}

  async seed(transaction?: DrizzleTransaction): Promise<void> {
    if (transaction === undefined) {
      return await this.drizzleClient.transaction(async (transaction) => {
        return await this.seed(transaction);
      });
    }
    await this.seedAdmins(transaction);
  }

  private async seedAdmins(transaction: DrizzleTransaction): Promise<void> {
    await Promise.all(
      adminSeeds.map(async (seed) => {
        const seedAlreadyInDb = !!(await this.userRepository.findOne(
          UserUniqueTrait.fromEmail(seed.email),
          [],
          transaction,
        ));
        if (!seedAlreadyInDb) {
          await this.userRepository.create(seed, transaction);
        }
      }),
    );
  }
}
