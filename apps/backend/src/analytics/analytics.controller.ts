import { Controller, Get, UseGuards } from "@nestjs/common";
import { AnalyticsService } from "./analytics.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";

@Controller("v1/analytics")
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("kpis")
  async getKpis() {
    return this.analyticsService.getKpis();
  }
}
