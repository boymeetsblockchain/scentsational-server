import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { PrismaModule } from '../global/prisma/prisma.module';
import { ProductsUtilsService } from './products.utils.service';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, ProductsUtilsService],
  imports: [PrismaModule],
})
export class ProductsModule {}
