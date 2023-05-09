export type Pagination<T = unknown> = T & {
  page: number;
  perpage: number;
  total: number;
  totalPage: number;
};
