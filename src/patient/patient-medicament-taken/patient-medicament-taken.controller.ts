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
  FilterByPatientMedicamentTakenFields,
  PatientMedicamentTakenNotFoundError,
  PatientMedicamentTakenRepository,
} from './patient-medicament-taken.repository';
import { PatientMedicamentTakenCreationDto } from './dtos/patient-medicament-taken-creation.dto';
import { PatientMedicamentTakenDto } from './dtos/patient-medicament-taken.dto';
import { PatientMedicamentTakenReplacementDto } from './dtos/patient-medicament-taken-replacement.dto';
import { PatientMedicamentTakenFiltersDto } from './dtos/patient-medicament-taken-filters.dto';
import { PatientMedicamentTakenPageDto } from './dtos/patient-medicament-taken-page.dto';
import { PaginationOptionsDto } from 'src/pagination/dtos/pagination-options.dto';
import { PatientMedicamentTakenUniqueTraitDto } from './dtos/patient-medicament-taken-unique-trait.dto';
import { MustBeLoggedInAs } from 'src/auth/must-be-logged-in-as.decorator';
import { UserFromPayload } from 'src/auth/user-from-payload.decorator';
import { User } from 'src/user/user.repository';
import { PatientMedicamentTakenReplacementWithPatientIdDto } from './dtos/patient-medicament-taken-replacement-with-patient-id.dto';
import { PatientMedicamentTakenCreationWithPatientIdDto } from './dtos/patient-medicament-taken-creation-with-patient-id.dto';

@Controller()
@ApiTags("Patients' medicaments taken")
export class PatientMedicamentTakenController {
  constructor(
    private readonly patientMedicamentTakenRepository: PatientMedicamentTakenRepository,
  ) {}

  @Post('/patients/medicaments-taken/')
  @MustBeLoggedInAs('admin')
  async create(
    @Body()
    patientMedicamentTakenCreationWithPatientIdDto: PatientMedicamentTakenCreationWithPatientIdDto,
  ): Promise<PatientMedicamentTakenDto> {
    const patientMedicamentTaken =
      await this.patientMedicamentTakenRepository.create(
        patientMedicamentTakenCreationWithPatientIdDto,
      );
    return PatientMedicamentTakenDto.fromModel(patientMedicamentTaken);
  }

  @Post('/patients/me/medicaments-taken/')
  @MustBeLoggedInAs('patient')
  async createAsPatient(
    @Body()
    patientMedicamentTakenCreationDto: PatientMedicamentTakenCreationDto,
    @UserFromPayload()
    me: User,
  ): Promise<PatientMedicamentTakenDto> {
    const patientMedicamentTaken =
      await this.patientMedicamentTakenRepository.create({
        ...patientMedicamentTakenCreationDto,
        patientId: me.id,
      });
    return PatientMedicamentTakenDto.fromModel(patientMedicamentTaken);
  }

  @Get('/patients/medicaments-taken/')
  @MustBeLoggedInAs('admin', 'nurse')
  async findPage(
    @Query() paginationOptionsDto: PaginationOptionsDto,
    @Query() patientMedicamentTakenFiltersDto: PatientMedicamentTakenFiltersDto,
  ): Promise<PatientMedicamentTakenPageDto> {
    const patientMedicamentTakenPage =
      await this.patientMedicamentTakenRepository.findPage(
        PaginationOptionsDto.toModel(paginationOptionsDto),
        [
          new FilterByPatientMedicamentTakenFields(
            patientMedicamentTakenFiltersDto,
          ),
        ],
      );
    const patientMedicamentTakenDtos = patientMedicamentTakenPage.items.map(
      PatientMedicamentTakenDto.fromModel,
    );
    return {
      ...patientMedicamentTakenPage,
      items: patientMedicamentTakenDtos,
    };
  }

  @Get('/patients/me/medicaments-taken/')
  @MustBeLoggedInAs('patient')
  async findPageAsPatient(
    @Query() paginationOptionsDto: PaginationOptionsDto,
    @Query() patientMedicamentTakenFiltersDto: PatientMedicamentTakenFiltersDto,
    @UserFromPayload() me: User,
  ): Promise<PatientMedicamentTakenPageDto> {
    const patientMedicamentTakenPage =
      await this.patientMedicamentTakenRepository.findPage(
        PaginationOptionsDto.toModel(paginationOptionsDto),
        [
          new FilterByPatientMedicamentTakenFields({
            ...patientMedicamentTakenFiltersDto,
            patientId: me.id,
          }),
        ],
      );
    const patientMedicamentTakenDtos = patientMedicamentTakenPage.items.map(
      PatientMedicamentTakenDto.fromModel,
    );
    return {
      ...patientMedicamentTakenPage,
      items: patientMedicamentTakenDtos,
    };
  }

  @Get('/patients/medicament-taken/')
  @MustBeLoggedInAs('admin', 'nurse')
  async findOne(
    @Query()
    patientMedicamentTakenUniqueTraitDto: PatientMedicamentTakenUniqueTraitDto,
  ): Promise<PatientMedicamentTakenDto> {
    const patientMedicamentTaken =
      await this.patientMedicamentTakenRepository.findOne(
        PatientMedicamentTakenUniqueTraitDto.toModel(
          patientMedicamentTakenUniqueTraitDto,
        ),
      );
    if (!patientMedicamentTaken) {
      throw new NotFoundException(
        "Patient's medicament taken not found",
        `There is no medicament taken which complies with the given constraints`,
      );
    }
    return PatientMedicamentTakenDto.fromModel(patientMedicamentTaken);
  }

  @Get('/patients/me/medicament-taken/')
  @MustBeLoggedInAs('patient')
  async findOneAsPatient(
    @Query()
    patientMedicamentTakenUniqueTraitDto: PatientMedicamentTakenUniqueTraitDto,
    @UserFromPayload() me: User,
  ): Promise<PatientMedicamentTakenDto> {
    const patientMedicamentTaken =
      await this.patientMedicamentTakenRepository.findOne(
        PatientMedicamentTakenUniqueTraitDto.toModel(
          patientMedicamentTakenUniqueTraitDto,
        ),
        [new FilterByPatientMedicamentTakenFields({ patientId: me.id })],
      );
    if (!patientMedicamentTaken) {
      throw new NotFoundException(
        "Patient's medicament taken not found",
        `There is no medicament taken which complies with the given constraints`,
      );
    }
    return PatientMedicamentTakenDto.fromModel(patientMedicamentTaken);
  }

  @Put('/patients/medicaments-taken/')
  @MustBeLoggedInAs('admin')
  async replace(
    @Body()
    patientMedicamentTakenReplacementWithPatientIdDto: PatientMedicamentTakenReplacementWithPatientIdDto,
    @Query()
    patientMedicamentTakenUniqueTraitDto: PatientMedicamentTakenUniqueTraitDto,
  ): Promise<PatientMedicamentTakenDto> {
    try {
      const patientMedicamentTaken =
        await this.patientMedicamentTakenRepository.replace(
          PatientMedicamentTakenUniqueTraitDto.toModel(
            patientMedicamentTakenUniqueTraitDto,
          ),
          patientMedicamentTakenReplacementWithPatientIdDto,
        );
      return PatientMedicamentTakenDto.fromModel(patientMedicamentTaken);
    } catch (error) {
      if (error instanceof PatientMedicamentTakenNotFoundError) {
        throw new NotFoundException("Patient's medicament taken not found", {
          description: `There is no medicament taken which complies with the given constraints`,
          cause: error,
        });
      }
      throw error;
    }
  }

  @Put('/patients/me/medicaments-taken/')
  @MustBeLoggedInAs('patient')
  async replaceAsPatient(
    @Body()
    patientMedicamentTakenReplacementDto: PatientMedicamentTakenReplacementDto,
    @Query()
    patientMedicamentTakenUniqueTraitDto: PatientMedicamentTakenUniqueTraitDto,
    @UserFromPayload()
    me: User,
  ): Promise<PatientMedicamentTakenDto> {
    try {
      const patientMedicamentTaken =
        await this.patientMedicamentTakenRepository.replace(
          PatientMedicamentTakenUniqueTraitDto.toModel(
            patientMedicamentTakenUniqueTraitDto,
          ),
          { ...patientMedicamentTakenReplacementDto, patientId: me.id },
        );
      return PatientMedicamentTakenDto.fromModel(patientMedicamentTaken);
    } catch (error) {
      if (error instanceof PatientMedicamentTakenNotFoundError) {
        throw new NotFoundException("Patient's medicament taken not found", {
          description: `There is no medicament taken which complies with the given constraints`,
          cause: error,
        });
      }
      throw error;
    }
  }

  @Delete('/patients/medicaments-taken/')
  @MustBeLoggedInAs('admin')
  async delete(
    @Query()
    patientMedicamentTakenUniqueTraitDto: PatientMedicamentTakenUniqueTraitDto,
  ): Promise<PatientMedicamentTakenDto> {
    try {
      const patientMedicamentTaken =
        await this.patientMedicamentTakenRepository.delete(
          PatientMedicamentTakenUniqueTraitDto.toModel(
            patientMedicamentTakenUniqueTraitDto,
          ),
        );
      return PatientMedicamentTakenDto.fromModel(patientMedicamentTaken);
    } catch (error) {
      if (error instanceof PatientMedicamentTakenNotFoundError) {
        throw new NotFoundException("Patient's medicament taken not found", {
          description: `There is no medicament taken which complies with the given constraints`,
          cause: error,
        });
      }
      throw error;
    }
  }

  @Delete('/patients/me/medicaments-taken/')
  @MustBeLoggedInAs('patient')
  async deleteAsPatient(
    @Query()
    patientMedicamentTakenUniqueTraitDto: PatientMedicamentTakenUniqueTraitDto,
  ): Promise<PatientMedicamentTakenDto> {
    try {
      const patientMedicamentTaken =
        await this.patientMedicamentTakenRepository.delete(
          PatientMedicamentTakenUniqueTraitDto.toModel(
            patientMedicamentTakenUniqueTraitDto,
          ),
        );
      return PatientMedicamentTakenDto.fromModel(patientMedicamentTaken);
    } catch (error) {
      if (error instanceof PatientMedicamentTakenNotFoundError) {
        throw new NotFoundException("Patient's medicament taken not found", {
          description: `There is no medicament taken which complies with the given constraints`,
          cause: error,
        });
      }
      throw error;
    }
  }
}
