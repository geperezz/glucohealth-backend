import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import {
  FilterByNurseFields,
  NurseNotFoundError,
  NurseRepository,
  NurseUniqueTrait,
} from './nurse.repository';
import { NurseCreationDto } from './dtos/nurse-creation.dto';
import { NurseDto } from './dtos/nurse.dto';
import { NurseReplacementDto } from './dtos/nurse-replacement.dto';
import { NurseFiltersDto } from './dtos/nurse-filters.dto';
import { NursePageDto } from './dtos/nurse-page.dto';
import { PaginationOptionsDto } from 'src/pagination/dtos/pagination-options.dto';
import { NurseUniqueTraitDto } from './dtos/nurse-unique-trait.dto';
import { MustBeLoggedInAs } from 'src/auth/must-be-logged-in-as.decorator';
import { UserFromPayload } from 'src/auth/user-from-payload.decorator';
import { User } from 'src/user/user.repository';

@Controller()
@ApiTags('Nurses')
export class NurseController {
  constructor(private readonly nurseRepository: NurseRepository) {}

  @Post('/nurses/')
  @MustBeLoggedInAs('admin')
  async create(@Body() nurseCreationDto: NurseCreationDto): Promise<NurseDto> {
    const nurse = await this.nurseRepository.create(nurseCreationDto);
    return NurseDto.fromModel(nurse);
  }

  @Get('/nurses/')
  @MustBeLoggedInAs('admin')
  async findPage(
    @Query() paginationOptionsDto: PaginationOptionsDto,
    @Query() nurseFiltersDto: NurseFiltersDto,
  ): Promise<NursePageDto> {
    const nursePage = await this.nurseRepository.findPage(
      PaginationOptionsDto.toModel(paginationOptionsDto),
      [new FilterByNurseFields(nurseFiltersDto)],
    );
    const nurseDtos = nursePage.items.map(NurseDto.fromModel);
    return {
      ...nursePage,
      items: nurseDtos,
    };
  }

  @Get('/nurse/')
  @MustBeLoggedInAs('admin')
  async findOne(
    @Query() nurseUniqueTraitDto: NurseUniqueTraitDto,
  ): Promise<NurseDto> {
    const nurse = await this.nurseRepository.findOne(
      NurseUniqueTraitDto.toModel(nurseUniqueTraitDto),
    );
    if (!nurse) {
      throw new NotFoundException(
        'Nurse not found',
        `There is no nurse who complies with the given constraints`,
      );
    }
    return NurseDto.fromModel(nurse);
  }

  @Get('/nurse/me/')
  @MustBeLoggedInAs('nurse')
  async findMe(@UserFromPayload() me: User): Promise<NurseDto> {
    const nurse = await this.nurseRepository.findOne(
      NurseUniqueTrait.fromId(me.id),
    );
    if (!nurse) {
      throw new NotFoundException(
        'Nurse not found',
        `There is no nurse who complies with the given constraints`,
      );
    }
    return NurseDto.fromModel(nurse);
  }

  @Put('/nurses/')
  @MustBeLoggedInAs('admin')
  async replace(
    @Body() nurseReplacementDto: NurseReplacementDto,
    @Query() nurseUniqueTraitDto: NurseUniqueTraitDto,
  ): Promise<NurseDto> {
    try {
      const nurse = await this.nurseRepository.replace(
        NurseUniqueTraitDto.toModel(nurseUniqueTraitDto),
        nurseReplacementDto,
      );
      return NurseDto.fromModel(nurse);
    } catch (error) {
      if (error instanceof NurseNotFoundError) {
        throw new NotFoundException('Nurse not found', {
          description: `There is no nurse who complies with the given constraints`,
          cause: error,
        });
      }
      throw error;
    }
  }

  @Put('/nurses/me/')
  @MustBeLoggedInAs('nurse')
  async replaceMe(
    @Body() nurseReplacementDto: NurseReplacementDto,
    @UserFromPayload() me: User,
  ): Promise<NurseDto> {
    try {
      const nurse = await this.nurseRepository.replace(
        NurseUniqueTrait.fromId(me.id),
        nurseReplacementDto,
      );
      return NurseDto.fromModel(nurse);
    } catch (error) {
      if (error instanceof NurseNotFoundError) {
        throw new NotFoundException('Nurse not found', {
          description: `There is no nurse who complies with the given constraints`,
          cause: error,
        });
      }
      throw error;
    }
  }

  @Delete('/nurses/')
  @MustBeLoggedInAs('admin')
  async delete(
    @Query() nurseUniqueTraitDto: NurseUniqueTraitDto,
  ): Promise<NurseDto> {
    try {
      const nurse = await this.nurseRepository.delete(
        NurseUniqueTraitDto.toModel(nurseUniqueTraitDto),
      );
      return NurseDto.fromModel(nurse);
    } catch (error) {
      if (error instanceof NurseNotFoundError) {
        throw new NotFoundException('Nurse not found', {
          description: `There is no nurse who complies with the given constraints`,
          cause: error,
        });
      }
      throw error;
    }
  }

  @Delete('/nurses/me/')
  @MustBeLoggedInAs('nurse')
  async deleteMe(@UserFromPayload() me: User): Promise<NurseDto> {
    try {
      const nurse = await this.nurseRepository.delete(
        NurseUniqueTrait.fromId(me.id),
      );
      return NurseDto.fromModel(nurse);
    } catch (error) {
      if (error instanceof NurseNotFoundError) {
        throw new NotFoundException('Nurse not found', {
          description: `There is no nurse who complies with the given constraints`,
          cause: error,
        });
      }
      throw error;
    }
  }
}
