// dto/discount/apply-discount.dto.ts
import { IsString, IsOptional } from 'class-validator';

export class ApplyDiscountDto {
  @IsString()
  discountId: string;

  @IsString()
  orderId: string;

  @IsString()
  @IsOptional()
  productId?: string;
}
