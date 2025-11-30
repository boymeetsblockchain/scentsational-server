import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PrismaModule } from '../global/prisma/prisma.module';
import { PaystackModule } from '../integrations/paystack/paystack.module';

@Module({
  controllers: [PaymentController],
  providers: [PaymentService],
  imports: [PrismaModule, PaystackModule],
})
export class PaymentModule {}
