import { Module } from "@nestjs/common";
import { ProjectsController } from "./projects.controller.js";
import { ProjectsService } from "./projects.service.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { SharedModule } from "@oracle69/shared";

@Module({
  imports: [PrismaModule, SharedModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
