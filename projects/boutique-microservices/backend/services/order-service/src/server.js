const express = require('express');
const axios = require('axios');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255),
      total_amount DECIMAL(10,2),
      status VARCHAR(50) DEFAULT 'pending',
      shipping_address JSONB,
      payment_status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INT REFERENCES orders(id),
      product_id VARCHAR(255),
      quantity INT,
      price DECIMAL(10,2)
    );
  `);
}

const PRODUCTS_SERVICE_URL = process.env.PRODUCTS_SERVICE_URL || 'http://localhost:3003';

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'order-service' });
});

app.post('/', async (req, res) => {
  try {
    const { items, shippingAddress, userId = 'demo-user-id' } = req.body;
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const productResponse = await axios.get(`${PRODUCTS_SERVICE_URL}/${item.productId}`);
      const product = productResponse.data.data;
      totalAmount += product.price * item.quantity;
      orderItems.push({ product_id: item.productId, quantity: item.quantity, price: product.price });
    }

    const result = await pool.query(`
      INSERT INTO orders (user_id, total_amount, status, shipping_address, payment_status)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `, [userId, totalAmount, 'pending', JSON.stringify(shippingAddress), 'pending']);

    const order = result.rows[0];

    for (const item of orderItems) {
      await pool.query(`
        INSERT INTO order_items (order_id, product_id, quantity, price)
        VALUES ($1, $2, $3, $4)
      `, [order.id, item.product_id, item.quantity, item.price]);
    }

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, error: 'Failed to create order' });
  }
});

app.get('/my-orders', async (req, res) => {
  try {
    const userId = req.query.userId || 'demo-user-id';
    const result = await pool.query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get orders' });
  }
});

app.listen(process.env.PORT || 3004, async () => {
  await init();
  console.log('Order service running on port', process.env.PORT || 3004);
});
