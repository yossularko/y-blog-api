import {
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import folderPath from 'src/utils/folderPath';
import { UpdateUserDto } from './dto/update-user.dto';
import * as fs from 'fs';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async findAll() {
    return await this.prismaService.user.findMany({
      select: {
        id: true,
        role: true,
        profile: true,
      },
    });
  }

  async findOne(id: string) {
    const item = await this.prismaService.user.findUnique({
      where: { id },
      include: { profile: true },
    });

    if (!item) {
      // optional, you can return null/undefined depending on your use case
      throw new NotFoundException(`User id ${id} is not found`);
    }

    delete item.hashedPassword;

    return item;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    files: {
      avaImage?: Express.Multer.File[];
      bgImage?: Express.Multer.File[];
    },
    user: User,
  ): Promise<User> {
    const { email, role, name, bio } = updateUserDto;

    if (user.role !== 1 && typeof role === 'number') {
      throw new ForbiddenException('Cannot update role!');
    }

    if (email && user.role !== 1) {
      throw new ForbiddenException('Cannot update email!');
    }

    const foundUser = await this.findOne(id);

    const avatar = files.avaImage
      ? `/${folderPath}/${files.avaImage[0].filename}`
      : undefined;

    const background = files.bgImage
      ? `/${folderPath}/${files.bgImage[0].filename}`
      : undefined;

    try {
      const item = await this.prismaService.user.update({
        where: { id },
        data: {
          email,
          role,
          profile: {
            update: { name, bio, avaImage: avatar, bgImage: background },
          },
        },
        include: { profile: true },
      });

      delete item.hashedPassword;

      if (avatar) {
        await fs.promises.unlink('./public' + foundUser.profile.avaImage);
      }

      if (background) {
        await fs.promises.unlink('./public' + foundUser.profile.bgImage);
      }
      return item;
    } catch (error) {
      throw new HttpException(error, 500, { cause: new Error(error) });
    }
  }

  async remove(id: string) {
    try {
      await this.prismaService.user.update({
        where: { id },
        data: { profile: { delete: true } },
        include: { profile: true },
      });
      await this.prismaService.user.delete({
        where: { id },
      });
      return { message: `User id: ${id} was deleted` };
    } catch (error) {
      if (error.code) {
        if (error.code === 'P2025') {
          throw new NotFoundException(error.meta?.cause);
        }
      }
      throw new InternalServerErrorException(error);
    }
  }
}
