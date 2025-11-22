import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { Prisma, PrismaClient } from 'generated/prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  async onModuleInit() {
    await this.$connect();

    console.log('::> Prisma connected to postgres db');
  }

  // create ab admin

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('::> Prisma disconnected from postgres db');
  }

  async paginate<
    TModel extends keyof PrismaClient,
    TFindManyArgs extends Prisma.Args<PrismaClient[TModel], 'findMany'>,
    TReturn = Prisma.Result<PrismaClient[TModel], TFindManyArgs, 'findMany'>,
  >(
    model: TModel,
    options: TFindManyArgs & {
      pagination?: PaginationOptions;
      dataKey?: string;
    },
  ) {
    const {
      where,
      orderBy,
      include,
      select,
      pagination,
      dataKey = 'data',
      ...rest
    } = options;

    const _pagination = pagination as unknown as PaginationOptions;
    const page = parseInt((_pagination?.page ?? 1).toString(), 10);
    const limit = parseInt((_pagination?.limit ?? 10).toString(), 10);
    const skip = (page - 1) * limit;

    if (_pagination?.startDate || _pagination?.endDate) {
      (where as any).createdAt = {
        ...(_pagination.startDate
          ? { gte: new Date(_pagination.startDate) }
          : {}),
        ...(_pagination.endDate ? { lte: new Date(_pagination.endDate) } : {}),
      };
    }

    const modelInstance = this[model] as any;

    const [data, total] = await Promise.all([
      modelInstance.findMany({
        skip,
        take: limit,
        where,
        orderBy,
        include,
        select,
        ...rest, // Allow other args like `distinct
      }) as Promise<TReturn[]>,
      modelInstance.count({ where }),
    ]);

    const nextPage = page * limit < total ? page + 1 : null;

    return {
      pagination: {
        total,
        current: page,
        next: nextPage,
      },
      [dataKey]: data,
    };
  }
}
