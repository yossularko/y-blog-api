export const allowedRole = (roles: number[], currRole: number): boolean => {
  const idx = roles.indexOf(currRole);
  const allowed: boolean = idx !== -1 ? true : false;

  return allowed;
};
