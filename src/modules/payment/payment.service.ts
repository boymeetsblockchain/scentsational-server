import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { PaymentStatus, PaymentMethod } from 'generated/prisma/enums';
import { PrismaService } from '../global/prisma/prisma.service';
import { PaystackService } from '../integrations/paystack/paystack.service';
import { CreateManualPaymentDto } from './dtos/payment.create-manual-payment.dto';
import { InitializePayment } from './dtos/payment.initialize.dto';
import { User } from 'generated/prisma/client';

@Injectable()
export class PaymentService {
  constructor(
    private readonly prismaClient: PrismaService,
    private readonly paystackService: PaystackService,
  ) {}

  // Initialize Payment with Paystack
  async initializePayment(input: InitializePayment, user: Pick<User, 'email'>) {
    // Verify order exists and get amount
    const order = await this.prismaClient.order.findUnique({
      where: { id: input.orderId },
      select: {
        id: true,
        orderNumber: true,
        totalAmount: true,
        paymentStatus: true,
        paymentMethod: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check if payment already exists and is completed
    if (order.paymentStatus === PaymentStatus.COMPLETED) {
      throw new BadRequestException(
        'Payment already completed for this order, contact support',
      );
    }

    // Initialize payment with Paystack
    const paystackResponse = await this.paystackService.initializeTransaction({
      amount: order.totalAmount.toNumber(),
      email: user.email,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
      },
    });

    // Create payment record
    const payment = await this.prismaClient.payment.create({
      data: {
        orderId: order.id,
        amount: order.totalAmount,
        currency: 'NGN',
        paymentMethod: order.paymentMethod,
        paymentIntentId: paystackResponse.data.reference,
        processor: 'paystack',
        status: PaymentStatus.PENDING,
        metadata: {
          paystackReference: paystackResponse.data.reference,
          authorizationUrl: paystackResponse.data.authorization_url,
          accessCode: paystackResponse.data.access_code,
        },
      },
    });

    // Update order payment status
    await this.prismaClient.order.update({
      where: { id: input.orderId },
      data: { paymentStatus: PaymentStatus.PROCESSING },
    });

    return {
      paymentId: payment.id,
      authorizationUrl: paystackResponse.data.authorization_url,
      reference: paystackResponse.data.reference,
      amount: order.totalAmount.toNumber(),
    };
  }

  // Verify Payment with Paystack
  async verifyPayment(paymentIntentId: string) {
    if (!paymentIntentId) {
      throw new BadRequestException('Payment reference is required');
    }

    // Find payment record
    const payment = await this.prismaClient.payment.findFirst({
      where: { paymentIntentId },
      include: {
        order: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment record not found');
    }

    // Verify payment with Paystack
    const verification =
      await this.paystackService.verifyTransaction(paymentIntentId);

    let paymentStatus: PaymentStatus;
    let failureReason: string | null = null;
    let transactionId: string | null = null;

    if (verification.data.status === 'success') {
      paymentStatus = PaymentStatus.COMPLETED;
      transactionId = verification.data.id.toString();
    } else if (verification.data.status === 'failed') {
      paymentStatus = PaymentStatus.FAILED;
      failureReason = verification.data.gateway_response || 'Payment failed';
    } else {
      paymentStatus = PaymentStatus.PENDING;
    }

    // Update payment record
    const updatedPayment = await this.prismaClient.payment.update({
      where: { id: payment.id },
      data: {
        status: paymentStatus,
        transactionId,
        failureReason,
        metadata: {
          ...(payment.metadata as any),
          paystackVerification: verification.data,
          verifiedAt: new Date().toISOString(),
        },
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
          },
        },
      },
    });

    // Update order payment status if payment is completed
    if (paymentStatus === PaymentStatus.COMPLETED) {
      await this.prismaClient.order.update({
        where: { id: payment.orderId },
        data: {
          paymentStatus: PaymentStatus.COMPLETED,
          transactionId,
        },
      });
    }

    return {
      payment: updatedPayment,
      verification: verification.data,
    };
  }

  // Create Manual Payment (for bank transfers, cash, etc.)
  async createManualPayment(orderId: string, input: CreateManualPaymentDto) {
    const order = await this.prismaClient.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        totalAmount: true,
        paymentStatus: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.paymentStatus === PaymentStatus.COMPLETED) {
      throw new BadRequestException('Payment already completed for this order');
    }

    const payment = await this.prismaClient.payment.create({
      data: {
        orderId: order.id,
        amount: input.amount || order.totalAmount,
        currency: input.currency || 'USD',
        paymentMethod: input.paymentMethod,
        processor: input.processor || 'manual',
        status: input.status || PaymentStatus.PENDING,
        transactionId: input.transactionId,
        failureReason: input.failureReason,
        metadata: input.metadata,
      },
      include: {
        order: {
          select: {
            orderNumber: true,
            totalAmount: true,
          },
        },
      },
    });

    // Update order payment status
    await this.prismaClient.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: input.status || PaymentStatus.PENDING,
        transactionId: input.transactionId,
      },
    });

    return payment;
  }

  // Get Payment by ID
  async getPayment(paymentId: string) {
    const payment = await this.prismaClient.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            customerEmail: true,
            customerFirstName: true,
            customerLastName: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  // Get Payments by Order ID
  async getOrderPayments(orderId: string) {
    const order = await this.prismaClient.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.prismaClient.payment.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          select: {
            orderNumber: true,
            totalAmount: true,
          },
        },
      },
    });
  }

  // Update Payment Status
  async updatePaymentStatus(
    paymentId: string,
    status: PaymentStatus,
    failureReason?: string,
  ) {
    const payment = await this.prismaClient.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const updatedPayment = await this.prismaClient.payment.update({
      where: { id: paymentId },
      data: {
        status,
        failureReason,
      },
    });

    // Update order payment status if needed
    if (status === PaymentStatus.COMPLETED) {
      await this.prismaClient.order.update({
        where: { id: payment.orderId },
        data: { paymentStatus: PaymentStatus.COMPLETED },
      });
    } else if (status === PaymentStatus.FAILED) {
      await this.prismaClient.order.update({
        where: { id: payment.orderId },
        data: { paymentStatus: PaymentStatus.FAILED },
      });
    }

    return updatedPayment;
  }

  // Refund Payment
  async refundPayment(paymentId: string, reason?: string) {
    const payment = await this.prismaClient.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException('Only completed payments can be refunded');
    }

    // Here you would integrate with Paystack refund API
    // For now, we'll just update the status
    const refundedPayment = await this.prismaClient.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.REFUNDED,
        failureReason: reason || 'Payment refunded',
        metadata: {
          ...(payment.metadata as any),
          refundedAt: new Date().toISOString(),
          refundReason: reason,
        },
      },
    });

    // Update order status
    await this.prismaClient.order.update({
      where: { id: payment.orderId },
      data: {
        paymentStatus: PaymentStatus.REFUNDED,
        refundedAt: new Date(),
      },
    });

    return refundedPayment;
  }

  // Get Payment Statistics
  async getPaymentStats(
    timeframe: 'day' | 'week' | 'month' | 'year' = 'month',
  ) {
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

    const [totalRevenue, successfulPayments, failedPayments, paymentMethods] =
      await Promise.all([
        // Total revenue
        this.prismaClient.payment.aggregate({
          where: {
            createdAt: { gte: startDate },
            status: PaymentStatus.COMPLETED,
          },
          _sum: { amount: true },
        }),

        // Successful payments count
        this.prismaClient.payment.count({
          where: {
            createdAt: { gte: startDate },
            status: PaymentStatus.COMPLETED,
          },
        }),

        // Failed payments count
        this.prismaClient.payment.count({
          where: {
            createdAt: { gte: startDate },
            status: PaymentStatus.FAILED,
          },
        }),

        // Payments by method
        this.prismaClient.payment.groupBy({
          by: ['paymentMethod'],
          where: {
            createdAt: { gte: startDate },
            status: PaymentStatus.COMPLETED,
          },
          _count: { id: true },
          _sum: { amount: true },
        }),
      ]);

    return {
      timeframe,
      totalRevenue: totalRevenue._sum.amount || 0,
      successfulPayments,
      failedPayments,
      successRate:
        (successfulPayments / (successfulPayments + failedPayments)) * 100,
      paymentMethods: paymentMethods.reduce((acc, method) => {
        acc[method.paymentMethod] = {
          count: method._count.id,
          amount: method._sum.amount,
        };
        return acc;
      }, {}),
    };
  }
}
