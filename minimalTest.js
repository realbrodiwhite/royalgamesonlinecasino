import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: `${__dirname}/.env` });

console.log("MONGODB_URI:", process.env.MONGODB_URI);
console.log("TEST_VAR:", process.env.TEST_VAR);
console.log("ANOTHER_TEST_VAR:", process.env.ANOTHER_TEST_VAR);
console.log("FINAL_TEST_VAR:", process.env.FINAL_TEST_VAR);
