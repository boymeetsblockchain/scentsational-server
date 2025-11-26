import { Controller, Post } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { UseGuards } from '@nestjs/common';
import { Roles } from '../global/decorators/roles-decorator';
import { RolesGuard } from '../global/guards/roles.guard';
import { JwtGuard } from '../global/guards/jwt.guard';
import { UserRole } from 'generated/prisma/enums';
import { CategoryCreateDto } from './dtos/category.create.dto';
import { CategoryUpdateDto } from './dtos/category.update.dto';

@UseGuards(JwtGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}
}
