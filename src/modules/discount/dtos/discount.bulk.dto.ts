// dto/discount/bulk-discount.dto.ts
import { IsArray, IsString, IsOptional } from 'class-validator';
import { CreateDiscountDto } from './discount.create.dto';

export class BulkUpdateDiscountDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];

  @IsOptional()
  isActive?: boolean;

  @IsOptional()
  expiresAt?: Date;
}

export class BulkCreateDiscountDto {
  @IsArray()
  discounts: CreateDiscountDto[];
}
