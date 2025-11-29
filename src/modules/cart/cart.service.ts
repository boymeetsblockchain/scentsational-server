import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../global/prisma/prisma.service';
import { AddToCartDto } from './dtos/add-to-cart.dto';
import { UpdateCartItemDto } from './dtos/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(private readonly prismaClient: PrismaService) {}

  // Get or Create User Cart
  async getOrCreateUserCart(userId: string) {
    let cart = await this.prismaClient.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
            variant: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!cart) {
      cart = await this.prismaClient.cart.create({
        data: {
          userId,
          itemsCount: 0,
          totalAmount: 0,
        },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: {
                    where: { isPrimary: true },
                    take: 1,
                  },
                },
              },
              variant: true,
            },
          },
        },
      });
    }

    return cart;
  }

  // Add Item to Cart
  async addToCart(userId: string, input: AddToCartDto) {
    const { productId, variantId, quantity = 1 } = input;

    // Get or create cart
    const cart = await this.getOrCreateUserCart(userId);

    // Verify product exists and get current price
    const product = await this.prismaClient.product.findUnique({
      where: { id: productId },
      include: {
        variants: variantId ? { where: { id: variantId } } : false,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check inventory
    if (product.trackQuantity && product.quantity < quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    // Get price from variant or base product
    let price = product.price;
    let variant = null;

    if (variantId) {
      variant = product.variants?.[0];
      if (!variant) {
        throw new NotFoundException('Product variant not found');
      }
      if (variant.trackQuantity && variant.quantity < quantity) {
        throw new BadRequestException('Insufficient stock for this variant');
      }
      price = variant.price;
    }

    // Check if item already exists in cart
    const existingItem = await this.prismaClient.cartItem.findUnique({
      where: {
        cartId_productId_variantId: {
          cartId: cart.id,
          productId,
          variantId: variantId || '', // Use empty string for no variant
        },
      },
    });

    if (existingItem) {
      // Update quantity if item exists
      return await this.updateCartItem(userId, existingItem.id, {
        quantity: existingItem.quantity + quantity,
      });
    }

    // Create new cart item
    const cartItem = await this.prismaClient.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        variantId: variantId || null,
        quantity,
        price,
      },
      include: {
        product: {
          include: {
            images: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
        variant: true,
      },
    });

    // Update cart totals
    await this.updateCartTotals(cart.id);

    return await this.getOrCreateUserCart(userId);
  }

  // Update Cart Item Quantity
  async updateCartItem(
    userId: string,
    cartItemId: string,
    input: UpdateCartItemDto,
  ) {
    const { quantity } = input;

    // Verify cart item exists and belongs to user
    const cartItem = await this.prismaClient.cartItem.findFirst({
      where: {
        id: cartItemId,
        cart: { userId },
      },
      include: {
        product: true,
        variant: true,
      },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    // Check inventory
    const stockItem = cartItem.variant || cartItem.product;
    if (stockItem.trackQuantity && stockItem.quantity < quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      return await this.removeFromCart(userId, cartItemId);
    }

    // Update cart item
    const updatedItem = await this.prismaClient.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
      include: {
        product: {
          include: {
            images: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
        variant: true,
      },
    });

    // Update cart totals
    await this.updateCartTotals(cartItem.cartId);

    return await this.getOrCreateUserCart(userId);
  }

  // Remove Item from Cart
  async removeFromCart(userId: string, cartItemId: string) {
    // Verify cart item exists and belongs to user
    const cartItem = await this.prismaClient.cartItem.findFirst({
      where: {
        id: cartItemId,
        cart: { userId },
      },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    // Delete cart item
    await this.prismaClient.cartItem.delete({
      where: { id: cartItemId },
    });

    // Update cart totals
    await this.updateCartTotals(cartItem.cartId);

    return await this.getOrCreateUserCart(userId);
  }

  // Clear Entire Cart
  async clearCart(userId: string) {
    const cart = await this.prismaClient.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    // Delete all cart items
    await this.prismaClient.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    // Reset cart totals
    const clearedCart = await this.prismaClient.cart.update({
      where: { id: cart.id },
      data: {
        itemsCount: 0,
        totalAmount: 0,
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
            variant: true,
          },
        },
      },
    });

    return clearedCart;
  }

  // Get Cart Summary (for header/mini-cart)
  async getCartSummary(userId: string) {
    const cart = await this.prismaClient.cart.findUnique({
      where: { userId },
      select: {
        itemsCount: true,
        totalAmount: true,
        items: {
          take: 3, // Only get a few items for summary
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
            variant: {
              select: {
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!cart) {
      return {
        itemsCount: 0,
        totalAmount: 0,
        items: [],
      };
    }

    return cart;
  }

  // Merge Guest Cart with User Cart (after login)
  async mergeCarts(userId: string, guestCartItems: any[]) {
    if (!guestCartItems.length) {
      return await this.getOrCreateUserCart(userId);
    }

    const userCart = await this.getOrCreateUserCart(userId);

    for (const guestItem of guestCartItems) {
      try {
        await this.addToCart(userId, {
          productId: guestItem.productId,
          variantId: guestItem.variantId,
          quantity: guestItem.quantity,
        });
      } catch (error) {
        // Skip items that can't be added (out of stock, etc.)
        console.warn('Failed to merge cart item:', error.message);
      }
    }

    return await this.getOrCreateUserCart(userId);
  }

  // Validate Cart Before Checkout
  async validateCart(userId: string) {
    const cart = await this.getOrCreateUserCart(userId);

    if (cart.itemsCount === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const validationResults = {
      isValid: true,
      errors: [] as string[],
      updatedCart: cart,
    };

    // Check each item for stock and price changes
    for (const item of cart.items) {
      const product = await this.prismaClient.product.findUnique({
        where: { id: item.productId },
        include: {
          variants: item.variantId ? { where: { id: item.variantId } } : false,
        },
      });

      if (!product) {
        validationResults.errors.push(
          `Product "${item.product.name}" is no longer available`,
        );
        validationResults.isValid = false;
        continue;
      }

      if (product.status !== 'ACTIVE') {
        validationResults.errors.push(
          `Product "${item.product.name}" is no longer available`,
        );
        validationResults.isValid = false;
        continue;
      }

      // Check stock
      const stockItem = item.variantId ? product.variants?.[0] : product;
      if (stockItem?.trackQuantity && stockItem.quantity < item.quantity) {
        validationResults.errors.push(
          `Insufficient stock for "${item.product.name}"`,
        );
        validationResults.isValid = false;
      }

      // Check price changes
      const currentPrice = item.variantId
        ? product.variants?.[0]?.price
        : product.price;
      if (currentPrice !== item.price) {
        // Update price in cart
        await this.prismaClient.cartItem.update({
          where: { id: item.id },
          data: { price: currentPrice },
        });
        validationResults.errors.push(
          `Price updated for "${item.product.name}"`,
        );
      }
    }

    // Update cart totals if prices changed
    if (
      validationResults.errors.some((error) => error.includes('Price updated'))
    ) {
      await this.updateCartTotals(cart.id);
      validationResults.updatedCart = await this.getOrCreateUserCart(userId);
    }

    return validationResults;
  }

  // Update Cart Totals (internal method)
  private async updateCartTotals(cartId: string) {
    const cartItems = await this.prismaClient.cartItem.findMany({
      where: { cartId },
      select: {
        quantity: true,
        price: true,
      },
    });

    const itemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = cartItems.reduce((sum, item) => {
      return sum + item.price.toNumber() * item.quantity;
    }, 0);

    await this.prismaClient.cart.update({
      where: { id: cartId },
      data: {
        itemsCount,
        totalAmount,
      },
    });
  }

  // Get Cart Items Count (for badge)
  async getCartItemsCount(userId: string): Promise<number> {
    const cart = await this.prismaClient.cart.findUnique({
      where: { userId },
      select: { itemsCount: true },
    });

    return cart?.itemsCount || 0;
  }
}
