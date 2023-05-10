import { User } from '@prisma/client';

export interface LoginRes {
  token: {
    access_token: string;
    refresh_token: string;
  };
  user: User;
}
