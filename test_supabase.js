import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envPath)) {
    const env = fs.readFileSync(envPath, 'utf8');
    const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
    const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);
    console.log('Found URL:', urlMatch ? 'yes' : 'no');
    console.log('Found Key:', keyMatch ? 'yes' : 'no');
} else {
    console.log('No .env file found');
}
