import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { DiscountService } from './discount.service';
import { JwtGuard } from '../global/guards/jwt.guard';
import { RolesGuard } from '../global/guards/roles.guard';
import { Roles } from '../global/decorators/roles-decorator';
import { UserRole, User } from 'generated/prisma/client';
import { CreateDiscountDto } from './dtos/discount.create.dto';
import { UpdateDiscountDto } from './dtos/discount.update.dto';
import { ValidateDiscountDto } from './dtos/discount.validate.dto';
import { ApplyDiscountDto } from './dtos/discount.apply.dto';
import { DiscountQueryDto } from './dtos/discount.query.dto';
import { Request } from 'express';

@Controller('discount')
export class DiscountController {
  constructor(private readonly discountService: DiscountService) {}

  // ============================================
  // ADMIN ENDPOINTS
  // ============================================

  /**
   * Create a new discount
   * @route POST /discount
   * @access Admin only
   */
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  async createDiscount(@Body() input: CreateDiscountDto) {
    return await this.discountService.createDiscount(input);
  }

  /**
   * Get all discounts with filters
   * @route GET /discount
   * @access Admin only
   */
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  async getAllDiscounts(@Query() query: DiscountQueryDto) {
    return await this.discountService.listDiscounts(query);
  }

  /**
   * Get discount by ID
   * @route GET /discount/:id
   * @access Admin only
   */
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get(':id')
  async getDiscountById(@Param('id') id: string) {
    return await this.discountService.getDiscountById(id);
  }

  /**
   * Update discount
   * @route PUT /discount/:id
   * @access Admin only
   */
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put(':id')
  async updateDiscount(
    @Param('id') id: string,
    @Body() input: UpdateDiscountDto,
  ) {
    return await this.discountService.updateDiscount(id, input);
  }

  /**
   * Deactivate discount
   * @route PUT /discount/:id/deactivate
   * @access Admin only
   */
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  async deactivateDiscount(@Param('id') id: string) {
    return await this.discountService.deactivateDiscount(id);
  }

  /**
   * Reactivate discount
   * @route PUT /discount/:id/reactivate
   * @access Admin only
   */
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put(':id/reactivate')
  @HttpCode(HttpStatus.OK)
  async reactivateDiscount(@Param('id') id: string) {
    return await this.discountService.reactivateDiscount(id);
  }

  /**
   * Delete discount (soft delete by deactivating)
   * @route DELETE /discount/:id
   * @access Admin only
   */
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDiscount(@Param('id') id: string) {
    return await this.discountService.deleteDiscount(id);
  }

  // ============================================
  // PUBLIC/USER ENDPOINTS
  // ============================================

  /**
   * Validate discount code (for cart preview)
   * @route POST /discount/validate
   * @access Authenticated users
   */
  @UseGuards(JwtGuard)
  @Post('validate')
  async validateDiscount(
    @Body() input: ValidateDiscountDto,
    @Req() req: Request,
  ) {
    return await this.discountService.validateDiscount(input, {
      id: req.user.id,
    });
  }

  /**
   * Get discount by code (public preview)
   * @route GET /discount/code/:code
   * @access Public
   */
  @Get('code/:code')
  async getDiscountByCode(@Param('code') code: string) {
    const discount = await this.discountService.getDiscountByCode(code);

    // Return limited info for public access
    if (discount && discount.isActive) {
      return {
        code: discount.code,
        name: discount.name,
        description: discount.description,
        type: discount.type,
        value: discount.value,
        minOrderAmount: discount.minOrderAmount,
        expiresAt: discount.expiresAt,
      };
    }

    return null;
  }

  /**
   * Apply discount to order
   * @route POST /discount/apply
   * @access Authenticated users
   */
  @UseGuards(JwtGuard)
  @Post('apply')
  async applyDiscount(@Body() input: ApplyDiscountDto, @Req() req: Request) {
    return await this.discountService.applyDiscount(input, {
      id: req.user.id,
    });
  }

  /**
   * Get active discounts (public promotions)
   * @route GET /discount/active
   * @access Public
   */
  @Get('active/list')
  async getActiveDiscounts() {
    return await this.discountService.listDiscounts({
      isActive: true,
      page: 1,
      limit: 50,
    });
  }
}
