import mysql from 'mysql2/promise';

const pool = mysql.createPool(process.env.MYSQL_PUBLIC_URL!);

export default pool;
