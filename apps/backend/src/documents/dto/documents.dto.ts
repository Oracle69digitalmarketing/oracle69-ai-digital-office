import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export const ALLOWED_DOCUMENT_STATUSES = ["active", "draft", "review", "archived"] as const;

/**
 * Create-document boundary. projectId is REQUIRED: a projectless document
 * cannot be attributed to a tenant and would otherwise fall outside the
 * tenant ownership check. ownerId is server-bound to the authenticated user.
 */
export class CreateDocumentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  category!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  storageUrl!: string;

  @IsString()
  @IsNotEmpty()
  projectId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  version?: string;

  @IsOptional()
  @IsIn(ALLOWED_DOCUMENT_STATUSES)
  status?: string;
}
