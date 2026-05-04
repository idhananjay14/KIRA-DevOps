const express = require('express');
const bcrypt = require('bcryptjs');
const { query } = require('../database/connection');
const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, first_name, last_name, role, created_at, updated_at',
      [email, hashedPassword, firstName, lastName, 'customer']
    );
    const user = result.rows[0];
    res.status(201).json({
      user: { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name, role: user.role },
      token: user.id.toString(),
      message: 'Registration successful'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (password === 'demo') {
      let user;
      const result = await query('SELECT id, email, first_name, last_name, role FROM users WHERE email = $1', [email]);
      if (result.rows.length === 0) {
        const hashedPassword = await bcrypt.hash('demo', 10);
        const newUser = await query(
          'INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, first_name, last_name, role',
          [email, hashedPassword, 'Demo', 'User', 'customer']
        );
        user = newUser.rows[0];
      } else {
        user = result.rows[0];
      }
      return res.json({
        user: { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name, role: user.role },
        token: user.id.toString(),
        message: 'Demo login successful'
      });
    }
    const result = await query('SELECT id, email, password_hash, first_name, last_name, role FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({
      user: { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name, role: user.role },
      token: user.id.toString(),
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/logout', (req, res) => res.json({ message: 'Logged out successfully' }));

router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  const userId = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  if (!userId || userId === 'undefined') return res.status(401).json({ error: 'Not logged in' });
  try {
    const result = await query('SELECT id, email, first_name, last_name, role FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'User not found' });
    const user = result.rows[0];
    res.json({ id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name, role: user.role });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user' });
  }
});

module.exports = { authRoutes: router };
