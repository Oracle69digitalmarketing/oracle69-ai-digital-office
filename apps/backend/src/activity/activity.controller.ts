import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ActivityService } from "./activity.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { ActivityFeedQueryDto, DEFAULT_ACTIVITY_FEED_LIMIT } from "./dto/activity.dto.js";

@Controller("activity")
@UseGuards(JwtAuthGuard)
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get("feed")
  getFeed(@Query() query: ActivityFeedQueryDto) {
    return this.activityService.getFeed(query.limit ?? DEFAULT_ACTIVITY_FEED_LIMIT);
  }
}
