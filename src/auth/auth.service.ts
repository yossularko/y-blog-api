import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
  NotFoundException,
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
import { TokenExpiredError } from 'jsonwebtoken';
import { LoginRes } from './interface/login-res.interface';
import { RefreshAccessTokenDto } from './dto/refresh-access-token.dto';
import { RefreshTokenRes } from './interface/refresh-token-res.interface';

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

  async signIn(
    loginDto: LoginDto,
    isMobile: string,
    res: Response,
  ): Promise<LoginRes> {
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

  async refreshAccessToken(
    refreshAccessTokenDto: RefreshAccessTokenDto,
    isMobile: string,
    response: Response,
  ): Promise<RefreshTokenRes> {
    const { refresh_token } = refreshAccessTokenDto;
    const payload = await this.decodeToken(refresh_token);
    const refreshToken = await this.prismaService.refreshToken.findUnique({
      where: { id: payload.jid },
      include: { User: true },
    });

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is not found');
    }

    if (refreshToken.isRevoked) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    const access_token = await this.createAccessToken(refreshToken.User);

    if (isMobile === 'true') {
      return { access_token };
    }

    response.cookie('jwt_auth', access_token, this.configCookie(true));

    return { access_token: '' };
  }

  async revokeRefreshToken(
    refreshAccessTokenDto: RefreshAccessTokenDto,
    response: Response,
  ) {
    const { refresh_token } = refreshAccessTokenDto;
    try {
      const payload = await this.decodeToken(refresh_token);
      await this.prismaService.refreshToken.update({
        where: { id: payload.jid },
        data: { isRevoked: true },
      });

      response.clearCookie(jwtKey);
      return { message: 'Token has been revoked' };
    } catch (error) {
      if (error.code) {
        if (error.code === 'P2025') {
          throw new NotFoundException(error.meta?.cause);
        }
      }
      throw new InternalServerErrorException(error);
    }
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

  async decodeToken(token: string): Promise<any> {
    try {
      return await this.jwtService.verifyAsync(token);
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedException('Refresh token is expired!');
      } else {
        throw new InternalServerErrorException('Failed to decode token');
      }
    }
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
