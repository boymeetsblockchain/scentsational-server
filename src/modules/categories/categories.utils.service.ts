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

    let slug = baseSlug;
    let counter = 1;

    // Check if slug already exists
    while (await this.prismaClient.product.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;

      // Safety check to prevent infinite loop
      if (counter > 100) {
        throw new Error('Unable to generate unique slug after 100 attempts');
      }
    }

    return slug;
  }
}
