import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { PrismaModule } from '../global/prisma/prisma.module';
import { CategoriesUtilsService } from './categories.utils.service';

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService, CategoriesUtilsService],
  imports: [PrismaModule],
})
export class CategoriesModule {}
