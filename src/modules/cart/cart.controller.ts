import {
  Controller,
  Post,
  Get,
  Put,
  Req,
  Body,
  Param,
  ParseUUIDPipe,
  Delete,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from '../global/guards/roles.guard';
import { Roles } from '../global/decorators/roles-decorator';
import { Request } from 'express';
import { AddToCartDto } from './dtos/cart.add.dto';
import { UpdateCartItemDto } from './dtos/cart.update.dto';
import { UserRole } from 'generated/prisma/enums';
import { JwtGuard } from '../global/guards/jwt.guard';

@UseGuards(JwtGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  // Get user cart
  @Get()
  async getCart(@Req() req: Request) {
    return await this.cartService.getOrCreateUserCart({ id: req.user.id });
  }

  // Get cart summary (for header/mini-cart)
  @Get('summary')
  async getCartSummary(@Req() req: Request) {
    return await this.cartService.getCartSummary({ id: req.user.id });
  }

  // Get cart items count
  @Get('count')
  async getCartItemsCount(@Req() req: Request) {
    const count = await this.cartService.getCartItemsCount({ id: req.user.id });
    return { count };
  }

  // Add item to cart
  @Post('items')
  async addToCart(@Req() req: Request, @Body() input: AddToCartDto) {
    return await this.cartService.addToCart({ id: req.user.id }, input);
  }

  // Update cart item quantity
  @Put('items/:itemId')
  async updateCartItem(
    @Req() req: Request,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() input: UpdateCartItemDto,
  ) {
    return await this.cartService.updateCartItem(
      { id: req.user.id },
      itemId,
      input,
    );
  }

  // Remove item from cart
  @Delete('items/:itemId')
  async removeFromCart(
    @Req() req: Request,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    return await this.cartService.removeFromCart({ id: req.user.id }, itemId);
  }

  // Clear entire cart
  @Delete()
  async clearCart(@Req() req: Request) {
    return await this.cartService.clearCart({ id: req.user.id });
  }

  // Merge guest cart with user cart (after login)
  // @Post('merge')
  // async mergeCarts(@Req() req: Request, @Body() input: MergeCartsDto) {
  //   return await this.cartService.mergeCarts(
  //     { id: req.user.id },
  //     input.guestCartItems,
  //   );
  // }

  // Validate cart before checkout
  @Get('validate')
  async validateCart(@Req() req: Request) {
    return await this.cartService.validateCart({ id: req.user.id });
  }
}
