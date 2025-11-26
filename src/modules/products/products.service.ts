import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../global/prisma/prisma.service';
import { ProductsUtilsService } from './products.utils.service';

import { ProductStatus } from 'generated/prisma/enums';
import { ProductCreateDto } from './dtos/products.create.dto';
import { ProductUpdateDto } from './dtos/products.update.dto';
import { ProductQueryDto } from './dtos/products.query.dto';
import { isUUID } from 'class-validator';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prismaClient: PrismaService,
    private readonly productsUtils: ProductsUtilsService,
  ) {}

  // Create Product
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

    // 4. Create product with explicit data structure
    const productData = {
      // Basic fields
      name: input.name,
      description: input.description,
      price: input.price,
      comparePrice: input.comparePrice,
      costPrice: input.costPrice,
      quantity: input.quantity,
      trackQuantity: input.trackQuantity,
      allowBackorder: input.allowBackorder,
      lowStockAlert: input.lowStockAlert,

      // Product classification
      type: input.type,
      concentration: input.concentration,
      gender: input.gender,
      season: input.season,

      // Fragrance notes
      topNotes: input.topNotes,
      middleNotes: input.middleNotes,
      baseNotes: input.baseNotes,

      // Specifications
      volume: input.volume,
      weight: input.weight,
      ingredients: input.ingredients,
      howToUse: input.howToUse,

      // Marketing
      featured: input.featured,
      status: input.status,
      tags: input.tags,

      // Generated fields
      sku,
      slug,

      // Relations
      categories: {
        create: input.categoryIds.map((categoryId) => ({
          category: { connect: { id: categoryId } },
        })),
      },
      images: {
        create: input.images,
      },
      variants: {
        create: variantsWithSKUs,
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

  // Get All Products with filtering, pagination, and sorting
  async getAllProducts(query: ProductQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      gender,
      season,
      concentration,
      minPrice,
      maxPrice,
      status,
      featured,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      status: status || { not: 'DRAFT' }, // Exclude drafts by default
    };

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Category filter
    if (category) {
      where.categories = {
        some: {
          category: {
            OR: [{ id: category }, { slug: category }],
          },
        },
      };
    }

    // Gender filter
    if (gender) {
      where.gender = gender;
    }

    // Season filter
    if (season) {
      where.season = {
        has: season,
      };
    }

    // Concentration filter
    if (concentration) {
      where.concentration = concentration;
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    // Featured filter
    if (featured !== undefined) {
      where.featured = featured;
    }

    // Sort configuration
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [products, total] = await Promise.all([
      this.prismaClient.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          images: {
            orderBy: { sortOrder: 'asc' },
          },
          categories: {
            include: {
              category: true,
            },
          },
          variants: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
          },
          _count: {
            select: {
              reviews: true,
            },
          },
        },
      }),
      this.prismaClient.product.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: products,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  // Get Single Product by ID or Slug
  async getProductById(identifier: string) {
    const where: any = {};

    if (isUUID(identifier)) {
      // Only query id if it's a valid UUID
      where.id = identifier;
    } else {
      // Otherwise query by slug or SKU
      where.OR = [{ slug: identifier }, { sku: identifier }];
    }

    const product = await this.prismaClient.product.findFirst({
      where,
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        categories: { include: { category: true } },
        variants: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
        reviews: {
          where: { status: 'APPROVED' },
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { reviews: true, wishlists: true } },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const averageRating = await this.calculateAverageRating(product.id);

    return { ...product, averageRating };
  }

  // Update Product
  async updateProduct(productId: string, input: ProductUpdateDto) {
    // Check if product exists
    const existingProduct = await this.prismaClient.product.findUnique({
      where: { id: productId },
    });

    if (!existingProduct) {
      throw new NotFoundException('Product not found');
    }

    // If name is being updated, generate new slug
    let slug = existingProduct.slug;
    if (input.name && input.name !== existingProduct.name) {
      slug = await this.productsUtils.generateUniqueSlug(input.name);
    }

    const updateData: any = {
      ...input,
      slug,
    };

    // Handle category updates if provided
    if (input.categoryIds) {
      // First, remove existing categories
      await this.prismaClient.productCategory.deleteMany({
        where: { productId },
      });

      updateData.categories = {
        create: input.categoryIds.map((categoryId) => ({
          category: { connect: { id: categoryId } },
        })),
      };
    }

    return this.prismaClient.product.update({
      where: { id: productId },
      data: updateData,
      include: {
        images: true,
        categories: {
          include: {
            category: true,
          },
        },
        variants: true,
      },
    });
  }

  // Delete Product (Soft delete by updating status)
  async deleteProduct(productId: string) {
    const product = await this.prismaClient.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.prismaClient.product.update({
      where: { id: productId },
      data: {
        status: 'INACTIVE',
      },
    });
  }

  // Get Products by Category
  async getProductsByCategory(categorySlug: string, query: ProductQueryDto) {
    const category = await this.prismaClient.category.findUnique({
      where: { slug: categorySlug },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return this.getAllProducts({
      ...query,
      category: category.id,
    });
  }

  // Get Featured Products
  async getFeaturedProducts(limit: number = 8) {
    return this.prismaClient.product.findMany({
      where: {
        featured: true,
        status: 'ACTIVE',
      },
      take: limit,
      include: {
        images: {
          where: { isPrimary: true },
        },
        categories: {
          include: {
            category: true,
          },
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Get Related Products
  async getRelatedProducts(productId: string, limit: number = 4) {
    const product = await this.prismaClient.product.findUnique({
      where: { id: productId },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const categoryIds = product.categories.map((pc) => pc.categoryId);

    return this.prismaClient.product.findMany({
      where: {
        id: { not: productId },
        status: 'ACTIVE',
        categories: {
          some: {
            categoryId: { in: categoryIds },
          },
        },
      },
      take: limit,
      include: {
        images: {
          where: { isPrimary: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Update Product Status
  async updateProductStatus(productId: string, status: ProductStatus) {
    const product = await this.prismaClient.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.prismaClient.product.update({
      where: { id: productId },
      data: { status },
    });
  }

  // Helper method to calculate average rating
  private async calculateAverageRating(productId: string): Promise<number> {
    const result = await this.prismaClient.review.aggregate({
      where: {
        productId,
        status: 'APPROVED',
      },
      _avg: {
        rating: true,
      },
    });

    return result._avg.rating || 0;
  }

  // Update product slug (existing method)
  async updateProductSlug(productId: string, newName: string) {
    const slug = await this.productsUtils.generateUniqueSlug(newName);

    return this.prismaClient.product.update({
      where: { id: productId },
      data: { slug },
    });
  }
}
