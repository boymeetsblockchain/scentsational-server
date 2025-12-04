import { Injectable } from '@nestjs/common';
import { PrismaService } from '../global/prisma/prisma.service';

@Injectable()
export class DiscountService {
  constructor(private readonly prismaClient: PrismaService) {}
}
