import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class ReceptionistChatDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  message!: string;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  sessionId?: string;
}
