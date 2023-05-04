import { ForbiddenException } from '@nestjs/common';

export const allowedRole = (roles: number[], currRole: number): boolean => {
  const idx = roles.indexOf(currRole);
  const allowed: boolean = idx !== -1 ? true : false;

  return allowed;
};

export const validatePermission = async (
  roles: number[],
  currRole: number,
  isCurrUser: boolean,
  dataReturn: Promise<any>,
): Promise<any> => {
  if (isCurrUser) {
    return await dataReturn;
  }

  if (!allowedRole(roles, currRole)) {
    throw new ForbiddenException('You are not allowed');
  }

  return await dataReturn;
};
