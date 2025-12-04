// dto/discount/discount-query.dto.ts

import { IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { DiscountType } from 'generated/prisma/enums';

// dto/base.dto.ts
export class BaseResponseDto<T> {
  success: boolean;
  data?: T;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

export class BaseQueryDto {
  page?: number = 1;
  limit?: number = 20;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc' = 'desc';
}
export class DiscountQueryDto extends BaseQueryDto {
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  isActive?: boolean;

  @IsOptional()
  @IsEnum(DiscountType)
  type?: DiscountType;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  isExpired?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  hasUsageLimit?: boolean;
}
