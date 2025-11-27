import { PartialType } from '@nestjs/mapped-types';
import { OrderCreateDto } from './orders.create.dto';

export class OrderUpdateDto extends PartialType(OrderCreateDto) {}
