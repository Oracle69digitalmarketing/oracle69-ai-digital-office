import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";

export const ALLOWED_PROJECT_STATUSES = [
  "planning",
  "active",
  "paused",
  "on_hold",
  "completed",
  "cancelled",
  "archived",
] as const;

export const ALLOWED_PROJECT_PRIORITIES = ["low", "medium", "high", "urgent", "critical"] as const;

/**
 * Create-project boundary. Server controls organizationId; clientId is
 * validated against the authenticated tenant in the service.
 */
export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @IsOptional()
  @IsIn(ALLOWED_PROJECT_STATUSES)
  status?: string;

  @IsOptional()
  @IsIn(ALLOWED_PROJECT_PRIORITIES)
  priority?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budget?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  clientId?: string;
}
