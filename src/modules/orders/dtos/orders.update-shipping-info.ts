import { IsNotEmpty, IsString } from 'class-validator';

export class OrdersUpdateShipping {
  @IsString()
  @IsNotEmpty()
  trackingNumber: string;

  @IsString()
  @IsNotEmpty()
  carrier: string;
}
