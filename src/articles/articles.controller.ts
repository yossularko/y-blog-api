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
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { GetUser } from 'src/common/decorator/get-user.decorator';
import { Roles } from 'src/common/decorator/roles.decorator';
import { IsUserGuard } from 'src/common/guard/is-user.guard';
import { JwtGuard } from 'src/common/guard/jwt.guard';
import { fileType } from 'src/utils/fileTypeRegExp';
import { maxSize } from 'src/utils/maxSize';
import { ArticlesService } from './articles.service';
import { ArticleQueryDto } from './dto/article-query.dto';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

@ApiTags('Article')
@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @UseGuards(JwtGuard)
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
  findAll(@Query() params: ArticleQueryDto) {
    return this.articlesService.findAll(params);
  }

  @UseGuards(JwtGuard)
  @Get('my-article')
  findAllByUser(@GetUser() user: User, @Query() params: ArticleQueryDto) {
    return this.articlesService.findAllByUser(user, params);
  }

  @Get('slugs')
  fibdSlugs() {
    return this.articlesService.findSlugs();
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.articlesService.findOne(slug);
  }

  @Roles(1)
  @UseGuards(JwtGuard, IsUserGuard)
  @Patch(':slug')
  @UseInterceptors(FileInterceptor('file'))
  update(
    @Param('slug') slug: string,
    @Body() updateArticleDto: UpdateArticleDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    console.log('update dto: ', updateArticleDto);
    return this.articlesService.update(slug, updateArticleDto, file);
  }

  @Roles(1)
  @UseGuards(JwtGuard, IsUserGuard)
  @Delete(':slug')
  remove(@Param('slug') slug: string) {
    return this.articlesService.remove(slug);
  }
}
