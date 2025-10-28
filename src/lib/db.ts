import mysql from 'mysql2/promise';

console.log('DB Config:', {
    host: process.env.MYSQL_HOST, // Check if this includes port 
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_ROOT_PASSWORD ? '***' : 'MISSING', 
    database: process.env.MYSQL_DATABASE,
});

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    // Use the specific root password variable
    password: process.env.MYSQL_ROOT_PASSWORD, 
    database: process.env.MYSQL_DATABASE,
    // Add port if MYSQL_HOST doesn't include it
    port: process.env.MYSQL_PORT, 
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

export default pool;
