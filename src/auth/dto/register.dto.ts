import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { LoginDto } from './login.dto';

export class RegisterDto extends LoginDto {
  @IsNotEmpty()
  @IsString()
  @Length(3)
  name: string;

  @IsOptional()
  avaImage: string;

  @IsOptional()
  bgImage: string;

  @IsOptional()
  role: number;
}
