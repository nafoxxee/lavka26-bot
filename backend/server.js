const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Инициализация базы данных SQLite
const db = new sqlite3.Database('./database/lavka26.db', (err) => {
    if (err) {
        console.error('Ошибка подключения к базе данных:', err.message);
    } else {
        console.log('Подключено к SQLite базе данных');
        initTables();
    }
});

// Создание таблиц
function initTables() {
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
    )`);

    // Таблица объявлений
    db.run(`CREATE TABLE IF NOT EXISTS ads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        category_id INTEGER,
        user_id INTEGER NOT NULL,
        images TEXT,
        status TEXT DEFAULT 'active',
        views INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    // Таблица избранного
    db.run(`CREATE TABLE IF NOT EXISTS favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        ad_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (ad_id) REFERENCES ads (id),
        UNIQUE(user_id, ad_id)
    )`);

    // Добавляем базовые категории
    db.run(`INSERT OR IGNORE INTO categories (name, icon) VALUES 
        ('Транспорт', '🚗'),
        ('Недвижимость', '🏠'),
        ('Электроника', '📱'),
        ('Одежда', '👕'),
        ('Услуги', '🔧'),
        ('Работа', '💼'),
        ('Другое', '📦')
    `);

    console.log('Таблицы созданы успешно');
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

// Получение объявлений
app.get('/api/ads', (req, res) => {
    const { category_id, search, limit = 20, offset = 0 } = req.query;
    
    let query = `
        SELECT a.*, u.first_name, u.username, c.name as category_name 
        FROM ads a 
        JOIN users u ON a.user_id = u.id 
        JOIN categories c ON a.category_id = c.id 
        WHERE a.status = 'active'
    `;
    const params = [];
    
    if (category_id) {
        query += ' AND a.category_id = ?';
        params.push(category_id);
    }
    
    if (search) {
        query += ' AND (a.title LIKE ? OR a.description LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
    }
    
    query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
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

// Обслуживание frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
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
