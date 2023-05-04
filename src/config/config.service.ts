import { ForbiddenException, Injectable } from '@nestjs/common';
import { ValidatePermission } from './interface/config.interface';

@Injectable()
export class ConfigService {
  async validatePermission({
    roles,
    currRole,
    isCurrUser,
    data,
  }: ValidatePermission): Promise<any> {
    if (isCurrUser) {
      return await data;
    }

    if (!this.allowedRole(roles, currRole)) {
      throw new ForbiddenException('You are not allowed');
    }

    return await data;
  }

  allowedRole(roles: number[], currRole: number): boolean {
    const idx = roles.indexOf(currRole);
    const allowed: boolean = idx !== -1 ? true : false;

    return allowed;
  }
}
