import { Type } from 'class-transformer';
import { IsOptional } from 'class-validator';
import { LoginDto } from './login.dto';

export class RegisterDto extends LoginDto {
  @IsOptional()
  @Type(() => Number)
  role: number;
}
