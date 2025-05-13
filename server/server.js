import express from 'express';
import dotenv from 'dotenv';
import db from './db.js';
import productRoutes from './routes/products.js'; 

dotenv.config();
const app = express();

app.use(express.json());
app.use('/products', productRoutes);

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});