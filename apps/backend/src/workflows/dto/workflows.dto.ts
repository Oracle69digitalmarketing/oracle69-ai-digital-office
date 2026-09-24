import { IsIn, IsNotEmpty, IsString, MaxLength } from "class-validator";

export const ALLOWED_WORKFLOW_STATUSES = [
  "not_started",
  "in_progress",
  "paused",
  "completed",
  "cancelled",
  "failed",
] as const;

export class CreateWorkflowDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @IsString()
  @IsNotEmpty()
  projectId!: string;
}

export class UpdateWorkflowStatusDto {
  @IsIn(ALLOWED_WORKFLOW_STATUSES)
  status!: string;
}
