import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../global/prisma/prisma.module';
import { AuthUtilService } from './auth.utils.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthUtilService],
  imports: [PrismaModule],
})
export class AuthModule {}
