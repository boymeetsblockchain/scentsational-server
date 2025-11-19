import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { configValidationSchema } from './configs/validation/validation.schema';
import * as z from 'zod';
import { ConfigModule } from '@nestjs/config';

function validate(config: Record<string, unknown>) {
  try {
    return configValidationSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Configuration validation failed: ${error.issues.map((e) => e.path.join('.') + ': ' + e.message).join(', ')}`,
      );
    }
    throw error;
  }
}
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validate,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
