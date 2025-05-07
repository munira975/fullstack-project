import express from 'express';
import mysql from 'mysql2';
import dotenv from 'dotenv';

const app = express();
dotenv.config();

const PORT = process.env.PORT;

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'user',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'recipes'
})

db.connect(err => {
    if (err) {
        console.error('Failed to connect to MySQL:', err.message);
    } else {
        console.log(`Successfully connected to MySQL database.`)
    };
})

app.listen(PORT, () => {
    console.log(`Server is running on http//:localhost:${PORT}`)
})