import { Controller, Get, NotFoundException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { MustBeLoggedInAs } from 'src/auth/must-be-logged-in-as.decorator';
import { UserFromPayload } from 'src/auth/user-from-payload.decorator';
import {
  User,
  UserRepository,
  UserUniqueTrait,
} from 'src/user/user.repository';
import { UserDto } from './dtos/user.dto';

@Controller()
@ApiTags('Users')
export class UserController {
  constructor(private readonly userRepository: UserRepository) {}

  @Get('/users/me/')
  @MustBeLoggedInAs('any')
  async findMe(@UserFromPayload() me: User): Promise<UserDto> {
    const user = await this.userRepository.findOne(
      UserUniqueTrait.fromId(me.id),
    );
    if (!user) {
      throw new NotFoundException(
        'User not found',
        `There is no nurse who complies with the given constraints`,
      );
    }
    return UserDto.fromModel(user);
  }
}
