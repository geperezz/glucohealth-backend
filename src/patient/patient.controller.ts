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

import { PatientNotFoundError, PatientRepository } from './patient.repository';
import { PatientCreationDto } from './dtos/patient-creation.dto';
import { PatientDto } from './dtos/patient.dto';
import { PatientUpdateDto } from './dtos/patient-update.dto';
import { PatientFiltersDto } from './dtos/patient-filters.dto';
import { PatientPageDto } from './dtos/patient-page.dto';
import { PaginationOptionsDto } from 'src/pagination/dtos/pagination-options.dto';
import { PatientUniqueTraitDto } from './dtos/patient-unique-trait.dto';
import { PatientWithPasswordDto } from './dtos/patient-with-password.dto';

@Controller()
@ApiTags('Patients')
export class PatientController {
  constructor(private readonly patientRepository: PatientRepository) {}

  @Post('/patients/')
  async create(
    @Body() patientCreationDto: PatientCreationDto,
  ): Promise<PatientWithPasswordDto> {
    const patient = await this.patientRepository.create(patientCreationDto);
    return PatientWithPasswordDto.fromModel(patient);
  }

  @Get('/patients/')
  async findPage(
    @Query() paginationOptionsDto: PaginationOptionsDto,
    @Query() patientFiltersDto: PatientFiltersDto,
  ): Promise<PatientPageDto> {
    const patientPage = await this.patientRepository.findPage(
      PaginationOptionsDto.toModel(paginationOptionsDto),
      patientFiltersDto,
    );
    const patientDtos = patientPage.items.map(PatientDto.fromModel);
    return {
      ...patientPage,
      items: patientDtos,
    };
  }

  @Get('/patient/')
  async findOne(
    @Query() patientUniqueTraitDto: PatientUniqueTraitDto,
  ): Promise<PatientDto> {
    const patient = await this.patientRepository.findOne(patientUniqueTraitDto);
    if (!patient) {
      throw new NotFoundException(
        'Patient not found',
        `There is no patient who complies with the given constraints`,
      );
    }
    return PatientDto.fromModel(patient);
  }

  @Patch('/patients/')
  async update(
    @Body() patientUpdateDto: PatientUpdateDto,
    @Query() patientUniqueTraitDto: PatientUniqueTraitDto,
  ): Promise<PatientDto> {
    try {
      const patient = await this.patientRepository.update(
        patientUniqueTraitDto,
        patientUpdateDto,
      );
      return PatientDto.fromModel(patient);
    } catch (error) {
      if (error instanceof PatientNotFoundError) {
        throw new NotFoundException('Patient not found', {
          description: `There is no patient who complies with the given constraints`,
          cause: error,
        });
      }
      throw error;
    }
  }

  @Delete('/patients/')
  async delete(
    @Query() patientUniqueTraitDto: PatientUniqueTraitDto,
  ): Promise<PatientDto> {
    try {
      const patient = await this.patientRepository.delete(
        patientUniqueTraitDto,
      );
      return PatientDto.fromModel(patient);
    } catch (error) {
      if (error instanceof PatientNotFoundError) {
        throw new NotFoundException('Patient not found', {
          description: `There is no patient who complies with the given constraints`,
          cause: error,
        });
      }
      throw error;
    }
  }
}
