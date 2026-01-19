const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  methods: ["GET", "POST"]
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100 // лимит запросов
});
app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Telegram Webhook endpoint
app.post('/bot/webhook', (req, res) => {
  res.status(200).send('OK');
});

// Базовые роуты для теста
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend работает!', timestamp: new Date().toISOString() });
});

// Заглушки для роутов (чтобы избежать ошибок импорта)
app.use('/api/ads', (req, res) => {
  res.json({ ads: [], message: 'Ads endpoint - заглушка' });
});

app.use('/api/users', (req, res) => {
  res.json({ users: [], message: 'Users endpoint - заглушка' });
});

app.use('/api/chats', (req, res) => {
  res.json({ chats: [], message: 'Chats endpoint - заглушка' });
});

app.use('/api/payments', (req, res) => {
  res.json({ payments: [], message: 'Payments endpoint - заглушка' });
});

app.use('/api/admin', (req, res) => {
  res.json({ admin: [], message: 'Admin endpoint - заглушка' });
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

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100 // ограничить каждый IP до 100 запросов за окно
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Проверка здоровья
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Маршруты
app.use('/api/auth/telegram', telegramAuth);
app.use('/api/users', authMiddleware, usersRoutes);
app.use('/api/ads', authMiddleware, adsRoutes);
app.use('/api/chats', authMiddleware, chatsRoutes);
app.use('/api/payments', authMiddleware, paymentsRoutes);
app.use('/api/admin', authMiddleware, adminRoutes);

// Инициализация Socket.IO
initializeSocket(io);

// Планировщик задач
setInterval(expireBoostedAds, 60000); // Проверять каждую минуту

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Что-то пошло не так!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Внутренняя ошибка сервера'
  });
});

// Обработчик 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Маршрут не найден' });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Lavka26 Backend запущен на порту ${PORT}`);
});
