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
  FilterByTreatmentFields,
  TreatmentNotFoundError,
  TreatmentRepository,
} from './treatment.repository';
import { TreatmentCreationDto } from './dtos/treatment-creation.dto';
import { TreatmentDto } from './dtos/treatment.dto';
import { TreatmentReplacementDto } from './dtos/treatment-replacement.dto';
import { TreatmentFiltersDto } from './dtos/treatment-filters.dto';
import { TreatmentPageDto } from './dtos/treatment-page.dto';
import { PaginationOptionsDto } from 'src/pagination/dtos/pagination-options.dto';
import { TreatmentUniqueTraitDto } from './dtos/treatment-unique-trait.dto';
import { MustBeLoggedInAs } from 'src/auth/must-be-logged-in-as.decorator';

@Controller()
@ApiTags('Treatments')
@MustBeLoggedInAs('admin', 'nurse')
export class TreatmentController {
  constructor(private readonly treatmentRepository: TreatmentRepository) {}

  @Post('/treatments/')
  async create(
    @Body() treatmentCreationDto: TreatmentCreationDto,
  ): Promise<TreatmentDto> {
    const treatment =
      await this.treatmentRepository.create(treatmentCreationDto);
    return TreatmentDto.fromModel(treatment);
  }

  @Get('/treatments/')
  async findPage(
    @Query() paginationOptionsDto: PaginationOptionsDto,
    @Query() treatmentFiltersDto: TreatmentFiltersDto,
  ): Promise<TreatmentPageDto> {
    const treatmentPage = await this.treatmentRepository.findPage(
      PaginationOptionsDto.toModel(paginationOptionsDto),
      [new FilterByTreatmentFields(treatmentFiltersDto)],
    );
    const treatmentDtos = treatmentPage.items.map(TreatmentDto.fromModel);
    return {
      ...treatmentPage,
      items: treatmentDtos,
    };
  }

  @Get('/treatment/')
  async findOne(
    @Query() treatmentUniqueTraitDto: TreatmentUniqueTraitDto,
  ): Promise<TreatmentDto> {
    const treatment = await this.treatmentRepository.findOne(
      TreatmentUniqueTraitDto.toModel(treatmentUniqueTraitDto),
    );
    if (!treatment) {
      throw new NotFoundException(
        'Treatment not found',
        `There is no treatment which complies with the given constraints`,
      );
    }
    return TreatmentDto.fromModel(treatment);
  }

  @Put('/treatments/')
  async replace(
    @Body() treatmentReplacementDto: TreatmentReplacementDto,
    @Query() treatmentUniqueTraitDto: TreatmentUniqueTraitDto,
  ): Promise<TreatmentDto> {
    try {
      const treatment = await this.treatmentRepository.replace(
        TreatmentUniqueTraitDto.toModel(treatmentUniqueTraitDto),
        treatmentReplacementDto,
      );
      return TreatmentDto.fromModel(treatment);
    } catch (error) {
      if (error instanceof TreatmentNotFoundError) {
        throw new NotFoundException('Treatment not found', {
          description: `There is no treatment which complies with the given constraints`,
          cause: error,
        });
      }
      throw error;
    }
  }

  @Delete('/treatments/')
  async delete(
    @Query() treatmentUniqueTraitDto: TreatmentUniqueTraitDto,
  ): Promise<TreatmentDto> {
    try {
      const treatment = await this.treatmentRepository.delete(
        TreatmentUniqueTraitDto.toModel(treatmentUniqueTraitDto),
      );
      return TreatmentDto.fromModel(treatment);
    } catch (error) {
      if (error instanceof TreatmentNotFoundError) {
        throw new NotFoundException('Treatment not found', {
          description: `There is no treatment which complies with the given constraints`,
          cause: error,
        });
      }
      throw error;
    }
  }
}
