// Lavka26 Mini App - Полноценный функционал как у Авито
let tg = window.Telegram.WebApp;

// Глобальные переменные
let currentUser = null;
let currentAd = null;
let ads = [];
let categories = [];
let favorites = [];
let navigationHistory = ['feed']; // История навигации
let currentFilter = {
    category: '',
    search: '',
    sort: 'date',
    priceMin: '',
    priceMax: '',
    location: '',
    withPhotos: false
};

// API URL
const API_BASE = window.location.hostname === 'localhost' 
    ? 'http://localhost:3001/api' 
    : 'https://lavka26-backend-rmr1.onrender.com/api';

// Инициализация приложения
function initializeApp() {
    console.log('🚀 Запуск Lavka26 Mini App...');
    showContent();
    setupTelegramWebApp();
    setupEventListeners();
    getUserDataWithTimeout();
    loadCategories();
    loadAds();
    checkAdminAccess();
    setupGeolocation();
    console.log('✅ Инициализация завершена');
}

// Показать контент
function showContent() {
    const loadingElement = document.getElementById('loading');
    const contentElement = document.getElementById('content');
    
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
    if (contentElement) {
        contentElement.style.display = 'block';
    }
}

// Настройка Telegram Web App
function setupTelegramWebApp() {
    tg.ready();
    tg.expand();
    tg.setHeaderColor('#ffffff');
    tg.setBackgroundColor('#f8f8f8');
    tg.MainButton.setText('Создать объявление');
    tg.MainButton.color = '#0089D1';
    tg.MainButton.textColor = '#ffffff';
    tg.MainButton.onClick(() => openCreateAd());
    tg.MainButton.hide();
    
    // Добавляем обработчик жеста "назад"
    tg.onEvent('backButtonClicked', () => {
        goBack();
    });
    
    // Показываем кнопку назад если нужно
    tg.BackButton.onClick(() => {
        goBack();
    });
    tg.BackButton.hide();
}

// Установка обработчиков событий
function setupEventListeners() {
    // Навигация
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            switchTab(tabName);
        });
    });

    // Категории
    document.querySelectorAll('.category-item').forEach(item => {
        item.addEventListener('click', function() {
            document.querySelectorAll('.category-item').forEach(cat => cat.classList.remove('active'));
            this.classList.add('active');
            currentFilter.category = this.dataset.category;
            loadAds();
        });
    });

    // Сортировка
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter.sort = this.dataset.sort;
            loadAds();
        });
    });

    // Вид отображения
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const view = this.dataset.view;
            const container = document.getElementById('ads-list');
            container.className = view === 'list' ? 'ads-container list-view' : 'ads-container';
        });
    });

    // Поиск
    const searchInput = document.getElementById('search-input');
    const searchCategory = document.getElementById('search-category');
    const categoryFilter = document.getElementById('category-filter');
    
    if (searchInput) {
        // Показываем категорию при фокусе на поиске
        searchInput.addEventListener('focus', function() {
            if (categoryFilter) {
                categoryFilter.style.display = 'block';
            }
        });
        
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentFilter.search = this.value;
                currentFilter.category = searchCategory ? searchCategory.value : '';
                loadAds();
            }, 500);
        });
    }
    
    if (searchCategory) {
        searchCategory.addEventListener('change', function() {
            currentFilter.category = this.value;
            loadAds();
        });
    }

    // Форма создания объявления
    const createForm = document.getElementById('create-ad-form');
    if (createForm) {
        createForm.addEventListener('submit', function(e) {
            e.preventDefault();
            publishAd();
        });
    }

    // Счетчики символов
    const titleInput = document.getElementById('ad-title-input');
    const descInput = document.getElementById('ad-description-input');
    
    if (titleInput) {
        titleInput.addEventListener('input', function() {
            document.getElementById('title-counter').textContent = this.value.length;
        });
    }
    
    if (descInput) {
        descInput.addEventListener('input', function() {
            document.getElementById('desc-counter').textContent = this.value.length;
        });
    }

    // Загрузка изображений
    const imagesInput = document.getElementById('ad-images-input');
    if (imagesInput) {
        imagesInput.addEventListener('change', handleImageUpload);
    }
}

// Переключение вкладок
function switchTab(tabName) {
    // Добавляем в историю навигации
    if (navigationHistory[navigationHistory.length - 1] !== tabName) {
        navigationHistory.push(tabName);
    }
    
    // Обновляем заголовок и кнопку назад
    updateHeader(tabName);
    
    // Скрываем все вкладки
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    
    // Убираем активный класс с навигации
    document.querySelectorAll('.tabbar-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Показываем выбранную вкладку
    const tabElement = document.getElementById(tabName + '-tab');
    if (tabElement) {
        tabElement.style.display = 'block';
    }
    
    // Активируем кнопку навигации
    const activeBtn = document.querySelector(`.tabbar-item[data-tab="${tabName}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // Загружаем данные для вкладки
    switch(tabName) {
        case 'favorites':
            loadFavorites();
            break;
        case 'my-ads':
            loadMyAds();
            break;
        case 'profile':
            loadProfile();
            break;
        case 'moderator':
            if (currentUser && currentUser.id === 1) { // Пример проверки модератора
                loadModeratorPanel();
            }
            break;
    }
}

// Обновление заголовка
function updateHeader(tabName) {
    const headerTitle = document.getElementById('header-title');
    const backBtn = document.getElementById('back-btn');
    
    const titles = {
        'feed': 'Lavka26',
        'categories': 'Категории',
        'favorites': 'Избранное',
        'profile': 'Профиль',
        'messages': 'Сообщения',
        'my-ads': 'Мои объявления',
        'admin': 'Панель администратора'
    };
    
    if (headerTitle) {
        headerTitle.textContent = titles[tabName] || 'Lavka26';
    }
    
    // Показываем/скрываем кнопку назад
    const showBack = navigationHistory.length > 1;
    if (backBtn) {
        backBtn.style.display = showBack ? 'flex' : 'none';
    }
    
    // Показываем/скрываем кнопку назад в Telegram
    if (tg && tg.BackButton) {
        if (showBack) {
            tg.BackButton.show();
        } else {
            tg.BackButton.hide();
        }
    }
}

// Функция возврата назад
function goBack() {
    if (navigationHistory.length > 1) {
        // Удаляем текущую страницу из истории
        navigationHistory.pop();
        // Получаем предыдущую страницу
        const previousTab = navigationHistory[navigationHistory.length - 1];
        // Переключаемся на неё без добавления в историю
        navigationHistory.pop(); // Удаляем чтобы не дублировать
        switchTab(previousTab);
    } else {
        // Если история пустая, закрываем приложение
        if (tg) {
            tg.close();
        }
    }
}

// Фильтрация по категориям
function filterByCategory(category) {
    currentFilter.category = category;
    // Переключаемся на главную страницу с фильтром
    switchTab('feed');
    // Показываем уведомление
    showNotification(`Категория: ${getCategoryName(category)}`, 'info');
    // Загружаем объявления с фильтром
    loadAds();
}

// Получение названия категории
function getCategoryName(category) {
    const categories = {
        'transport': 'Транспорт',
        'electronics': 'Электроника',
        'property': 'Недвижимость',
        'clothing': 'Одежда',
        'jobs': 'Работа',
        'sports': 'Спорт',
        'furniture': 'Мебель',
        'pets': 'Животные',
        'services': 'Услуги',
        'food': 'Продукты',
        'books': 'Книги',
        'other': 'Другое'
    };
    return categories[category] || 'Все категории';
}

// Получение данных пользователя
async function getUserDataWithTimeout() {
    const tgUser = tg.initDataUnsafe.user;
    const userDisplayElement = document.getElementById('user-name-display');
    
    if (tgUser) {
        try {
            // Регистрируем/получаем пользователя в базе
            const response = await fetch(`${API_BASE}/user/${tgUser.id}`);
            const userData = await response.json();
            currentUser = userData;
            
            if (userDisplayElement) {
                userDisplayElement.textContent = userData.first_name || tgUser.first_name;
            }
            
            if (tg.MainButton) {
                tg.MainButton.show();
            }
        } catch (error) {
            console.error('Ошибка получения данных пользователя:', error);
            currentUser = tgUser;
            if (userDisplayElement) {
                userDisplayElement.textContent = tgUser.first_name;
            }
        }
    } else {
        if (userDisplayElement) {
            userDisplayElement.textContent = 'Гость';
        }
    }
}

// Загрузка категорий
async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE}/categories`);
        categories = await response.json();
        console.log('Категории загружены:', categories);
    } catch (error) {
        console.error('Ошибка загрузки категорий:', error);
    }
}

// Загрузка объявлений
async function loadAds() {
    const adsList = document.getElementById('ads-grid');
    if (!adsList) return;
    
    // Показываем скелетон
    adsList.innerHTML = `
        <div class="loading-placeholder">
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
        </div>
    `;
    
    try {
        const params = new URLSearchParams();
        if (currentFilter.category) params.append('category', currentFilter.category);
        if (currentFilter.search) params.append('search', currentFilter.search);
        if (currentFilter.sort) params.append('sort', currentFilter.sort);
        if (currentFilter.priceMin) params.append('priceMin', currentFilter.priceMin);
        if (currentFilter.priceMax) params.append('priceMax', currentFilter.priceMax);
        if (currentFilter.location) params.append('location', currentFilter.location);
        if (currentFilter.withPhotos) params.append('withPhotos', 'true');
        
        const response = await fetch(`${API_BASE}/ads?${params}`);
        ads = await response.json();
        
        renderAds(ads);
    } catch (error) {
        console.error('Ошибка загрузки объявлений:', error);
        adsList.innerHTML = '<div class="error-message">Ошибка загрузки объявлений</div>';
    }
}

// Отображение объявлений
function renderAds(adsToRender) {
    const adsList = document.getElementById('ads-grid');
    if (!adsList) return;
    
    if (adsToRender.length === 0) {
        adsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>Объявления не найдены</h3>
                <p>Попробуйте изменить параметры поиска</p>
            </div>
        `;
        return;
    }
    
    const adsHTML = adsToRender.map(ad => `
        <div class="ad-card" onclick="openAd(${ad.id})">
            <div class="ad-image">
                ${ad.images && ad.images.length > 0 
                    ? `<img src="${ad.images[0]}" alt="${ad.title}">` 
                    : `<div class="no-image"><i class="fas fa-image"></i></div>`
                }
                <button class="favorite-btn ${isFavorite(ad.id) ? 'active' : ''}" 
                        onclick="toggleFavorite(event, ${ad.id})">
                    <i class="fas fa-heart"></i>
                </button>
            </div>
            <div class="ad-content">
                <div class="ad-price">${formatPrice(ad.price)} ₽</div>
                <h3 class="ad-title">${escapeHtml(ad.title)}</h3>
                <p class="ad-description">${escapeHtml(ad.description || '').substring(0, 100)}...</p>
                <div class="ad-meta">
                    <span class="ad-location">
                        <i class="fas fa-map-marker-alt"></i>
                        ${ad.location || 'Местоположение не указано'}
                    </span>
                    <span class="ad-date">${formatDate(ad.created_at)}</span>
                </div>
            </div>
        </div>
    `).join('');
    
    adsList.innerHTML = adsHTML;
}

// Открытие объявления
async function openAd(adId) {
    try {
        const response = await fetch(`${API_BASE}/ads/${adId}`);
        const ad = await response.json();
        currentAd = ad;
        
        // Увеличиваем просмотры
        await fetch(`${API_BASE}/ads/${adId}/view`, { method: 'POST' });
        
        showAdModal(ad);
    } catch (error) {
        console.error('Ошибка загрузки объявления:', error);
        showNotification('Ошибка загрузки объявления', 'error');
    }
}

// Показать модальное окно объявления
function showAdModal(ad) {
    const modal = document.getElementById('ad-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    if (!modal || !modalTitle || !modalBody) return;
    
    modalTitle.textContent = ad.title;
    
    const imagesHTML = ad.images && ad.images.length > 0 
        ? `
            <div class="ad-gallery">
                ${ad.images.map(img => `<img src="${img}" alt="${ad.title}">`).join('')}
            </div>
        `
        : `<div class="no-image-large"><i class="fas fa-image"></i></div>`;
    
    modalBody.innerHTML = `
        ${imagesHTML}
        <div class="ad-details">
            <div class="ad-price-large">${formatPrice(ad.price)} ₽</div>
            <div class="ad-meta-info">
                <span class="ad-location">
                    <i class="fas fa-map-marker-alt"></i>
                    ${ad.location || 'Местоположение не указано'}
                </span>
                <span class="ad-date">${formatDate(ad.created_at)}</span>
                <span class="ad-views">
                    <i class="fas fa-eye"></i>
                    ${ad.views || 0} просмотров
                </span>
            </div>
            <div class="ad-description-full">
                <h4>Описание</h4>
                <p>${escapeHtml(ad.description || 'Описание отсутствует')}</p>
            </div>
            <div class="ad-seller-info">
                <h4>Продавец</h4>
                <div class="seller-card">
                    <div class="seller-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="seller-details">
                        <div class="seller-name">${ad.user?.first_name || 'Продавец'}</div>
                        <div class="seller-rating">★ ${ad.user?.rating || '0.0'}</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
}

// Закрыть модальное окно
function closeModal() {
    const modal = document.getElementById('ad-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    currentAd = null;
}

// Показать все категории
function showAllCategories() {
    // Переключаемся на вкладку категорий
    switchTab('categories');
}

// Открыть создание объявления
function openCreateAd() {
    if (!currentUser) {
        showNotification('Сначала авторизуйтесь', 'error');
        return;
    }
    const modalElement = document.getElementById('create-ad-modal');
    if (modalElement) {
        modalElement.style.display = 'flex';
    } else {
        // Если модального окна нет, показываем уведомление
        showNotification('Создание объявления в разработке', 'info');
    }
}

// Закрыть модальное окно создания
function closeCreateAdModal() {
    const modalElement = document.getElementById('create-ad-modal');
    if (modalElement) {
        modalElement.style.display = 'none';
        document.getElementById('create-ad-form').reset();
        document.getElementById('image-preview-container').innerHTML = '';
    }
}

// Публикация объявления
async function publishAd() {
    if (!currentUser) {
        showNotification('Сначала авторизуйтесь', 'error');
        return;
    }
    
    const form = document.getElementById('create-ad-form');
    const formData = new FormData(form);
    
    const adData = {
        title: formData.get('title'),
        description: formData.get('description'),
        price: parseFloat(formData.get('price')),
        category_id: parseInt(formData.get('category')),
        location: formData.get('location'),
        contact_info: JSON.stringify({
            show_phone: document.getElementById('show-phone').checked,
            allow_messages: document.getElementById('allow-messages').checked
        })
    };
    
    // Валидация
    if (!adData.title || !adData.price || !adData.category_id) {
        showNotification('Заполните все обязательные поля', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/ads`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...adData,
                user_id: currentUser.id
            })
        });
        
        if (response.ok) {
            showNotification('Объявление успешно отправлено на модерацию', 'success');
            closeCreateAdModal();
            loadAds();
        } else {
            const error = await response.json();
            showNotification(error.message || 'Ошибка создания объявления', 'error');
        }
    } catch (error) {
        console.error('Ошибка создания объявления:', error);
        showNotification('Ошибка создания объявления', 'error');
    }
}

// Обработка загрузки изображений
function handleImageUpload(event) {
    const files = event.target.files;
    const container = document.getElementById('image-preview-container');
    
    if (!container) return;
    
    container.innerHTML = '';
    
    Array.from(files).forEach((file, index) => {
        if (index >= 5) return; // Максимум 5 фото
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.createElement('div');
            preview.className = 'image-preview';
            preview.innerHTML = `
                <img src="${e.target.result}" alt="Preview ${index + 1}">
                <button type="button" class="remove-image" onclick="removeImage(${index})">
                    <i class="fas fa-times"></i>
                </button>
            `;
            container.appendChild(preview);
        };
        reader.readAsDataURL(file);
    });
}

// Удалить изображение из предпросмотра
function removeImage(index) {
    const container = document.getElementById('image-preview-container');
    const previews = container.querySelectorAll('.image-preview');
    if (previews[index]) {
        previews[index].remove();
    }
}

// Переключение избранного
async function toggleFavorite(event, adId) {
    event.stopPropagation();
    
    if (!currentUser) {
        showNotification('Сначала авторизуйтесь', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/favorites`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: currentUser.id,
                ad_id: adId
            })
        });
        
        if (response.ok) {
            const btn = event.currentTarget;
            btn.classList.toggle('active');
            showNotification(
                btn.classList.contains('active') ? 'Добавлено в избранное' : 'Удалено из избранного',
                'success'
            );
        }
    } catch (error) {
        console.error('Ошибка управления избранным:', error);
        showNotification('Ошибка управления избранным', 'error');
    }
}

// Проверка избранного
function isFavorite(adId) {
    return favorites.some(fav => fav.ad_id === adId);
}

// Загрузка избранного
async function loadFavorites() {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`${API_BASE}/favorites/${currentUser.id}`);
        favorites = await response.json();
        renderFavorites();
    } catch (error) {
        console.error('Ошибка загрузки избранного:', error);
    }
}

// Отображение избранного
function renderFavorites() {
    const favoritesList = document.getElementById('favorites-list');
    const emptyState = document.getElementById('empty-favorites');
    const countElement = document.getElementById('favorites-count');
    
    if (!favoritesList) return;
    
    if (countElement) {
        countElement.textContent = favorites.length;
    }
    
    if (favorites.length === 0) {
        favoritesList.innerHTML = '';
        if (emptyState) {
            emptyState.style.display = 'block';
        }
        return;
    }
    
    if (emptyState) {
        emptyState.style.display = 'none';
    }
    
    const adsHTML = favorites.map(fav => `
        <div class="ad-card" onclick="openAd(${fav.ad_id})">
            <div class="ad-image">
                ${fav.ad.images && fav.ad.images.length > 0 
                    ? `<img src="${fav.ad.images[0]}" alt="${fav.ad.title}">` 
                    : `<div class="no-image"><i class="fas fa-image"></i></div>`
                }
                <button class="favorite-btn active" onclick="toggleFavorite(event, ${fav.ad_id})">
                    <i class="fas fa-heart"></i>
                </button>
            </div>
            <div class="ad-content">
                <div class="ad-price">${formatPrice(fav.ad.price)} ₽</div>
                <h3 class="ad-title">${escapeHtml(fav.ad.title)}</h3>
                <div class="ad-meta">
                    <span class="ad-date">${formatDate(fav.ad.created_at)}</span>
                </div>
            </div>
        </div>
    `).join('');
    
    favoritesList.innerHTML = adsHTML;
}

// Загрузка моих объявлений
async function loadMyAds() {
    if (!currentUser) return;
    
    const myAdsList = document.getElementById('my-ads-list');
    if (!myAdsList) return;
    
    try {
        const response = await fetch(`${API_BASE}/ads/user/${currentUser.id}`);
        const myAds = await response.json();
        
        if (myAds.length === 0) {
            myAdsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-ad"></i>
                    <h3>У вас пока нет объявлений</h3>
                    <p>Создайте свое первое объявление</p>
                    <button class="btn-primary" onclick="openCreateAd()">
                        <i class="fas fa-plus"></i> Создать объявление
                    </button>
                </div>
            `;
            return;
        }
        
        const adsHTML = myAds.map(ad => `
            <div class="my-ad-card">
                <div class="my-ad-image">
                    ${ad.images && ad.images.length > 0 
                        ? `<img src="${ad.images[0]}" alt="${ad.title}">` 
                        : `<div class="no-image"><i class="fas fa-image"></i></div>`
                    }
                </div>
                <div class="my-ad-content">
                    <div class="my-ad-header">
                        <h4>${escapeHtml(ad.title)}</h4>
                        <span class="status-badge status-${ad.status}">${getStatusText(ad.status)}</span>
                    </div>
                    <div class="my-ad-price">${formatPrice(ad.price)} ₽</div>
                    <div class="my-ad-meta">
                        <span class="ad-views">
                            <i class="fas fa-eye"></i>
                            ${ad.views || 0} просмотров
                        </span>
                        <span class="ad-date">${formatDate(ad.created_at)}</span>
                    </div>
                    <div class="my-ad-actions">
                        <button class="btn-secondary" onclick="editAd(${ad.id})">
                            <i class="fas fa-edit"></i> Редактировать
                        </button>
                        <button class="btn-danger" onclick="deleteAd(${ad.id})">
                            <i class="fas fa-trash"></i> Удалить
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
        myAdsList.innerHTML = adsHTML;
    } catch (error) {
        console.error('Ошибка загрузки моих объявлений:', error);
        myAdsList.innerHTML = '<div class="error-message">Ошибка загрузки объявлений</div>';
    }
}

// Загрузка профиля
function loadProfile() {
    if (!currentUser) return;
    
    const profileName = document.getElementById('profile-name');
    const profileUsername = document.getElementById('profile-username');
    const profileAdsCount = document.getElementById('profile-ads-count');
    const profileRating = document.getElementById('profile-rating');
    const profileJoined = document.getElementById('profile-joined');
    
    if (profileName) profileName.textContent = currentUser.first_name || 'Пользователь';
    if (profileUsername) profileUsername.textContent = currentUser.username ? `@${currentUser.username}` : '@username';
    if (profileAdsCount) profileAdsCount.textContent = '0'; // Загрузить реальное количество
    if (profileRating) profileRating.textContent = currentUser.rating?.toFixed(1) || '0.0';
    if (profileJoined) profileJoined.textContent = formatDate(currentUser.created_at);
}

// Открыть фильтры
function openFilters() {
    const modal = document.getElementById('filters-modal');
    if (modal) {
        modal.style.display = 'flex';
        // Заполняем текущие значения фильтров
        document.getElementById('price-min').value = currentFilter.priceMin || '';
        document.getElementById('price-max').value = currentFilter.priceMax || '';
        document.getElementById('location').value = currentFilter.location || '';
        document.getElementById('with-photos').checked = currentFilter.withPhotos;
    }
}

// Закрыть фильтры
function closeFilters() {
    const modal = document.getElementById('filters-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Применить фильтры
function applyFilters() {
    currentFilter.priceMin = document.getElementById('price-min').value;
    currentFilter.priceMax = document.getElementById('price-max').value;
    currentFilter.location = document.getElementById('location').value;
    currentFilter.withPhotos = document.getElementById('with-photos').checked;
    
    closeFilters();
    loadAds();
}

// Сбросить фильтры
function resetFilters() {
    currentFilter = {
        category: '',
        search: '',
        sort: 'date',
        priceMin: '',
        priceMax: '',
        location: '',
        withPhotos: false
    };
    
    document.getElementById('price-min').value = '';
    document.getElementById('price-max').value = '';
    document.getElementById('location').value = '';
    document.getElementById('with-photos').checked = false;
    document.getElementById('search-input').value = '';
    
    document.querySelectorAll('.category-item').forEach(cat => cat.classList.remove('active'));
    document.querySelector('.category-item[data-category=""]').classList.add('active');
    
    closeFilters();
    loadAds();
}

// Связаться с продавцом
function contactSeller() {
    if (!currentAd || !currentUser) {
        showNotification('Ошибка: данные не загружены', 'error');
        return;
    }
    
    // В Telegram Web App можно открыть чат с пользователем
    if (currentAd.user?.username) {
        tg.openTelegramLink(`https://t.me/${currentAd.user.username}`);
    } else {
        showNotification('Продавец не указал контактные данные', 'error');
    }
}

// Поделиться объявлением
function shareAd() {
    if (!currentAd) return;
    
    const shareText = `${currentAd.title}\n${currentAd.description}\nЦена: ${formatPrice(currentAd.price)} ₽\n\n${window.location.href}`;
    
    if (tg.shareURL) {
        tg.shareURL(window.location.href);
    } else {
        navigator.clipboard.writeText(shareText);
        showNotification('Ссылка скопирована в буфер обмена', 'success');
    }
}

// Утилиты
function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU').format(price);
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

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getStatusText(status) {
    const statuses = {
        'pending': 'На модерации',
        'active': 'Активно',
        'rejected': 'Отклонено',
        'sold': 'Продано'
    };
    return statuses[status] || status;
}

function showNotification(message, type = 'info') {
    const notifications = document.getElementById('notifications');
    if (!notifications) return;
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    notifications.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Дополнительные функции для модераторской панели
function refreshPendingAds() {
    console.log('Обновление объявлений на модерации...');
    showNotification('Обновление объявлений...', 'info');
}

function refreshReports() {
    console.log('Обновление жалоб...');
    showNotification('Обновление жалоб...', 'info');
}

function refreshSupportMessages() {
    console.log('Обновление сообщений поддержки...');
    showNotification('Обновление сообщений поддержки...', 'info');
}

function refreshPayments() {
    console.log('Обновление платежей...');
    showNotification('Обновление платежей...', 'info');
}

function refreshUsers() {
    console.log('Обновление пользователей...');
    showNotification('Обновление пользователей...', 'info');
}

function editAd(adId) {
    console.log('Редактирование объявления:', adId);
    showNotification('Функция редактирования в разработке', 'info');
}

function deleteAd(adId) {
    console.log('Удаление объявления:', adId);
    showNotification('Функция удаления в разработке', 'info');
}

function approveAd(adId) {
    console.log('Одобрение объявления:', adId);
    showNotification('Функция одобрения в разработке', 'info');
}

function rejectAd(adId) {
    console.log('Отклонение объявления:', adId);
    showNotification('Функция отклонения в разработке', 'info');
}

function editProfile() {
    console.log('Редактирование профиля...');
    showNotification('Функция редактирования профиля в разработке', 'info');
}

// Тестовая функция для отладки
function testFunction() {
    console.log('🧪 Тестовая функция вызвана!');
    alert('Кнопки работают! JavaScript загружен правильно.');
    
    // Проверим основные функции
    console.log('Доступные функции:', {
        openCreateAd: typeof window.openCreateAd,
        switchTab: typeof window.switchTab,
        loadAds: typeof window.loadAds,
        showNotification: typeof window.showNotification
    });
}

// Глобальные функции для доступа из HTML
window.openCreateAd = openCreateAd;
window.closeCreateAdModal = closeCreateAdModal;
window.publishAd = publishAd;
window.openAd = openAd;
window.closeModal = closeModal;
// Проверка доступа админа
function checkAdminAccess() {
    const tgUser = tg.initDataUnsafe.user;
    console.log('Проверка админа:', tgUser?.id, 'ожидаем: 379036860');
    
    if (tgUser && tgUser.id === 379036860) {
        console.log('✅ Админ обнаружен!');
        // Инициализируем currentUser если еще не установлен
        if (!currentUser) {
            currentUser = tgUser;
        }
        currentUser.isAdmin = true;
        showAdminInterface();
    } else {
        console.log('❌ Не админ:', tgUser?.id);
    }
}

// Показать админский интерфейс
function showAdminInterface() {
    // Показываем админскую навигацию
    const mainTabbar = document.getElementById('main-tabbar');
    const adminTabbar = document.getElementById('admin-tabbar');
    
    if (mainTabbar) mainTabbar.style.display = 'none';
    if (adminTabbar) adminTabbar.style.display = 'flex';
    
    // Загружаем админские данные
    loadAdminStats();
}

// Загрузка админской статистики
async function loadAdminStats() {
    try {
        updateAdminStats(0, 0, 0); // Временно ставим нули
    } catch (error) {
        console.error('Ошибка загрузки админской статистики:', error);
    }
}

// Обновление админской статистики
function updateAdminStats(pending, support, payments) {
    const pendingCount = document.getElementById('pending-ads-count');
    const supportCount = document.getElementById('support-messages-count');
    const paymentsCount = document.getElementById('payments-count');
    
    if (pendingCount) pendingCount.textContent = pending;
    if (supportCount) supportCount.textContent = support;
    if (paymentsCount) paymentsCount.textContent = payments;
}

// Открытие админской панели
function openAdminPanel() {
    switchTab('admin');
}

// Выполнить поиск
function performSearch() {
    const searchInput = document.getElementById('search-input');
    const searchCategory = document.getElementById('search-category');
    
    if (searchInput) {
        currentFilter.search = searchInput.value;
    }
    if (searchCategory) {
        currentFilter.category = searchCategory.value;
    }
    
    loadAds();
    showNotification('Поиск выполнен', 'success');
}

// Показать секцию админки
function showAdminSection(section) {
    // Скрываем все секции
    document.querySelectorAll('.admin-section').forEach(sec => {
        sec.style.display = 'none';
    });
    
    // Убираем активный класс с кнопок
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Показываем выбранную секцию
    const targetSection = document.getElementById(`admin-${section}`);
    if (targetSection) {
        targetSection.style.display = 'block';
    }
    
    // Активируем кнопку
    event.target.closest('.admin-tab-btn').classList.add('active');
    
    // Загружаем данные для секции
    switch(section) {
        case 'pending':
            refreshPendingAds();
            break;
        case 'support':
            refreshSupportMessages();
            break;
        case 'payments':
            refreshPayments();
            break;
        case 'users':
            refreshUsers();
            break;
    }
}

// Настройка геолокации
function setupGeolocation() {
    if (tg && tg.requestLocation) {
        tg.requestLocation();
    }
}

// ЧАТЫ
let currentChat = null;

// Открыть чат
function openChat(userId, userName) {
    currentChat = { userId, userName };
    
    const chatList = document.getElementById('chat-list');
    const chatWindow = document.getElementById('chat-window');
    
    if (chatList) chatList.style.display = 'none';
    if (chatWindow) chatWindow.style.display = 'flex';
    
    // Обновляем информацию о пользователе в чате
    const chatUserName = document.querySelector('.chat-user-name');
    if (chatUserName) chatUserName.textContent = userName;
}

// Закрыть чат
function closeChat() {
    currentChat = null;
    
    const chatList = document.getElementById('chat-list');
    const chatWindow = document.getElementById('chat-window');
    
    if (chatList) chatList.style.display = 'block';
    if (chatWindow) chatWindow.style.display = 'none';
}

// Отправить сообщение
function sendMessage() {
    const input = document.getElementById('message-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Временно просто очищаем поле
    input.value = '';
    showNotification('Сообщение отправлено', 'success');
}

// УЛУЧЧЕННАЯ ЗАГРУЗКА ФОТО (до 20мб)
function handleImageUpload(event) {
    const files = event.target.files;
    const container = document.getElementById('image-preview-container');
    
    if (!container) return;
    
    container.innerHTML = '';
    
    Array.from(files).forEach((file, index) => {
        if (index >= 10) return; // Максимум 10 фото
        
        // Проверяем размер файла (20мб)
        if (file.size > 20 * 1024 * 1024) {
            showNotification(`Файл ${file.name} слишком большой (макс. 20мб)`, 'error');
            return;
        }
        
        // Проверяем тип файла
        if (!file.type.startsWith('image/')) {
            showNotification(`Файл ${file.name} не является изображением`, 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.createElement('div');
            preview.className = 'image-preview';
            preview.innerHTML = `
                <img src="${e.target.result}" alt="Preview ${index + 1}">
                <div class="image-info">
                    <span>${formatFileSize(file.size)}</span>
                </div>
                <button type="button" class="remove-image" onclick="removeImage(${index})">
                    <i class="fas fa-times"></i>
                </button>
            `;
            container.appendChild(preview);
        };
        reader.readAsDataURL(file);
    });
}

// Форматирование размера файла
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
}