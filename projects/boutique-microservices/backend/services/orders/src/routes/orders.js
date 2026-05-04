const express = require('express');
const axios = require('axios');
const { query } = require('../database/connection');
const router = express.Router();

const PRODUCTS_SERVICE_URL = process.env.PRODUCTS_SERVICE_URL || 'http://localhost:3003';

router.post('/', async (req, res) => {
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

    const result = await query(`
      INSERT INTO orders (user_id, total_amount, status, shipping_address, payment_status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING *
    `, [userId, totalAmount, 'pending', JSON.stringify(shippingAddress), 'pending']);

    const order = result.rows[0];

    for (const item of orderItems) {
      await query(`
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

router.get('/my-orders', async (req, res) => {
  try {
    const userId = req.query.userId || 'demo-user-id';
    const result = await query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get orders' });
  }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;
    await query('UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [status, id]);
    const result = await query('SELECT * FROM orders WHERE id = $1', [id]);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update order status' });
  }
});

module.exports = { orderRoutes: router };
