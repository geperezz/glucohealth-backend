export type Page<T> = {
  items: T[];
  pageIndex: number;
  itemsPerPage: number;
  pageCount: number;
  itemCount: number;
};
