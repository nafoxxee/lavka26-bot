const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const WebSocket = require('ws');
const http = require('http');
require('dotenv').config();

const storage = require('./storage.js');
const moderation = require('./moderation.js');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// WebSocket для чатов
const chatConnections = new Map(); // userId -> WebSocket

wss.on('connection', (ws, req) => {
    console.log('WebSocket connection established');
    
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            
            switch (data.type) {
                case 'join_chat':
                    chatConnections.set(data.userId, ws);
                    ws.userId = data.userId;
                    break;
                    
                case 'send_message':
                    const messageData = {
                        user_id: data.userId,
                        text: data.text,
                        chat_id: data.chatId
                    };
                    
                    const newMessage = await storage.addMessage(data.chatId, messageData);
                    
                    if (newMessage) {
                        const chat = await storage.getChatById(data.chatId);
                        if (chat) {
                            chat.participants.forEach(participantId => {
                                const participantWs = chatConnections.get(participantId);
                                if (participantWs && participantWs.readyState === WebSocket.OPEN) {
                                    participantWs.send(JSON.stringify({
                                        type: 'new_message',
                                        message: newMessage
                                    }));
                                }
                            });
                        }
                    }
                    break;
            }
        } catch (error) {
            console.error('WebSocket error:', error);
        }
    });
    
    ws.on('close', () => {
        if (ws.userId) {
            chatConnections.delete(ws.userId);
        }
    });
});

// Настройка загрузки изображений
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: multerStorage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Только изображения разрешены'), false);
        }
    }
});

// Middleware для проверки Telegram пользователя
const checkTelegramUser = (req, res, next) => {
    const user = req.body.user || req.query.user;
    if (!user || !user.id) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    req.telegramUser = user;
    next();
};

// API Routes

// Пользователи
app.post('/api/users/auth', async (req, res) => {
    try {
        const userData = req.body;
        const user = await storage.getOrCreateUser(userData);
        
        // Добавляем роль пользователя
        user.role = await moderation.getUserRole(userData.id);
        user.blocked = await moderation.isUserBlocked(userData.id);
        
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/users/:id', async (req, res) => {
    try {
        const user = await storage.getUserById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Добавляем роль
        user.role = await moderation.getUserRole(req.params.id);
        user.blocked = await moderation.isUserBlocked(req.params.id);
        
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Категории
app.get('/api/categories', async (req, res) => {
    try {
        const categories = await storage.getCategories();
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Объявления
app.get('/api/ads', async (req, res) => {
    try {
        const { category, user_id, limit = 20, offset = 0, status = 'active' } = req.query;
        let ads = await storage.getAds();
        
        // Фильтрация по статусу (обычные пользователи видят только active)
        ads = ads.filter(ad => ad.status === status);
        
        // Фильтрация
        if (category) {
            ads = ads.filter(ad => ad.category === category);
        }
        if (user_id) {
            ads = ads.filter(ad => ad.user_id === user_id);
        }
        
        // Сортировка (новые первые)
        ads.sort((a, b) => b.created_at - a.created_at);
        
        // Пагинация
        const paginatedAds = ads.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
        
        res.json({
            ads: paginatedAds,
            total: ads.length,
            hasMore: parseInt(offset) + parseInt(limit) < ads.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/ads/:id', async (req, res) => {
    try {
        const ad = await storage.getAdById(req.params.id);
        if (!ad) {
            return res.status(404).json({ error: 'Ad not found' });
        }
        res.json(ad);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/ads', checkTelegramUser, moderation.requireNotBlocked(), upload.array('images', 5), async (req, res) => {
    try {
        const { title, description, price, category, city } = req.body;
        
        if (!title || !description || !price || !category) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Обработка изображений
        const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];
        
        const adData = {
            user_id: req.telegramUser.id,
            title: title.trim(),
            description: description.trim(),
            price: parseInt(price),
            category: category.trim(),
            city: city?.trim() || 'Не указано',
            images: images,
            status: 'pending' // Все объявления идут на модерацию
        };
        
        const newAd = await storage.createAd(adData);
        res.status(201).json(newAd);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/ads/:id', checkTelegramUser, moderation.requireNotBlocked(), async (req, res) => {
    try {
        const ad = await storage.getAdById(req.params.id);
        if (!ad) {
            return res.status(404).json({ error: 'Ad not found' });
        }
        
        if (ad.user_id !== req.telegramUser.id) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const updatedAd = await storage.updateAd(req.params.id, req.body);
        res.json(updatedAd);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/ads/:id', checkTelegramUser, moderation.requireNotBlocked(), async (req, res) => {
    try {
        const ad = await storage.getAdById(req.params.id);
        if (!ad) {
            return res.status(404).json({ error: 'Ad not found' });
        }
        
        if (ad.user_id !== req.telegramUser.id) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        await storage.deleteAd(req.params.id);
        res.json({ message: 'Ad deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// === МОДЕРАТОРСКИЕ ЭНДПОИНТЫ ===

// Получение объявлений на модерации
app.get('/api/moderation/pending', moderation.requireModerator(), async (req, res) => {
    try {
        const ads = await moderation.getPendingAds();
        res.json(ads);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Одобрение объявления
app.post('/api/moderation/approve/:adId', moderation.requireModerator(), async (req, res) => {
    try {
        const moderatorId = req.telegramUser.id;
        const ad = await moderation.approveAd(req.params.adId, moderatorId);
        res.json(ad);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Отклонение объявления
app.post('/api/moderation/reject/:adId', moderation.requireModerator(), async (req, res) => {
    try {
        const moderatorId = req.telegramUser.id;
        const { reason } = req.body;
        const ad = await moderation.rejectAd(req.params.adId, moderatorId, reason);
        res.json(ad);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Удаление объявления модератором
app.delete('/api/moderation/delete/:adId', moderation.requireModerator(), async (req, res) => {
    try {
        await moderation.deleteAd(req.params.adId, req.telegramUser.id);
        res.json({ message: 'Ad deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Блокировка пользователя
app.post('/api/moderation/block/:userId', moderation.requireModerator(), async (req, res) => {
    try {
        await moderation.blockUser(req.params.userId, req.telegramUser.id);
        res.json({ message: 'User blocked successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Разблокировка пользователя
app.post('/api/moderation/unblock/:userId', moderation.requireModerator(), async (req, res) => {
    try {
        await moderation.unblockUser(req.params.userId, req.telegramUser.id);
        res.json({ message: 'User unblocked successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Статистика модерации
app.get('/api/moderation/stats', moderation.requireModerator(), async (req, res) => {
    try {
        const stats = await moderation.getModerationStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Все объявления (для модератора)
app.get('/api/moderation/ads', moderation.requireModerator(), async (req, res) => {
    try {
        const ads = await moderation.getAllAds();
        res.json(ads);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Чаты
app.get('/api/chats/:adId', async (req, res) => {
    try {
        const { adId } = req.params;
        let chat = await storage.getChatByAdId(adId);
        
        if (!chat) {
            const ad = await storage.getAdById(adId);
            if (!ad) {
                return res.status(404).json({ error: 'Ad not found' });
            }
            
            chat = await storage.createChat({
                ad_id: adId,
                participants: [ad.user_id]
            });
        }
        
        res.json(chat);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/chats/:chatId/join', checkTelegramUser, moderation.requireNotBlocked(), async (req, res) => {
    try {
        const chat = await storage.getChatById(req.params.chatId);
        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }
        
        if (!chat.participants.includes(req.telegramUser.id)) {
            chat.participants.push(req.telegramUser.id);
            await storage.updateChat(req.params.chatId, chat);
        }
        
        res.json(chat);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Загрузка изображений
app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    
    res.json({
        url: `/uploads/${req.file.filename}`,
        filename: req.file.filename
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
});

// Обслуживание фронтенда
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Запуск сервера
server.listen(PORT, () => {
    console.log(`🚀 LAVKA26 server running on port ${PORT}`);
    console.log(`📱 WebSocket server ready`);
    console.log(`🛡️ Moderation system enabled`);
    console.log(`🌐 http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🔄 Shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});
