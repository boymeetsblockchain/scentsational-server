import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  DefaultValuePipe,
  ParseUUIDPipe,
  ParseBoolPipe,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { JwtGuard } from '../global/guards/jwt.guard';
import { RolesGuard } from '../global/guards/roles.guard';
import { Roles } from '../global/decorators/roles-decorator';
import { UserRole } from 'generated/prisma/enums';
import { CategoryCreateDto } from './dtos/category.create.dto';
import { CategoryUpdateDto } from './dtos/category.update.dto';

@UseGuards(JwtGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // -------------------------
  // CREATE CATEGORY
  // -------------------------
  @Post()
  createCategory(@Body() input: CategoryCreateDto) {
    return this.categoriesService.createCategory(input);
  }

  // -------------------------
  // GET ALL CATEGORIES
  // -------------------------
  @Get()
  getAllCategories(
    @Query('includeInactive', new DefaultValuePipe(false), ParseBoolPipe)
    includeInactive: boolean,
  ) {
    return this.categoriesService.getAllCategories(includeInactive);
  }

  // -------------------------
  // GET CATEGORY BY ID OR SLUG
  // -------------------------
  @Get(':identifier')
  getCategoryById(@Param('identifier') identifier: string) {
    return this.categoriesService.getCategoryById(identifier);
  }

  // -------------------------
  // UPDATE CATEGORY
  // -------------------------
  @Patch(':id')
  updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() input: CategoryUpdateDto,
  ) {
    return this.categoriesService.updateCategory(id, input);
  }

  // -------------------------
  // DELETE CATEGORY (SOFT DELETE)
  // -------------------------
  @Delete(':id')
  deleteCategory(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.deleteCategory(id);
  }

  // -------------------------
  // GET ROOT CATEGORIES (NO PARENT)
  // -------------------------
  @Get('roots/list')
  getRootCategories(
    @Query('includeInactive', new DefaultValuePipe(false), ParseBoolPipe)
    includeInactive: boolean,
  ) {
    return this.categoriesService.getRootCategories(includeInactive);
  }

  // -------------------------
  // GET CHILDREN OF A CATEGORY
  // -------------------------
  @Get(':parentId/children')
  getCategoryChildren(
    @Param('parentId', ParseUUIDPipe) parentId: string,
    @Query('includeInactive', new DefaultValuePipe(false), ParseBoolPipe)
    includeInactive: boolean,
  ) {
    return this.categoriesService.getCategoryChildren(
      parentId,
      includeInactive,
    );
  }

  // -------------------------
  // GET CATEGORY BREADCRUMB
  // -------------------------
  @Get(':id/breadcrumb')
  getCategoryBreadcrumb(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.getCategoryBreadcrumb(id);
  }
}
