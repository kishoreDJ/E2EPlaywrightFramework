import * as fs from 'fs';
import * as path from 'path';

const TOKEN_FILE = path.resolve(process.cwd(), '.env.tokens');

export default async function globalTeardown(): Promise<void> {
  if (fs.existsSync(TOKEN_FILE)) {
    fs.unlinkSync(TOKEN_FILE);
    console.log('[globalTeardown] .env.tokens deleted.');
  }
}
