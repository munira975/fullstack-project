import express from 'express';
import db from '../db.js';

const router = express.Router();

router.get('/', (req, res) => {
    db.query('SELECT * FROM products', (err, results) => {
        if (err) return res.status(500).json({error: err.message});
        res.json(results);
    });
});

router.get('/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM products WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.length === 0) return res.status(404).json({ message: 'Product not found' });
        res.json(result[0]);
    });
});

router.post('/', (req, res) => {
    const { name, price, stock, category_id } = req.body;
  
    if (!name || !price || !category_id) {
      return res.status(400).json({ message: 'Name, Price, and Category ID are required' });
    }
  
    db.query(
        'INSERT INTO products (name, price, stock, category_id) VALUES (?, ?, ?, ?)',
        [name, price, stock || 0, category_id],
        (err, result) => {
          if (err) return res.status(500).json({ error: err.message });
          res.status(201).json({ id: result.insertId, message: 'Product created successfully' });
    });
});
  
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { name, price, stock, category_id } = req.body;
    
    if (!name || !price || !category_id) {
      return res.status(400).json({ message: 'Name, Price, and Category ID are required' });
    }
    
    db.query(
        'UPDATE products SET name = ?, price = ?, stock = ?, category_id = ? WHERE id = ?',
        [name, price, stock || 0, category_id, id],
        (err, result) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ message: 'Product updated successfully' });
    });
});  

router.delete('/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM products WHERE id = ?', [id], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Product deleted successfully' });
    });
});

export default router;