require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');

const app = express();

// Базові мідлвари
app.use(cors());
app.use(express.json());

// 📖 Повна конфігурація Swagger OpenAPI 3.0 для всього проєкту
const swaggerDocument = {
    openapi: '3.0.0',
    info: {
        title: 'Promo API',
        version: '1.0.0',
        description: 'Повна REST API документація вебплатформи локальних знижок та акцій'
    },
    servers: [
        {
            url: 'http://localhost:5000/api',
            description: 'Локальний сервер розробки'
        }
    ],
    tags: [
        { name: 'Auth', description: 'Авторизація та реєстрація користувачів' },
        { name: 'Regions', description: 'Управління містами та живий пошук' },
        { name: 'Categories', description: 'Категорії товарів та послуг' },
        { name: 'Places', description: 'Заклади та пекарні/магазини' },
        { name: 'Promotions', description: 'Промо-акції та знижки' },
        { name: 'Favorites', description: 'Збережені акції користувача' },
        { name: 'Admin', description: 'Панель модерації та управління ролями' }
    ],
    paths: {
        '/auth/register': {
            post: {
                tags: ['Auth'],
                summary: 'Реєстрація нового користувача або закладу',
                responses: { 201: { description: 'Успішна реєстрація' } }
            }
        },
        '/auth/login': {
            post: {
                tags: ['Auth'],
                summary: 'Вхід у систему (отримання JWT-токена)',
                responses: { 200: { description: 'Успішний вхід' } }
            }
        },

        // --- 📍 REGIONS ---
        '/regions': {
            get: {
                tags: ['Regions'],
                summary: 'Отримати список міст / живий автопошук',
                responses: { 200: { description: 'Список міст' } }
            },
            post: {
                tags: ['Regions'],
                summary: 'Створити нове місто',
                responses: { 201: { description: 'Місто створено' } }
            }
        },

        // --- 🏷️ CATEGORIES ---
        '/categories': {
            get: {
                tags: ['Categories'],
                summary: 'Отримати всі категорії товарів та послуг',
                responses: { 200: { description: 'Список категорій' } }
            }
        },

        // --- 🏬 PLACES ---
        '/places/popular': {
            get: {
                tags: ['Places'],
                summary: 'Отримати популярні заклади для головної сторінки',
                responses: { 200: { description: 'Список ТОП-закладів' } }
            }
        },
        '/places/my': {
            get: {
                tags: ['Places'],
                summary: 'Отримати заклади поточного продавця (Merchant)',
                responses: { 200: { description: 'Список власних закладів' } }
            }
        },
        '/places/{id}': {
            get: {
                tags: ['Places'],
                summary: 'Детальна інформація про заклад та його акції',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                responses: { 200: { description: 'Дані закладу' } }
            }
        },
        '/places': {
            post: {
                tags: ['Places'],
                summary: 'Створити новий заклад (Merchant)',
                responses: { 201: { description: 'Заклад створено' } }
            }
        },

        // --- 🔥 PROMOTIONS ---
        '/promotions': {
            get: {
                tags: ['Promotions'],
                summary: 'Отримати каталог акцій з фільтрацією (місто, категорія, пошук)',
                responses: { 200: { description: 'Список акцій' } }
            },
            post: {
                tags: ['Promotions'],
                summary: 'Опублікувати нову акцію (Merchant)',
                responses: { 201: { description: 'Акцію створено' } }
            }
        },
        '/promotions/{id}': {
            delete: {
                tags: ['Promotions'],
                summary: 'Видалити акцію (Merchant/Admin)',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                responses: { 200: { description: 'Акцію видалено' } }
            }
        },

        // --- ❤️ FAVORITES ---
        '/favorites': {
            get: {
                tags: ['Favorites'],
                summary: 'Отримати список збережених акцій користувача',
                responses: { 200: { description: 'Список ID обраних акцій' } }
            },
            post: {
                tags: ['Favorites'],
                summary: 'Додати акцію в обране',
                responses: { 201: { description: 'Додано в обране' } }
            }
        },
        '/favorites/{id}': {
            delete: {
                tags: ['Favorites'],
                summary: 'Видалити акцію з обраного',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                responses: { 200: { description: 'Видалено з обраного' } }
            }
        },

        // --- 🛡️ ADMIN PANEL ---
        '/admin/places/pending': {
            get: {
                tags: ['Admin'],
                summary: 'Отримати непідтверджені заклади на модерацію',
                responses: { 200: { description: 'Запити закладів' } }
            }
        },
        '/admin/places/{id}/approve': {
            put: {
                tags: ['Admin'],
                summary: 'Підтвердити або відхилити новий заклад',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                responses: { 200: { description: 'Статус закладу змінено' } }
            }
        },
        '/admin/users': {
            get: {
                tags: ['Admin'],
                summary: 'Отримати список усіх користувачів',
                responses: { 200: { description: 'Список користувачів' } }
            }
        },
        '/admin/users/{id}/role': {
            put: {
                tags: ['Admin'],
                summary: 'Змінити роль користувача (user/merchant/admin)',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                responses: { 200: { description: 'Роль оновлено' } }
            }
        }
    }
};

// Підключення Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Головні роути застосунку
const promoRoutes = require('./routes/promoRoutes');
app.use('/api', promoRoutes);

// Запуск сервера
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Сервер успішно запущено на порту ${PORT} 🚀`);
    console.log(`Swagger UI доступний за адресою: http://localhost:${PORT}/api-docs 📖`);
});