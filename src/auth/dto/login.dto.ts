import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, Length } from 'class-validator';

export class LoginDto {
  @ApiProperty({ default: 'admin@admin.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ default: 'admin123' })
  @IsNotEmpty()
  @Length(8, 20, { message: 'Password has to be at between 8 and 20 chars' })
  password: string;
}
