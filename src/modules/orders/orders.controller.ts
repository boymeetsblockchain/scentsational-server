import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseUUIDPipe,
  DefaultValuePipe,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtGuard } from '../global/guards/jwt.guard';
import { RolesGuard } from '../global/guards/roles.guard';
import { UserRole, OrderStatus, PaymentStatus } from 'generated/prisma/enums';
import { OrderCreateDto } from './dtos/orders.create.dto';
import { OrderQueryDto } from './dtos/orders.query.dto';
import { Roles } from '../global/decorators/roles-decorator';
import { Request } from 'express';
import { OrdersUpdateShipping } from './dtos/orders.update-shipping-info';

@UseGuards(JwtGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async createOrder(@Req() req: Request, @Body() input: OrderCreateDto) {
    return await this.ordersService.createOrder(input, {
      id: req.user?.id!,
      phoneCountryCode: req.user.phoneCountryCode,
      phoneNumber: req.user.phoneNumber,
      firstName: req.user.firstName || null,
      lastName: req.user.lastName || null,
      email: req.user.email,
    });
  }

  // Get order by ID or order number (public for order tracking)
  @Get(':identifier')
  async getOrder(@Param('identifier') identifier: string) {
    return await this.ordersService.getOrderById(identifier);
  }

  @Get('my/orders')
  @UseGuards(JwtGuard)
  async getMyOrders(@Req() req: Request, @Query() query: OrderQueryDto) {
    return await this.ordersService.getUserOrders(req.user.id, query);
  }

  // Cancel own order
  @Patch('my/orders/:id/cancel')
  @UseGuards(JwtGuard)
  async cancelMyOrder(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) orderId: string,
    @Body('reason') reason?: string,
  ) {
    return await this.ordersService.cancelOrder(orderId, reason);
  }

  // 🔐 Admin Routes

  // Get all orders with filtering
  @Get()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAllOrders(@Query() query: OrderQueryDto) {
    return await this.ordersService.getAllOrders(query);
  }

  // Update order status
  @Patch(':id/status')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateOrderStatus(
    @Param('id', ParseUUIDPipe) orderId: string,
    @Body('status') status: OrderStatus,
    @Body('internalNote') internalNote?: string,
  ) {
    return await this.ordersService.updateOrderStatus(
      orderId,
      status,
      internalNote,
    );
  }

  // Update payment status
  @Patch(':id/payment-status')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updatePaymentStatus(
    @Param('id', ParseUUIDPipe) orderId: string,
    @Body('paymentStatus') paymentStatus: PaymentStatus,
    @Body('transactionId') transactionId?: string,
  ) {
    return await this.ordersService.updatePaymentStatus(
      orderId,
      paymentStatus,
      transactionId,
    );
  }

  // Update shipping information
  @Patch(':id/shipping')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateShippingInfo(
    @Param('id', ParseUUIDPipe) orderId: string,
    @Body() input: OrdersUpdateShipping,
  ) {
    return await this.ordersService.updateShippingInfo(orderId, input);
  }

  // Mark order as delivered
  @Patch(':id/deliver')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async markAsDelivered(@Param('id', ParseUUIDPipe) orderId: string) {
    return await this.ordersService.updateOrderStatus(
      orderId,
      OrderStatus.DELIVERED,
    );
  }

  // Cancel any order (admin)
  @Patch(':id/cancel')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async cancelOrder(
    @Param('id', ParseUUIDPipe) orderId: string,
    @Body('reason') reason?: string,
  ) {
    return await this.ordersService.cancelOrder(orderId, reason);
  }

  // Get order statistics
  @Get('analytics/stats')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getOrderStats(
    @Query('timeframe', new DefaultValuePipe('month'))
    timeframe: 'day' | 'week' | 'month' | 'year',
  ) {
    return await this.ordersService.getOrderStats(timeframe);
  }

  // Get orders by status
  @Get('status/:status')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getOrdersByStatus(
    @Param('status') status: OrderStatus,
    @Query() query: OrderQueryDto,
  ) {
    return await this.ordersService.getAllOrders({
      ...query,
      status,
    });
  }

  // Get recent orders
  @Get('recent/orders')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getRecentOrders(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return await this.ordersService.getAllOrders({
      limit,
      page: 1,
    });
  }
}
