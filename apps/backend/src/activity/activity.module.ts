import { Module } from "@nestjs/common";
import { ActivityService } from "./activity.service.js";
import { ActivityController } from "./activity.controller.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { SharedModule } from "@oracle69/shared";

@Module({
  imports: [PrismaModule, SharedModule],
  controllers: [ActivityController],
  providers: [ActivityService],
  exports: [ActivityService],
})
export class ActivityModule {}
