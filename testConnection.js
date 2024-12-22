import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

dotenv.config({ path: './.env' });

const uri = process.env.MONGODB_URI;

if (!uri) {
    console.error("Error: MONGODB_URI is not defined in the environment variables.");
    process.exit(1);
}
console.log("MongoDB URI:", uri); // Log the URI for verification
const client = new MongoClient(uri);

async function run() {
    try {
        await client.connect();
        console.log("Connected successfully to MongoDB");
    } catch (error) {
        console.error("Connection failed:", error);
    } finally {
        await client.close();
    }
}

run().catch(console.error);
