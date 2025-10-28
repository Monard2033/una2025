import mysql from 'mysql2/promise';
import { PoolOptions } from 'mysql2/promise'; // Import the type for better clarity

// Define the configuration object with explicit type casting for environment variables
const dbConfig: PoolOptions = {
    // Railway's integration should populate these with the public credentials
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, 
    database: process.env.DB_NAME,
    
    // CRITICAL FIX: The port must be explicitly cast to a number.
    // If it's undefined, Number() returns NaN, but since it's a PoolOptions object,
    // the structure is correct, and the database library handles connection failure if the value is bad.
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
};

// Console log for debugging the deployed environment variables
console.log('DB Config:', {
    ...dbConfig,
    password: dbConfig.password ? '***' : 'MISSING', 
});

const pool = mysql.createPool(dbConfig);

export default pool;
