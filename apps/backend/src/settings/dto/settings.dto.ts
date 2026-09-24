import { IsDefined, IsIn, IsString } from "class-validator";

/**
 * Explicit allowlist of recognized user setting keys. Unknown keys are
 * rejected so a client cannot write arbitrary/privilege-shaped settings rows.
 * The value is stored verbatim as JSON; no object merging is performed.
 */
export const ALLOWED_SETTING_KEYS = [
  "theme",
  "language",
  "timezone",
  "locale",
  "notifications",
] as const;

export class UpdateSettingDto {
  @IsString()
  @IsIn(ALLOWED_SETTING_KEYS)
  key!: string;

  @IsDefined()
  value!: unknown;
}
