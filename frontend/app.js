// Lavka26 Mini App
let tg = window.Telegram.WebApp;

let currentUser = null;
let currentAd = null;
let ads = [];

function initializeApp() {
    console.log('🚀 Запуск Lavka26 Mini App...');
    showContent();
    setupTelegramWebApp();
    setupEventListeners();
    getUserDataWithTimeout();
    console.log('✅ Инициализация завершена');
}

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
}

function setupEventListeners() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const activeBtn = document.querySelector(`.nav-item[data-tab="${tabName}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
}

function openCreateAd() {
    if (!currentUser) {
        showNotification('Сначала авторизуйтесь', 'error');
        return;
    }
    const modalElement = document.getElementById('create-ad-modal');
    if (modalElement) {
        modalElement.style.display = 'flex';
    }
}

function showNotification(message, type = 'info') {
    console.log(message);
}

function getUserDataWithTimeout() {
    const tgUser = tg.initDataUnsafe.user;
    const userDisplayElement = document.getElementById('user-name-display');
    
    if (tgUser) {
        currentUser = tgUser;
        if (userDisplayElement) {
            userDisplayElement.textContent = tgUser.first_name;
        }
        if (tg.MainButton) {
            tg.MainButton.show();
        }
    } else {
        if (userDisplayElement) {
            userDisplayElement.textContent = 'Гость';
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}