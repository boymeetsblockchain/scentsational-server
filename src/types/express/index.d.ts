import { User as PrismaUser } from 'generated/prisma';

declare global {
  namespace Express {
    interface Request {
      user?: PrismaUser;
    }
  }
}
