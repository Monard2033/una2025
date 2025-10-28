import mysql, { PoolOptions } from 'mysql2/promise';

const dbHost = process.env.DB_HOST;
const dbUser = process.env.DB_USER;
const dbPort = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined;
const dbPass = process.env.DB_PASS;
const dbName = process.env.DB_NAME;

if (!dbHost || !dbUser || !dbPass || !dbName || !dbPort) {
    console.error("FATAL ERROR: One or more DB_ environment variables are missing.");
    console.log('DB Config Check:', {
        host: !!dbHost,
        user: !!dbUser,
        port: !!dbPort,
        pass: !!dbPass,
        name: !!dbName,
    });
    throw new Error("Missing critical database connection variables (DB_HOST, DB_USER, DB_PORT, DB_PASS, DB_NAME).");
}

const dbOptions: PoolOptions = {
    host: dbHost,
    user: dbUser,
    port: dbPort,
    password: dbPass,
    database: dbName,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
};

console.log('DB Config (Individual Vars):', {
    host: dbOptions.host,
    user: dbOptions.user,
    database: dbOptions.database,
    port: dbOptions.port,
    waitForConnections: dbOptions.waitForConnections,
    connectionLimit: dbOptions.connectionLimit,
    queueLimit: dbOptions.queueLimit
});

// Create the connection pool
const pool = mysql.createPool(dbOptions);

export default pool;
