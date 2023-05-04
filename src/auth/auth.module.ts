import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { jwtConfig } from 'src/config/jwt.config';
import { UsersModule } from 'src/users/users.module';
import { JwtStrategy } from './jwt/jwt.strategy';

@Module({
  imports: [JwtModule.register(jwtConfig), PrismaModule, UsersModule],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
