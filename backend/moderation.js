// Система модерации LAVKA26
const storage = require('./storage.js');

const MODERATOR_ID = '379036860'; // Telegram ID модератора

class ModerationService {
    constructor() {
        this.moderatorId = MODERATOR_ID;
    }

    // Проверка роли пользователя
    async getUserRole(telegramId) {
        if (telegramId === this.moderatorId) {
            return 'MODERATOR';
        }
        return 'USER';
    }

    // Проверка прав модератора
    async isModerator(telegramId) {
        const role = await this.getUserRole(telegramId);
        return role === 'MODERATOR';
    }

    // Проверка заблокирован ли пользователь
    async isUserBlocked(telegramId) {
        const users = await storage.getUsers();
        const user = users.find(u => u.id === telegramId);
        return user && user.blocked === true;
    }

    // Блокировка пользователя
    async blockUser(telegramId, moderatorId) {
        if (!(await this.isModerator(moderatorId))) {
            throw new Error('Доступ запрещен');
        }

        const users = await storage.getUsers();
        const userIndex = users.findIndex(u => u.id === telegramId);
        
        if (userIndex !== -1) {
            users[userIndex].blocked = true;
            users[userIndex].blocked_at = Date.now();
            users[userIndex].blocked_by = moderatorId;
            await storage.writeFile('users.json', users);
            return true;
        }
        
        return false;
    }

    // Разблокировка пользователя
    async unblockUser(telegramId, moderatorId) {
        if (!(await this.isModerator(moderatorId))) {
            throw new Error('Доступ запрещен');
        }

        const users = await storage.getUsers();
        const userIndex = users.findIndex(u => u.id === telegramId);
        
        if (userIndex !== -1) {
            delete users[userIndex].blocked;
            delete users[userIndex].blocked_at;
            delete users[userIndex].blocked_by;
            await storage.writeFile('users.json', users);
            return true;
        }
        
        return false;
    }

    // Получение объявлений на модерации
    async getPendingAds() {
        const ads = await storage.getAds();
        return ads.filter(ad => ad.status === 'pending');
    }

    // Одобрение объявления
    async approveAd(adId, moderatorId) {
        if (!(await this.isModerator(moderatorId))) {
            throw new Error('Доступ запрещен');
        }

        return await storage.updateAd(adId, {
            status: 'active',
            moderated_at: Date.now(),
            moderated_by: moderatorId
        });
    }

    // Отклонение объявления
    async rejectAd(adId, moderatorId, reason = '') {
        if (!(await this.isModerator(moderatorId))) {
            throw new Error('Доступ запрещен');
        }

        return await storage.updateAd(adId, {
            status: 'rejected',
            moderated_at: Date.now(),
            moderated_by: moderatorId,
            rejection_reason: reason
        });
    }

    // Удаление объявления (только модератор)
    async deleteAd(adId, moderatorId) {
        if (!(await this.isModerator(moderatorId))) {
            throw new Error('Доступ запрещен');
        }

        return await storage.deleteAd(adId);
    }

    // Получение всех объявлений (для модератора)
    async getAllAds() {
        const ads = await storage.getAds();
        return ads.sort((a, b) => b.created_at - a.created_at);
    }

    // Получение статистики модерации
    async getModerationStats() {
        const ads = await storage.getAds();
        const users = await storage.getUsers();
        
        return {
            total_ads: ads.length,
            pending_ads: ads.filter(ad => ad.status === 'pending').length,
            active_ads: ads.filter(ad => ad.status === 'active').length,
            rejected_ads: ads.filter(ad => ad.status === 'rejected').length,
            total_users: users.length,
            blocked_users: users.filter(u => u.blocked).length
        };
    }

    // Middleware для проверки прав в Express
    requireModerator() {
        return async (req, res, next) => {
            const telegramId = req.body.user_id || req.query.user_id || req.headers['x-user-id'];
            
            if (!telegramId) {
                return res.status(401).json({ error: 'Требуется авторизация' });
            }

            if (!(await this.isModerator(telegramId))) {
                return res.status(403).json({ error: 'Доступ запрещен' });
            }

            next();
        };
    }

    // Middleware для проверки блокировки
    requireNotBlocked() {
        return async (req, res, next) => {
            const telegramId = req.body.user_id || req.query.user_id || req.headers['x-user-id'];
            
            if (!telegramId) {
                return res.status(401).json({ error: 'Требуется авторизация' });
            }

            if (await this.isUserBlocked(telegramId)) {
                return res.status(403).json({ 
                    error: 'Ваш аккаунт временно ограничен модерацией' 
                });
            }

            next();
        };
    }
}

module.exports = new ModerationService();
