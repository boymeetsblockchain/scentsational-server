import { IsString, IsNumber, IsOptional, IsArray, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class ValidateDiscountDto {
  @IsString()
  @Transform(({ value }) => value.trim())
  discountCode: string;

  @IsString()
  userId: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  orderAmount?: number = 0;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  productIds?: string[] = [];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  categoryIds?: string[] = [];

  @IsOptional()
  @IsString()
  customerId?: string;
}
