import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  IsUUID,
  ValidateIf,
} from 'class-validator';

export class AddToCartDto {
  @IsUUID()
  productId: string;

  @IsOptional()
  @ValidateIf((o) => o.variantId !== null && o.variantId !== undefined) // Only validate if present
  @IsUUID()
  variantId?: string | null; // Allow null

  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number = 1;
}
