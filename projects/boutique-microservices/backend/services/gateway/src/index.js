const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const helmet = require('helmet');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());

const services = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3002',
  products: process.env.PRODUCTS_SERVICE_URL || 'http://localhost:3003',
  orders: process.env.ORDER_SERVICE_URL || 'http://localhost:3004',
  users: process.env.USER_SERVICE_URL || 'http://localhost:3006',
};

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'gateway' });
});

app.use('/api/auth', createProxyMiddleware({
  target: services.auth,
  changeOrigin: true,
  pathRewrite: { '^/api/auth': '' },
}));

app.use('/api/products', createProxyMiddleware({
  target: services.products,
  changeOrigin: true,
  pathRewrite: { '^/api/products': '' },
}));

app.use('/api/orders', createProxyMiddleware({
  target: services.orders,
  changeOrigin: true,
  pathRewrite: { '^/api/orders': '' },
}));

app.use('/api/users', createProxyMiddleware({
  target: services.users,
  changeOrigin: true,
  pathRewrite: { '^/api/users': '' },
}));

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API Gateway running on port ${PORT}`);
});
