import { Module } from '@nestjs/common';
import { PaystackService } from './paystack.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

@Module({
  providers: [PaystackService],
  exports: [PaystackService],
  imports: [
    ConfigModule.forRoot(),
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const baseURL = configService.get<string>('PAYSTACK_BASE_URL');
        const secretKey = configService.get<string>('PAYSTACK_SECRET_KEY');

        if (!baseURL || !secretKey) {
          throw new Error('Paystack configuration is missing');
        }

        return {
          baseURL,
          headers: {
            Authorization: `Bearer ${secretKey}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          timeout: 20000,
        };
      },
    }),
  ],
})
export class PaystackModule {}
