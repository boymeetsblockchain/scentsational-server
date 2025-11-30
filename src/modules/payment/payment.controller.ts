import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { UseGuards } from '@nestjs/common';
import { Roles } from '../global/decorators/roles-decorator';
import { JwtGuard } from '../global/guards/jwt.guard';
import { RolesGuard } from '../global/guards/roles.guard';
import { Request } from 'express';

import { PaymentStatus, UserRole } from 'generated/prisma/enums';
import { CreateManualPaymentDto } from './dtos/payment.create-manual-payment.dto';

@UseGuards(JwtGuard, RolesGuard)
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Roles(UserRole.USER)
  @Post('orders/:orderId/initialize')
  async initializePayment(
    @Req() req: Request,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    return await this.paymentService.initializePayment(orderId, {
      email: req.user.email,
    });
  }

  @Roles(UserRole.USER)
  @Post('verify/:reference')
  async verifyPayment(@Param('reference') reference: string) {
    return await this.paymentService.verifyPayment(reference);
  }

  // Create Manual Payment
  @Post('orders/:orderId/manual')
  @Roles(UserRole.ADMIN)
  async createManualPayment(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() input: CreateManualPaymentDto,
  ) {
    return await this.paymentService.createManualPayment(orderId, input);
  }

  // Get Payment by ID
  @Get(':id')
  @Roles(UserRole.ADMIN)
  async getPayment(@Param('id', ParseUUIDPipe) paymentId: string) {
    return await this.paymentService.getPayment(paymentId);
  }

  // Get Order Payments
  @Get('orders/:orderId')
  @Roles(UserRole.ADMIN)
  async getOrderPayments(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return await this.paymentService.getOrderPayments(orderId);
  }

  // Update Payment Status
  @Put(':id/status')
  @Roles(UserRole.ADMIN)
  async updatePaymentStatus(
    @Param('id', ParseUUIDPipe) paymentId: string,
    @Body('status') status: PaymentStatus,
    @Body('failureReason') failureReason?: string,
  ) {
    return await this.paymentService.updatePaymentStatus(
      paymentId,
      status,
      failureReason,
    );
  }

  // Refund Payment
  @Post(':id/refund')
  @Roles(UserRole.ADMIN)
  async refundPayment(
    @Param('id', ParseUUIDPipe) paymentId: string,
    @Body('reason') reason?: string,
  ) {
    return await this.paymentService.refundPayment(paymentId, reason);
  }

  // Get Payment Statistics
  @Get('analytics/stats')
  @Roles(UserRole.ADMIN)
  async getPaymentStats(
    @Query('timeframe', new DefaultValuePipe('month'))
    timeframe: 'day' | 'week' | 'month' | 'year',
  ) {
    return await this.paymentService.getPaymentStats(timeframe);
  }
}
