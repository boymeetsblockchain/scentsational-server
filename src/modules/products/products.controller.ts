import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { UseGuards } from '@nestjs/common';
import { JwtGuard } from '../global/guards/jwt.guard';
import { RolesGuard } from '../global/guards/roles.guard';
import { Message } from '../global/decorators/message.decorator';
import { ProductCreateDto } from './dtos/products.create.dto';
import { ProductQueryDto } from './dtos/products.query.dto';
import { ProductStatus, UserRole } from 'generated/prisma/enums';
import { Roles } from '../global/decorators/roles-decorator';
import { ProductUpdateDto } from './dtos/products.update.dto';
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async getAllProducts(@Query() query: ProductQueryDto) {
    return await this.productsService.getAllProducts(query);
  }

  @Get(':identifier')
  async getProduct(@Param('identifier') identifier: string) {
    return await this.productsService.getProductById(identifier);
  }

  @Get('category/:categorySlug')
  async getProductsByCategory(
    @Param('categorySlug') categorySlug: string,
    @Query() query: ProductQueryDto,
  ) {
    return await this.productsService.getProductsByCategory(
      categorySlug,
      query,
    );
  }

  @Get('featured/products')
  async getFeaturedProducts(
    @Query('limit', new DefaultValuePipe(8), ParseIntPipe) limit: number,
  ) {
    return await this.productsService.getFeaturedProducts(limit);
  }

  @Get(':id/related')
  async getRelatedProducts(
    @Param('id', ParseUUIDPipe) productId: string,
    @Query('limit', new DefaultValuePipe(4), ParseIntPipe) limit: number,
  ) {
    return await this.productsService.getRelatedProducts(productId, limit);
  }

  //================== ADMIN ROUTES ==================//
  // Create product
  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async createProduct(@Body() input: ProductCreateDto) {
    return await this.productsService.createProduct(input);
  }

  // Update product
  @Put(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateProduct(
    @Param('id', ParseUUIDPipe) productId: string,
    @Body() input: ProductUpdateDto,
  ) {
    return await this.productsService.updateProduct(productId, input);
  }

  // Delete product (soft delete)
  @Delete(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteProduct(@Param('id', ParseUUIDPipe) productId: string) {
    return await this.productsService.deleteProduct(productId);
  }

  // Update product status
  @Put(':id/status')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateProductStatus(
    @Param('id', ParseUUIDPipe) productId: string,
    @Body('status') status: ProductStatus,
  ) {
    return await this.productsService.updateProductStatus(productId, status);
  }

  // Update product slug
  @Put(':id/slug')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateProductSlug(
    @Param('id', ParseUUIDPipe) productId: string,
    @Body('name') name: string,
  ) {
    return await this.productsService.updateProductSlug(productId, name);
  }

  // 📊 ANALYTICS ROUTES (Optional)

  // Get product statistics
  @Get('analytics/overview')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getProductAnalytics() {
    // This would call a separate analytics service
    // return await this.productsService.getProductAnalytics();
    return { message: 'Product analytics endpoint' };
  }
}
