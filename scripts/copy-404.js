import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const buildDir = path.resolve(__dirname, '..', 'build');
const indexPath = path.join(buildDir, 'index.html');
const destPath = path.join(buildDir, '404.html');

try {
  if (!fs.existsSync(indexPath)) {
    console.error('index.html not found. Run `npm run build` first.');
    process.exit(1);
  }

  fs.copyFileSync(indexPath, destPath);
  console.log('Copied index.html -> 404.html');
} catch (err) {
  console.error('Failed to create 404.html', err);
  process.exit(1);
}