import slugify from 'slugify';
import { PrismaService } from '../global/prisma/prisma.service';

export class CategoriesUtilsService {
  constructor(private readonly prismaClient: PrismaService) {}

  async generateUniqueSlug(name: string): Promise<string> {
    const baseSlug = slugify(name, {
      lower: true,
      strict: true,
      trim: true,
    });

    return baseSlug;
  }
}
