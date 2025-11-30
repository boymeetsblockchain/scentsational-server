import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../global/prisma/prisma.service';
import { OrderCreateDto } from './dtos/orders.create.dto';
import { OrderQueryDto } from './dtos/orders.query.dto';
import {
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
} from 'generated/prisma/enums';
import { User } from 'generated/prisma/client';
import { OrdersUpdateShipping } from './dtos/orders.update-shipping-info';

@Injectable()
export class OrdersService {
  constructor(private readonly prismaClient: PrismaService) {}

  // Generate unique order number
  private async generateOrderNumber(): Promise<string> {
    const latestOrder = await this.prismaClient.order.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { orderNumber: true },
    });

    if (!latestOrder) {
      return 'ORD-0001';
    }

    const lastNumber = parseInt(latestOrder.orderNumber.split('-')[1]);
    return `ORD-${(lastNumber + 1).toString().padStart(4, '0')}`;
  }

  //   Validate billing address requirement
  private requiresBillingAddress(paymentMethod: PaymentMethod): boolean {
    const methodsRequiringBilling: PaymentMethod[] = [
      PaymentMethod.CREDIT_CARD,
      PaymentMethod.DEBIT_CARD,
    ];
    return methodsRequiringBilling.includes(paymentMethod);
  }

  // Create Order
  async createOrder(
    input: OrderCreateDto,
    user: Pick<
      User,
      | 'id'
      | 'firstName'
      | 'lastName'
      | 'email'
      | 'phoneCountryCode'
      | 'phoneNumber'
    >,
  ) {
    // Validate billing address based on payment method
    if (this.requiresBillingAddress(input.paymentMethod)) {
      if (!input.billingAddressLine1 || !input.billingCity) {
        throw new BadRequestException(
          'Billing address is required for this payment method',
        );
      }
    }

    // Generate order number
    const orderNumber = await this.generateOrderNumber();

    // Calculate totals
    const subtotal = input.items.reduce(
      (sum: any, item: any) => sum + item.price * item.quantity,
      0,
    );
    const totalAmount =
      subtotal +
      (input.taxAmount || 0) +
      (input.shippingAmount || 0) -
      (input.discountAmount || 0);

    return this.prismaClient.order.create({
      data: {
        orderNumber,
        userId: user.id!,

        subtotal,
        discountAmount: input.discountAmount || 0,
        taxAmount: input.taxAmount || 0,
        shippingAmount: input.shippingAmount || 0,
        totalAmount,

        // Status
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        paymentMethod: input.paymentMethod,

        // Customer snapshot
        customerEmail: user.email,
        customerFirstName: user.firstName!,
        customerLastName: user.lastName!,
        customerPhone: user.phoneCountryCode + user.phoneNumber,

        // Shipping address (required)
        shippingFirstName: user.firstName!,
        shippingLastName: user.lastName!,
        shippingCompany: input.shippingCompany,
        shippingAddressLine1: input.shippingAddressLine1,
        shippingAddressLine2: input.shippingAddressLine2,
        shippingCity: input.shippingCity,
        shippingState: input.shippingState,
        shippingPostalCode: input.shippingPostalCode,
        shippingCountry: input.shippingCountry,
        shippingPhone:
          input.shippingPhone || user.phoneCountryCode + user.phoneNumber,

        // Billing address (optional)
        billingFirstName: input.billingFirstName,
        billingLastName: input.billingLastName,
        billingCompany: input.billingCompany,
        billingAddressLine1: input.billingAddressLine1,
        billingAddressLine2: input.billingAddressLine2,
        billingCity: input.billingCity,
        billingState: input.billingState,
        billingPostalCode: input.billingPostalCode,
        billingCountry: input.billingCountry,

        // Discount
        discountId: input.discountId,
        discountCode: input.discountCode,

        // Notes
        customerNote: input.customerNote,

        // Order items
        items: {
          create: input.items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            productName: item.productName,
            productSku: item.productSku,
            variantName: item.variantName,
            productImage: item.productImage,
            price: item.price,
            comparePrice: item.comparePrice,
            quantity: item.quantity,
            total: item.price * item.quantity,
          })),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        items: true,
        payments: true,
        discount: true,
      },
    });
  }

  // Get All Orders with Filtering
  async getAllOrders(query: OrderQueryDto) {
    const {
      page = 1,
      limit = 10,
      userId,
      status,
      paymentStatus,
      paymentMethod,
      startDate,
      endDate,
      search,
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (userId) where.userId = userId;
    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (paymentMethod) where.paymentMethod = paymentMethod;

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Search filter
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { customerFirstName: { contains: search, mode: 'insensitive' } },
        { customerLastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [orders, total] = await Promise.all([
      this.prismaClient.order.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  images: {
                    where: { isPrimary: true },
                    take: 1,
                  },
                },
              },
            },
          },
          payments: true,
          _count: {
            select: {
              items: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prismaClient.order.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: orders,
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

  // Get Order by ID or Order Number
  async getOrderById(identifier: string) {
    const order = await this.prismaClient.order.findFirst({
      where: {
        OR: [{ id: identifier }, { orderNumber: identifier }],
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
          },
        },
        items: {
          include: {
            product: {
              include: {
                images: true,
              },
            },
            variant: true,
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
        discount: true,
        shippingAddress: true,
        billingAddress: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  // Get User Orders
  async getUserOrders(user: Pick<User, 'id'>, query: OrderQueryDto) {
    return this.getAllOrders({
      ...query,
      userId: user.id!,
    });
  }

  // Update Order Status
  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    internalNote?: string,
  ) {
    const order = await this.prismaClient.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const updateData: any = { status };

    // Set timestamps for specific status changes
    if (status === OrderStatus.SHIPPED && !order.shippedAt) {
      updateData.shippedAt = new Date();
    } else if (status === OrderStatus.DELIVERED && !order.deliveredAt) {
      updateData.deliveredAt = new Date();
    } else if (status === OrderStatus.CANCELLED && !order.cancelledAt) {
      updateData.cancelledAt = new Date();
    }

    if (internalNote) {
      updateData.internalNote = internalNote;
    }

    return this.prismaClient.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
          },
        },
        items: true,
      },
    });
  }

  // Update Payment Status
  async updatePaymentStatus(
    orderId: string,
    paymentStatus: PaymentStatus,
    transactionId?: string,
  ) {
    const order = await this.prismaClient.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // If payment is completed, update order status to confirmed
    let orderStatus = order.status;
    if (
      paymentStatus === PaymentStatus.COMPLETED &&
      order.status === OrderStatus.PENDING
    ) {
      orderStatus = OrderStatus.CONFIRMED;
    }

    return this.prismaClient.order.update({
      where: { id: orderId },
      data: {
        paymentStatus,
        status: orderStatus,
        transactionId,
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
          },
        },
      },
    });
  }

  // Update Shipping Information
  async updateShippingInfo(orderId: string, input: OrdersUpdateShipping) {
    const order = await this.prismaClient.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.prismaClient.order.update({
      where: { id: orderId },
      data: {
        trackingNumber: input.trackingNumber,
        carrier: input.carrier,
        shippedAt: new Date(),
        status: OrderStatus.SHIPPED,
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
          },
        },
      },
    });
  }

  // Cancel Order
  async cancelOrder(orderId: string, reason?: string) {
    const order = await this.prismaClient.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        payments: {
          where: { status: PaymentStatus.COMPLETED },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check if order can be cancelled
    if (
      !([OrderStatus.PENDING, OrderStatus.CONFIRMED] as OrderStatus[]).includes(
        order.status,
      )
    ) {
      throw new BadRequestException('Order cannot be cancelled at this stage');
    }

    // If payment was completed, initiate refund
    if (order.payments.length > 0) {
      // Here you would integrate with your payment processor for refunds
      console.log(`Initiating refund for order ${order.orderNumber}`);
    }

    return this.prismaClient.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CANCELLED,
        cancelledAt: new Date(),
        internalNote: reason ? `Cancelled: ${reason}` : undefined,
      },
    });
  }

  // Get Order Statistics
  async getOrderStats(timeframe: 'day' | 'week' | 'month' | 'year' = 'month') {
    const now = new Date();
    let startDate = new Date();

    switch (timeframe) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    const [totalOrders, totalRevenue, averageOrderValue, statusCounts] =
      await Promise.all([
        // Total orders
        this.prismaClient.order.count({
          where: {
            createdAt: { gte: startDate },
            status: { not: OrderStatus.CANCELLED },
          },
        }),

        // Total revenue
        this.prismaClient.order.aggregate({
          where: {
            createdAt: { gte: startDate },
            status: { not: OrderStatus.CANCELLED },
            paymentStatus: PaymentStatus.COMPLETED,
          },
          _sum: { totalAmount: true },
        }),

        // Average order value
        this.prismaClient.order.aggregate({
          where: {
            createdAt: { gte: startDate },
            status: { not: OrderStatus.CANCELLED },
            paymentStatus: PaymentStatus.COMPLETED,
          },
          _avg: { totalAmount: true },
        }),

        // Orders by status
        this.prismaClient.order.groupBy({
          by: ['status'],
          where: {
            createdAt: { gte: startDate },
          },
          _count: { id: true },
        }),
      ]);

    return {
      timeframe,
      totalOrders,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      averageOrderValue: averageOrderValue._avg.totalAmount || 0,
      statusBreakdown: statusCounts.reduce((acc, item) => {
        acc[item.status] = item._count.id;
        return acc;
      }, {}),
    };
  }
}
