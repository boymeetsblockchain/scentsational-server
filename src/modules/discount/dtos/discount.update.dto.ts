// dto/discount/update-discount.dto.ts
import { PartialType } from '@nestjs/mapped-types';

import { IsOptional, ValidateIf, IsNumber, Min, Max } from 'class-validator';
import { CreateDiscountDto } from './discount.create.dto';

export class UpdateDiscountDto extends PartialType(CreateDiscountDto) {
  @IsOptional()
  @ValidateIf((o) => o.type === 'PERCENTAGE' && o.value !== undefined)
  @Max(100)
  @ValidateIf((o) => o.type === 'FIXED_AMOUNT' && o.value !== undefined)
  @Min(0)
  value?: number;

  // Override the validate method for partial updates
  private validate() {
    // Skip validation if no fields are provided
    if (Object.keys(this).length === 0) {
      return;
    }

    // Validate value based on type if provided
    if (this.type && this.value !== undefined) {
      if (this.type === 'PERCENTAGE' && this.value > 100) {
        throw new Error('Percentage discount cannot exceed 100%');
      }
      if (this.type === 'FIXED_AMOUNT' && this.value < 0) {
        throw new Error('Fixed amount discount must be positive');
      }
    }

    // Validate product/category restrictions
    if (
      this.appliesToAllProducts === false &&
      (!this.productIds || this.productIds.length === 0) &&
      (!this.categoryIds || this.categoryIds.length === 0)
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
