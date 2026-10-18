const db = require('../config/db');

// Додати акцію в обране
const addFavorite = async (req, res) => {
    const { promotion_id } = req.body;
    const userId = req.user.id;

    if (!promotion_id) {
        return res.status(400).json({ error: 'Вкажіть promotion_id' });
    }

    try {
        // Перевірка існування акції
        const promoCheck = await db.query('SELECT * FROM promotions WHERE id = $1', [promotion_id]);
        if (promoCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Акцію не знайдено' });
        }

        const newFav = await db.query(
            `INSERT INTO favorites (user_id, promotion_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, promotion_id) DO NOTHING
       RETURNING *`,
            [userId, promotion_id]
        );

        if (newFav.rows.length === 0) {
            return res.status(400).json({ message: 'Ця акція вже в обраному' });
        }

        res.status(201).json({ message: 'Додано в обране', favorite: newFav.rows[0] });
    } catch (error) {
        console.error('Помилка додавання в обране:', error);
        res.status(500).json({ error: 'Помилка сервера' });
    }
};

// Видалити акцію з обраного
const removeFavorite = async (req, res) => {
    const { promotion_id } = req.params;
    const userId = req.user.id;

    try {
        const result = await db.query(
            'DELETE FROM favorites WHERE user_id = $1 AND promotion_id = $2 RETURNING *',
            [userId, promotion_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Запис в обраному не знайдено' });
        }

        res.json({ message: 'Видалено з обраного' });
    } catch (error) {
        console.error('Помилка видалення з обраного:', error);
        res.status(500).json({ error: 'Помилка сервера' });
    }
};

// Отримати список збережених акцій поточного користувача
const getMyFavorites = async (req, res) => {
    const userId = req.user.id;

    try {
        const query = `
      SELECT 
        f.id AS favorite_id,
        f.created_at AS added_at,
        p.id AS promotion_id,
        p.title,
        p.description,
        p.discount_value,
        p.start_date,
        p.end_date,
        pl.name AS place_name,
        pl.address,
        r.name AS region_name,
        c.name AS category_name
      FROM favorites f
      JOIN promotions p ON f.promotion_id = p.id
      JOIN places pl ON p.place_id = pl.id
      JOIN regions r ON pl.region_id = r.id
      JOIN categories c ON pl.category_id = c.id
      WHERE f.user_id = $1
      ORDER BY f.id DESC
    `;

        const result = await db.query(query, [userId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Помилка отримання обраного:', error);
        res.status(500).json({ error: 'Помилка сервера' });
    }
};

module.exports = { addFavorite, removeFavorite, getMyFavorites };