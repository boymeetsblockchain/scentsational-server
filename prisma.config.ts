import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  // Note: 'datasources' is not a valid property on PrismaConfig.
  // Set DATABASE_URL in your environment (e.g. .env) and reference it from prisma/schema.prisma.
});
