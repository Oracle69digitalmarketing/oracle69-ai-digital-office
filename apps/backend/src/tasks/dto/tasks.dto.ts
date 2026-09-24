import {
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";

export const ALLOWED_TASK_STATUSES = [
  "pending",
  "assigned",
  "in_progress",
  "review",
  "completed",
  "cancelled",
  "failed",
] as const;

export const ALLOWED_TASK_PRIORITIES = ["low", "medium", "high", "urgent", "critical"] as const;

/**
 * Create-task boundary. Security-sensitive fields (organizationId, status,
 * relation writes) are deliberately absent so they cannot be supplied by the
 * client; the server owns tenant scope and lifecycle state.
 */
export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @IsOptional()
  @IsIn(ALLOWED_TASK_PRIORITIES)
  priority?: string;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedCost?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  executionTime?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dependencies?: string[];

  @IsString()
  @IsNotEmpty()
  projectId!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  assignedAgentId?: string;
}

export class UpdateTaskStatusDto {
  @IsIn(ALLOWED_TASK_STATUSES)
  status!: string;
}
