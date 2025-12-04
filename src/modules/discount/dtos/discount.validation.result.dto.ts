// dto/discount/discount-validation-result.dto.ts
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsObject,
} from 'class-validator';

export class DiscountValidationResultDto {
  @IsBoolean()
  isValid: boolean;

  @IsNumber()
  discountAmount: number;

  @IsString()
  @IsOptional()
  message?: string;

  @IsObject()
  @IsOptional()
  discount?: any;

  @IsBoolean()
  @IsOptional()
  isFreeShipping?: boolean;

  @IsNumber()
  @IsOptional()
  originalAmount?: number;

  @IsNumber()
  @IsOptional()
  finalAmount?: number;
}
