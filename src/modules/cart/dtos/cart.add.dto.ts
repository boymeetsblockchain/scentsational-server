import { IsString, IsOptional, IsNumber, Min, IsUUID } from 'class-validator';

export class AddToCartDto {
  @IsUUID()
  productId: string;

  @IsOptional()
  @IsUUID()
  variantId?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number = 1;
}
