import { Module } from "@nestjs/common";
import { TasksService } from "./tasks.service.js";
import { TasksController } from "./tasks.controller.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { SharedModule } from "@oracle69/shared";

@Module({
  imports: [PrismaModule, SharedModule],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
