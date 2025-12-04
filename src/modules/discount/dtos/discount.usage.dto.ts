// dto/discount/discount-usage.dto.ts
import { IsString, IsDate, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class DiscountUsageDto {
  @IsString()
  id: string;

  @IsString()
  discountId: string;

  @IsString()
  userId: string;

  @IsString()
  @IsOptional()
  productId?: string;

  @IsString()
  @IsOptional()
  orderId?: string;

  @IsDate()
  @Type(() => Date)
  usedAt: Date;
}

export class CreateDiscountUsageDto {
  @IsString()
  discountId: string;

  @IsString()
  userId: string;

  @IsString()
  @IsOptional()
  productId?: string;

  @IsString()
  @IsOptional()
  orderId?: string;
}
