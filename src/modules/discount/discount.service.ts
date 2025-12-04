import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateDiscountDto } from './dtos/discount.create.dto';
import { UpdateDiscountDto } from './dtos/discount.update.dto';
import { ValidateDiscountDto } from './dtos/discount.validate.dto';
import { DiscountValidationResultDto } from './dtos/discount.validation.result.dto';
import { Discount, DiscountType, User } from 'generated/prisma/client';
import { PrismaService } from '../global/prisma/prisma.service';
import { ApplyDiscountDto } from './dtos/discount.apply.dto';
import { DiscountQueryDto } from './dtos/discount.query.dto';

@Injectable()
export class DiscountService {
  constructor(private readonly prismaClient: PrismaService) {}

  // Private helper methods
  private async validateDiscountRules(
    discount: any,
    userId: string,
    orderAmount: number,
    productIds: string[],
    categoryIds: string[],
    customerId?: string,
  ): Promise<DiscountValidationResultDto> {
    const now = new Date();

    // Check expiration
    if (discount.expiresAt && discount.expiresAt < now) {
      return {
        isValid: false,
        discountAmount: 0,
        message: 'Discount has expired',
      };
    }

    // Check start date
    if (discount.startsAt && discount.startsAt > now) {
      return {
        isValid: false,
        discountAmount: 0,
        message: 'Discount not yet started',
      };
    }

    // Check minimum order amount
    if (
      discount.minOrderAmount &&
      orderAmount < discount.minOrderAmount.toNumber()
    ) {
      return {
        isValid: false,
        discountAmount: 0,
        message: `Minimum order amount of ${discount.minOrderAmount} required`,
      };
    }

    // Check usage limit
    if (discount.usageLimit && discount.usedCount >= discount.usageLimit) {
      return {
        isValid: false,
        discountAmount: 0,
        message: 'Discount usage limit reached',
      };
    }

    if (discount.oncePerCustomer) {
      const existingUsage = await this.prismaClient.discountUsage.findFirst({
        where: {
          discountId: discount.id,
          userId,
        },
      });

      if (existingUsage) {
        return {
          isValid: false,
          discountAmount: 0,
          message: 'Discount can only be used once per customer',
        };
      }
    }

    const checkCustomerId = customerId || userId;
    if (
      discount.customerIds.length > 0 &&
      !discount.customerIds.includes(checkCustomerId)
    ) {
      return {
        isValid: false,
        discountAmount: 0,
        message: 'Discount not available for this customer',
      };
    }

    if (!discount.appliesToAllProducts) {
      const hasEligibleProduct =
        productIds.some((productId) =>
          discount.productIds.includes(productId),
        ) ||
        categoryIds.some((categoryId) =>
          discount.categoryIds.includes(categoryId),
        );

      if (!hasEligibleProduct) {
        return {
          isValid: false,
          discountAmount: 0,
          message: 'Discount not applicable to products in cart',
        };
      }
    }

    return { isValid: true, discountAmount: 0 };
  }

  private calculateDiscountAmount(
    discount: Discount,
    orderAmount: number,
  ): number {
    let discountAmount = 0;

    switch (discount.type) {
      case 'PERCENTAGE':
        discountAmount = orderAmount * (discount.value.toNumber() / 100);
        break;

      case 'FIXED_AMOUNT':
        discountAmount = discount.value.toNumber();
        break;

      case 'FREE_SHIPPING':
        // For free shipping, return 0 as shipping is handled separately
        discountAmount = 0;
        break;
    }

    // Apply max discount amount if set
    if (
      discount.maxDiscountAmount &&
      discountAmount > discount.maxDiscountAmount.toNumber()
    ) {
      discountAmount = discount.maxDiscountAmount.toNumber();
    }

    // Ensure discount doesn't exceed order amount
    if (discountAmount > orderAmount) {
      discountAmount = orderAmount;
    }

    return discountAmount;
  }

  async createDiscount(input: CreateDiscountDto) {
    // Check if code already exists
    const existingDiscount = await this.prismaClient.discount.findUnique({
      where: { code: input.code },
    });

    if (existingDiscount) {
      throw new ConflictException('Discount code already exists');
    }

    // Create discount
    return await this.prismaClient.discount.create({
      data: {
        code: input.code,
        name: input.name,
        description: input.description,
        type: input.type,
        value: input.value,
        usageLimit: input.usageLimit,
        minOrderAmount: input.minOrderAmount,
        maxDiscountAmount: input.maxDiscountAmount,
        startsAt: input.startsAt,
        expiresAt: input.expiresAt,
        isActive: input.isActive,
        appliesToAllProducts: input.appliesToAllProducts,
        productIds: input.productIds,
        categoryIds: input.categoryIds,
        oncePerCustomer: input.oncePerCustomer,
        customerIds: input.customerIds,
      },
    });
  }

  async updateDiscount(id: string, input: UpdateDiscountDto) {
    // Check if discount exists
    const discount = await this.prismaClient.discount.findUnique({
      where: { id },
    });

    if (!discount) {
      throw new NotFoundException('Discount not found');
    }

    // If updating code, check for conflicts
    if (input.code && input.code !== discount.code) {
      const existingDiscount = await this.prismaClient.discount.findUnique({
        where: { code: input.code },
      });

      if (existingDiscount) {
        throw new ConflictException('Discount code already exists');
      }
    }

    // Update discount
    return await this.prismaClient.discount.update({
      where: { id },
      data: input,
    });
  }

  async getDiscountById(id: string) {
    const discount = await this.prismaClient.discount.findUnique({
      where: { id },
      include: {
        discountUsages: {
          take: 10,
          orderBy: { usedAt: 'desc' },
          include: {
            product: true,
          },
        },
      },
    });

    if (!discount) {
      throw new NotFoundException('Discount not found');
    }

    return discount;
  }

  async validateDiscount(
    input: ValidateDiscountDto,
    user: Pick<User, 'id'>,
  ): Promise<DiscountValidationResultDto> {
    const {
      discountCode,
      orderAmount = 0,
      productIds = [],
      categoryIds = [],
      customerId,
    } = input;

    // Find active discount
    const discount = await this.prismaClient.discount.findFirst({
      where: {
        code: discountCode,
        isActive: true,
        AND: [
          {
            OR: [{ startsAt: null }, { startsAt: { lte: new Date() } }],
          },
          {
            OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
          },
        ],
      },
    });

    if (!discount) {
      return {
        isValid: false,
        discountAmount: 0,
        message: 'Discount not found or expired',
      };
    }

    // Validate discount rules
    const validation = await this.validateDiscountRules(
      discount,
      user.id,
      orderAmount,
      productIds,
      categoryIds,
      customerId,
    );

    if (!validation.isValid) {
      return validation;
    }

    // Calculate discount amount
    const discountAmount = this.calculateDiscountAmount(discount, orderAmount);

    return {
      isValid: true,
      discountAmount,
      discount,
      isFreeShipping: discount.type === 'FREE_SHIPPING',
      originalAmount: orderAmount,
      finalAmount: orderAmount - discountAmount,
    };
  }

  async getDiscountByCode(code: string) {
    return await this.prismaClient.discount.findUnique({
      where: { code },
    });
  }

  async listDiscounts(filters: DiscountQueryDto) {
    const { isActive, search, type, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (type) {
      where.type = type as DiscountType;
    }

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [discounts, total] = await Promise.all([
      this.prismaClient.discount.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prismaClient.discount.count({ where }),
    ]);

    return {
      discounts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async applyDiscount(input: ApplyDiscountDto, user: Pick<User, 'id'>) {
    // Check if discount exists and is still valid
    const discount = await this.prismaClient.discount.findUnique({
      where: { id: input.discountId },
    });

    if (!discount || !discount.isActive) {
      throw new Error('Discount not available');
    }

    // Check if once per customer restriction applies
    if (discount.oncePerCustomer) {
      const existingUsage = await this.prismaClient.discountUsage.findFirst({
        where: {
          discountId: input.discountId,
          userId: user.id,
        },
      });

      if (existingUsage) {
        throw new Error('Discount can only be used once per customer');
      }
    }

    // Check customer eligibility
    if (
      discount.customerIds.length > 0 &&
      !discount.customerIds.includes(user.id)
    ) {
      throw new Error('Discount not available for this customer');
    }

    // Check usage limit
    if (discount.usageLimit && discount.usedCount >= discount.usageLimit) {
      throw new Error('Discount usage limit reached');
    }

    // Start transaction
    return await this.prismaClient.$transaction(async (tx) => {
      // Record discount usage
      const discountUsage = await tx.discountUsage.create({
        data: {
          discountId: input.discountId,
          userId: user.id,
          orderId: input.orderId,
          productId: input.productId,
        },
      });

      // Increment discount usage count
      await tx.discount.update({
        where: { id: input.discountId },
        data: {
          usedCount: {
            increment: 1,
          },
        },
      });

      return discountUsage;
    });
  }

  async deactivateDiscount(id: string) {
    return await this.prismaClient.discount.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // Reactivate discount
  async reactivateDiscount(id: string) {
    return await this.prismaClient.discount.update({
      where: { id },
      data: { isActive: true },
    });
  }

  async deleteDiscount(id: string) {
    return await this.deactivateDiscount(id);
  }
}
