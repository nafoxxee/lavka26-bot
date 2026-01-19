// Русские переводы для Lavka26
export const ru = {
  // Общие
  common: {
    loading: 'Загрузка...',
    error: 'Ошибка',
    success: 'Успешно',
    cancel: 'Отмена',
    save: 'Сохранить',
    delete: 'Удалить',
    edit: 'Редактировать',
    back: 'Назад',
    next: 'Далее',
    search: 'Поиск',
    filter: 'Фильтры',
    send: 'Отправить',
    close: 'Закрыть',
    confirm: 'Подтвердить',
    retry: 'Попробовать снова',
    refresh: 'Обновить',
  },

  // Навигация
  nav: {
    feed: 'Лента',
    search: 'Поиск',
    create: 'Создать',
    favorites: 'Избранное',
    chats: 'Чаты',
    profile: 'Профиль',
  },

  // Авторизация
  auth: {
    welcome: 'Добро пожаловать в Lavka26!',
    loggingIn: 'Авторизация...',
    loginError: 'Ошибка авторизации',
    telegramRequired: 'Это приложение работает только в Telegram',
    howToOpen: 'Как открыть приложение:',
    instructions: '1. Найдите бота @lavka26_bot в Telegram\n2. Нажмите /start\n3. Нажмите кнопку "Открыть Lavka26"',
  },

  // Объявления
  ads: {
    title: 'Объявления',
    create: 'Создать объявление',
    edit: 'Редактировать объявление',
    delete: 'Удалить объявление',
    myAds: 'Мои объявления',
    titlePlaceholder: 'Например: iPhone 13 Pro 256GB',
    descriptionPlaceholder: 'Опишите товар подробно...',
    pricePlaceholder: '0',
    locationPlaceholder: 'Москва, Центральный район',
    noAds: 'Объявления не найдены',
    noResults: 'Ничего не найдено',
    tryDifferentQuery: 'Попробуйте изменить поисковый запрос',
    boosted: 'Поднято',
    views: 'Просмотров',
    addedToFavorites: 'Добавлено в избранное',
    removedFromFavorites: 'Удалено из избранного',
    status: {
      draft: 'Черновик',
      pending: 'На модерации',
      active: 'Активно',
      blocked: 'Заблокировано',
      expired: 'Истекло',
    },
  },

  // Категории
  categories: {
    transport: 'Транспорт',
    realEstate: 'Недвижимость',
    electronics: 'Электроника',
    jobs: 'Работа',
    services: 'Услуги',
    personal: 'Личные вещи',
    hobbies: 'Хобби',
    animals: 'Животные',
    other: 'Другое',
  },

  // Чаты
  chats: {
    title: 'Чаты',
    noChats: 'У вас нет чатов',
    noChatsDesc: 'Начните общение с продавцами или покупателями',
    findAds: 'Найти объявления',
    writeMessage: 'Написать',
    messagePlaceholder: 'Написать сообщение...',
    sending: 'Отправляется...',
    newMessage: 'Новое сообщение',
    unread: 'Непрочитано',
    typing: 'печатает',
  },

  // Профиль
  profile: {
    title: 'Профиль',
    edit: 'Редактировать профиль',
    personalInfo: 'Личная информация',
    username: 'Имя пользователя',
    firstName: 'Имя',
    lastName: 'Фамилия',
    phone: 'Телефон',
    stats: 'Статистика',
    totalAds: 'Объявлений',
    activeAds: 'Активных',
    totalViews: 'Просмотров',
    favoritesCount: 'Избранное',
    chatsCount: 'Чатов',
    logout: 'Выйти',
    adminPanel: 'Админ панель',
    notSpecified: 'Не указано',
  },

  // Избранное
  favorites: {
    title: 'Избранное',
    noFavorites: 'У вас нет избранных объявлений',
    noFavoritesDesc: 'Добавляйте понравившиеся объявления, чтобы быстро находить их',
    goToFeed: 'Перейти к ленте',
  },

  // Создание объявления
  createAd: {
    title: 'Создать объявление',
    photos: 'Фотографии',
    addPhotos: 'Добавить фото',
    maxPhotos: 'Макс. 10',
    title: 'Заголовок',
    titleRequired: 'Заголовок обязателен',
    titleMinLength: 'Минимум 3 символа',
    titleMaxLength: 'Максимум 255 символов',
    category: 'Категория',
    selectCategory: 'Выберите категорию',
    price: 'Цена (₽)',
    priceRequired: 'Цена обязательна',
    priceNegative: 'Цена не может быть отрицательной',
    description: 'Описание',
    descriptionRequired: 'Описание обязательно',
    descriptionMinLength: 'Минимум 10 символов',
    descriptionMaxLength: 'Максимум 5000 символов',
    location: 'Местоположение',
    creating: 'Создание...',
    createSuccess: 'Объявление создано и отправлено на модерацию',
    addAtLeastOnePhoto: 'Добавьте хотя бы одно фото',
    invalidFileType: 'Неподдерживаемый формат файла',
    fileTooLarge: 'Файл слишком большой (макс. 5MB)',
    maxPhotosReached: 'Максимум 10 фотографий',
  },

  // Платежи
  payments: {
    title: 'Платежи',
    boostAd: 'Продвинуть объявление',
    boost24h: 'Поднять на 24 часа',
    boost72h: 'Поднять на 72 часа',
    price24h: '149 ₽',
    price72h: '299 ₽',
    paymentSuccess: 'Оплата прошла успешно! Ваше объявление поднято.',
    paymentError: 'Произошла ошибка при обработке платежа',
    processingPayment: 'Обработка платежа...',
  },

  // Админ панель
  admin: {
    title: 'Админ панель',
    accessDenied: 'Доступ запрещен',
    noAdminRights: 'У вас нет прав для доступа к админ панели',
    stats: 'Статистика',
    moderation: 'Модерация',
    users: 'Пользователи',
    payments: 'Платежи',
    totalUsers: 'Пользователей',
    totalAds: 'Объявлений',
    totalChats: 'Чатов',
    totalRevenue: 'Доход',
    pendingAds: 'Объявления на модерации',
    approve: 'Одобрить',
    reject: 'Отклонить',
    block: 'Заблокировать',
    view: 'Просмотр',
    reason: 'Укажите причину:',
    moderationSuccess: 'Действие выполнено',
    moderationError: 'Ошибка выполнения действия',
  },

  // Уведомления
  notifications: {
    newMessage: 'Новое сообщение',
    adApproved: 'Объявление одобрено',
    adRejected: 'Объявление отклонено',
    boostExpired: 'Срок поднятия объявления истек',
    loginSuccess: 'Добро пожаловать в Lavka26!',
    profileUpdated: 'Профиль обновлен',
    adCreated: 'Объявление создано',
    adUpdated: 'Объявление обновлено',
    adDeleted: 'Объявление удалено',
    chatCreated: 'Чат создан',
    messageSent: 'Сообщение отправлено',
    paymentProcessed: 'Платеж обработан',
  },

  // Ошибки
  errors: {
    networkError: 'Ошибка сети',
    serverError: 'Ошибка сервера',
    notFound: 'Не найдено',
    accessDenied: 'Доступ запрещен',
    validationError: 'Ошибка валидации',
    uploadError: 'Ошибка загрузки',
    paymentError: 'Ошибка платежа',
    unknownError: 'Неизвестная ошибка',
  },

  // Форматы времени
  time: {
    justNow: 'только что',
    minutesAgo: '{{count}} минут назад',
    hoursAgo: '{{count}} часов назад',
    daysAgo: '{{count}} дней назад',
    weeksAgo: '{{count}} недель назад',
    monthsAgo: '{{count}} месяцев назад',
    yearsAgo: '{{count}} лет назад',
  },
};

export default ru;
