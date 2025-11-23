import { Injectable } from '@nestjs/common';
import { PrismaService } from '../global/prisma/prisma.service';
import { ConcentrationLevel } from 'generated/prisma/enums';
import {
  ProductCreateDto,
  ProductVariantCreateDto,
} from './dtos/products.create.dto';
import slugify from 'slugify';

@Injectable()
export class ProductsUtilsService {
  constructor(private readonly prismaClient: PrismaService) {}

  generateSKU(input: ProductCreateDto): string {
    const brandAbbr = this.getBrandAbbreviation(input.name);
    const concentrationAbbr = this.getConcentrationAbbreviation(
      input.concentration,
    );
    const volume = input.volume || 0;
    const randomNum = Math.floor(100 + Math.random() * 900); // 3-digit random

    return `${brandAbbr}-${concentrationAbbr}-${volume}ML-${randomNum}`.toUpperCase();
  }

  generateVariantSKU(
    baseSKU: string,
    variant: ProductVariantCreateDto,
    index: number,
  ): string {
    const variantCode = variant.volume
      ? `${variant.volume}ML`
      : `VAR${index + 1}`;
    return `${baseSKU}-${variantCode}`;
  }

  async generateUniqueSlug(name: string): Promise<string> {
    const baseSlug = slugify(name, {
      lower: true,
      strict: true,
      trim: true,
    });

    let slug = baseSlug;
    let counter = 1;

    // Check if slug already exists
    while (await this.prismaClient.product.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;

      // Safety check to prevent infinite loop
      if (counter > 100) {
        throw new Error('Unable to generate unique slug after 100 attempts');
      }
    }

    return slug;
  }

  private getBrandAbbreviation(productName: string): string {
    // Extract first letters of first two words, or use first 3 letters
    const words = productName.split(' ').filter((word) => word.length > 0);
    if (words.length >= 2) {
      return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
    }
    return productName.substring(0, 3).toUpperCase();
  }

  private getConcentrationAbbreviation(
    concentration?: ConcentrationLevel,
  ): string {
    const abbreviations: Record<ConcentrationLevel, string> = {
      [ConcentrationLevel.EAU_FRAICHE]: 'EF',
      [ConcentrationLevel.EAU_DE_COLOGNE]: 'EDC',
      [ConcentrationLevel.EAU_DE_TOILETTE]: 'EDT',
      [ConcentrationLevel.EAU_DE_PARFUM]: 'EDP',
      [ConcentrationLevel.PARFUM]: 'PARF',
      [ConcentrationLevel.EXTRAIT]: 'EXT',
    };
    return concentration ? abbreviations[concentration] : 'GEN';
  }

  // Additional utility methods you might need:

  validateProductData(input: ProductCreateDto): void {
    // Validate that base product has price if no variants
    if (!input.variants || input.variants.length === 0) {
      if (!input.price || input.price <= 0) {
        throw new Error(
          'Base product price is required when no variants are provided',
        );
      }
    }

    // Validate that at least one image is marked as primary
    const hasPrimaryImage = input.images.some((image) => image.isPrimary);
    if (!hasPrimaryImage && input.images.length > 0) {
      // Auto-set first image as primary
      input.images[0].isPrimary = true;
    }
  }

  calculateProfitMargin(costPrice: number, sellingPrice: number): number {
    if (costPrice <= 0 || sellingPrice <= 0) return 0;
    return ((sellingPrice - costPrice) / sellingPrice) * 100;
  }

  generateProductCode(type: string, sequence: number): string {
    const typeCodes: Record<string, string> = {
      PERFUME: 'PERF',
      BODY_SPRAY: 'BSPR',
      CANDLE: 'CAND',
      DIFFUSER: 'DIFF',
      GIFT_SET: 'GIFT',
    };

    const typeCode = typeCodes[type] || 'PROD';
    return `${typeCode}-${sequence.toString().padStart(6, '0')}`;
  }
}
