import { Module } from '@nestjs/common';
import { DiscountService } from './discount.service';
import { DiscountController } from './discount.controller';
import { PrismaModule } from '../global/prisma/prisma.module';

@Module({
  controllers: [DiscountController],
  providers: [DiscountService],
  imports: [PrismaModule],
})
export class DiscountModule {}
