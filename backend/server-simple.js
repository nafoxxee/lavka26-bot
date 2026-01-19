const express = require('express');
const http = require('http');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  methods: ["GET", "POST"]
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0-simple'
  });
});

// Telegram Webhook endpoint
app.post('/bot/webhook', (req, res) => {
  console.log('Webhook received:', req.body);
  res.status(200).send('OK');
});

// Базовые роуты
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend работает!', timestamp: new Date().toISOString() });
});

app.use('/api/ads', (req, res) => {
  res.json({ ads: [], message: 'Ads endpoint - заглушка' });
});

app.use('/api/users', (req, res) => {
  res.json({ users: [], message: 'Users endpoint - заглушка' });
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Lavka26 Backend запущен на порту ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Webhook: http://localhost:${PORT}/bot/webhook`);
});
