import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class ArticleQueryDto {
  @ApiProperty({ required: false })
  @IsOptional()
  search: string;
}
