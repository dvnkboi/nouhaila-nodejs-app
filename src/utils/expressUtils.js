import path from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const publicPath = path.join(__dirname, '../Views/');

export const page = (name) => {
  return path.join(publicPath, `${name}.html`);
};

export const getPublicPath = () => {
  return publicPath;
};