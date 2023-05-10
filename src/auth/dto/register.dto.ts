import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { LoginDto } from './login.dto';

export class RegisterDto extends LoginDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @Length(3)
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  bio: string;

  @ApiProperty({ required: false })
  @IsOptional()
  avaImage: any;

  @ApiProperty({ required: false })
  @IsOptional()
  bgImage: any;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @Type(() => Number)
  role: number;
}
