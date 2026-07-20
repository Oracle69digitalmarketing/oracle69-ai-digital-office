import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ActivityService } from "./activity.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";

@Controller("activity")
@UseGuards(JwtAuthGuard)
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get("feed")
  getFeed(@Query("limit") limit?: number) {
    return this.activityService.getFeed(limit ? Number(limit) : 50);
  }
}
