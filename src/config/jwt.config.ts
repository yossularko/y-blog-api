import { JwtModuleOptions, JwtSignOptions } from '@nestjs/jwt';
import { jwtSecret } from 'src/utils/constant';

export const jwtConfig: JwtModuleOptions = {
  secret: jwtSecret,
  signOptions: {
    expiresIn: 3600,
  },
};

export const refreshTokenConfig: JwtSignOptions = {
  expiresIn: 3600 * 24,
};
