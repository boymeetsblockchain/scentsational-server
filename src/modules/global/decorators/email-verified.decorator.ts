import { Reflector } from '@nestjs/core';

export const RequiresVerifiedEmail = Reflector.createDecorator<boolean>();
