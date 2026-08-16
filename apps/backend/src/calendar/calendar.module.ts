import { Module } from "@nestjs/common";
import { CalendarController } from "./calendar.controller.js";
import { CalendarService } from "./calendar.service.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { RuntimeModule } from "@oracle69/runtime";

@Module({
  imports: [PrismaModule, RuntimeModule],
  controllers: [CalendarController],
  providers: [CalendarService],
  exports: [CalendarService],
})
export class CalendarModule {}
