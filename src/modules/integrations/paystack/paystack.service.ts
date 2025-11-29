import { BadRequestException, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  initializeTransactionData,
  initializeTransactionResponse,
} from './dtos/paystack.dto';

@Injectable()
export class PaystackService {
  constructor(private readonly httpService: HttpService) {}

  async initializeTransaction(
    input: initializeTransactionData,
  ): Promise<initializeTransactionResponse> {
    const { amount, email } = input;
    if (!amount || !email) {
      throw new BadRequestException(
        'Both amount and email are required to initialize payment',
      );
    }

    const payload = {
      amount: amount * 100,
      email,
    };

    try {
      const response = await this.httpService.axiosRef.post(
        '/transaction/initialize',
        payload,
      );

      return response.data;
    } catch (error) {
      throw new BadRequestException(
        error.response?.data?.message || 'Error initializing transaction',
      );
    }
  }

  async verifyTransaction(reference: string): Promise<any> {
    if (!reference) {
      throw new BadRequestException('Transaction reference is required');
    }

    try {
      const response = await this.httpService.axiosRef.get(
        `/transaction/verify/${reference}`,
      );

      return response.data;
    } catch (error) {
      throw new BadRequestException(
        error.response?.data?.message || 'Error verifying transaction',
      );
    }
  }
}
