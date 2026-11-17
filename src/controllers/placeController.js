const db = require('../config/db');

// 🏬 1. Створення закладу
const createPlace = async (req, res) => {
    const { name, address, category_id, region_id, logo_url } = req.body;
    const merchant_id = req.user.id;

    try {
        if (!name || !address || !category_id || !region_id) {
            return res.status(400).json({ error: 'Заповніть усі обов\'язкові поля' });
        }

        const slug = `place-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const result = await db.query(
            `INSERT INTO places (name, slug, address, category_id, region_id, merchant_id, logo_url, is_verified) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
            [name, slug, address, parseInt(category_id, 10), parseInt(region_id, 10), merchant_id, logo_url || '🏬', true]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('❌ Помилка створення закладу:', error);
        res.status(500).json({ error: 'Помилка сервера при створенні закладу' });
    }
};

// 🔥 2. Популярні заклади для головної сторінки
const getPopularPlaces = async (req, res) => {
    try {
        const query = `
      SELECT p.*, COUNT(pr.id)::int AS active_promos_count
      FROM places p
      LEFT JOIN promotions pr ON pr.place_id = p.id AND pr.is_active = TRUE
      WHERE p.is_verified = TRUE
      GROUP BY p.id
      ORDER BY p.rating DESC
      LIMIT 10
    `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('❌ Помилка завантаження закладів:', error);
        res.status(500).json({ error: 'Помилка сервера' });
    }
};

// 📌 3. Отримання закладу за ID та його активних акцій (формат { place, promotions })
const getPlaceById = async (req, res) => {
    const { id } = req.params;
    try {
        const placeQuery = `
      SELECT p.*, r.name AS region_name, c.name AS category_name
      FROM places p
      LEFT JOIN regions r ON p.region_id = r.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = $1
    `;
        const placeResult = await db.query(placeQuery, [id]);

        if (placeResult.rows.length === 0) {
            return res.status(404).json({ error: 'Заклад не знайдено' });
        }

        const promosQuery = `
      SELECT * FROM promotions 
      WHERE place_id = $1 AND is_active = TRUE 
      ORDER BY id DESC
    `;
        const promosResult = await db.query(promosQuery, [id]);

        res.json({
            place: placeResult.rows[0],
            promotions: promosResult.rows
        });
    } catch (error) {
        console.error('❌ Помилка отримання сторінки закладу:', error);
        res.status(500).json({ error: 'Помилка сервера' });
    }
};

// 💼 4. Мої заклади (для кабінету продавця)
const getMyPlaces = async (req, res) => {
    const merchant_id = req.user.id;
    try {
        const result = await db.query(
            'SELECT * FROM places WHERE merchant_id = $1 ORDER BY id DESC',
            [merchant_id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('❌ Помилка завантаження моїх закладів:', error);
        res.status(500).json({ error: 'Помилка сервера' });
    }
};

// ⭐️ 5. Додавання / оновлення відгуку
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

        const avgRes = await db.query(
            'SELECT ROUND(AVG(rating)::numeric, 1) as avg_rating FROM reviews WHERE place_id = $1',
            [place_id]
        );
        const newRating = avgRes.rows[0].avg_rating || 0;

        await db.query('UPDATE places SET rating = $1 WHERE id = $2', [newRating, place_id]);

        res.json({ message: 'Дякуємо за ваш відгук!', newRating });
    } catch (error) {
        console.error('❌ Помилка збереження відгуку:', error);
        res.status(500).json({ error: 'Помилка сервера при збереженні відгуку' });
    }
};

// 💬 6. Список відгуків закладу (з user_id для перевірки автора)
const getPlaceReviews = async (req, res) => {
    const place_id = req.params.id;
    try {
        const result = await db.query(`
      SELECT r.id, r.place_id, r.user_id, r.rating, r.comment, r.created_at, u.full_name 
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.place_id = $1
      ORDER BY r.created_at DESC
    `, [place_id]);

        res.json(result.rows);
    } catch (error) {
        console.error('❌ Помилка завантаження відгуків:', error);
        res.status(500).json({ error: 'Помилка сервера при отриманні відгуків' });
    }
};

// 🗑️ 7. Видалення відгуку (admin — будь-який, звичайний користувач — лише свій)
const deleteReview = async (req, res) => {
    const { reviewId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        const reviewRes = await db.query('SELECT * FROM reviews WHERE id = $1', [reviewId]);
        if (reviewRes.rows.length === 0) {
            return res.status(404).json({ error: 'Відгук не знайдено' });
        }

        const review = reviewRes.rows[0];

        if (userRole !== 'admin' && Number(review.user_id) !== Number(userId)) {
            return res.status(403).json({ error: 'Ви можете видаляти лише власні відгуки' });
        }

        await db.query('DELETE FROM reviews WHERE id = $1', [reviewId]);

        // Перераховуємо середній рейтинг закладу після видалення
        const avgRes = await db.query(
            'SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 4.5) AS avg_rating FROM reviews WHERE place_id = $1',
            [review.place_id]
        );
        const newRating = avgRes.rows[0].avg_rating;

        await db.query('UPDATE places SET rating = $1 WHERE id = $2', [newRating, review.place_id]);

        res.json({ message: 'Відгук видалено', newRating });
    } catch (error) {
        console.error('❌ Помилка видалення відгуку:', error);
        res.status(500).json({ error: 'Помилка сервера при видаленні відгуку' });
    }
};

module.exports = {
    createPlace,
    getPopularPlaces,
    getPlaceById,
    getMyPlaces,
    addReview,
    getPlaceReviews,
    deleteReview
};