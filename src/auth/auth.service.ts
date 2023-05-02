import { Injectable, BadRequestException } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private readonly prismaService: PrismaService) {}

  // createUserData: Prisma.UserCreateInput
  async signup(createUserData: RegisterDto): Promise<User> {
    const { name, email, password } = createUserData;

    const foundUser = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (foundUser) {
      throw new BadRequestException('Email already exist');
    }

    const hashedPassword = await this.hashPassword(password);

    return await this.prismaService.user.create({
      data: {
        name,
        email,
        hashedPassword,
      },
    });
  }

  async hashPassword(password: string) {
    const saltOrRounds = 10;
    const hashed = await bcrypt.hash(password, saltOrRounds);

    return hashed;
  }
}
