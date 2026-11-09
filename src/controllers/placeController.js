const db = require('../config/db');

// 🏬 1. Створення закладу
const createPlace = async (req, res) => {
    const { name, address, category_id, region_id, logo_url } = req.body;
    const merchant_id = req.user.id; // Отримуємо z JWT

    try {
        if (!name || !address || !category_id || !region_id) {
            return res.status(400).json({ error: 'Заповніть усі обов\'язкові поля' });
        }

        const result = await db.query(
            `INSERT INTO places (name, address, category_id, region_id, merchant_id, logo_url, is_verified) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
            [name, address, parseInt(category_id, 10), parseInt(region_id, 10), merchant_id, logo_url || '', false]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('  Помилка створення закладу:', error);
        res.status(500).json({ error: 'Помилка сервера при створенні закладу' });
    }
};

// 🔥 2. Отримання популярних / підтверджених закладів
const getPopularPlaces = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM places WHERE is_verified = true ORDER BY rating DESC LIMIT 10');
        res.json(result.rows);
    } catch (error) {
        console.error('  Помилка завантаження закладів:', error);
        res.status(500).json({ error: 'Помилка сервера' });
    }
};

// 📌 3. Отримання закладу за ID
const getPlaceById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM places WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Заклад не знайдено' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('  Помилка отримання закладу:', error);
        res.status(500).json({ error: 'Помилка сервера' });
    }
};

// 💼 4. Отримання власних закладів мерчанта
const getMyPlaces = async (req, res) => {
    const merchant_id = req.user.id;
    try {
        const result = await db.query('SELECT * FROM places WHERE merchant_id = $1 ORDER BY id DESC', [merchant_id]);
        res.json(result.rows);
    } catch (error) {
        console.error('  Помилка завантаження моїх закладів:', error);
        res.status(500).json({ error: 'Помилка сервера' });
    }
};

// 🛡️ 5. Заклади на модерацію (для Admin)
const getPendingPlaces = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM places WHERE is_verified = false ORDER BY id DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('  Помилка отримання закладів на модерацію:', error);
        res.status(500).json({ error: 'Помилка сервера' });
    }
};

// 🛡️ 6. Затвердження закладу адміном
const approvePlace = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('UPDATE places SET is_verified = true WHERE id = $1', [id]);
        res.json({ message: 'Заклад успішно підтверджено!' });
    } catch (error) {
        console.error('  Помилка підтвердження закладу:', error);
        res.status(500).json({ error: 'Помилка сервера' });
    }
};

// ⭐️ 7. Додавання / оновлення відгуку
const addReview = async (req, res) => {
    const place_id = req.params.id;
    const user_id = req.user.id;
    const { rating, comment } = req.body;

    try {
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Оцінка має бути від 1 до 5 зірок' });
        }

        await db.query(`
      INSERT INTO reviews (place_id, user_id, rating, comment)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (place_id, user_id) 
      DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, created_at = NOW()
    `, [place_id, user_id, rating, comment || '']);

        // Перераховуємо середній рейтинг закладу
        const avgRes = await db.query(
            'SELECT ROUND(AVG(rating)::numeric, 1) as avg_rating FROM reviews WHERE place_id = $1',
            [place_id]
        );
        const newRating = avgRes.rows[0].avg_rating || 0;

        await db.query('UPDATE places SET rating = $1 WHERE id = $2', [newRating, place_id]);

        res.json({ message: 'Дякуємо за ваш відгук!', newRating });
    } catch (error) {
        console.error('Помилка збереження відгуку:', error);
        res.status(500).json({ error: 'Помилка сервера при збереженні відгуку' });
    }
};

// 💬 8. Отримання списку відгуків закладу
const getPlaceReviews = async (req, res) => {
    const place_id = req.params.id;
    try {
        const result = await db.query(`
      SELECT r.id, r.rating, r.comment, r.created_at, u.full_name 
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.place_id = $1
      ORDER BY r.created_at DESC
    `, [place_id]);

        res.json(result.rows);
    } catch (error) {
        console.error('Помилка завантаження відгуків:', error);
        res.status(500).json({ error: 'Помилка сервера при отриманні відгуків' });
    }
};

module.exports = {
    createPlace,
    getPopularPlaces,
    getPlaceById,
    getMyPlaces,
    getPendingPlaces,
    approvePlace,
    addReview,
    getPlaceReviews
};