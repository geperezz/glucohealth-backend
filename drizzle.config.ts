import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in the environment variables');
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/**/*.table.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
