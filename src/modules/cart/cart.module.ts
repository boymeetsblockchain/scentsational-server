import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { PrismaModule } from '../global/prisma/prisma.module';

@Module({
  controllers: [CartController],
  providers: [CartService],
  imports: [PrismaModule],
})
export class CartModule {}
