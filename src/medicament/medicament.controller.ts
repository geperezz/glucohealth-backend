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
  MedicamentNotFoundError,
  MedicamentRepository,
} from './medicament.repository';
import { MedicamentCreationDto } from './dtos/medicament-creation.dto';
import { MedicamentDto } from './dtos/medicament.dto';
import { MedicamentReplacementDto } from './dtos/medicament-replacement.dto';
import { MedicamentFiltersDto } from './dtos/medicament-filters.dto';
import { MedicamentPageDto } from './dtos/medicament-page.dto';
import { PaginationOptionsDto } from 'src/pagination/dtos/pagination-options.dto';
import { MedicamentUniqueTraitDto } from './dtos/medicament-unique-trait.dto';
import { MustBeLoggedInAs } from 'src/auth/must-be-logged-in-as.decorator';

@Controller()
@ApiTags('Medicaments')
@MustBeLoggedInAs('admin')
export class MedicamentController {
  constructor(private readonly medicamentRepository: MedicamentRepository) {}

  @Post('/medicaments/')
  async create(
    @Body() medicamentCreationDto: MedicamentCreationDto,
  ): Promise<MedicamentDto> {
    const medicament = await this.medicamentRepository.create(
      medicamentCreationDto,
    );
    return MedicamentDto.fromModel(medicament);
  }

  @Get('/medicaments/')
  @MustBeLoggedInAs('nurse', 'patient')
  async findPage(
    @Query() paginationOptionsDto: PaginationOptionsDto,
    @Query() medicamentFiltersDto: MedicamentFiltersDto,
  ): Promise<MedicamentPageDto> {
    const medicamentPage = await this.medicamentRepository.findPage(
      PaginationOptionsDto.toModel(paginationOptionsDto),
      medicamentFiltersDto,
    );
    const medicamentDtos = medicamentPage.items.map(MedicamentDto.fromModel);
    return {
      ...medicamentPage,
      items: medicamentDtos,
    };
  }

  @Get('/medicament/')
  @MustBeLoggedInAs('nurse', 'patient')
  async findOne(
    @Query() medicamentUniqueTraitDto: MedicamentUniqueTraitDto,
  ): Promise<MedicamentDto> {
    const medicament = await this.medicamentRepository.findOne(
      MedicamentUniqueTraitDto.toModel(medicamentUniqueTraitDto),
    );
    if (!medicament) {
      throw new NotFoundException(
        'Medicament not found',
        `There is no medicament which complies with the given constraints`,
      );
    }
    return MedicamentDto.fromModel(medicament);
  }

  @Put('/medicaments/')
  async replace(
    @Body() medicamentReplacementDto: MedicamentReplacementDto,
    @Query() medicamentUniqueTraitDto: MedicamentUniqueTraitDto,
  ): Promise<MedicamentDto> {
    try {
      const medicament = await this.medicamentRepository.replace(
        MedicamentUniqueTraitDto.toModel(medicamentUniqueTraitDto),
        medicamentReplacementDto,
      );
      return MedicamentDto.fromModel(medicament);
    } catch (error) {
      if (error instanceof MedicamentNotFoundError) {
        throw new NotFoundException('Medicament not found', {
          description: `There is no medicament which complies with the given constraints`,
          cause: error,
        });
      }
      throw error;
    }
  }

  @Delete('/medicaments/')
  async delete(
    @Query() medicamentUniqueTraitDto: MedicamentUniqueTraitDto,
  ): Promise<MedicamentDto> {
    try {
      const medicament = await this.medicamentRepository.delete(
        MedicamentUniqueTraitDto.toModel(medicamentUniqueTraitDto),
      );
      return MedicamentDto.fromModel(medicament);
    } catch (error) {
      if (error instanceof MedicamentNotFoundError) {
        throw new NotFoundException('Medicament not found', {
          description: `There is no medicament which complies with the given constraints`,
          cause: error,
        });
      }
      throw error;
    }
  }
}
