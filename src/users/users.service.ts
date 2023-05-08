import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

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

  async findOne(id: string): Promise<User> {
    const item = await this.prismaService.user.findUnique({
      where: { id },
      include: { profile: true },
    });

    if (!item) {
      // optional, you can return null/undefined depending on your use case
      throw new NotFoundException(`Item id ${id} is not found`);
    }

    delete item.hashedPassword;

    return item;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    user: User,
  ): Promise<User> {
    const { email, role, name, bio, avaImage, bgImage } = updateUserDto;

    if (user.role !== 1 && typeof role === 'number') {
      throw new ForbiddenException('Cannot update role!');
    }

    try {
      const item = await this.prismaService.user.update({
        where: { id },
        data: {
          email,
          role,
          profile: { update: { name, bio, avaImage, bgImage } },
        },
        include: { profile: true },
      });

      delete item.hashedPassword;
      return item;
    } catch (error) {
      if (error.code) {
        if (error.code === 'P2025') {
          throw new NotFoundException(error.meta?.cause);
        }
      }
      throw new InternalServerErrorException(error);
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
