import { PartialType } from '@nestjs/mapped-types';
import { ProductCreateDto } from './products.create.dto';

export class ProductUpdateDto extends PartialType(ProductCreateDto) {}
