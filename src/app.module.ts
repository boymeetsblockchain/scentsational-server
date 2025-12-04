import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { configValidationSchema } from './configs/validation/validation.schema';
import * as z from 'zod';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './modules/global/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtStrategy } from './modules/global/strategies/jwt.strategy';
import { ProductsModule } from './modules/products/products.module';
import { UploadModule } from './modules/upload/upload.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { CartModule } from './modules/cart/cart.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentModule } from './modules/payment/payment.module';
import { DiscountModule } from './modules/discount/discount.module';

function validate(config: Record<string, unknown>) {
  try {
    return configValidationSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Configuration validation failed: ${error.issues.map((e) => e.path.join('.') + ': ' + e.message).join(', ')}`,
      );
    }
    throw error;
  }
}
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validate,
    }),
    PrismaModule,
    AuthModule,
    ProductsModule,
    UploadModule,
    CategoriesModule,
    CartModule,
    OrdersModule,
    PaymentModule,
    DiscountModule,
  ],
  controllers: [AppController],
  providers: [AppService, JwtStrategy],
})
export class AppModule {}
