import { SetMetadata, applyDecorators } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

import { User } from 'src/user/user.repository';

export const MustBeLoggedInAs = (
  ...roles: [User['role'], ...User['role'][]] | ['any']
) => applyDecorators(SetMetadata('allowedRoles', roles), ApiBearerAuth());
