import { IsEmail, IsNotEmpty, Length } from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @Length(8, 20, { message: 'Password has to be at between 8 and 20 chars' })
  password: string;
}
