import { Module } from "@nestjs/common";
import { DepartmentsController } from "./departments.controller.js";
import { DepartmentsService } from "./departments.service.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { SharedModule } from "@oracle69/shared";

@Module({
  imports: [PrismaModule, SharedModule],
  controllers: [DepartmentsController],
  providers: [DepartmentsService],
  exports: [DepartmentsService],
})
export class DepartmentsModule {}
