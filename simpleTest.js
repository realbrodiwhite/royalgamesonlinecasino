import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

console.log("MONGODB_URI:", process.env.MONGODB_URI);
console.log("TEST_VAR:", process.env.TEST_VAR);
