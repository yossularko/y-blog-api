import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from 'src/users/users.service';
import { jwtKey, jwtSecret } from 'src/utils/constant';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        JwtStrategy.extractJwt,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: jwtSecret,
    });
  }

  private static extractJwt(req: Request): string | null {
    if (req.cookies && jwtKey in req.cookies) {
      return req.cookies[jwtKey];
    }

    return null;
  }

  async validate(payload: any) {
    const user = await this.usersService.findOne(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User is not found!');
    }

    return user;
  }
}
