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
  FilterByPatientFields,
  PatientNotFoundError,
  PatientRepository,
  PatientUniqueTrait,
} from './patient.repository';
import { PatientCreationDto } from './dtos/patient-creation.dto';
import { PatientDto } from './dtos/patient.dto';
import { PatientReplacementDto } from './dtos/patient-replacement.dto';
import { PatientFiltersDto } from './dtos/patient-filters.dto';
import { PatientPageDto } from './dtos/patient-page.dto';
import { PaginationOptionsDto } from 'src/pagination/dtos/pagination-options.dto';
import { PatientUniqueTraitDto } from './dtos/patient-unique-trait.dto';
import { PatientWithPasswordDto } from './dtos/patient-with-password.dto';
import { MustBeLoggedInAs } from 'src/auth/must-be-logged-in-as.decorator';
import { UserFromPayload } from 'src/auth/user-from-payload.decorator';
import { User } from 'src/user/user.repository';

@Controller()
@ApiTags('Patients')
export class PatientController {
  constructor(private readonly patientRepository: PatientRepository) {}

  @Post('/patients/')
  @MustBeLoggedInAs('admin', 'nurse')
  async create(
    @Body() patientCreationDto: PatientCreationDto,
  ): Promise<PatientWithPasswordDto> {
    const patient = await this.patientRepository.create(patientCreationDto);
    return PatientWithPasswordDto.fromModel(patient);
  }

  @Get('/patients/')
  @MustBeLoggedInAs('admin', 'nurse')
  async findPage(
    @Query() paginationOptionsDto: PaginationOptionsDto,
    @Query() patientFiltersDto: PatientFiltersDto,
  ): Promise<PatientPageDto> {
    const patientPage = await this.patientRepository.findPage(
      PaginationOptionsDto.toModel(paginationOptionsDto),
      [new FilterByPatientFields(patientFiltersDto)],
    );
    const patientDtos = patientPage.items.map(PatientDto.fromModel);
    return {
      ...patientPage,
      items: patientDtos,
    };
  }

  @Get('/patient/')
  @MustBeLoggedInAs('admin', 'nurse')
  async findOne(
    @Query() patientUniqueTraitDto: PatientUniqueTraitDto,
  ): Promise<PatientDto> {
    const patient = await this.patientRepository.findOne(
      PatientUniqueTraitDto.toModel(patientUniqueTraitDto),
    );
    if (!patient) {
      throw new NotFoundException(
        'Patient not found',
        `There is no patient who complies with the given constraints`,
      );
    }
    return PatientDto.fromModel(patient);
  }

  @Get('/patients/me/')
  @MustBeLoggedInAs('patient')
  async findMe(@UserFromPayload() me: User): Promise<PatientDto> {
    const patient = await this.patientRepository.findOne(
      PatientUniqueTrait.fromId(me.id),
    );
    if (!patient) {
      throw new NotFoundException(
        'Patient not found',
        `There is no patient who complies with the given constraints`,
      );
    }
    return PatientDto.fromModel(patient);
  }

  @Put('/patients/')
  @MustBeLoggedInAs('admin', 'nurse')
  async replace(
    @Body() patientReplacementDto: PatientReplacementDto,
    @Query() patientUniqueTraitDto: PatientUniqueTraitDto,
  ): Promise<PatientDto> {
    try {
      const patient = await this.patientRepository.replace(
        PatientUniqueTraitDto.toModel(patientUniqueTraitDto),
        patientReplacementDto,
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

  @Put('/patients/me/')
  @MustBeLoggedInAs('patient')
  async replaceMe(
    @Body() patientReplacementDto: PatientReplacementDto,
    @UserFromPayload() me: User,
  ): Promise<PatientDto> {
    try {
      const patient = await this.patientRepository.replace(
        PatientUniqueTrait.fromId(me.id),
        patientReplacementDto,
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
  @MustBeLoggedInAs('admin')
  async delete(
    @Query() patientUniqueTraitDto: PatientUniqueTraitDto,
  ): Promise<PatientDto> {
    try {
      const patient = await this.patientRepository.delete(
        PatientUniqueTraitDto.toModel(patientUniqueTraitDto),
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

  @Delete('/patients/me/')
  @MustBeLoggedInAs('patient')
  async deleteMe(@UserFromPayload() me: User): Promise<PatientDto> {
    try {
      const patient = await this.patientRepository.delete(
        PatientUniqueTrait.fromId(me.id),
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
