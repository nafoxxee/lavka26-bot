const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authMiddleware = require('./src/middleware/auth');
const telegramAuth = require('./src/middleware/telegramAuth');
const adsRoutes = require('./src/routes/ads');
const usersRoutes = require('./src/routes/users');
const chatsRoutes = require('./src/routes/chats');
const paymentsRoutes = require('./src/routes/payments');
const adminRoutes = require('./src/routes/admin');
const { initializeSocket } = require('./src/services/socketService');
const { expireBoostedAds } = require('./src/services/adService');

const app = express();
const server = http.createServer(app);

// Настройка Socket.IO
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true
}));

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
