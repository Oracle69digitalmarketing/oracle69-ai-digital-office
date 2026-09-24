import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";

export const MAX_ACTIVITY_FEED_LIMIT = 200;
export const DEFAULT_ACTIVITY_FEED_LIMIT = 50;

export class ActivityFeedQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_ACTIVITY_FEED_LIMIT)
  limit?: number;
}
