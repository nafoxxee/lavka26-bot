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
    document.getElementById('loading').style.display = 'none';
    document.getElementById('content').style.display = 'block';
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
    document.getElementById('create-ad-modal').style.display = 'flex';
}

function showNotification(message, type = 'info') {
    console.log(message);
}

function getUserDataWithTimeout() {
    const tgUser = tg.initDataUnsafe.user;
    if (tgUser) {
        currentUser = tgUser;
        document.getElementById('user-name-display').textContent = tgUser.first_name;
        if (tg.MainButton) {
            tg.MainButton.show();
        }
    } else {
        document.getElementById('user-name-display').textContent = 'Гость';
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}