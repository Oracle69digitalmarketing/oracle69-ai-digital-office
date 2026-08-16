import { Module } from "@nestjs/common";
import { AnalyticsService } from "./analytics.service.js";
import { AnalyticsController } from "./analytics.controller.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { RuntimeModule } from "@oracle69/runtime";

@Module({
  imports: [PrismaModule, RuntimeModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
