import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  ParseFilePipeBuilder,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorator/roles.decorator';
import { JwtGuard } from 'src/common/guard/jwt.guard';
import { RolesGuard } from 'src/common/guard/roles.guard';
import { fileType } from 'src/utils/fileTypeRegExp';
import { maxSize } from 'src/utils/maxSize';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('Category')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Roles(1)
  @UseGuards(JwtGuard, RolesGuard)
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  create(
    @Body() createCategoryDto: CreateCategoryDto,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: fileType })
        .addMaxSizeValidator({ maxSize: maxSize })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    file: Express.Multer.File,
  ) {
    return this.categoriesService.create(createCategoryDto, file);
  }

  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Roles(1)
  @UseGuards(JwtGuard, RolesGuard)
  @Patch(':id')
  @UseInterceptors(FileInterceptor('file'))
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: fileType })
        .addMaxSizeValidator({ maxSize: maxSize })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    file: Express.Multer.File,
  ) {
    return this.categoriesService.update(id, updateCategoryDto, file);
  }

  @Roles(1)
  @UseGuards(JwtGuard, RolesGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
