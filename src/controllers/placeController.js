const db = require('../config/db');

// Створення нового закладу (тільки для авторизованого merchant/admin)
const createPlace = async (req, res) => {
    const { region_id, category_id, name, description, address, logo_url } = req.body;
    const userId = req.user.id; // Отримуємо ID із JWT токена

    if (!region_id || !category_id || !name || !address) {
        return res.status(400).json({ error: 'Заповніть обовʼязкові поля: region_id, category_id, name, address' });
    }

    // Генерація слага
    const slug = name.toLowerCase().trim().replace(/[^a-z0-9а-яєіїґ]/g, '-') + '-' + Date.now();

    try {
        const result = await db.query(
            `INSERT INTO places (user_id, region_id, category_id, name, slug, description, address, logo_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
            [userId, region_id, category_id, name, slug, description || '', address, logo_url || null]
        );

        res.status(201).json({
            message: 'Заклад успішно створено!',
            place: result.rows[0]
        });
    } catch (error) {
        console.error('Помилка створення закладу:', error);
        res.status(500).json({ error: 'Помилка сервера при створенні закладу' });
    }
};

// Отримати заклади поточного авторизованого продавця
const getMyPlaces = async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM places WHERE user_id = $1 ORDER BY id DESC',
            [req.user.id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Помилка отримання закладів:', error);
        res.status(500).json({ error: 'Помилка сервера' });
    }
};

module.exports = { createPlace, getMyPlaces };