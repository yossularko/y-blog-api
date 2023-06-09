import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtGuard } from 'src/common/guard/jwt.guard';
import { Roles } from 'src/common/decorator/roles.decorator';
import { RolesGuard } from 'src/common/guard/roles.guard';
import { IsUserGuard } from 'src/common/guard/is-user.guard';
import { GetUser } from 'src/common/decorator/get-user.decorator';
import { User } from '@prisma/client';
import { ApiTags } from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { configFileInterceptor } from 'src/utils/configFileInterceptor';

@ApiTags('User')
@Controller('users')
@UseGuards(JwtGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(1)
  @UseGuards(RolesGuard)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Roles(1)
  @UseGuards(IsUserGuard) // Guard to detect current user or not with registered role exception
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Roles(1)
  @UseGuards(IsUserGuard)
  @Patch(':id')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'avaImage', maxCount: 1 },
        { name: 'bgImage', maxCount: 1 },
      ],
      configFileInterceptor(),
    ),
  )
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFiles()
    files: {
      avaImage?: Express.Multer.File[];
      bgImage?: Express.Multer.File[];
    },
    @GetUser() user: User,
  ) {
    return this.usersService.update(id, updateUserDto, files, user);
  }

  @Roles(1)
  @UseGuards(RolesGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
