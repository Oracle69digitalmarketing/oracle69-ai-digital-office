import { IsString, IsOptional, IsInt, Min, Max, Matches, MaxLength } from "class-validator";

export class CreateApiKeyDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z)?$/, {
    message: "expiresAt must be an ISO-8601 timestamp",
  })
  expiresAt?: string;
}

export class ProvisionOrgDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  industry?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  timezone?: string;
}

export class MemoryQueryDto {
  @IsString()
  @IsOptional()
  @MaxLength(5000)
  query?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
