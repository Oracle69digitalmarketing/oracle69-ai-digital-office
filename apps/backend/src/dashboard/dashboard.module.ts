import { Module } from "@nestjs/common";
import { DashboardController } from "./dashboard.controller.js";
import { DashboardService } from "./dashboard.service.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { RuntimeModule } from "@oracle69/runtime";

@Module({
  imports: [PrismaModule, RuntimeModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
