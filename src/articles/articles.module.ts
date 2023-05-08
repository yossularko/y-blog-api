import { Module } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { ArticlesController } from './articles.controller';
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
  controllers: [ArticlesController],
  providers: [ArticlesService, JwtStrategy],
})
export class ArticlesModule {}
