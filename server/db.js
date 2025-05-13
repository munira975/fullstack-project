import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'user',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'fresho_db'
});

db.connect(err => {
    if (err) {
        console.error('Failed to connect to MySQL:', err.message);
    } else {
        console.log('Successfully connected to MySQL database.');
    }
});

export default db;