import { IsDateString, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export const ALLOWED_CALENDAR_EVENT_STATUSES = [
  "confirmed",
  "scheduled",
  "tentative",
  "cancelled",
  "completed",
] as const;

/**
 * Create-calendar-event boundary. ownerId is server-bound to the
 * authenticated user; organizationId is never accepted from the client.
 */
export class CreateCalendarEventDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsDateString()
  start!: string;

  @IsDateString()
  end!: string;

  @IsOptional()
  @IsIn(ALLOWED_CALENDAR_EVENT_STATUSES)
  status?: string;
}
