import { config } from 'dotenv';
import { resolve } from 'path';

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';

// Load environment variables from .env file
config({ path: resolve(__dirname, '.env') }); 