import pool from './db';

(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('DB connected!');
        connection.release();
    } catch (err) {
        console.error('DB connection failed:', err);
    }
})();