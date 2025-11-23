import {
  IsString,
  IsNumber,
  IsDecimal,
  IsBoolean,
  IsOptional,
  IsArray,
  IsEnum,
  IsNotEmpty,
  Min,
  Max,
  MinLength,
  MaxLength,
  ArrayMinSize,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ProductStatus,
  ProductType,
  ConcentrationLevel,
  Gender,
  Season,
} from 'generated/prisma/enums';

export class ProductVariantCreateDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  sku: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  comparePrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number = 0;

  @IsOptional()
  @IsNumber()
  @Min(0)
  volume?: number; // in milliliters

  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number; // in grams

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @IsOptional()
  @IsNumber()
  sortOrder?: number = 0;
}

// For product images
export class ProductImageCreateDto {
  @IsString()
  @IsNotEmpty()
  url: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  altText?: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number = 0;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean = false;
}

export class ProductCreateDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  // Pricing
  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  comparePrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costPrice?: number;

  // Inventory
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number = 0;

  @IsOptional()
  @IsBoolean()
  trackQuantity?: boolean = true;

  @IsOptional()
  @IsBoolean()
  allowBackorder?: boolean = false;

  @IsOptional()
  @IsNumber()
  @Min(1)
  lowStockAlert?: number = 5;

  // Product Type & Classification
  @IsEnum(ProductType)
  type: ProductType;

  @IsOptional()
  @IsEnum(ConcentrationLevel)
  concentration?: ConcentrationLevel;

  @IsEnum(Gender)
  gender: Gender;

  @IsArray()
  @IsEnum(Season, { each: true })
  @ArrayMinSize(1)
  season: Season[];

  // Fragrance Notes
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  topNotes: string[];

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  middleNotes: string[];

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  baseNotes: string[];

  // Specifications
  @IsOptional()
  @IsNumber()
  @Min(1)
  volume?: number; // in milliliters

  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number; // in grams

  @IsOptional()
  @IsString()
  ingredients?: string;

  @IsOptional()
  @IsString()
  howToUse?: string;

  // Marketing & Status
  @IsOptional()
  @IsBoolean()
  featured?: boolean = false;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus = ProductStatus.DRAFT;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[] = [];

  // Categories
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  categoryIds: string[];

  // Images
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageCreateDto)
  @ArrayMinSize(1)
  images: ProductImageCreateDto[];

  // Variants
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantCreateDto)
  variants?: ProductVariantCreateDto[] = [];

  // Publishing
  @IsOptional()
  @IsDateString()
  publishedAt?: string;
}
