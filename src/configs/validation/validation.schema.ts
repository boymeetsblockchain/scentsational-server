import { z } from 'zod';

export const configValidationSchema = z.object({
  JWT_SECRET: z.string().length(32),

  PORT: z.preprocess(
    (a) => parseInt(z.string().parse(a), 10),
    z.number().default(3000),
  ),

  // Database
  DATABASE_URL: z.string(),

  // Cloudinary Configuration
  CLOUDINARY_CLOUD_NAME: z.string().min(1, 'Cloud name is required'),
  CLOUDINARY_API_KEY: z.string().min(1, 'API key is required'),
  CLOUDINARY_API_SECRET: z.string().min(1, 'API secret is required'),
});

export type Config = z.infer<typeof configValidationSchema>;
