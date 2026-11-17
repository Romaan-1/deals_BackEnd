const path = require('path');
// Примусово вказуємо шлях до .env у корені проекту (Promo_BackEnd)
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { Pool } = require('pg');

// ДІАГНОСТИКА: перевірка в консолі
console.log('--- Перевірка зчитування .env ---');
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? 'Зчитано успішно ✅' : 'НЕ ЗЧИТАНО ❌ (undefined)');
console.log('--------------------------------');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: String(process.env.DB_PASSWORD || ''),
});

pool.on('connect', () => {
    console.log('✅ Успішно підключено до PostgreSQL');
});

module.exports = pool;