import { IsOptional } from 'class-validator';

export class LoginQueryDto {
  @IsOptional()
  isMobile: string;
}
