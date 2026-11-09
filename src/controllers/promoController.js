const db = require('../config/db');

// 1. Отримати всі акції (вже існує)
const getPromotions = async (req, res) => {
    const { region_id, category_id } = req.query;

    try {
        let query = `
      SELECT p.*, pl.name as place_name, pl.logo_url as place_logo 
      FROM promotions p
      JOIN places pl ON p.place_id = pl.id
      WHERE pl.is_verified = true
    `;
        const params = [];

        if (region_id && region_id !== 'all' && region_id !== 'undefined') {
            params.push(region_id);
            query += ` AND pl.region_id = $${params.length}`;
        }

        if (category_id && category_id !== 'all' && category_id !== 'undefined') {
            params.push(category_id);
            query += ` AND pl.category_id = $${params.length}`;
        }

        query += ' ORDER BY p.id DESC';

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Помилка завантаження акцій:', error);
        res.status(500).json({ error: 'Помилка сервера' });
    }
};

// 2. Створення нової акції
const createPromotion = async (req, res) => {
    const { place_id, title, description, discount_value, image_url, link_url, start_date, end_date } = req.body;

    try {
        const result = await db.query(
            `INSERT INTO promotions (place_id, title, description, discount_value, image_url, link_url, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [place_id, title, description || '', discount_value, image_url || '', link_url || '', start_date, end_date]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Помилка створення акції:', error);
        res.status(500).json({ error: 'Помилка сервера при створенні акції' });
    }
};

// 3. Редагування акції
const updatePromotion = async (req, res) => {
    const { id } = req.params;
    const { title, description, discount_value, is_active, start_date, end_date } = req.body;

    try {
        // Перевірка існування та власності
        const checkQuery = `
      SELECT p.id, pl.user_id 
      FROM promotions p
      JOIN places pl ON p.place_id = pl.id
      WHERE p.id = $1
    `;
        const checkResult = await db.query(checkQuery, [id]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Акцію не знайдено' });
        }

        if (checkResult.rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Немає прав для редагування цієї акції' });
        }

        const updateQuery = `
      UPDATE promotions
      SET 
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        discount_value = COALESCE($3, discount_value),
        is_active = COALESCE($4, is_active),
        start_date = COALESCE($5, start_date),
        end_date = COALESCE($6, end_date)
      WHERE id = $7
      RETURNING *
    `;

        const updated = await db.query(updateQuery, [
            title, description, discount_value, is_active, start_date, end_date, id
        ]);

        res.json({
            message: 'Акцію оновлено',
            promotion: updated.rows[0]
        });
    } catch (error) {
        console.error('Помилка оновлення акції:', error);
        res.status(500).json({ error: 'Помилка сервера при оновленні акції' });
    }
};

// 4. Видалення (або деактивація) акції
const deletePromotion = async (req, res) => {
    const { id } = req.params;

    try {
        const checkQuery = `
      SELECT p.id, pl.user_id 
      FROM promotions p
      JOIN places pl ON p.place_id = pl.id
      WHERE p.id = $1
    `;
        const checkResult = await db.query(checkQuery, [id]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Акцію не знайдено' });
        }

        if (checkResult.rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Немає прав для видалення цієї акції' });
        }

        await db.query('DELETE FROM promotions WHERE id = $1', [id]);

        res.json({ message: 'Акцію успішно видалено' });
    } catch (error) {
        console.error('Помилка видалення акції:', error);
        res.status(500).json({ error: 'Помилка сервера при видаленні акції' });
    }
};

// 1. Додавання / оновлення відгуку
const addReview = async (req, res) => {
    const place_id = req.params.id;
    const user_id = req.user.id; // Отримуємо з JWT токена
    const { rating, comment } = req.body;

    try {
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Оцінка має бути від 1 до 5 зірок' });
        }

        // Зберігаємо або оновлюємо відгук користувача
        await db.query(`
      INSERT INTO reviews (place_id, user_id, rating, comment)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (place_id, user_id) 
      DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, created_at = NOW()
    `, [place_id, user_id, rating, comment || '']);

        // Автоматично перераховуємо середній рейтинг закладу у таблиці places
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

// 2. Отримання списку відгуків закладу
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
    getPromotions,
    createPromotion,
    updatePromotion,
    deletePromotion,
    addReview,
    getPlaceReviews
};