import { IsEmail, IsString, MinLength, MaxLength, IsNotEmpty, IsOptional } from "class-validator";

const DEFAULT_ROLE = "employee";
const PRIVILEGED_ROLES = new Set([
  "admin",
  "superadmin",
  "super_admin",
  "owner",
  "manager",
  "administrator",
]);

export function isPrivilegedRole(role: string): boolean {
  return PRIVILEGED_ROLES.has(role.toLowerCase());
}

export function isSafeDefaultRole(role: string): boolean {
  return role === DEFAULT_ROLE;
}

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(12, { message: "Password must be at least 12 characters long" })
  @MaxLength(128)
  password!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  organizationName?: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class RefreshDto {
  @IsString()
  @IsNotEmpty()
  refresh_token!: string;
}
