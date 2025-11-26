import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../global/prisma/prisma.service';
import { CategoryCreateDto } from './dtos/category.create.dto';
import { CategoryUpdateDto } from './dtos/category.update.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prismaClient: PrismaService) {}

  // Create Category
  async createCategory(input: CategoryCreateDto) {
    // Generate slug from name if not provided
    const slug = input.slug || (await this.generateUniqueSlug(input.name));

    // Validate parent if provided
    if (input.parentId) {
      await this.validateParentCategory(input.parentId);
    }

    return this.prismaClient.category.create({
      data: {
        name: input.name,
        slug,
        description: input.description,
        image: input.image,
        parentId: input.parentId,
        metaTitle: input.metaTitle,
        metaDescription: input.metaDescription,
        sortOrder: input.sortOrder,
        isActive: input.isActive,
      },
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
    });
  }

  // Get All Categories
  async getAllCategories(includeInactive: boolean = false) {
    const where = includeInactive ? {} : { isActive: true };

    return this.prismaClient.category.findMany({
      where,
      include: {
        parent: true,
        children: {
          where: includeInactive ? {} : { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  // Get Category by ID or Slug
  async getCategoryById(identifier: string) {
    const category = await this.prismaClient.category.findFirst({
      where: {
        OR: [{ id: identifier }, { slug: identifier }],
      },
      include: {
        parent: true,
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            _count: {
              select: {
                products: true,
              },
            },
          },
        },
        products: {
          include: {
            product: {
              include: {
                images: {
                  where: { isPrimary: true },
                },
              },
            },
          },
          take: 10,
        },
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  // Update Category
  async updateCategory(categoryId: string, input: CategoryUpdateDto) {
    const category = await this.prismaClient.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // If name is updated and slug is not provided, generate new slug
    let slug = input.slug || category.slug;
    if (input.name && input.name !== category.name && !input.slug) {
      slug = await this.generateUniqueSlug(input.name);
    }

    // Validate parent if changing
    if (input.parentId && input.parentId !== category.parentId) {
      await this.validateParentCategory(input.parentId);

      // Check for circular reference
      await this.checkCircularReference(categoryId, input.parentId);
    }

    return this.prismaClient.category.update({
      where: { id: categoryId },
      data: {
        name: input.name,
        slug,
        description: input.description,
        image: input.image,
        parentId: input.parentId,
        metaTitle: input.metaTitle,
        metaDescription: input.metaDescription,
        sortOrder: input.sortOrder,
        isActive: input.isActive,
      },
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
    });
  }

  // Delete Category (Soft delete)
  async deleteCategory(categoryId: string) {
    const category = await this.prismaClient.category.findUnique({
      where: { id: categoryId },
      include: {
        children: { where: { isActive: true } },
        _count: { select: { products: true } },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Check if category has active products
    if (category._count.products > 0) {
      throw new BadRequestException(
        'Cannot delete category with associated products',
      );
    }

    // Check if category has children
    if (category.children.length > 0) {
      throw new BadRequestException(
        'Cannot delete category with sub-categories',
      );
    }

    return this.prismaClient.category.update({
      where: { id: categoryId },
      data: { isActive: false },
    });
  }

  // Get Root Categories (no parent)
  async getRootCategories(includeInactive: boolean = false) {
    const where = includeInactive
      ? { parentId: null }
      : { parentId: null, isActive: true };

    return this.prismaClient.category.findMany({
      where,
      include: {
        children: {
          where: includeInactive ? {} : { isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            _count: {
              select: {
                products: true,
              },
            },
          },
        },
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  // Get Category Children
  async getCategoryChildren(
    parentId: string,
    includeInactive: boolean = false,
  ) {
    const parent = await this.prismaClient.category.findUnique({
      where: { id: parentId },
    });

    if (!parent) {
      throw new NotFoundException('Parent category not found');
    }

    const where = includeInactive ? { parentId } : { parentId, isActive: true };

    return this.prismaClient.category.findMany({
      where,
      include: {
        children: {
          where: includeInactive ? {} : { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  // Get Category Breadcrumb
  async getCategoryBreadcrumb(categoryId: string) {
    const breadcrumb: { id: string; name: string; slug: string }[] = [];
    let currentCategory = await this.prismaClient.category.findUnique({
      where: { id: categoryId },
      include: { parent: true },
    });

    if (!currentCategory) {
      throw new NotFoundException('Category not found');
    }

    while (currentCategory) {
      breadcrumb.unshift({
        id: currentCategory.id,
        name: currentCategory.name,
        slug: currentCategory.slug,
      });

      if (currentCategory.parentId) {
        currentCategory = await this.prismaClient.category.findUnique({
          where: { id: currentCategory.parentId },
          include: { parent: true },
        });
      } else {
        currentCategory = null;
      }
    }

    return breadcrumb;
  }

  // Validate Parent Category
  private async validateParentCategory(parentId: string) {
    const parent = await this.prismaClient.category.findUnique({
      where: { id: parentId },
    });

    if (!parent) {
      throw new NotFoundException('Parent category not found');
    }

    if (!parent.isActive) {
      throw new BadRequestException('Parent category is inactive');
    }

    return parent;
  }

  // Check for Circular Reference
  private async checkCircularReference(
    categoryId: string,
    potentialParentId: string,
  ) {
    let current = await this.prismaClient.category.findUnique({
      where: { id: potentialParentId },
      include: { parent: true },
    });

    while (current) {
      if (current.id === categoryId) {
        throw new BadRequestException(
          'Circular reference detected: cannot make a category its own ancestor',
        );
      }
      current = current.parent
        ? await this.prismaClient.category.findUnique({
            where: { id: current.parent.id },
            include: { parent: true },
          })
        : null;
    }
  }

  // Generate unique slug
  private async generateUniqueSlug(name: string): Promise<string> {
    const baseSlug = this.slugify(name);
    let slug = baseSlug;
    let counter = 1;

    while (await this.prismaClient.category.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;

      if (counter > 100) {
        throw new Error('Unable to generate unique slug after 100 attempts');
      }
    }

    return slug;
  }

  // Simple slugify function
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }
}
