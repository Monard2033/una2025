import mysql, { PoolOptions } from 'mysql2/promise';

// The most reliable way for Vercel to connect to Railway is using the
// complete public connection string, which includes host, port, user, and password.
const connectionUrl = process.env.MYSQL_PUBLIC_URL;

if (!connectionUrl) {
    console.error("FATAL ERROR: MYSQL_PUBLIC_URL environment variable is not set.");
    // In production, throwing an error is often safer than continuing with 'undefined' host/user.
    throw new Error("Missing database connection URL. Check Vercel environment variables.");
}

// Configuration options for the connection pool
const dbOptions: PoolOptions = {
    // The 'uri' property tells mysql2/promise to parse the full URL string.
    uri: connectionUrl,

    // General pool settings
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
};

// Console log for debugging the deployed environment variables
// Note: We avoid logging the URL itself to prevent exposure, just confirming it's present.
console.log('DB Config:', {
    urlDefined: !!connectionUrl,
    connectionLimit: dbOptions.connectionLimit
});

// Create the connection pool
const pool = mysql.createPool(dbOptions);

export default pool;
