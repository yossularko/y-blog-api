import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Article, User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import folderPath from 'src/utils/folderPath';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import * as fs from 'fs';

@Injectable()
export class ArticlesService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(
    createArticleDto: CreateArticleDto,
    file: Express.Multer.File,
    user: User,
  ): Promise<Article> {
    const { title, body, categoryId } = createArticleDto;
    try {
      return await this.prismaService.article.create({
        data: {
          title,
          body,
          coverImage: `/${folderPath}/${file.filename}`,
          Category: { connect: { id: categoryId } },
          Author: { connect: { id: user.id } },
        },
      });
    } catch (error) {
      throw new HttpException(error, 500, { cause: new Error(error) });
    }
  }

  async findAll(user: User): Promise<Article[]> {
    if (user.role === 1) {
      return await this.prismaService.article.findMany({
        include: {
          Category: { select: { id: true, name: true, image: true } },
        },
      });
    }
    return await this.prismaService.article.findMany({
      where: { authorId: user.id },
      include: { Category: { select: { id: true, name: true, image: true } } },
    });
  }

  async findOne(id: string): Promise<Article> {
    const response = await this.prismaService.article.findUnique({
      where: { id },
      include: {
        Category: { select: { id: true, name: true, image: true } },
        Author: { select: { id: true, profile: true } },
        comments: {
          select: {
            id: true,
            body: true,
            images: true,
            createdAt: true,
            User: {
              select: {
                id: true,
                profile: { select: { name: true, avaImage: true } },
              },
            },
          },
        },
      },
    });

    delete response.authorId;
    delete response.categoryId;

    return response;
  }

  async update(
    id: string,
    updateArticleDto: UpdateArticleDto,
    file: Express.Multer.File,
  ): Promise<Article> {
    const { title, body, categoryId } = updateArticleDto;
    try {
      if (!categoryId) {
        throw new BadRequestException('Category Id tidak boleh Kosong');
      }

      const item = await this.findOne(id);

      if (!item) {
        throw new NotFoundException(`Cannot find article id: ${id}`);
      }

      const updateItem = await this.prismaService.article.update({
        where: { id },
        data: {
          title,
          body,
          coverImage: file ? `/${folderPath}/${file.filename}` : undefined,
          Category: { connect: { id: categoryId } },
        },
      });

      if (file) {
        await fs.promises.unlink('./public' + item.coverImage);
      }
      return updateItem;
    } catch (error) {
      throw new HttpException(error, 500, { cause: new Error(error) });
    }
  }

  async remove(id: string) {
    const item = await this.findOne(id);

    if (!item) {
      throw new NotFoundException(`Cannot find category id: ${id}`);
    }

    await this.prismaService.article.delete({ where: { id } });
    await fs.promises.unlink('./public' + item.coverImage);

    return { message: `Article ${id} has been deleted` };
  }
}
