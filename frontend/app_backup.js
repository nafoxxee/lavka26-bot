// Lavka26 - Полный функционал как у Авито
let tg = window.Telegram.WebApp;

// Глобальные переменные
let currentUser = null;
let currentAd = null;
let ads = [];
let categories = [];
let notifications = [];
let messages = [];
let favorites = [];
let currentFilters = {
    category: '',
    search: '',
    priceMin: '',
    priceMax: '',
    location: '',
    distance: 10,
    date: 'today',
    withPhotos: false
};

// Инициализация приложения
function initializeApp() {
    console.log('🚀 Запуск Lavka26...');
    
    // Показываем контент сразу
    showContent();
    
    // Настройка Telegram WebApp
    setupTelegramWebApp();
    
    // Получение данных пользователя
    getUserDataWithTimeout();
    
    // Настройка обработчиков событий
    setupEventListeners();
    
    // Загрузка начальных данных
    loadInitialData();
    
    console.log('✅ Инициализация завершена');
}

// Настройка Telegram WebApp
function setupTelegramWebApp() {
    tg.expand();
    tg.setHeaderColor('#0066FF');
    tg.setBackgroundColor('#F7F8FA');
    tg.ready();
    console.log('✅ Telegram WebApp настроен');
}

// Получение данных пользователя
function getUserDataWithTimeout() {
    const tgUser = tg.initDataUnsafe.user;
    
    if (tgUser) {
        console.log('✅ Получены данные из Telegram:', tgUser);
        registerUser({
            telegram_id: tgUser.id,
            first_name: tgUser.first_name,
            last_name: tgUser.last_name || '',
            username: tgUser.username || ''
        });
        
        // Проверяем, является ли пользователь модератором
        checkModeratorAccess(tgUser.id);
    } else {
        const urlParams = new URLSearchParams(window.location.search);
        const userData = {
            telegram_id: urlParams.get('telegram_id'),
            first_name: urlParams.get('first_name') || 'Пользователь',
            last_name: urlParams.get('last_name') || '',
            username: urlParams.get('username') || ''
        };
        
        if (userData.telegram_id) {
            registerUser(userData);
            checkModeratorAccess(userData.telegram_id);
        } else {
            console.log('⚠️ Работаем без регистрации');
            loadInitialData();
        }
    }
}

// Проверка прав модератора
function checkModeratorAccess(telegramId) {
    const MODERATOR_ID = 379036860;
    
    if (telegramId.toString() === MODERATOR_ID.toString()) {
        // Показываем модераторскую вкладку
        const moderatorTab = document.getElementById('moderator-tab');
        if (moderatorTab) {
            moderatorTab.style.display = 'block';
        }
        console.log('✅ Доступ модератора предоставлен');
    }
}

// Регистрация пользователя
async function registerUser(userData) {
    try {
        const response = await fetch(`/api/user/${userData.telegram_id}?first_name=${encodeURIComponent(userData.first_name)}&last_name=${encodeURIComponent(userData.last_name)}&username=${encodeURIComponent(userData.username)}`);
        
        if (response.ok) {
            currentUser = await response.json();
            console.log('✅ Пользователь зарегистрирован:', currentUser);
            await loadInitialData();
        }
    } catch (error) {
        console.error('❌ Ошибка регистрации:', error);
        loadInitialData();
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Поиск
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentFilters.search = e.target.value;
                loadAds();
            }, 500);
        });
    }
    
    // Категории
    document.querySelectorAll('.category-item').forEach(item => {
        item.addEventListener('click', function() {
            document.querySelectorAll('.category-item').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            currentFilters.category = this.dataset.category;
            loadAds();
        });
    });
    
    // Сортировка
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentSort = this.dataset.sort;
            loadAds();
        });
    });
    
    // Переключение вида
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentView = this.dataset.view;
            updateViewMode();
        });
    });
    
    // Нижняя навигация
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const tab = this.dataset.tab;
            switchTab(tab);
        });
    });
    
    // Слайдер расстояния
    const distanceSlider = document.getElementById('distance');
    const distanceValue = document.getElementById('distance-value');
    if (distanceSlider && distanceValue) {
        distanceSlider.addEventListener('input', (e) => {
            distanceValue.textContent = e.target.value;
        });
    }
}

// Загрузка начальных данных
async function loadInitialData() {
    await Promise.all([
        loadCategories(),
        loadAds(),
        loadNotifications(),
        loadMessages()
    ]);
}

// Загрузка категорий
async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        if (response.ok) {
            categories = await response.json();
            console.log('✅ Категории загружены:', categories);
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки категорий:', error);
    }
}

// Загрузка объявлений
async function loadAds() {
    try {
        const params = new URLSearchParams();
        
        if (currentFilters.category) params.append('category_id', currentFilters.category);
        if (currentFilters.search) params.append('search', currentFilters.search);
        if (currentFilters.priceMin) params.append('price_min', currentFilters.priceMin);
        if (currentFilters.priceMax) params.append('price_max', currentFilters.priceMax);
        if (currentFilters.withPhotos) params.append('with_photos', 'true');
        
        params.append('sort', currentSort);
        
        const response = await fetch(`/api/ads?${params}`);
        
        if (response.ok) {
            const ads = await response.json();
            displayAds(ads);
            console.log('✅ Объявления загружены:', ads.length);
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки объявлений:', error);
        showAdsError();
    }
}

// Отображение объявлений
function displayAds(ads) {
    const container = document.getElementById('ads-list');
    
    if (!ads || ads.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>Объявления не найдены</h3>
                <p>Попробуйте изменить фильтры или поиск</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = ads.map(ad => createAdCard(ad)).join('');
    
    // Добавляем обработчики событий
    container.querySelectorAll('.ad-card').forEach(card => {
        card.addEventListener('click', function() {
            const adId = this.dataset.adId;
            openAd(adId);
        });
    });
}

// Создание карточки объявления
function createAdCard(ad) {
    let imageHtml = '';
    if (ad.images && ad.images.length > 0) {
        try {
            const images = JSON.parse(ad.images);
            if (images.length > 0) {
                imageHtml = `<img src="${images[0]}" alt="${escapeHtml(ad.title)}" class="ad-image">`;
            }
        } catch (e) {
            imageHtml = `<div class="ad-image placeholder"><i class="fas fa-image"></i></div>`;
        }
    } else {
        imageHtml = `<div class="ad-image placeholder"><i class="fas fa-image"></i></div>`;
    }
    
    return `
        <div class="ad-card" data-ad-id="${ad.id}">
            ${imageHtml}
            <div class="ad-content">
                <h3 class="ad-title">${escapeHtml(ad.title)}</h3>
                <div class="ad-price">${formatPrice(ad.price)}</div>
                <div class="ad-location">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${escapeHtml(ad.location || 'Не указано')}</span>
                </div>
            </div>
        </div>
    `;
}

// Обновление режима отображения
function updateViewMode() {
    const container = document.getElementById('ads-list');
    if (currentView === 'list') {
        container.classList.add('list-view');
    } else {
        container.classList.remove('list-view');
    }
}

// Открытие объявления
async function openAd(adId) {
    try {
        const response = await fetch(`/api/ads/${adId}`);
        
        if (response.ok) {
            currentAd = await response.json();
            displayModalAd();
            
            // Увеличиваем счетчик просмотров
            incrementViews(adId);
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки объявления:', error);
        showNotification('Ошибка загрузки объявления', 'error');
    }
}

// Отображение объявления в модальном окне
function displayModalAd() {
    if (!currentAd) return;
    
    document.getElementById('modal-title').textContent = currentAd.title;
    
    // Изображения
    let imagesHtml = '';
    if (currentAd.images) {
        try {
            const images = JSON.parse(currentAd.images);
            if (images.length > 0) {
                imagesHtml = `
                    <div class="ad-images-full">
                        ${images.map(img => 
                            `<img src="${img}" alt="Фото" class="ad-image-full" onclick="window.open('${img}', '_blank')">`
                        ).join('')}
                    </div>
                `;
            }
        } catch (e) {
            console.error('Ошибка парсинга изображений:', e);
        }
    }
    
    document.getElementById('modal-body').innerHTML = `
        ${imagesHtml}
        <div class="ad-details">
            <div class="ad-price-large">${formatPrice(currentAd.price)}</div>
            
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
    
    document.getElementById('ad-modal').style.display = 'flex';
}

// Увеличение счетчика просмотров
async function incrementViews(adId) {
    try {
        await fetch(`/api/ads/${adId}/views`, { method: 'POST' });
    } catch (error) {
        console.error('Ошибка увеличения просмотров:', error);
    }
}

// Функции фильтров
function openFilters() {
    document.getElementById('filters-modal').style.display = 'flex';
    // Загружаем текущие значения фильтров
    loadFilterValues();
}

function closeFilters() {
    document.getElementById('filters-modal').style.display = 'none';
}

function loadFilterValues() {
    // Восстанавливаем сохраненные значения фильтров
    const savedFilters = localStorage.getItem('filters');
    if (savedFilters) {
        const filters = JSON.parse(savedFilters);
        document.getElementById('filter-category').value = filters.category || '';
        document.getElementById('filter-min-price').value = filters.minPrice || '';
        document.getElementById('filter-max-price').value = filters.maxPrice || '';
        document.getElementById('filter-condition').value = filters.condition || '';
        document.getElementById('filter-sort').value = filters.sort || 'newest';
    }
}

function applyFilters() {
    const filters = {
        category: document.getElementById('filter-category').value,
        minPrice: document.getElementById('filter-min-price').value,
        maxPrice: document.getElementById('filter-max-price').value,
        condition: document.getElementById('filter-condition').value,
        sort: document.getElementById('filter-sort').value
    };
    
    // Сохраняем фильтры
    localStorage.setItem('filters', JSON.stringify(filters));
    
    // Применяем фильтры к загрузке объявлений
    currentFilters = filters;
    
    // Перезагружаем объявления с новыми фильтрами
    loadAds();
    
    closeFilters();
    showNotification('Фильтры применены', 'success');
}

function resetFilters() {
    // Очищаем форму
    document.getElementById('filter-category').value = '';
    document.getElementById('filter-min-price').value = '';
    document.getElementById('filter-max-price').value = '';
    document.getElementById('filter-condition').value = '';
    document.getElementById('filter-sort').value = 'newest';
    
    // Очищаем сохраненные фильтры
    localStorage.removeItem('filters');
    currentFilters = {};
    
    // Перезагружаем объявления
    loadAds();

function resetFilters() {
    currentFilters = {
        category: '',
        search: '',
        priceMin: '',
        priceMax: '',
        location: '',
        distance: 10,
        date: 'today',
        withPhotos: false
    };
    
    // Сброс формы
    document.getElementById('price-min').value = '';
    document.getElementById('price-max').value = '';
    document.getElementById('location').value = '';
    document.getElementById('distance').value = 10;
    document.getElementById('distance-value').textContent = '10';
    document.getElementById('with-photos').checked = false;
    document.querySelector('input[name="date"][value="today"]').checked = true;
    
    closeFilters();
    loadAds();
}

function loadAds() {
    const container = document.getElementById('ads-container');
    container.innerHTML = '<div class="skeleton-card"></div><div class="skeleton-card"></div><div class="skeleton-card"></div>';
    
    let url = '/api/ads';
    const params = new URLSearchParams();
    
    // Добавляем фильтры к URL
    if (currentFilters.category) params.append('category', currentFilters.category);
    if (currentFilters.minPrice) params.append('min_price', currentFilters.minPrice);
    if (currentFilters.maxPrice) params.append('max_price', currentFilters.maxPrice);
    if (currentFilters.condition) params.append('condition', currentFilters.condition);
    if (currentFilters.sort) params.append('sort', currentFilters.sort);
    
    if (params.toString()) {
        url += '?' + params.toString();
    }
    
    fetch(url)
        .then(response => response.json())
        .then(ads => {
            displayAds(ads);
        })
        .catch(error => {
            console.error('❌ Ошибка загрузки объявлений:', error);
            container.innerHTML = '<div class="error-message">Ошибка загрузки объявлений</div>';
        });
}

// Функции навигации
function switchTab(tabName) {
    // Удаляем active у всех кнопок навигации
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Добавляем active к выбранной кнопке
    const activeBtn = document.querySelector(`.nav-item[data-tab="${tabName}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // Скрываем все вкладки
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    
    // Показываем выбранную вкладку
    const targetTab = document.getElementById(`${tabName}-tab`);
    if (targetTab) {
        targetTab.style.display = 'block';
    }
    
    // Загружаем данные для конкретной вкладки
    switch(tabName) {
        case 'favorites':
            loadFavorites();
            break;
        case 'profile':
            loadProfile();
            break;
        case 'my-ads':
            loadMyAds();
            break;
        case 'messages':
            openMessages();
            break;
        case 'moderator':
            loadModeratorPanel();
            break;
        case 'feed':
            // Главная вкладка - показываем объявления
            document.getElementById('ads-list').style.display = 'grid';
            break;
    }
}

function openCreateAd() {
    if (!currentUser) {
        showNotification('Сначала авторизуйтесь', 'error');
        return;
    }
    
    document.getElementById('create-ad-modal').style.display = 'flex';
    setupCreateAdForm();
}

function closeCreateAdModal() {
    document.getElementById('create-ad-modal').style.display = 'none';
    resetCreateAdForm();
}

function setupCreateAdForm() {
    // Счетчики символов
    const titleInput = document.getElementById('ad-title-input');
    const descInput = document.getElementById('ad-description-input');
    const titleCounter = document.getElementById('title-counter');
    const descCounter = document.getElementById('desc-counter');
    
    titleInput.addEventListener('input', () => {
        titleCounter.textContent = titleInput.value.length;
    });
    
    descInput.addEventListener('input', () => {
        descCounter.textContent = descInput.value.length;
    });
    
    // Загрузка изображений
    const imagesInput = document.getElementById('ad-images-input');
    imagesInput.addEventListener('change', handleImageUpload);
}

function resetCreateAdForm() {
    document.getElementById('create-ad-form').reset();
    document.getElementById('title-counter').textContent = '0';
    document.getElementById('desc-counter').textContent = '0';
    document.getElementById('image-preview-container').innerHTML = '';
    uploadedImages = [];
}

let uploadedImages = [];

function handleImageUpload(event) {
    const files = Array.from(event.target.files);
    const maxFiles = 5;
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (uploadedImages.length + files.length > maxFiles) {
        showNotification(`Максимум ${maxFiles} фотографий`, 'error');
        return;
    }
    
    const previewContainer = document.getElementById('image-preview-container');
    
    files.forEach(file => {
        if (file.size > maxSize) {
            showNotification(`Файл ${file.name} слишком большой (максимум 5МБ)`, 'error');
            return;
        }
        
        if (!file.type.startsWith('image/')) {
            showNotification(`Файл ${file.name} не является изображением`, 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const previewItem = document.createElement('div');
            previewItem.className = 'image-preview-item';
            previewItem.innerHTML = `
                <img src="${e.target.result}" alt="Preview">
                <button type="button" class="remove-image" onclick="removeImage(this, '${file.name}')">
                    <i class="fas fa-times"></i>
                </button>
            `;
            previewContainer.appendChild(previewItem);
            
            uploadedImages.push({
                file: file,
                name: file.name,
                url: e.target.result
            });
        };
        reader.readAsDataURL(file);
    });
    
    // Скрываем placeholder если есть изображения
    const uploadArea = document.querySelector('.image-upload-area');
    if (uploadedImages.length > 0) {
        uploadArea.style.display = 'none';
    }
}

function removeImage(button, fileName) {
    const previewItem = button.parentElement;
    previewItem.remove();
    
    uploadedImages = uploadedImages.filter(img => img.name !== fileName);
    
    // Показываем placeholder если нет изображений
    const uploadArea = document.querySelector('.image-upload-area');
    if (uploadedImages.length === 0) {
        uploadArea.style.display = 'block';
    }
}

async function publishAd() {
    if (!currentUser) {
        showNotification('Сначала авторизуйтесь', 'error');
        return;
    }
    
    const form = document.getElementById('create-ad-form');
    const formData = new FormData(form);
    
    // Валидация
    const title = formData.get('title').trim();
    const category = formData.get('category');
    const price = parseFloat(formData.get('price'));
    const description = formData.get('description').trim();
    
    if (!title) {
        showNotification('Введите заголовок', 'error');
        return;
    }
    
    if (!category) {
        showNotification('Выберите категорию', 'error');
        return;
    }
    
    if (!price || price <= 0) {
        showNotification('Введите корректную цену', 'error');
        return;
    }
    
    try {
        showNotification('Загрузка изображений...', 'info');
        
        // Загружаем изображения
        let imagePaths = [];
        if (uploadedImages.length > 0) {
            const imageFormData = new FormData();
            uploadedImages.forEach(img => {
                imageFormData.append('images', img.file);
            });
            
            const uploadResponse = await fetch('/api/upload', {
                method: 'POST',
                body: imageFormData
            });
            
            if (uploadResponse.ok) {
                const uploadResult = await uploadResponse.json();
                imagePaths = uploadResult.images || [];
            } else {
                throw new Error('Ошибка загрузки изображений');
            }
        }
        
        showNotification('Создание объявления...', 'info');
        
        // Создаем объявление
        const adData = {
            title,
            description,
            price,
            category_id: parseInt(category),
            user_id: currentUser.id,
            images: JSON.stringify(imagePaths),
            location: formData.get('location') || '',
            contact_info: JSON.stringify({
                show_phone: document.getElementById('show-phone').checked,
                allow_messages: document.getElementById('allow-messages').checked
            })
        };
        
        const response = await fetch('/api/ads', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(adData)
        });
        
        if (response.ok) {
            const ad = await response.json();
            showNotification('Объявление отправлено на модерацию!', 'success');
            closeCreateAdModal();
            loadAds(); // Обновляем список
            
            // Если модератор, обновляем статистику
            if (currentUser.telegram_id === 379036860) {
                loadModeratorStats();
            }
        } else {
            throw new Error('Ошибка создания объявления');
        }
        
    } catch (error) {
        console.error('❌ Ошибка создания объявления:', error);
        showNotification('Ошибка создания объявления', 'error');
    }
}

function openNotifications() {
    // Создаем модальное окно уведомлений
    const modalHtml = `
        <div class="modal" id="notifications-modal" style="display: flex;">
            <div class="modal-content notifications-modal">
                <div class="modal-header">
                    <button class="close-btn" onclick="closeNotificationsModal()">
                        <i class="fas fa-times"></i>
                    </button>
                    <h3>Уведомления</h3>
                    <button class="clear-btn" onclick="clearAllNotifications()">
                        <i class="fas fa-trash"></i> Очистить
                    </button>
                </div>
                <div class="modal-body">
                    <div class="notifications-list" id="notifications-list">
                        <div class="loading-placeholder">Загрузка уведомлений...</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Добавляем модальное окно в body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Загружаем уведомления
    loadNotificationsList();
}

function closeNotificationsModal() {
    const modal = document.getElementById('notifications-modal');
    if (modal) {
        modal.remove();
    }
}

async function loadNotificationsList() {
    if (!currentUser) {
        document.getElementById('notifications-list').innerHTML = 
            '<div class="empty-notifications">Пожалуйста авторизуйтесь</div>';
        return;
    }
    
    try {
        const response = await fetch(`/api/notifications/${currentUser.id}`);
        if (response.ok) {
            const notifications = await response.json();
            displayNotificationsList(notifications);
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки уведомлений:', error);
        document.getElementById('notifications-list').innerHTML = 
            '<div class="empty-notifications">Ошибка загрузки</div>';
    }
}

function displayNotificationsList(notifications) {
    const container = document.getElementById('notifications-list');
    
    if (!notifications || notifications.length === 0) {
        container.innerHTML = `
            <div class="empty-notifications">
                <i class="fas fa-bell-slash"></i>
                <p>У вас нет уведомлений</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = notifications.map(notification => `
        <div class="notification-item ${notification.read ? 'read' : 'unread'}" onclick="markAsRead(${notification.id})">
            <div class="notification-icon">
                <i class="fas ${getNotificationIcon(notification.type)}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${escapeHtml(notification.title)}</div>
                <div class="notification-message">${escapeHtml(notification.message)}</div>
                <div class="notification-time">${formatDate(notification.created_at)}</div>
            </div>
            <div class="notification-actions">
                <button class="notification-delete" onclick="event.stopPropagation(); deleteNotification(${notification.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function getNotificationIcon(type) {
    const icons = {
        'ad_approved': 'fa-check-circle',
        'ad_rejected': 'fa-times-circle',
        'new_message': 'fa-comment',
        'new_favorite': 'fa-heart',
        'system': 'fa-info-circle'
    };
    return icons[type] || 'fa-bell';
}

async function markAsRead(notificationId) {
    try {
        const response = await fetch(`/api/notifications/${notificationId}/read`, {
            method: 'PUT'
        });
        if (response.ok) {
            loadNotificationsList();
        }
    } catch (error) {
        console.error('❌ Ошибка отметки как прочитанное:', error);
    }
}

async function deleteNotification(notificationId) {
    try {
        const response = await fetch(`/api/notifications/${notificationId}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            loadNotificationsList();
            showNotification('Уведомление удалено', 'success');
        }
    } catch (error) {
        console.error('❌ Ошибка удаления уведомления:', error);
    }
}

async function clearAllNotifications() {
    if (!confirm('Удалить все уведомления?')) return;
    
    try {
        const response = await fetch(`/api/notifications/${currentUser.id}/clear`, {
            method: 'DELETE'
        });
        if (response.ok) {
            loadNotificationsList();
            showNotification('Все уведомления удалены', 'success');
        }
    } catch (error) {
        console.error('❌ Ошибка очистки уведомлений:', error);
    }
}

function openMessages() {
    // Создаем модальное окно сообщений
    const modalHtml = `
        <div class="modal" id="messages-modal" style="display: flex;">
            <div class="modal-content messages-modal">
                <div class="modal-header">
                    <button class="close-btn" onclick="closeMessagesModal()">
                        <i class="fas fa-times"></i>
                    </button>
                    <h3>Сообщения</h3>
                    <button class="new-chat-btn" onclick="startNewChat()">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="messages-list" id="messages-list">
                        <div class="loading-placeholder">Загрузка сообщений...</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Добавляем модальное окно в body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Загружаем сообщения
    loadMessagesList();
}

function closeMessagesModal() {
    const modal = document.getElementById('messages-modal');
    if (modal) {
        modal.remove();
    }
}

async function loadMessagesList() {
    if (!currentUser) {
        document.getElementById('messages-list').innerHTML = 
            '<div class="empty-messages">Пожалуйста авторизуйтесь</div>';
        return;
    }
    
    try {
        const response = await fetch(`/api/messages/${currentUser.id}`);
        if (response.ok) {
            const messages = await response.json();
            displayMessagesList(messages);
        } else {
            // Если API еще не готов, показываем демо-данные
            displayDemoMessages();
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки сообщений:', error);
        displayDemoMessages();
    }
}

function displayDemoMessages() {
    const demoMessages = [
        {
            id: 1,
            user_name: 'Александр',
            last_message: 'Здравствуйте! Товар еще доступен?',
            time: '5 мин назад',
            unread: true,
            avatar: 'A'
        },
        {
            id: 2,
            user_name: 'Мария',
            last_message: 'Можно договориться о цене?',
            time: '1 час назад',
            unread: true,
            avatar: 'М'
        },
        {
            id: 3,
            user_name: 'Дмитрий',
            last_message: 'Спасибо за покупку!',
            time: 'вчера',
            unread: false,
            avatar: 'Д'
        }
    ];
    
    displayMessagesList(demoMessages);
}

function displayMessagesList(messages) {
    const container = document.getElementById('messages-list');
    
    if (!messages || messages.length === 0) {
        container.innerHTML = `
            <div class="empty-messages">
                <i class="fas fa-comments"></i>
                <p>У вас нет сообщений</p>
                <button class="btn-primary" onclick="startNewChat()">
                    <i class="fas fa-plus"></i> Начать чат
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = messages.map(message => `
        <div class="message-item ${message.unread ? 'unread' : ''}" onclick="openChat(${message.id})">
            <div class="message-avatar">
                <span>${message.avatar || message.user_name[0]}</span>
            </div>
            <div class="message-content">
                <div class="message-header">
                    <div class="message-name">${escapeHtml(message.user_name)}</div>
                    <div class="message-time">${message.time}</div>
                </div>
                <div class="message-text">${escapeHtml(message.last_message)}</div>
            </div>
            ${message.unread ? '<div class="unread-indicator"></div>' : ''}
        </div>
    `).join('');
}

function openChat(chatId) {
    showNotification('Открытие чата...', 'info');
    // Здесь можно добавить логику открытия конкретного чата
}

function startNewChat() {
    showNotification('Создание нового чата...', 'info');
    // Здесь можно добавить логику создания нового чата
}

function openProfile() {
    if (!currentUser) {
        showNotification('Сначала авторизуйтесь', 'error');
        return;
    }
    switchTab('profile');
}

async function loadProfile() {
    if (!currentUser) {
        showNotification('Сначала авторизуйтесь', 'error');
        return;
    }
    
    try {
        // Загружаем данные профиля
        document.getElementById('profile-name').textContent = 
            currentUser.first_name + (currentUser.last_name ? ' ' + currentUser.last_name : '');
        document.getElementById('profile-username').textContent = 
            currentUser.username ? '@' + currentUser.username : 'Без username';
        
        // Загружаем статистику
        const adsResponse = await fetch(`/api/ads?user_id=${currentUser.id}`);
        if (adsResponse.ok) {
            const ads = await adsResponse.json();
            document.getElementById('profile-ads-count').textContent = ads.length || 0;
            
            // Показываем превью объявлений
            const previewContainer = document.getElementById('profile-ads-preview');
            if (ads.length > 0) {
                const recentAds = ads.slice(0, 3);
                previewContainer.innerHTML = recentAds.map(ad => `
                    <div class="ad-card" onclick="openAd(${ad.id})">
                        ${ad.images && ad.images.length > 0 ? 
                            `<img src="${ad.images[0]}" alt="${escapeHtml(ad.title)}" class="ad-image">` :
                            `<div class="ad-image-placeholder"><i class="fas fa-image"></i></div>`
                        }
                        <div class="ad-content">
                            <h3 class="ad-title">${escapeHtml(ad.title)}</h3>
                            <div class="ad-price">${formatPrice(ad.price)}</div>
                        </div>
                    </div>
                `).join('');
            } else {
                previewContainer.innerHTML = '<div class="empty-preview">Нет объявлений</div>';
            }
        }
        
        // Загружаем избранное
        await loadFavorites();
        const favoritesContainer = document.getElementById('profile-favorites-preview');
        if (favorites.length > 0) {
            const recentFavorites = favorites.slice(0, 3);
            favoritesContainer.innerHTML = recentFavorites.map(ad => `
                <div class="ad-card" onclick="openAd(${ad.id})">
                    ${ad.images && ad.images.length > 0 ? 
                        `<img src="${ad.images[0]}" alt="${escapeHtml(ad.title)}" class="ad-image">` :
                        `<div class="ad-image-placeholder"><i class="fas fa-image"></i></div>`
                    }
                    <div class="ad-content">
                        <h3 class="ad-title">${escapeHtml(ad.title)}</h3>
                        <div class="ad-price">${formatPrice(ad.price)}</div>
                    </div>
                </div>
            `).join('');
        } else {
            favoritesContainer.innerHTML = '<div class="empty-preview">Нет избранного</div>';
        }
        
        // Устанавливаем рейтинг (пока заглушка)
        document.getElementById('profile-rating').textContent = '4.8';
        
        // Дата регистрации
        const joinDate = currentUser.created_at ? new Date(currentUser.created_at) : new Date();
        document.getElementById('profile-joined').textContent = formatDate(joinDate);
        
    } catch (error) {
        console.error('❌ Ошибка загрузки профиля:', error);
        showNotification('Ошибка загрузки профиля', 'error');
    }
}

function editProfile() {
    showNotification('Редактирование профиля в разработке', 'info');
}

// Функции модального окна
function closeModal() {
    document.getElementById('ad-modal').style.display = 'none';
    currentAd = null;
}

function shareAd() {
    if (!currentAd) return;
    
    if (navigator.share) {
        navigator.share({
            title: currentAd.title,
            text: `${currentAd.title} - ${formatPrice(currentAd.price)}`,
            url: window.location.href
        });
    } else {
        // Копируем в буфер обмена
        const text = `${currentAd.title} - ${formatPrice(currentAd.price)}`;
        navigator.clipboard.writeText(text);
        showNotification('Ссылка скопирована', 'success');
    }
}

async function toggleFavorite() {
    if (!currentUser || !currentAd) {
        showNotification('Сначала авторизуйтесь', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/favorites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: currentUser.id,
                ad_id: currentAd.id
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            const isFavorite = result.action === 'added';
            
            // Обновляем кнопку в модальном окне
            const favoriteBtn = document.querySelector('#modal-actions .action-btn.secondary');
            if (favoriteBtn) {
                favoriteBtn.innerHTML = `<i class="fas fa-heart"></i> ${isFavorite ? 'В избранном' : 'В избранное'}`;
                favoriteBtn.classList.toggle('active', isFavorite);
            }
            
            // Обновляем список избранного если на этой вкладке
            if (document.getElementById('favorites-tab').style.display !== 'none') {
                await loadFavorites();
            }
            
            showNotification(isFavorite ? 'Добавлено в избранное' : 'Удалено из избранного', 'success');
        }
        
    } catch (error) {
        console.error('❌ Ошибка управления избранным:', error);
        showNotification('Ошибка управления избранным', 'error');
    }
}

function contactSeller() {
    if (!currentAd || !currentAd.username) {
        showNotification('Не удалось получить данные продавца', 'error');
        return;
    }
    
    const telegramUrl = `https://t.me/${currentAd.username}`;
    
    try {
        tg.openTelegramLink(telegramUrl);
    } catch (error) {
        window.open(telegramUrl, '_blank');
    }
    
    showNotification('Открываем чат с продавцом...', 'success');
}

// Загрузка уведомлений
async function loadNotifications() {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`/api/notifications/${currentUser.id}`);
        if (response.ok) {
            notifications = await response.json();
            updateNotificationBadge();
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки уведомлений:', error);
    }
}

// Загрузка сообщений
async function loadMessages() {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`/api/messages/${currentUser.id}`);
        if (response.ok) {
            messages = await response.json();
            updateMessageBadge();
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки сообщений:', error);
    }
}

// Обновление бейджей
function updateNotificationBadge() {
    const badge = document.getElementById('notification-badge');
    const unreadCount = notifications.filter(n => !n.read).length;
    badge.textContent = unreadCount;
    badge.style.display = unreadCount > 0 ? 'block' : 'none';
}

function updateMessageBadge() {
    const badge = document.getElementById('message-badge');
    const unreadCount = messages.filter(m => !m.read).length;
    badge.textContent = unreadCount;
    badge.style.display = unreadCount > 0 ? 'block' : 'none';
}

// Вспомогательные функции
function showContent() {
    const loading = document.getElementById('loading');
    const content = document.getElementById('content');
    if (loading) loading.style.display = 'none';
    if (content) content.style.display = 'block';
}

function showAdsError() {
    const container = document.getElementById('ads-list');
    container.innerHTML = `
        <div class="error-state">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Ошибка загрузки</h3>
            <p>Не удалось загрузить объявления. Попробуйте позже.</p>
            <button class="btn-primary" onclick="loadAds()">Повторить</button>
        </div>
    `;
}

function showNotification(message, type = 'info') {
    const container = document.getElementById('notifications');
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

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

// Запуск приложения
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Модераторские функции
async function loadModeratorPanel() {
    if (!currentUser || currentUser.telegram_id !== 379036860) {
        showNotification('Access denied', 'error');
        return;
    }
    
    await Promise.all([
        loadModeratorStats(),
        loadPendingAds(),
        loadReports()
    ]);
}

async function loadModeratorStats() {
    try {
        const response = await fetch(`/api/moderator/stats?telegram_id=${currentUser.telegram_id}`);
        if (response.ok) {
            const stats = await response.json();
            
            document.getElementById('total-ads').textContent = stats.total_ads || 0;
            document.getElementById('pending-ads').textContent = stats.pending_ads || 0;
            document.getElementById('active-ads').textContent = stats.active_ads || 0;
            document.getElementById('total-reports').textContent = stats.total_reports || 0;
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки статистики:', error);
    }
}

async function loadPendingAds() {
    try {
        const response = await fetch(`/api/moderator/ads?telegram_id=${currentUser.telegram_id}`);
        if (response.ok) {
            const ads = await response.json();
            displayPendingAds(ads);
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки объявлений:', error);
        document.getElementById('pending-ads-list').innerHTML = '<div class="loading-placeholder">Error loading ads</div>';
    }
}

function displayPendingAds(ads) {
    const container = document.getElementById('pending-ads-list');
    
    if (!ads || ads.length === 0) {
        container.innerHTML = '<div class="loading-placeholder">No pending ads</div>';
        return;
    }
    
    container.innerHTML = ads.map(ad => `
        <div class="pending-ad-card">
            <div class="pending-ad-header">
                <div>
                    <div class="pending-ad-title">${escapeHtml(ad.title)}</div>
                    <div class="pending-ad-meta">
                        💰 ${formatPrice(ad.price)} • 👤 ${escapeHtml(ad.first_name)} • 📅 ${formatDate(ad.created_at)}
                    </div>
                </div>
            </div>
            ${ad.description ? `<div class="pending-ad-description">${escapeHtml(ad.description.substring(0, 200))}${ad.description.length > 200 ? '...' : ''}</div>` : ''}
            <div class="pending-ad-actions">
                <button class="btn-approve" onclick="approveAd(${ad.id})">
                    <i class="fas fa-check"></i> Approve
                </button>
                <button class="btn-reject" onclick="rejectAd(${ad.id})">
                    <i class="fas fa-times"></i> Reject
                </button>
            </div>
        </div>
    `).join('');
}

async function loadReports() {
    try {
        const response = await fetch(`/api/moderator/reports?telegram_id=${currentUser.telegram_id}`);
        if (response.ok) {
            const reports = await response.json();
            displayReports(reports);
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки жалоб:', error);
        document.getElementById('reports-list').innerHTML = '<div class="loading-placeholder">Error loading reports</div>';
    }
}

function displayReports(reports) {
    const container = document.getElementById('reports-list');
    
    if (!reports || reports.length === 0) {
        container.innerHTML = '<div class="loading-placeholder">No reports</div>';
        return;
    }
    
    container.innerHTML = reports.map(report => `
        <div class="report-card">
            <div class="report-header">
                <div>
                    <div class="report-title">${escapeHtml(report.ad_title)}</div>
                    <div class="report-meta">
                        👤 ${escapeHtml(report.reporter_name)} • 📅 ${formatDate(report.created_at)}
                    </div>
                </div>
            </div>
            <div class="report-reason">
                <strong>Reason:</strong> ${escapeHtml(report.reason)}
            </div>
            ${report.description ? `<div class="report-description">${escapeHtml(report.description)}</div>` : ''}
            <div class="report-actions">
                <button class="btn-approve" onclick="viewReportedAd(${report.ad_id})">
                    <i class="fas fa-eye"></i> View Ad
                </button>
                <button class="btn-reject" onclick="dismissReport(${report.id})">
                    <i class="fas fa-check"></i> Dismiss
                </button>
            </div>
        </div>
    `).join('');
}

async function approveAd(adId) {
    try {
        const response = await fetch(`/api/moderator/approve-ad/${adId}?telegram_id=${currentUser.telegram_id}`, {
            method: 'POST'
        });
        
        const result = await response.json();
        if (result.success) {
            showNotification('Advertisement approved', 'success');
            await loadPendingAds();
            await loadModeratorStats();
        } else {
            showNotification('Error approving ad', 'error');
        }
    } catch (error) {
        console.error('❌ Ошибка одобрения:', error);
        showNotification('Error approving ad', 'error');
    }
}

async function rejectAd(adId) {
    const reason = prompt('Enter rejection reason (optional):');
    
    try {
        const response = await fetch(`/api/moderator/reject-ad/${adId}?telegram_id=${currentUser.telegram_id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason: reason || '' })
        });
        
        const result = await response.json();
        if (result.success) {
            showNotification('Advertisement rejected', 'success');
            await loadPendingAds();
            await loadModeratorStats();
        } else {
            showNotification('Error rejecting ad', 'error');
        }
    } catch (error) {
        console.error('❌ Ошибка отклонения:', error);
        showNotification('Error rejecting ad', 'error');
    }
}

async function viewReportedAd(adId) {
    await openAd(adId);
}

async function dismissReport(reportId) {
    try {
        // Здесь можно добавить API для отклонения жалобы
        showNotification('Report dismissed', 'success');
        await loadReports();
    } catch (error) {
        console.error('❌ Ошибка отклонения жалобы:', error);
        showNotification('Error dismissing report', 'error');
    }
}

function refreshPendingAds() {
    loadPendingAds();
}

function refreshReports() {
    loadReports();
}

// Функции для "Моих объявлений"
let currentStatusFilter = 'all';

async function loadMyAds() {
    if (!currentUser) {
        document.getElementById('my-ads-list').innerHTML = '<div class="loading-placeholder">Please login to view your advertisements</div>';
        return;
    }
    
    try {
        const response = await fetch(`/api/ads?user_id=${currentUser.id}`);
        if (response.ok) {
            const ads = await response.json();
            displayMyAds(ads);
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки моих объявлений:', error);
        document.getElementById('my-ads-list').innerHTML = '<div class="loading-placeholder">Error loading advertisements</div>';
    }
}

function displayMyAds(ads) {
    const container = document.getElementById('my-ads-list');
    
    if (!ads || ads.length === 0) {
        container.innerHTML = '<div class="loading-placeholder">You have no advertisements yet</div>';
        return;
    }
    
    // Фильтруем по статусу
    const filteredAds = currentStatusFilter === 'all' 
        ? ads 
        : ads.filter(ad => ad.status === currentStatusFilter);
    
    if (filteredAds.length === 0) {
        container.innerHTML = `<div class="loading-placeholder">No ${currentStatusFilter} advertisements</div>`;
        return;
    }
    
    container.innerHTML = filteredAds.map(ad => `
        <div class="my-ad-card ${ad.status}">
            <div class="my-ad-header">
                <div>
                    <div class="my-ad-title" onclick="openAd(${ad.id})">${escapeHtml(ad.title)}</div>
                    <div class="my-ad-meta">
                        <span>💰 ${formatPrice(ad.price)}</span>
                        <span>👁 ${ad.views || 0} views</span>
                        <span>📅 ${formatDate(ad.created_at)}</span>
                    </div>
                </div>
                <div class="my-ad-status ${ad.status}">${ad.status}</div>
            </div>
            ${ad.description ? `<div class="my-ad-description">${escapeHtml(ad.description.substring(0, 150))}${ad.description.length > 150 ? '...' : ''}</div>` : ''}
            <div class="my-ad-actions">
                <button class="my-ad-btn" onclick="openAd(${ad.id})">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="my-ad-btn edit" onclick="editAd(${ad.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="my-ad-btn delete" onclick="deleteAd(${ad.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
    
    // Добавляем обработчики для фильтров
    setupStatusFilters();
}

function setupStatusFilters() {
    document.querySelectorAll('.status-filter').forEach(filter => {
        filter.addEventListener('click', function() {
            document.querySelectorAll('.status-filter').forEach(f => f.classList.remove('active'));
            this.classList.add('active');
            currentStatusFilter = this.dataset.status;
            loadMyAds();
        });
    });
}

function editAd(adId) {
    showNotification('Edit functionality coming soon', 'info');
}

async function deleteAd(adId) {
    if (!confirm('Are you sure you want to delete this advertisement?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/ads/${adId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showNotification('Advertisement deleted', 'success');
            await loadMyAds();
            await loadAds(); // Обновляем основной список
        } else {
            showNotification('Error deleting advertisement', 'error');
        }
    } catch (error) {
        console.error('❌ Ошибка удаления объявления:', error);
        showNotification('Error deleting advertisement', 'error');
    }
}

// Функции для избранного

async function loadFavorites() {
    if (!currentUser) {
        document.getElementById('favorites-list').innerHTML = '<div class="loading-placeholder">Пожалуйста авторизуйтесь</div>';
        return;
    }
    
    try {
        const response = await fetch(`/api/favorites/${currentUser.id}`);
        if (response.ok) {
            const data = await response.json();
            favorites = data.favorites || [];
            displayFavorites();
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки избранного:', error);
        document.getElementById('favorites-list').innerHTML = '<div class="loading-placeholder">Ошибка загрузки</div>';
    }
}

function displayFavorites() {
    const container = document.getElementById('favorites-list');
    const emptyState = document.getElementById('empty-favorites');
    const countElement = document.getElementById('favorites-count');
    
    countElement.textContent = favorites.length;
    
    if (!favorites || favorites.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    container.style.display = 'grid';
    emptyState.style.display = 'none';
    
    container.innerHTML = favorites.map(ad => `
        <div class="favorite-card" onclick="openAd(${ad.id})">
            <div class="favorite-header">
                <div>
                    <div class="favorite-title">${escapeHtml(ad.title)}</div>
                    <div class="favorite-meta">
                        <span>👁 ${ad.views || 0} просмотров</span>
                        <span>📅 ${formatDate(ad.created_at)}</span>
                    </div>
                </div>
                <div class="favorite-price">${formatPrice(ad.price)}</div>
            </div>
            ${ad.description ? `<div class="favorite-description">${escapeHtml(ad.description.substring(0, 150))}${ad.description.length > 150 ? '...' : ''}</div>` : ''}
            <div class="favorite-actions">
                <button class="favorite-btn" onclick="event.stopPropagation(); openAd(${ad.id})">
                    <i class="fas fa-eye"></i> Посмотреть
                </button>
                <button class="favorite-btn remove" onclick="event.stopPropagation(); removeFromFavorites(${ad.id})">
                    <i class="fas fa-heart"></i> Удалить
                </button>
            </div>
        </div>
    `).join('');
}

async function toggleFavorite() {
    if (!currentUser || !currentAd) {
        showNotification('Сначала авторизуйтесь', 'error');
        return;
    }
    
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
        
        const result = await response.json();
        
        if (result.success) {
            const isFavorite = result.action === 'added';
            
            // Обновляем кнопку в модальном окне
            const favoriteBtn = document.querySelector('#modal-actions .action-btn.secondary');
            if (favoriteBtn) {
                favoriteBtn.innerHTML = `<i class="fas fa-heart"></i> ${isFavorite ? 'В избранном' : 'В избранное'}`;
                favoriteBtn.classList.toggle('active', isFavorite);
            }
            
            // Обновляем список избранного если на этой вкладке
            if (document.getElementById('favorites-tab').style.display !== 'none') {
                await loadFavorites();
            }
            
            showNotification(isFavorite ? 'Добавлено в избранное' : 'Удалено из избранного', 'success');
        }
        
    } catch (error) {
        console.error('❌ Ошибка управления избранным:', error);
        showNotification('Ошибка управления избранным', 'error');
    }
}

async function removeFromFavorites(adId) {
    if (!currentUser) {
        showNotification('Сначала авторизуйтесь', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/favorites', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: currentUser.id,
                ad_id: adId
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Удалено из избранного', 'success');
            await loadFavorites();
        }
        
    } catch (error) {
        console.error('❌ Ошибка удаления из избранного:', error);
        showNotification('Ошибка удаления из избранного', 'error');
    }
}

function updateFavoriteButton() {
    if (!currentAd || !currentUser) return;
    
    const isFavorite = favorites.some(fav => fav.id === currentAd.id);
    const favoriteBtn = document.querySelector('#modal-actions .action-btn.secondary');
    
    if (favoriteBtn) {
        favoriteBtn.innerHTML = `<i class="fas fa-heart"></i> ${isFavorite ? 'В избранном' : 'В избранное'}`;
        favoriteBtn.classList.toggle('active', isFavorite);
    }
}

console.log('🎉 Lavka26 готов к работе!');

c o n s o l e . l o g ( ' <؉�  L a v k a 2 6   3>B>2  :  @01>B5! ' ) ;  
  
 i f   ( d o c u m e n t . r e a d y S t a t e   = = =   ' l o a d i n g ' )   {  
         d o c u m e n t . a d d E v e n t L i s t e n e r ( ' D O M C o n t e n t L o a d e d ' ,   i n i t i a l i z e A p p ) ;  
 }   e l s e   {  
         i n i t i a l i z e A p p ( ) ;  
 }  
 