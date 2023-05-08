import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import * as fs from 'fs';
import { Comment, User } from '@prisma/client';
import folderPath from 'src/utils/folderPath';

@Injectable()
export class CommentsService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(
    createCommentDto: CreateCommentDto,
    files: Array<Express.Multer.File>,
    user: User,
  ): Promise<Comment> {
    const { body, articleId } = createCommentDto;

    try {
      return await this.prismaService.comment.create({
        data: {
          body,
          images: files
            ? files.map((file) => `/${folderPath}/${file.filename}`)
            : [],
          Article: { connect: { id: articleId } },
          User: { connect: { id: user.id } },
        },
      });
    } catch (error) {
      throw new HttpException(error, 500, { cause: new Error(error) });
    }
  }

  async findOne(id: string): Promise<Comment> {
    return await this.prismaService.comment.findUnique({ where: { id } });
  }

  async remove(id: string) {
    const item = await this.findOne(id);

    if (!item) {
      throw new NotFoundException(`Cannot find comment id: ${id}`);
    }

    await this.prismaService.comment.delete({ where: { id } });
    await Promise.all(
      item.images.map(async (filePath) => {
        await fs.promises.unlink('./public' + filePath);
      }),
    );

    return { message: `Comment ${id} has been deleted` };
  }
}
