import { Controller, Post, Query } from '@nestjs/common';
import { DiscountService } from './discount.service';
import { JwtGuard } from '../global/guards/jwt.guard';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from '../global/guards/roles.guard';
import { Roles } from '../global/decorators/roles-decorator';
import { UserRole } from 'generated/prisma/enums';
import { CreateDiscountDto } from './dtos/discount.create.dto';
import { DiscountQueryDto } from './dtos/discount.query.dto';
@Controller('discount')
export class DiscountController {
  constructor(private readonly discountService: DiscountService) {}

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  async createDiscount(input: CreateDiscountDto) {
    return await this.discountService.createDiscount(input);
  }

  // async getAllDiscounts(@Query() query: DiscountQueryDto) {
  //   const result = await this.discountService.getAllDiscounts(query);
  // }
}
