// dto/discount/create-discount.dto.ts
import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  Min,
  Max,
  ValidateIf,
  IsPositive,
  IsDateString,
  ArrayNotEmpty,
} from 'class-validator';

import { Transform, Type } from 'class-transformer';
import { DiscountType } from 'generated/prisma/enums';

export class CreateDiscountDto {
  @IsString()
  @Transform(({ value }) => value.toUpperCase().trim())
  code: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(DiscountType)
  type: DiscountType;

  @IsNumber()
  @Min(0)
  @ValidateIf((o) => o.type === 'PERCENTAGE')
  @Max(100)
  value: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  usageLimit?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  minOrderAmount?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  maxDiscountAmount?: number;

  @IsDateString()
  @IsOptional()
  startsAt?: Date;

  @IsDateString()
  @IsOptional()
  expiresAt?: Date;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @IsBoolean()
  @IsOptional()
  appliesToAllProducts?: boolean = true;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  productIds?: string[] = [];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  categoryIds?: string[] = [];

  @IsBoolean()
  @IsOptional()
  oncePerCustomer?: boolean = false;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  customerIds?: string[] = [];

  constructor() {
    // Auto-validation
    this.validate();
  }

  private validate() {
    // Additional validation based on discount type
    if (this.type === 'PERCENTAGE' && this.value > 100) {
      throw new Error('Percentage discount cannot exceed 100%');
    }

    if (this.type === 'FIXED_AMOUNT' && this.value < 0) {
      throw new Error('Fixed amount discount must be positive');
    }

    if (
      !this.appliesToAllProducts &&
      this.productIds!.length === 0 &&
      this.categoryIds!.length === 0
    ) {
      throw new Error(
        'When appliesToAllProducts is false, you must specify productIds or categoryIds',
      );
    }

    // Validate date range
    if (
      this.startsAt &&
      this.expiresAt &&
      new Date(this.startsAt) >= new Date(this.expiresAt)
    ) {
      throw new Error('Start date must be before expiration date');
    }
  }
}
