export interface ValidatePermission {
  roles: number[];
  currRole: number;
  isCurrUser: boolean;
  data: Promise<any>;
}
