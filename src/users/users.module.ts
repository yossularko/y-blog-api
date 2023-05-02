import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtStrategy } from 'src/auth/jwt.strategy';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [UsersService, JwtStrategy],
  exports: [UsersService],
})
export class UsersModule {}
