import { Injectable } from '@nestjs/common';

@Injectable()
export class CommonService {
  constructor() {}

  isDtoEmpty(dto: Record<string, any>): boolean {
    return Object.values(dto).every((v) => v == null);
  }

  isValidId(id: string): boolean {
    const numericId = Number(id);
    return !isNaN(numericId) && numericId > 0;
  }
}
