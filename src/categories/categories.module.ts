import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtStrategy } from 'src/common/jwt.strategy';
import { UsersModule } from 'src/users/users.module';
import { MulterModule } from '@nestjs/platform-express';
import { configFileInterceptor } from 'src/utils/configFileInterceptor';

@Module({
  imports: [
    MulterModule.register(configFileInterceptor()),
    PrismaModule,
    UsersModule,
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService, JwtStrategy],
})
export class CategoriesModule {}
