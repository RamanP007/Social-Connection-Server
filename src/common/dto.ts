import { UserType } from "@prisma/client";
import { IsEnum, IsString } from "class-validator";

export class JwtAuthPayload {
  @IsString()
  id: string;

  @IsEnum(UserType)
  type: UserType;

  @IsString()
  token: string;
}
