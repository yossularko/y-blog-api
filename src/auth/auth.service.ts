import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { CookieOptions, Response } from 'express';
import { refreshTokenConfig } from 'src/config/jwt.config';
import { jwtKey } from 'src/utils/constant';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private jwtService: JwtService,
  ) {}

  // createUserData: Prisma.UserCreateInput
  async signup(createUserData: RegisterDto): Promise<User> {
    const { email, password } = createUserData;

    const foundUser = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (foundUser) {
      throw new BadRequestException('Email already exist');
    }

    const hashedPassword = await this.hashPassword(password);

    return await this.prismaService.user.create({
      data: {
        email,
        hashedPassword,
      },
    });
  }

  async signIn(loginDto: LoginDto, isMobile: string, res: Response) {
    const { email, password } = loginDto;

    const foundUser = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (!foundUser) {
      throw new UnauthorizedException('Wrong credentials');
    }

    const isMatch = await this.comparePasswords({
      password,
      hash: foundUser.hashedPassword,
    });

    if (!isMatch) {
      throw new UnauthorizedException('Wrong email or password');
    }

    const access_token = await this.createAccessToken(foundUser);
    const refresh_token = await this.createRefreshToken(foundUser);

    if (isMobile === 'true') {
      return { access_token, refresh_token };
    }

    res.cookie(jwtKey, access_token, this.configCookie(true));

    return { access_token: '', refresh_token };
  }

  async hashPassword(password: string) {
    const saltOrRounds = 10;
    const hashed = await bcrypt.hash(password, saltOrRounds);

    return hashed;
  }

  async comparePasswords(args: { password: string; hash: string }) {
    const isMatch = await bcrypt.compare(args.password, args.hash);
    return isMatch;
  }

  async createAccessToken(user: User): Promise<string> {
    const payload = { sub: user.id };

    const access_token = await this.jwtService.signAsync(payload);

    return access_token;
  }

  async createRefreshToken(user: User): Promise<string> {
    const expiredAt = new Date();
    expiredAt.setTime(
      expiredAt.getTime() + Number(refreshTokenConfig.expiresIn),
    );

    const refreshToken = await this.prismaService.refreshToken.create({
      data: {
        isRevoked: false,
        expiredAt,
        User: {
          connect: {
            id: user.id,
          },
        },
      },
    });

    const payload = { jid: refreshToken.id };

    const refresh_token = await this.jwtService.signAsync(
      payload,
      refreshTokenConfig,
    );

    return refresh_token;
  }

  configCookie(isLocal?: boolean): CookieOptions {
    const localConfig: CookieOptions = {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 3600 * 1000,
      path: '/',
    };

    const onlineConfig: CookieOptions = {
      expires: new Date(new Date().getTime() + 3600 * 1000),
      httpOnly: true,
      sameSite: 'strict',
      secure: true,
    };

    return isLocal ? localConfig : onlineConfig;
  }
}
