// Lavka26 Mini App - Полный функционал маркетплейса
let tg = window.Telegram.WebApp;
let currentUser = null;
let currentAd = null;
let categories = [];
let favorites = [];

// Инициализация приложения - запускаем сразу для Telegram WebApp
console.log('🚀 Запуск Lavka26 Mini App...');
console.log('📱 Telegram WebApp доступен:', typeof window.Telegram !== 'undefined');

// Показываем контент сразу для отладки
showContent();

// Настройка Telegram WebApp
setupTelegramWebApp();

// Получение данных пользователя с таймаутом
getUserDataWithTimeout();

// Настройка обработчиков событий
setupEventListeners();

// Загрузка начальных данных
loadInitialData();

console.log('✅ Инициализация завершена');

// Получение данных пользователя с таймаутом
function getUserDataWithTimeout() {
    // Сначала пробуем получить из Telegram WebApp
    const tgUser = tg.initDataUnsafe.user;
    
    if (tgUser) {
        console.log('✅ Получены данные из Telegram WebApp:', tgUser);
        registerUser({
            telegram_id: tgUser.id,
            first_name: tgUser.first_name,
            last_name: tgUser.last_name || '',
            username: tgUser.username || ''
        });
    } else {
        // Fallback - пробуем получить из URL параметров
        const urlParams = new URLSearchParams(window.location.search);
        
        const userData = {
            telegram_id: urlParams.get('telegram_id'),
            first_name: urlParams.get('first_name') || 'Пользователь',
            last_name: urlParams.get('last_name') || '',
            username: urlParams.get('username') || ''
        };
        
        if (userData.telegram_id) {
            console.log('✅ Получены данные из URL параметров:', userData);
            registerUser(userData);
        } else {
            console.log('⚠️ Не удалось получить данные пользователя, работаем без регистрации');
            document.getElementById('user-name-display').textContent = 'Гость';
            showContent();
        }
    }
}

// Настройка Telegram WebApp
function setupTelegramWebApp() {
    // Расширяем на весь экран
    tg.expand();
    
    // Устанавливаем цвета темы
    tg.setHeaderColor('#007bff');
    tg.setBackgroundColor('#f8f9fa');
    
    // Показываем кнопку назад если нужно
    if (tg.BackButton) {
        tg.BackButton.onClick(() => {
            closeModal();
        });
    }
    
    // Устанавливаем главную кнопку
    tg.MainButton.setText('Lavka26');
    tg.MainButton.color = '#007bff';
    tg.MainButton.textColor = '#ffffff';
    
    // Сообщаем о готовности
    tg.ready();
    
    console.log('✅ Telegram WebApp настроен');
}

// Регистрация пользователя
async function registerUser(userData) {
    try {
        const response = await fetch(`/api/user/${userData.telegram_id}?first_name=${encodeURIComponent(userData.first_name)}&last_name=${encodeURIComponent(userData.last_name)}&username=${encodeURIComponent(userData.username)}`);
        
        if (!response.ok) {
            throw new Error('Ошибка регистрации пользователя');
        }
        
        currentUser = await response.json();
        console.log('✅ Пользователь зарегистрирован:', currentUser);
        
        // Обновляем отображение имени
        document.getElementById('user-name-display').textContent = currentUser.first_name;
        
        // Загружаем избранные
        await loadFavorites();
        
        // Показываем контент
        showContent();
        
    } catch (error) {
        console.error('❌ Ошибка регистрации:', error);
        showNotification('Ошибка регистрации пользователя', 'error');
        // Показываем контент даже если регистрация не удалась
        showContent();
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Переключение вкладок
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            switchTab(tabName);
        });
    });
    
    // Форма создания объявления
    document.getElementById('ad-form').addEventListener('submit', function(e) {
        e.preventDefault();
        createAd();
    });
    
    // Поиск по Enter
    document.getElementById('search-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchAds();
        }
    });
    
    // Закрытие модального окна по клику вне его
    document.getElementById('ad-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
}

// Загрузка начальных данных
async function loadInitialData() {
    await loadCategories();
    await loadAds();
}

// Загрузка категорий
async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        if (!response.ok) throw new Error('Ошибка загрузки категорий');
        
        categories = await response.json();
        console.log('✅ Категории загружены:', categories);
        
        // Обновляем селекты категорий
        updateCategorySelects();
        
    } catch (error) {
        console.error('❌ Ошибка загрузки категорий:', error);
        showNotification('Ошибка загрузки категорий', 'error');
    }
}

// Обновление селектов категорий
function updateCategorySelects() {
    const filterSelect = document.getElementById('category-filter');
    const createSelect = document.getElementById('ad-category');
    
    // Очищаем селекты
    filterSelect.innerHTML = '<option value="">📂 Все категории</option>';
    createSelect.innerHTML = '<option value="">Выберите категорию</option>';
    
    // Добавляем категории
    categories.forEach(category => {
        const option1 = new Option(`${category.icon} ${category.name}`, category.id);
        const option2 = new Option(`${category.icon} ${category.name}`, category.id);
        
        filterSelect.add(option1);
        createSelect.add(option2);
    });
}

// Загрузка объявлений
async function loadAds(params = {}) {
    try {
        const queryString = new URLSearchParams(params).toString();
        const response = await fetch(`/api/ads?${queryString}`);
        
        if (!response.ok) throw new Error('Ошибка загрузки объявлений');
        
        const ads = await response.json();
        console.log('✅ Объявления загружены:', ads.length);
        
        displayAds(ads, 'ads-list');
        
    } catch (error) {
        console.error('❌ Ошибка загрузки объявлений:', error);
        document.getElementById('ads-list').innerHTML = '<div class="loading-placeholder">Ошибка загрузки объявлений</div>';
    }
}

// Отображение объявлений
function displayAds(ads, containerId) {
    const container = document.getElementById(containerId);
    
    if (!ads || ads.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>📦 Объявлений нет</h3>
                <p>Попробуйте изменить фильтры или создайте новое объявление</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = ads.map(ad => `
        <div class="ad-card" onclick="openAd(${ad.id})">
            <div class="ad-header">
                <div class="ad-title">${escapeHtml(ad.title)}</div>
                <div class="ad-price">${formatPrice(ad.price)}</div>
            </div>
            <div class="ad-description">${escapeHtml(ad.description || '')}</div>
            <div class="ad-meta">
                <span class="ad-category">${ad.category_name || 'Другое'}</span>
                <div class="ad-author">
                    <span>${escapeHtml(ad.first_name || 'Аноним')}</span>
                    <span>•</span>
                    <span>${formatDate(ad.created_at)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Загрузка моих объявлений
async function loadMyAds() {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`/api/ads?user_id=${currentUser.id}`);
        
        if (!response.ok) throw new Error('Ошибка загрузки моих объявлений');
        
        const ads = await response.json();
        console.log('✅ Мои объявления загружены:', ads.length);
        
        displayAds(ads, 'my-ads-list');
        
    } catch (error) {
        console.error('❌ Ошибка загрузки моих объявлений:', error);
        document.getElementById('my-ads-list').innerHTML = '<div class="loading-placeholder">Ошибка загрузки</div>';
    }
}

// Загрузка избранных
async function loadFavorites() {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`/api/favorites/${currentUser.id}`);
        
        if (!response.ok) throw new Error('Ошибка загрузки избранного');
        
        const ads = await response.json();
        favorites = ads;
        console.log('✅ Избранное загружено:', ads.length);
        
        displayAds(ads, 'favorites-list');
        
    } catch (error) {
        console.error('❌ Ошибка загрузки избранного:', error);
        document.getElementById('favorites-list').innerHTML = '<div class="loading-placeholder">Ошибка загрузки</div>';
    }
}

// Переключение вкладок
function switchTab(tabName) {
    // Обновляем кнопки
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Обновляем контент
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Загружаем данные для вкладки
    switch (tabName) {
        case 'my-ads':
            loadMyAds();
            break;
        case 'favorites':
            loadFavorites();
            break;
    }
}

// Поиск объявлений
function searchAds() {
    const searchTerm = document.getElementById('search-input').value.trim();
    const categoryId = document.getElementById('category-filter').value;
    
    const params = {};
    if (searchTerm) params.search = searchTerm;
    if (categoryId) params.category_id = categoryId;
    
    loadAds(params);
}

// Фильтр по категории
function filterByCategory() {
    searchAds();
}

// Создание объявления
async function createAd() {
    if (!currentUser) {
        showNotification('Сначала авторизуйтесь', 'error');
        return;
    }
    
    const title = document.getElementById('ad-title').value.trim();
    const categoryId = document.getElementById('ad-category').value;
    const price = parseFloat(document.getElementById('ad-price').value);
    const description = document.getElementById('ad-description').value.trim();
    
    if (!title || !categoryId || !price) {
        showNotification('Заполните все обязательные поля', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/ads', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title,
                description,
                price,
                category_id: parseInt(categoryId),
                user_id: currentUser.id,
                images: []
            })
        });
        
        if (!response.ok) throw new Error('Ошибка создания объявления');
        
        const ad = await response.json();
        console.log('✅ Объявление создано:', ad);
        
        showNotification('Объявление успешно опубликовано!', 'success');
        
        // Очищаем форму
        document.getElementById('ad-form').reset();
        
        // Переключаемся на мои объявления
        switchTab('my-ads');
        
    } catch (error) {
        console.error('❌ Ошибка создания объявления:', error);
        showNotification('Ошибка создания объявления', 'error');
    }
}

// Открытие объявления
async function openAd(adId) {
    try {
        const response = await fetch(`/api/ads/${adId}`);
        
        if (!response.ok) throw new Error('Ошибка загрузки объявления');
        
        currentAd = await response.json();
        console.log('✅ Объявление загружено:', currentAd);
        
        displayModalAd();
        
    } catch (error) {
        console.error('❌ Ошибка загрузки объявления:', error);
        showNotification('Ошибка загрузки объявления', 'error');
    }
}

// Отображение объявления в модальном окне
function displayModalAd() {
    if (!currentAd) return;
    
    document.getElementById('modal-title').textContent = currentAd.title;
    
    const isFavorite = favorites.some(fav => fav.id === currentAd.id);
    document.getElementById('favorite-btn').textContent = isFavorite ? '❤️' : '🤍';
    document.getElementById('favorite-btn').classList.toggle('active', isFavorite);
    
    document.getElementById('modal-body').innerHTML = `
        <div class="ad-details">
            <div class="ad-price-large">${formatPrice(currentAd.price)}</div>
            <div class="ad-category-badge">${currentAd.category_name || 'Другое'}</div>
            
            ${currentAd.description ? `
                <div class="ad-description-full">
                    <h4>Описание</h4>
                    <p>${escapeHtml(currentAd.description)}</p>
                </div>
            ` : ''}
            
            <div class="ad-author-info">
                <h4>Продавец</h4>
                <div class="author-card">
                    <div class="author-name">${escapeHtml(currentAd.first_name || 'Аноним')}</div>
                    ${currentAd.username ? `<div class="author-username">@${escapeHtml(currentAd.username)}</div>` : ''}
                    ${currentAd.rating ? `<div class="author-rating">⭐ ${currentAd.rating}</div>` : ''}
                </div>
            </div>
            
            <div class="ad-stats">
                <span>👁 ${currentAd.views || 0} просмотров</span>
                <span>📅 ${formatDate(currentAd.created_at)}</span>
            </div>
        </div>
    `;
    
    // Показываем кнопку назад в Telegram
    if (tg.BackButton) {
        tg.BackButton.show();
    }
    
    document.getElementById('ad-modal').style.display = 'flex';
}

// Закрытие модального окна
function closeModal() {
    document.getElementById('ad-modal').style.display = 'none';
    currentAd = null;
    
    // Скрываем кнопку назад в Telegram
    if (tg.BackButton) {
        tg.BackButton.hide();
    }
}

// Связаться с продавцом
function contactSeller() {
    if (!currentAd || !currentAd.username) {
        showNotification('Не удалось получить данные продавца', 'error');
        return;
    }
    
    const telegramUrl = `https://t.me/${currentAd.username}`;
    
    // Пытаемся открыть через Telegram WebApp
    try {
        tg.openTelegramLink(telegramUrl);
    } catch (error) {
        // Fallback - открываем в новой вкладке
        window.open(telegramUrl, '_blank');
    }
    
    showNotification('Открываем чат с продавцом...', 'success');
}

// Добавление/удаление из избранного
async function toggleFavorite() {
    if (!currentUser || !currentAd) return;
    
    try {
        const response = await fetch('/api/favorites', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: currentUser.id,
                ad_id: currentAd.id
            })
        });
        
        if (!response.ok) throw new Error('Ошибка операции с избранным');
        
        const result = await response.json();
        
        if (result.success) {
            // Обновляем список избранных
            await loadFavorites();
            
            // Обновляем кнопку
            const isFavorite = favorites.some(fav => fav.id === currentAd.id);
            document.getElementById('favorite-btn').textContent = isFavorite ? '❤️' : '🤍';
            document.getElementById('favorite-btn').classList.toggle('active', isFavorite);
            
            showNotification(isFavorite ? 'Добавлено в избранное' : 'Удалено из избранного', 'success');
        }
        
    } catch (error) {
        console.error('❌ Ошибка операции с избранным:', error);
        showNotification('Ошибка операции с избранным', 'error');
    }
}

// Показать контент приложения
function showContent() {
    console.log('🎯 Показываем контент...');
    
    const loading = document.getElementById('loading');
    const content = document.getElementById('content');
    
    console.log('📦 Элемент loading:', loading);
    console.log('📦 Элемент content:', content);
    
    if (loading) {
        loading.style.display = 'none';
        console.log('✅ Скрыли loading');
    } else {
        console.error('❌ Элемент loading не найден');
    }
    
    if (content) {
        content.style.display = 'block';
        console.log('✅ Показали content');
    } else {
        console.error('❌ Элемент content не найден');
    }
}

// Показать уведомление
function showNotification(message, type = 'info') {
    const container = document.getElementById('notifications');
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    container.appendChild(notification);
    
    // Автоматическое удаление через 3 секунды
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Вспомогательные функции
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(price);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'только что';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} мин назад`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ч назад`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} д назад`;
    
    return date.toLocaleDateString('ru-RU');
}

// Обработка ошибок
window.addEventListener('error', function(e) {
    console.error('❌ Ошибка приложения:', e.error);
    showNotification('Произошла ошибка приложения', 'error');
});

// Обработка необработанных промисов
window.addEventListener('unhandledrejection', function(e) {
    console.error('❌ Необработанный промис:', e.reason);
    showNotification('Произошла ошибка сети', 'error');
});

console.log('🎉 Lavka26 Mini App готов к работе!');
