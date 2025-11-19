// // src/config/validation.schema.ts

import { z } from 'zod';

export const configValidationSchema = z.object({
  // Security Configuration
  JWT_SECRET: z.string().length(32),

  //   Port Configuration
  PORT: z.preprocess(
    (a) => parseInt(z.string().parse(a), 10),
    z.number().default(3000),
  ),

  DATABASE_URL: z.string().url(),
});

export type Config = z.infer<typeof configValidationSchema>;

// src/database/database.provider.ts (Example)

// import { Injectable } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { Config } from '../config/validation.schema'; // Import the Zod inferred type

// @Injectable()
// export class DatabaseProvider {
//   // ConfigService now has the correct type defined!
//   constructor(private configService: ConfigService<Config>) {}

//   getConnectionString(): string {
//     const host = this.configService.get('DATABASE_HOST', { infer: true });
//     const port = this.configService.get('DATABASE_PORT', { infer: true });

//     // TypeScript knows these are string and number, respectively.
//     return `postgres://${host}:${port}/ecommerce_db`;
//   }
// }
