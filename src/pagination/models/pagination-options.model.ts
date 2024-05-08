export class PaginationOptions {
  constructor(
    public readonly pageIndex: number = 1, // 1-based index
    public readonly itemsPerPage: number = 10,
  ) {}
}
