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
import { ArticleQueryDto } from './dto/article-query.dto';
import { Pagination } from 'src/types/main.type';

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

  async findAll(
    params: ArticleQueryDto,
  ): Promise<Pagination<{ data: Article[] }>> {
    const { categoryId } = params;
    const { isSearch, pagginate } = this.generateParamUtil(params);

    const where = categoryId
      ? {
          categoryId,
          title: isSearch,
          body: isSearch,
          tags: isSearch,
        }
      : {
          title: isSearch,
          body: isSearch,
          tags: isSearch,
        };

    const article = await this.prismaService.$transaction([
      this.prismaService.article.count({
        where: where,
      }),
      this.prismaService.article.findMany({
        ...pagginate,
        where: where,
        include: {
          Category: { select: { id: true, name: true, image: true } },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    const perpage = params.perpage || 20;
    const total = article[0] ?? 0;
    const totalPage = this.getTotalPage(total, perpage);

    return {
      page: params.page || 1,
      perpage,
      total,
      totalPage,
      data: article[1],
    };
  }

  async findAllByUser(
    user: User,
    params: ArticleQueryDto,
  ): Promise<Pagination<{ data: Article[] }>> {
    const { categoryId } = params;
    const { isSearch, pagginate } = this.generateParamUtil(params);

    const where =
      categoryId && user.role === 1
        ? {
            categoryId,
            title: isSearch,
            body: isSearch,
            tags: isSearch,
          }
        : categoryId && user.role !== 1
        ? {
            categoryId,
            authorId: user.id,
            title: isSearch,
            body: isSearch,
            tags: isSearch,
          }
        : {
            title: isSearch,
            body: isSearch,
            tags: isSearch,
          };

    const article = await this.prismaService.$transaction([
      this.prismaService.article.count({
        where: where,
      }),
      this.prismaService.article.findMany({
        ...pagginate,
        where: where,
        include: {
          Category: { select: { id: true, name: true, image: true } },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    const perpage = params.perpage || 20;
    const total = article[0] ?? 0;
    const totalPage = this.getTotalPage(total, perpage);

    return {
      page: params.page || 1,
      perpage: perpage,
      total,
      totalPage,
      data: article[1],
    };
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

  generateParamUtil(params: ArticleQueryDto) {
    const { search, page, perpage } = params;

    const searchFormat: string = search?.replace(/[\s\n\t]/g, ' | ') || '';
    const pagginate =
      page && perpage
        ? { skip: (page - 1) * perpage, take: perpage }
        : { skip: 0, take: 20 };

    return {
      isSearch: searchFormat ? { search: searchFormat } : undefined,
      pagginate,
    };
  }

  getTotalPage(total: number, perpage: number) {
    const sisaBagi = total % perpage;
    if (sisaBagi > 0) {
      const addon = perpage - sisaBagi;
      const newTotal = total + addon;
      return newTotal / perpage;
    }
    return total / perpage;
  }
}
