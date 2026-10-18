const db = require('../config/db');

// Отримати один заклад та всі його акції за ID
const getPlaceById = async (req, res) => {
    const { id } = req.params;
    try {
        const placeQuery = `
      SELECT p.*, r.name AS region_name, c.name AS category_name
      FROM places p
      JOIN regions r ON p.region_id = r.id
      JOIN categories c ON p.category_id = c.id
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
        console.error('Помилка отримання закладу:', error);
        res.status(500).json({ error: 'Помилка сервера' });
    }
};

// Отримати популярні заклади для головної сторінки
const getPopularPlaces = async (req, res) => {
    try {
        const query = `
      SELECT p.*, COUNT(pr.id) AS active_promos_count
      FROM places p
      LEFT JOIN promotions pr ON pr.place_id = p.id AND pr.is_active = TRUE
      GROUP BY p.id
      LIMIT 6
    `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Помилка отримання закладах:', error);
        res.status(500).json({ error: 'Помилка сервера' });
    }
};

module.exports = { getPlaceById, getPopularPlaces };