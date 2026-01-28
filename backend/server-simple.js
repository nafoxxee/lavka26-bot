const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Настройка загрузки изображений
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Только изображения разрешены'));
        }
    }
});

// Простое хранилище в памяти
let users = [];
let ads = [];
let chats = [];

// Инициализация демо-данных
function initDemoData() {
    // Демо объявления
    ads = [
        {
            id: '1',
            title: 'iPhone 13 Pro 128 ГБ',
            description: 'Отличное состояние, оригинал',
            price: 65000,
            category: 'electronics',
            city: 'Москва',
            images: ['https://via.placeholder.com/200x150/0066FF/FFFFFF?text=iPhone'],
            user_id: 'demo_user',
            user_name: 'Demo User',
            status: 'active',
            created_at: Date.now()
        },
        {
            id: '2',
            title: 'MacBook Air M1',
            description: 'Практически новый',
            price: 85000,
            category: 'electronics',
            city: 'Санкт-Петербург',
            images: ['https://via.placeholder.com/200x150/0066FF/FFFFFF?text=MacBook'],
            user_id: 'demo_user',
            user_name: 'Demo User',
            status: 'active',
            created_at: Date.now()
        }
    ];
}

initDemoData();

// API Routes
app.get('/api/ads', (req, res) => {
    const { category, status = 'active', limit = 20, offset = 0 } = req.query;
    
    let filteredAds = ads;
    
    if (category) {
        filteredAds = filteredAds.filter(ad => ad.category === category);
    }
    
    if (status !== 'all') {
        filteredAds = filteredAds.filter(ad => ad.status === status);
    }
    
    // Сортировка по дате
    filteredAds.sort((a, b) => b.created_at - a.created_at);
    
    // Пагинация
    const paginatedAds = filteredAds.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
    
    res.json({
        ads: paginatedAds,
        total: filteredAds.length,
        has_more: offset + limit < filteredAds.length
    });
});

app.get('/api/ads/:id', (req, res) => {
    const ad = ads.find(a => a.id === req.params.id);
    if (!ad) {
        return res.status(404).json({ error: 'Объявление не найдено' });
    }
    res.json(ad);
});

app.post('/api/ads', upload.array('images', 5), (req, res) => {
    try {
        const { title, description, price, category, city } = req.body;
        
        // Получаем данные пользователя из Telegram WebApp
        const user = req.body.user ? JSON.parse(req.body.user) : { id: 'demo_user', first_name: 'Demo' };
        
        const newAd = {
            id: Date.now().toString(),
            title,
            description,
            price: parseInt(price),
            category,
            city,
            images: req.files ? req.files.map(file => `/uploads/${file.filename}`) : [],
            user_id: user.id,
            user_name: user.first_name || 'Anonymous',
            status: 'pending', // На модерации
            created_at: Date.now()
        };
        
        ads.unshift(newAd);
        
        res.status(201).json(newAd);
    } catch (error) {
        console.error('Error creating ad:', error);
        res.status(500).json({ error: 'Ошибка создания объявления' });
    }
});

app.delete('/api/ads/:id', (req, res) => {
    const adIndex = ads.findIndex(a => a.id === req.params.id);
    if (adIndex === -1) {
        return res.status(404).json({ error: 'Объявление не найдено' });
    }
    
    ads.splice(adIndex, 1);
    res.json({ success: true });
});

app.get('/api/users/:id', (req, res) => {
    let user = users.find(u => u.id === req.params.id);
    
    if (!user) {
        // Создаем пользователя если нет
        user = {
            id: req.params.id,
            first_name: 'User',
            last_name: '',
            username: '',
            role: req.params.id === '379036860' ? 'MODERATOR' : 'USER',
            blocked: false,
            created_at: Date.now()
        };
        users.push(user);
    }
    
    res.json(user);
});

app.get('/api/categories', (req, res) => {
    res.json([
        { id: 'electronics', name: 'Электроника', icon: '📱' },
        { id: 'transport', name: 'Транспорт', icon: '🚗' },
        { id: 'realestate', name: 'Недвижимость', icon: '🏠' },
        { id: 'clothing', name: 'Одежда', icon: '👕' },
        { id: 'home', name: 'Дом и сад', icon: '🏡' },
        { id: 'jobs', name: 'Работа', icon: '💼' },
        { id: 'services', name: 'Услуги', icon: '🔧' },
        { id: 'other', name: 'Другое', icon: '📦' }
    ]);
});

// Простая модерация
app.get('/api/moderation/stats', (req, res) => {
    const stats = {
        total_ads: ads.length,
        pending_ads: ads.filter(ad => ad.status === 'pending').length,
        active_ads: ads.filter(ad => ad.status === 'active').length,
        blocked_users: users.filter(u => u.blocked).length
    };
    res.json(stats);
});

app.get('/api/moderation/pending', (req, res) => {
    const pendingAds = ads.filter(ad => ad.status === 'pending');
    res.json(pendingAds);
});

app.post('/api/moderation/approve/:id', (req, res) => {
    const ad = ads.find(a => a.id === req.params.id);
    if (!ad) {
        return res.status(404).json({ error: 'Объявление не найдено' });
    }
    
    ad.status = 'active';
    res.json({ success: true });
});

app.post('/api/moderation/reject/:id', (req, res) => {
    const ad = ads.find(a => a.id === req.params.id);
    if (!ad) {
        return res.status(404).json({ error: 'Объявление не найдено' });
    }
    
    ad.status = 'rejected';
    res.json({ success: true });
});

// Главная страница
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Open http://localhost:${PORT}`);
});
