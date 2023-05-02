import { Body, Controller, Post, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginQueryDto } from './dto/login-query.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(@Body() payload: RegisterDto) {
    return this.authService.signup(payload);
  }

  @Post('signin')
  signin(
    @Body() payload: LoginDto,
    @Query() params: LoginQueryDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { isMobile } = params;
    return this.authService.signIn(payload, isMobile, res);
  }
}
