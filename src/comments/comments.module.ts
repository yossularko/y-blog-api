import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { JwtStrategy } from 'src/common/jwt.strategy';
import { MulterModule } from '@nestjs/platform-express';
import { configFileInterceptor } from 'src/utils/configFileInterceptor';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    MulterModule.register(configFileInterceptor()),
    PrismaModule,
    UsersModule,
  ],
  controllers: [CommentsController],
  providers: [CommentsService, JwtStrategy],
})
export class CommentsModule {}
