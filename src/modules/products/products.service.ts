import { Injectable } from '@nestjs/common';
import { PrismaService } from '../global/prisma/prisma.service';
import { ProductsUtilsService } from './products.utils.service';
import { ProductCreateDto } from './dtos/product.create.dto';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prismaClient: PrismaService,
    private readonly productsUtils: ProductsUtilsService,
  ) {}

  async createProduct(input: ProductCreateDto) {
    // Validate product data
    this.productsUtils.validateProductData(input);

    // 1. Generate SKU
    const sku = this.productsUtils.generateSKU(input);

    // 2. Generate Slug
    const slug = await this.productsUtils.generateUniqueSlug(input.name);

    // 3. Generate variant SKUs
    const variantsWithSKUs =
      input.variants?.map((variant, index) => ({
        ...variant,
        sku: this.productsUtils.generateVariantSKU(sku, variant, index),
      })) || [];

    // 4. Create product with generated fields
    const productData = {
      ...input,
      sku,
      slug,
      variants: {
        create: variantsWithSKUs,
      },
      images: {
        create: input.images,
      },
      categories: {
        create: input.categoryIds.map((categoryId) => ({
          category: { connect: { id: categoryId } },
        })),
      },
    };

    return this.prismaClient.product.create({
      data: productData,
      include: {
        variants: true,
        images: true,
        categories: {
          include: {
            category: true,
          },
        },
      },
    });
  }

  async updateProductSlug(productId: string, newName: string) {
    const slug = await this.productsUtils.generateUniqueSlug(newName);

    return this.prismaClient.product.update({
      where: { id: productId },
      data: { slug },
    });
  }
}
