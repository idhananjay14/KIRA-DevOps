const express = require('express');
const jwt = require('jsonwebtoken');
const { query } = require('../database/connection');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'kira-secret-key';

router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ success: false, error: 'No token provided' });

    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await query('SELECT id, email, first_name, last_name, role, created_at, updated_at FROM users WHERE id = $1', [decoded.userId]);

    if (result.rows.length === 0) return res.status(401).json({ success: false, error: 'Invalid token' });

    const user = result.rows[0];
    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to get profile' });
  }
});

router.put('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ success: false, error: 'No token provided' });

    const decoded = jwt.verify(token, JWT_SECRET);
    const { firstName, lastName } = req.body;

    await query('UPDATE users SET first_name = $1, last_name = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [firstName, lastName, decoded.userId]);

    const result = await query('SELECT id, email, first_name, last_name, role FROM users WHERE id = $1', [decoded.userId]);
    const user = result.rows[0];

    res.json({
      success: true,
      data: { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name, role: user.role }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
});

module.exports = { userRoutes: router };
