import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  ParseFilePipeBuilder,
  UploadedFile,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { User } from '@prisma/client';
import { GetUser } from 'src/common/decorator/get-user.decorator';
import { Roles } from 'src/common/decorator/roles.decorator';
import { IsUserGuard } from 'src/common/guard/is-user.guard';
import { JwtGuard } from 'src/common/guard/jwt.guard';
import { fileType } from 'src/utils/fileTypeRegExp';
import { maxSize } from 'src/utils/maxSize';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

@Controller('articles')
@UseGuards(JwtGuard)
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  create(
    @Body() createArticleDto: CreateArticleDto,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: fileType })
        .addMaxSizeValidator({ maxSize: maxSize })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    file: Express.Multer.File,
    @GetUser() user: User,
  ) {
    return this.articlesService.create(createArticleDto, file, user);
  }

  @Get()
  findAll(@GetUser() user: User) {
    return this.articlesService.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.articlesService.findOne(id);
  }

  @Roles(1)
  @UseGuards(IsUserGuard)
  @Patch(':id')
  @UseInterceptors(FileInterceptor('file'))
  update(
    @Param('id') id: string,
    @Body() updateArticleDto: UpdateArticleDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    console.log('update dto: ', updateArticleDto);
    return this.articlesService.update(id, updateArticleDto, file);
  }

  @Roles(1)
  @UseGuards(IsUserGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.articlesService.remove(id);
  }
}
