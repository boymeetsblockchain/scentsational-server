import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsEnum,
  IsEmail,
  Min,
  ValidateNested,
  ArrayMinSize,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from 'generated/prisma/enums';

export class OrderItemCreateDto {
  @IsString()
  productId: string;

  @IsOptional()
  @IsString()
  variantId?: string;

  @IsString()
  productName: string;

  @IsString()
  productSku: string;

  @IsOptional()
  @IsString()
  variantName?: string;

  @IsOptional()
  @IsString()
  productImage?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  comparePrice?: number;

  @IsNumber()
  @Min(1)
  quantity: number;
}

export class OrderCreateDto {
  @IsString()
  userId: string;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  // Customer information
  @IsEmail()
  customerEmail: string;

  @IsString()
  customerFirstName: string;

  @IsString()
  customerLastName: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  // Shipping address (required)
  @IsString()
  shippingFirstName: string;

  @IsString()
  shippingLastName: string;

  @IsOptional()
  @IsString()
  shippingCompany?: string;

  @IsString()
  shippingAddressLine1: string;

  @IsOptional()
  @IsString()
  shippingAddressLine2?: string;

  @IsString()
  shippingCity: string;

  @IsString()
  shippingState: string;

  @IsString()
  shippingPostalCode: string;

  @IsString()
  shippingCountry: string;

  @IsOptional()
  @IsString()
  shippingPhone?: string;

  // Billing address (optional)
  @IsOptional()
  @IsString()
  billingFirstName?: string;

  @IsOptional()
  @IsString()
  billingLastName?: string;

  @IsOptional()
  @IsString()
  billingCompany?: string;

  @IsOptional()
  @IsString()
  billingAddressLine1?: string;

  @IsOptional()
  @IsString()
  billingAddressLine2?: string;

  @IsOptional()
  @IsString()
  billingCity?: string;

  @IsOptional()
  @IsString()
  billingState?: string;

  @IsOptional()
  @IsString()
  billingPostalCode?: string;

  @IsOptional()
  @IsString()
  billingCountry?: string;

  // Order items
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemCreateDto)
  items: OrderItemCreateDto[];

  // Financials
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  shippingAmount?: number;

  @IsOptional()
  @IsString()
  discountId?: string;

  @IsOptional()
  @IsString()
  discountCode?: string;

  @IsOptional()
  @IsString()
  customerNote?: string;
}
