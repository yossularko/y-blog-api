import { Injectable, NotFoundException } from '@nestjs/common';
import { Category } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import folderPath from 'src/utils/folderPath';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import * as fs from 'fs';

@Injectable()
export class CategoriesService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(
    createCategoryDto: CreateCategoryDto,
    file: Express.Multer.File,
  ): Promise<Category> {
    const { name } = createCategoryDto;
    return await this.prismaService.category.create({
      data: { name, image: `/${folderPath}/${file.filename}` },
    });
  }

  async findAll(): Promise<Category[]> {
    return await this.prismaService.category.findMany();
  }

  async findOne(id: string): Promise<Category> {
    return await this.prismaService.category.findUnique({ where: { id } });
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
    file: Express.Multer.File,
  ): Promise<Category> {
    const { name } = updateCategoryDto;

    const item = await this.findOne(id);

    if (!item) {
      throw new NotFoundException(`Cannot find category id: ${id}`);
    }

    const updateItem = await this.prismaService.category.update({
      where: { id },
      data: { name, image: `/${folderPath}/${file.filename}` },
    });

    await fs.promises.unlink('./public' + item.image);
    return updateItem;
  }

  async remove(id: string) {
    const item = await this.findOne(id);

    if (!item) {
      throw new NotFoundException(`Cannot find category id: ${id}`);
    }

    await this.prismaService.category.update({
      where: { id },
      data: { articles: { set: [] } },
      include: { articles: true },
    });

    await this.prismaService.category.delete({ where: { id } });
    await fs.promises.unlink('./public' + item.image);

    return { message: `Category ${id} has been deleted` };
  }
}
