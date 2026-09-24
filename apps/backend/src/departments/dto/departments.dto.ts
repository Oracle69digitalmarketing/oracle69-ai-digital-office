import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export const ALLOWED_DEPARTMENT_STATUSES = ["active", "inactive", "archived"] as const;

export class CreateDepartmentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsIn(ALLOWED_DEPARTMENT_STATUSES)
  status?: string;
}
