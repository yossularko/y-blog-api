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
    const { title, body, categoryId, tags } = createArticleDto;
    const slug = await this.createSlug(title);
    try {
      return await this.prismaService.article.create({
        data: {
          slug,
          title,
          body,
          coverImage: `/${folderPath}/${file.filename}`,
          tags,
          Category: { connect: { id: categoryId } },
          Author: { connect: { id: user.id } },
        },
      });
    } catch (error) {
      throw new HttpException(error, 500, { cause: new Error(error) });
    }
  }

  async findAll(search: string): Promise<Article[]> {
    const searchFormat: string = search?.replace(/[\s\n\t]/g, ' | ') || '';
    return await this.prismaService.article.findMany({
      where: {
        title: searchFormat ? { search: searchFormat } : undefined,
        body: searchFormat ? { search: searchFormat } : undefined,
        tags: searchFormat ? { search: searchFormat } : undefined,
      },
      include: { Category: { select: { id: true, name: true, image: true } } },
    });
  }

  async findAllByUser(user: User, search: string): Promise<Article[]> {
    const searchFormat: string = search?.replace(/[\s\n\t]/g, ' | ') || '';

    if (user.role === 1) {
      return await this.prismaService.article.findMany({
        where: {
          title: searchFormat ? { search: searchFormat } : undefined,
          body: searchFormat ? { search: searchFormat } : undefined,
          tags: searchFormat ? { search: searchFormat } : undefined,
        },
        include: {
          Category: { select: { id: true, name: true, image: true } },
        },
      });
    }
    return await this.prismaService.article.findMany({
      where: {
        authorId: user.id,
        title: searchFormat ? { search: searchFormat } : undefined,
        body: searchFormat ? { search: searchFormat } : undefined,
        tags: searchFormat ? { search: searchFormat } : undefined,
      },
      include: { Category: { select: { id: true, name: true, image: true } } },
    });
  }

  async findOne(slug: string): Promise<Article> {
    try {
      const response = await this.prismaService.article.findUnique({
        where: { slug },
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

      if (!response) {
        throw new NotFoundException(`Cannot find article ${slug}`);
      }

      delete response.authorId;
      delete response.categoryId;

      return response;
    } catch (error) {
      throw new HttpException(error, 500, { cause: new Error(error) });
    }
  }

  async update(
    slug: string,
    updateArticleDto: UpdateArticleDto,
    file: Express.Multer.File,
  ): Promise<Article> {
    const { title, body, categoryId, tags } = updateArticleDto;
    try {
      if (!categoryId) {
        throw new BadRequestException('Category Id tidak boleh Kosong');
      }

      const item = await this.findOne(slug);

      if (!item) {
        throw new NotFoundException(`Cannot find article ${slug}`);
      }

      const updateItem = await this.prismaService.article.update({
        where: { slug },
        data: {
          title,
          body,
          coverImage: file ? `/${folderPath}/${file.filename}` : undefined,
          tags,
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

  async remove(slug: string) {
    const item = await this.findOne(slug);

    if (!item) {
      throw new NotFoundException(`Cannot find category ${slug}`);
    }

    await this.prismaService.article.delete({ where: { slug } });
    await fs.promises.unlink('./public' + item.coverImage);

    return { message: `Article ${slug} has been deleted` };
  }

  async createSlug(title: string): Promise<string> {
    const initialSlug = title
      .toLowerCase()
      .replace(/[\s\n\t]/g, '-')
      .replace(/['",.;:@#$%^&*]/g, '');
    const slugs = await this.prismaService.article.findMany({
      select: { slug: true },
    });

    const isSlugExist = slugs.some((itemSlug) => itemSlug.slug === initialSlug);

    if (isSlugExist) {
      const splited = initialSlug.split('-');
      const lastSplit = splited[splited.length - 1];
      const isNanLastSplit = Number.isNaN(+lastSplit);
      const slug = isNanLastSplit
        ? [...splited, 2].join('-')
        : [...splited.slice(0, splited.length - 2), +lastSplit + 1].join('-');
      return slug;
    }

    return initialSlug;
  }
}
