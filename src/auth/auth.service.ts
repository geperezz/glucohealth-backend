import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import {
  User,
  UserRepository,
  UserUniqueTrait,
} from 'src/user/user.repository';
import { LoginInputDto } from './dtos/login-input.dto';
import { LoginOutputDto } from './dtos/login-output.dto';
import { UserDto } from 'src/user/dtos/user.dto';

@Injectable()
export class AuthService {
  constructor(
    private userRepository: UserRepository,
    private jwtService: JwtService,
  ) {}

  async login(loginInput: LoginInputDto): Promise<LoginOutputDto> {
    let user: User | null;
    if (loginInput.id) {
      user = await this.userRepository.findOne(
        UserUniqueTrait.fromId(loginInput.id),
      );
    } else if (loginInput.email) {
      user = await this.userRepository.findOne(
        UserUniqueTrait.fromEmail(loginInput.email),
      );
    } else {
      user = await this.userRepository.findOne(
        UserUniqueTrait.fromNationalId(loginInput.nationalId!),
      );
    }

    if (!user) {
      throw new Error('User not found');
    }
    if (!(await bcrypt.compare(loginInput.password, user.password))) {
      throw new Error('Invalid password');
    }

    return {
      user: UserDto.fromModel(user),
      token: await this.jwtService.signAsync({ userId: user.id }),
    };
  }
}
