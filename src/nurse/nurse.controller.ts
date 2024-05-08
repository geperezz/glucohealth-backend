import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { NurseNotFoundError, NurseRepository } from './nurse.repository';
import { NurseCreationDto } from './dtos/nurse-creation.dto';
import { NurseDto } from './dtos/nurse.dto';
import { NurseUpdateDto } from './dtos/nurse-update.dto';
import { NurseFiltersDto } from './dtos/nurse-filters.dto';
import { NursePageDto } from './dtos/nurse-page.dto';
import { PaginationOptionsDto } from 'src/pagination/dtos/pagination-options.dto';
import { NurseUniqueTraitDto } from './dtos/nurse-unique-trait.dto';

@Controller()
@ApiTags('Nurses')
export class NurseController {
  constructor(private readonly nurseRepository: NurseRepository) {}

  @Post('/nurses/')
  async create(@Body() nurseCreationDto: NurseCreationDto): Promise<NurseDto> {
    const nurse = await this.nurseRepository.create(nurseCreationDto);
    return NurseDto.fromModel(nurse);
  }

  @Get('/nurses/')
  async findPage(
    @Query() paginationOptionsDto: PaginationOptionsDto,
    @Query() nurseFiltersDto: NurseFiltersDto,
  ): Promise<NursePageDto> {
    const nursePage = await this.nurseRepository.findPage(
      PaginationOptionsDto.toModel(paginationOptionsDto),
      nurseFiltersDto,
    );
    const nurseDtos = nursePage.items.map(NurseDto.fromModel);
    return {
      ...nursePage,
      items: nurseDtos,
    };
  }

  @Get('/nurse/')
  async findOne(
    @Query() nurseUniqueTraitDto: NurseUniqueTraitDto,
  ): Promise<NurseDto> {
    const nurse = await this.nurseRepository.findOne(nurseUniqueTraitDto);
    if (!nurse) {
      throw new NotFoundException(
        'Nurse not found',
        `There is no nurse who complies with the given constraints`,
      );
    }
    return NurseDto.fromModel(nurse);
  }

  @Patch('/nurses/')
  async update(
    @Body() nurseUpdateDto: NurseUpdateDto,
    @Query() nurseUniqueTraitDto: NurseUniqueTraitDto,
  ): Promise<NurseDto> {
    try {
      const nurse = await this.nurseRepository.update(
        nurseUniqueTraitDto,
        nurseUpdateDto,
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
  async delete(
    @Query() nurseUniqueTraitDto: NurseUniqueTraitDto,
  ): Promise<NurseDto> {
    try {
      const nurse = await this.nurseRepository.delete(nurseUniqueTraitDto);
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
