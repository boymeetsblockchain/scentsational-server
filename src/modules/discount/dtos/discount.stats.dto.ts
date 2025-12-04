// dto/discount/discount-stats.dto.ts
import { IsNumber, IsOptional, IsObject } from 'class-validator';

export class DiscountStatsDto {
  @IsNumber()
  totalUsed: number;

  @IsNumber()
  @IsOptional()
  remainingUses?: number;

  @IsObject()
  usageByUser: Record<string, number>;

  @IsNumber()
  successRate?: number;

  @IsNumber()
  averageDiscountAmount?: number;

  @IsNumber()
  totalDiscountAmount?: number;
}

export class DiscountStatsQueryDto {
  @IsOptional()
  startDate?: Date;

  @IsOptional()
  endDate?: Date;

  @IsOptional()
  userId?: string;
}
