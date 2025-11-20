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

  DATABASE_URL: z.string(),
});

export type Config = z.infer<typeof configValidationSchema>;
