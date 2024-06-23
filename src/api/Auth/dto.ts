import {
  IsEmail,
  IsMobilePhone,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
} from "class-validator";

export class RegisterUserDTO {
  @IsString()
  fullname: string;

  @IsNotEmpty()
  email: string;

  @IsStrongPassword()
  password: string;

  @IsOptional()
  @IsMobilePhone()
  mobile?: string;
}

export class LoginUserDTO {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
