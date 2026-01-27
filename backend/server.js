const express = require('express');
const sqlite3 = require('sqlite3').verbose();
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

// Настройка загрузки изображений
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Только изображения разрешены'));
        }
    }
});

// Обслуживание статических файлов
const publicPath = path.join(__dirname, 'public');
console.log('📁 Static files path:', publicPath);
app.use(express.static(publicPath));

// Инициализация базы данных SQLite
const dbPath = process.env.NODE_ENV === 'production' ? '/tmp/lavka26.db' : './database/lavka26.db';
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Ошибка подключения к базе данных:', err.message);
    } else {
        console.log('Подключено к SQLite базе данных');
        initTables();
    }
});

// Создание таблиц
function initTables() {
    // Создаем таблицы последовательно
    db.serialize(() => {
        // Таблица пользователей
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            telegram_id INTEGER UNIQUE NOT NULL,
            first_name TEXT,
            last_name TEXT,
            username TEXT,
            phone TEXT,
            rating REAL DEFAULT 0.0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Таблица категорий
        db.run(`CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            icon TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error('Ошибка создания таблицы categories:', err);
            } else {
                // Добавляем базовые категории после создания таблицы
                db.run(`INSERT OR IGNORE INTO categories (name, icon) VALUES 
                    ('Транспорт', '🚗'),
                    ('Недвижимость', '🏠'),
                    ('Электроника', '📱'),
                    ('Одежда', '👕'),
                    ('Услуги', '🔧'),
                    ('Работа', '💼'),
                    ('Другое', '📦')
                `, (err) => {
                    if (err) {
                        console.error('Ошибка добавления категорий:', err);
                    } else {
                        console.log('✅ Категории добавлены');
                    }
                });
            }
        });

        // Таблица объявлений
        db.run(`CREATE TABLE IF NOT EXISTS ads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            price REAL NOT NULL,
            category_id INTEGER,
            user_id INTEGER NOT NULL,
            images TEXT,
            status TEXT DEFAULT 'pending',
            views INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Таблица жалоб
        db.run(`CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ad_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            reason TEXT NOT NULL,
            description TEXT,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Таблица избранного
        db.run(`CREATE TABLE IF NOT EXISTS favorites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            ad_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, ad_id)
        )`);

        // Таблица уведомлений
        db.run(`CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            title TEXT NOT NULL,
            message TEXT,
            data TEXT,
            read BOOLEAN DEFAULT FALSE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Таблица сообщений
        db.run(`CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id INTEGER NOT NULL,
            receiver_id INTEGER NOT NULL,
            ad_id INTEGER,
            text TEXT NOT NULL,
            read BOOLEAN DEFAULT FALSE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        console.log('✅ Все таблицы созданы успешно');
    });
}

// API Routes

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Получение информации о пользователе
app.get('/api/user/:telegramId', (req, res) => {
    const telegramId = req.params.telegramId;
    
    db.get('SELECT * FROM users WHERE telegram_id = ?', [telegramId], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (!row) {
            // Создаем нового пользователя
            const { first_name, last_name, username } = req.query;
            db.run('INSERT INTO users (telegram_id, first_name, last_name, username) VALUES (?, ?, ?, ?)', 
                [telegramId, first_name, last_name, username], 
                function(err) {
                    if (err) {
                        res.status(500).json({ error: err.message });
                        return;
                    }
                    
                    db.get('SELECT * FROM users WHERE id = ?', [this.lastID], (err, row) => {
                        if (err) {
                            res.status(500).json({ error: err.message });
                            return;
                        }
                        res.json(row);
                    });
                }
            );
        } else {
            res.json(row);
        }
    });
});

// Получение категорий
app.get('/api/categories', (req, res) => {
    db.all('SELECT * FROM categories ORDER BY name', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Загрузка изображений
app.post('/api/upload', upload.array('images', 5), (req, res) => {
    try {
        const files = req.files.map(file => `/uploads/${file.filename}`);
        res.json({ images: files });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Получение объявлений с расширенными фильтрами
app.get('/api/ads', (req, res) => {
    const { 
        category_id, 
        search, 
        limit = 20, 
        offset = 0, 
        status = 'active',
        sort = 'date',
        price_min,
        price_max,
        with_photos
    } = req.query;
    
    let query = `
        SELECT a.*, u.first_name, u.username, c.name as category_name 
        FROM ads a 
        JOIN users u ON a.user_id = u.id 
        JOIN categories c ON a.category_id = c.id 
        WHERE a.status = ?
    `;
    const params = [status];
    
    if (category_id) {
        query += ' AND a.category_id = ?';
        params.push(category_id);
    }
    
    if (search) {
        query += ' AND (a.title LIKE ? OR a.description LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
    }
    
    if (price_min) {
        query += ' AND a.price >= ?';
        params.push(parseFloat(price_min));
    }
    
    if (price_max) {
        query += ' AND a.price <= ?';
        params.push(parseFloat(price_max));
    }
    
    if (with_photos === 'true') {
        query += ' AND a.images IS NOT NULL AND a.images != "[]"';
    }
    
    // Сортировка
    switch (sort) {
        case 'price-asc':
            query += ' ORDER BY a.price ASC';
            break;
        case 'price-desc':
            query += ' ORDER BY a.price DESC';
            break;
        case 'date':
        default:
            query += ' ORDER BY a.created_at DESC';
            break;
    }
    
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    db.all(query, params, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Создание объявления
app.post('/api/ads', (req, res) => {
    const { title, description, price, category_id, user_id, images } = req.body;
    
    if (!title || !price || !category_id || !user_id) {
        res.status(400).json({ error: 'Обязательные поля: title, price, category_id, user_id' });
        return;
    }
    
    db.run('INSERT INTO ads (title, description, price, category_id, user_id, images) VALUES (?, ?, ?, ?, ?, ?)', 
        [title, description, price, category_id, user_id, JSON.stringify(images || [])], 
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            db.get('SELECT * FROM ads WHERE id = ?', [this.lastID], (err, row) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                res.json(row);
            });
        }
    );
});

// Получение деталей объявления
app.get('/api/ads/:id', (req, res) => {
    const adId = req.params.id;
    
    // Увеличиваем счетчик просмотров
    db.run('UPDATE ads SET views = views + 1 WHERE id = ?', [adId]);
    
    const query = `
        SELECT a.*, u.first_name, u.username, u.rating, c.name as category_name 
        FROM ads a 
        JOIN users u ON a.user_id = u.id 
        JOIN categories c ON a.category_id = c.id 
        WHERE a.id = ?
    `;
    
    db.get(query, [adId], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (!row) {
            res.status(404).json({ error: 'Объявление не найдено' });
            return;
        }
        
        // Парсим изображения
        if (row.images) {
            try {
                row.images = JSON.parse(row.images);
            } catch (e) {
                row.images = [];
            }
        }
        
        res.json(row);
    });
});

// Добавление в избранное
app.post('/api/favorites', (req, res) => {
    const { user_id, ad_id } = req.body;
    
    if (!user_id || !ad_id) {
        res.status(400).json({ error: 'user_id и ad_id обязательны' });
        return;
    }
    
    db.run('INSERT OR IGNORE INTO favorites (user_id, ad_id) VALUES (?, ?)', [user_id, ad_id], 
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ success: true, id: this.lastID });
        }
    );
});

// Получение избранных объявлений
app.get('/api/favorites/:userId', (req, res) => {
    const userId = req.params.userId;
    
    const query = `
        SELECT a.*, u.first_name, u.username, c.name as category_name 
        FROM favorites f 
        JOIN ads a ON f.ad_id = a.id 
        JOIN users u ON a.user_id = u.id 
        JOIN categories c ON a.category_id = c.id 
        WHERE f.user_id = ? AND a.status = 'active'
        ORDER BY f.created_at DESC
    `;
    
    db.all(query, [userId], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Подача жалобы на объявление
app.post('/api/reports', (req, res) => {
    const { ad_id, user_id, reason, description } = req.body;
    
    if (!ad_id || !user_id || !reason) {
        res.status(400).json({ error: 'ad_id, user_id и reason обязательны' });
        return;
    }
    
    db.run('INSERT INTO reports (ad_id, user_id, reason, description) VALUES (?, ?, ?, ?)', 
        [ad_id, user_id, reason, description], 
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ success: true, id: this.lastID });
        }
    );
});

// Получение жалоб (для модерации)
app.get('/api/reports', (req, res) => {
    const query = `
        SELECT r.*, a.title as ad_title, u.first_name as reporter_name, u.username as reporter_username
        FROM reports r
        JOIN ads a ON r.ad_id = a.id
        JOIN users u ON r.user_id = u.id
        ORDER BY r.created_at DESC
    `;
    
    db.all(query, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Одобрение/отклонение объявления (модерация)
app.put('/api/ads/:id/status', (req, res) => {
    const adId = req.params.id;
    const { status } = req.body;
    
    if (!['active', 'rejected', 'pending'].includes(status)) {
        res.status(400).json({ error: 'Неверный статус' });
        return;
    }
    
    db.run('UPDATE ads SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
        [status, adId], 
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ success: true, changes: this.changes });
        }
    );
});

// Получение объявлений на модерации
app.get('/api/ads/pending', (req, res) => {
    const query = `
        SELECT a.*, u.first_name, u.username, c.name as category_name 
        FROM ads a 
        JOIN users u ON a.user_id = u.id 
        JOIN categories c ON a.category_id = c.id 
        WHERE a.status = 'pending'
        ORDER BY a.created_at DESC
    `;
    
    db.all(query, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Увеличение счетчика просмотров
app.post('/api/ads/:id/views', (req, res) => {
    const adId = req.params.id;
    
    db.run('UPDATE ads SET views = views + 1 WHERE id = ?', [adId], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true, views: this.changes });
    });
});

// Получение уведомлений пользователя
app.get('/api/notifications/:userId', (req, res) => {
    const userId = req.params.userId;
    
    const query = `
        SELECT * FROM notifications 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT 50
    `;
    
    db.all(query, [userId], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Проверка прав модератора
function checkModerator(req, res, next) {
    const MODERATOR_ID = 379036860;
    
    if (!req.query.telegram_id || parseInt(req.query.telegram_id) !== MODERATOR_ID) {
        return res.status(403).json({ error: 'Access denied. Moderator rights required.' });
    }
    
    next();
}

// Модераторская панель - получение объявлений на модерации
app.get('/api/moderator/ads', checkModerator, (req, res) => {
    const query = `
        SELECT a.*, u.first_name, u.username, u.telegram_id, c.name as category_name 
        FROM ads a 
        JOIN users u ON a.user_id = u.id 
        JOIN categories c ON a.category_id = c.id 
        WHERE a.status = 'pending'
        ORDER BY a.created_at DESC
    `;
    
    db.all(query, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Модераторская панель - получение жалоб
app.get('/api/moderator/reports', checkModerator, (req, res) => {
    const query = `
        SELECT r.*, a.title as ad_title, u.first_name as reporter_name, u.telegram_id as reporter_id,
               u2.first_name as ad_author_name, u2.telegram_id as ad_author_id
        FROM reports r
        JOIN ads a ON r.ad_id = a.id
        JOIN users u ON r.user_id = u.id
        JOIN users u2 ON a.user_id = u2.id
        ORDER BY r.created_at DESC
    `;
    
    db.all(query, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Модераторская панель - одобрение объявления
app.post('/api/moderator/approve-ad/:id', checkModerator, (req, res) => {
    const adId = req.params.id;
    
    db.run('UPDATE ads SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
        ['active', adId], 
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            // Создаем уведомление для автора
            db.run(`INSERT INTO notifications (user_id, type, title, message) 
                SELECT user_id, 'ad_approved', 'Объявление одобрено', 
                'Ваше объявление было одобрено и теперь опубликовано' FROM ads WHERE id = ?`,
                [adId]
            );
            
            res.json({ success: true, message: 'Advertisement approved' });
        }
    );
});

// Модераторская панель - отклонение объявления
app.post('/api/moderator/reject-ad/:id', checkModerator, (req, res) => {
    const adId = req.params.id;
    const { reason } = req.body;
    
    db.run('UPDATE ads SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
        ['rejected', adId], 
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            // Создаем уведомление для автора
            const message = reason ? 
                `Ваше объявление было отклонено. Причина: ${reason}` :
                'Ваше объявление было отклонено';
                
            db.run(`INSERT INTO notifications (user_id, type, title, message) 
                SELECT user_id, 'ad_rejected', 'Объявление отклонено', ? FROM ads WHERE id = ?`,
                [message, adId]
            );
            
            res.json({ success: true, message: 'Advertisement rejected' });
        }
    );
});

// Модераторская панель - статистика
app.get('/api/moderator/stats', checkModerator, (req, res) => {
    const queries = {
        total_ads: 'SELECT COUNT(*) as count FROM ads',
        pending_ads: 'SELECT COUNT(*) as count FROM ads WHERE status = "pending"',
        active_ads: 'SELECT COUNT(*) as count FROM ads WHERE status = "active"',
        rejected_ads: 'SELECT COUNT(*) as count FROM ads WHERE status = "rejected"',
        total_reports: 'SELECT COUNT(*) as count FROM reports',
        pending_reports: 'SELECT COUNT(*) as count FROM reports WHERE status = "pending"',
        total_users: 'SELECT COUNT(*) as count FROM users'
    };
    
    const stats = {};
    let completed = 0;
    
    Object.entries(queries).forEach(([key, query]) => {
        db.get(query, (err, row) => {
            if (!err && row) {
                stats[key] = row.count;
            }
            
            completed++;
            if (completed === Object.keys(queries).length) {
                res.json(stats);
            }
        });
    });
});

// Получение сообщений пользователя
app.get('/api/messages/:userId', (req, res) => {
    const userId = req.params.userId;
    
    const query = `
        SELECT m.*, u.first_name, u.username 
        FROM messages m
        JOIN users u ON m.sender_id = u.id OR m.receiver_id = u.id
        WHERE (m.sender_id = ? OR m.receiver_id = ?) AND u.id != ?
        ORDER BY m.created_at DESC
        LIMIT 50
    `;
    
    db.all(query, [userId, userId, userId], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Обслуживание frontend
app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'public/index.html');
    console.log('🏠 Serving index.html from:', indexPath);
    res.sendFile(indexPath);
});

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Backend сервер запущен на порту ${PORT}`);
    console.log(`📱 Frontend доступен: http://0.0.0.0:${PORT}`);
    console.log(`🔗 Health check: http://0.0.0.0:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Закрытие сервера...');
    db.close((err) => {
        if (err) {
            console.error('Ошибка закрытия базы данных:', err.message);
        } else {
            console.log('База данных закрыта');
        }
        process.exit(0);
    });
});
