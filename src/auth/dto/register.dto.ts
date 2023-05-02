import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class RegisterDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @Length(3)
  name: string;

  @IsOptional()
  avaImage: string;

  @IsOptional()
  bgImage: string;

  @IsNotEmpty()
  @Length(8, 20, { message: 'Password has to be at between 8 and 20 chars' })
  password: string;
}
