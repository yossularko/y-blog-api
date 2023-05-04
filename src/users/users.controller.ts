import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from 'src/auth/roles/roles.decorator';
import { RolesGuard } from 'src/auth/roles/roles.guard';
import { JwtGuard } from 'src/auth/jwt/jwt.guard';
import { ConfigService } from 'src/config/config.service';
import { GetUser } from './get-user.decorator';
import { User } from '@prisma/client';

@Controller('users')
@UseGuards(JwtGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  @Roles(1)
  @UseGuards(RolesGuard)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetUser() user: User) {
    return this.configService.validatePermission({
      roles: [1],
      currRole: user.role,
      isCurrUser: user.id === id,
      data: this.usersService.findOne(id),
    });
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @GetUser() user: User,
  ) {
    return this.configService.validatePermission({
      roles: [1],
      currRole: user.role,
      isCurrUser: user.id === id,
      data: this.usersService.update(id, updateUserDto),
    });
  }

  @Roles(1)
  @UseGuards(RolesGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
