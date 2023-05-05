import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';

// Guard to detect current user or not with registered role exception

@Injectable()
export class IsUserGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  matchUser(
    roles: number[],
    userRole: number,
    idParam: string,
    userId: string,
  ): boolean {
    if (idParam === userId) {
      return true;
    }

    return roles.some((role) => role === userRole);
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const roles = this.reflector.get<number[]>('roles', context.getHandler());

    if (!roles) {
      return false;
    }

    const request = context.switchToHttp().getRequest();
    const params = request.params;
    const user = request.user;
    return this.matchUser(roles, user.role, params.id, user.id);
  }
}
