import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  HttpException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { AxiosError } from 'axios';
import { MESSAGE_KEY } from './modules/global/decorators/message.decorator';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, any> {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const statusCode = response?.statusCode ?? 200;

    const customMessage = this.reflector.get<string>(
      MESSAGE_KEY,
      context.getHandler(),
    );

    return next.handle().pipe(
      map((data) => ({
        statusCode,
        message: customMessage ?? 'Request successful',
        data,
      })),

      catchError((err) => {
        // Handle Axios errors
        if (err?.isAxiosError) {
          const axiosErr = err as AxiosError;
          const res = axiosErr.response;

          const responseData = res?.data as any;

          const message =
            responseData?.message ||
            responseData?.error ||
            axiosErr.message ||
            'External service error';

          console.log(message);

          const error = responseData?.error || axiosErr.name;

          return throwError(() => ({
            statusCode: 500,
            message: 'External service error',
            error,
          }));
        }

        // Handle NestJS HttpExceptions
        if (err instanceof HttpException) {
          const errorResponse = err.getResponse();
          const errorStatus = err.getStatus();

          const message =
            typeof errorResponse === 'string'
              ? errorResponse
              : ((errorResponse as any)?.message ?? 'An error occurred');

          const error = (errorResponse as any)?.error ?? err.name;

          return throwError(() => ({
            statusCode: errorStatus,
            message,
            error,
          }));
        }

        // Handle all other unexpected errors
        return throwError(() => ({
          statusCode: 500,
          message: err?.message ?? 'Internal server error',
          error: err?.name ?? 'UnexpectedError',
        }));
      }),
    );
  }
}
