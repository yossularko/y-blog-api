import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class LoginQueryDto {
  @ApiProperty({ required: false })
  @IsOptional()
  isMobile: string;
}
