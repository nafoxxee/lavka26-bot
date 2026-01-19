const express = require('express');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());

// Health check endpoint - ПЕРВЫМ!
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0-minimal'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Lavka26 Backend работает!' });
});

// Telegram Webhook
app.post('/bot/webhook', (req, res) => {
  res.status(200).send('OK');
});

// API endpoints
app.get('/api/test', (req, res) => {
  res.json({ message: 'API работает!' });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend запущен на порту ${PORT}`);
  console.log(`Health: http://0.0.0.0:${PORT}/health`);
});
