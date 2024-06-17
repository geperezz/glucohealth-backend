import { z } from 'nestjs-zod/z';
import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { ValidationPipe } from 'src/validation/validation.pipe';
import { patientDtoSchema } from 'src/patient/dtos/patient.dto';
import { PatientMedicamentScheduleDto } from './dtos/patient-medicament-schedule.dto';
import { PatientMedicamentScheduleService } from './patient-medicament-schedule.service';
import { MustBeLoggedInAs } from 'src/auth/must-be-logged-in-as.decorator';
import { UserFromPayload } from 'src/auth/user-from-payload.decorator';
import { User } from 'src/user/user.repository';

@Controller()
@ApiTags("Schedules for the patients' treatments")
export class PatientMedicamentScheduleController {
  constructor(
    private readonly patientMedicamentScheduleService: PatientMedicamentScheduleService,
  ) {}

  @Get('/patients/me/treatment/schedules/:scheduleDate/')
  @MustBeLoggedInAs('patient')
  async findMine(
    @UserFromPayload()
    me: User,
    @Param('scheduleDate', new ValidationPipe(z.coerce.date()))
    scheduleDate: Date,
  ): Promise<PatientMedicamentScheduleDto[]> {
    const schedule = await this.patientMedicamentScheduleService.findOne(
      me.id,
      scheduleDate,
    );

    return schedule.map((schedule) =>
      PatientMedicamentScheduleDto.fromSchema(schedule),
    );
  }

  @Get('/patients/:patientId/treatment/schedules/:scheduleDate/')
  @MustBeLoggedInAs('admin', 'nurse')
  async findOne(
    @Param('patientId', new ValidationPipe(patientDtoSchema.shape.id))
    patientId: number,
    @Param('scheduleDate', new ValidationPipe(z.coerce.date()))
    scheduleDate: Date,
  ): Promise<PatientMedicamentScheduleDto[]> {
    const schedule = await this.patientMedicamentScheduleService.findOne(
      patientId,
      scheduleDate,
    );

    return schedule.map((schedule) =>
      PatientMedicamentScheduleDto.fromSchema(schedule),
    );
  }
}
