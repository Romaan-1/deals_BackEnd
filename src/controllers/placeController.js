const db = require('../config/db');

// 1. Створити новий заклад (Merchant / Admin)
const createPlace = async (req, res) => {
    const { region_id, category_id, name, address, logo_url, banner_url } = req.body;
    const owner_id = req.user.id;

    if (!region_id || !category_id || !name || !address) {
        return res.status(400).json({ error: 'Заповніть усі обовʼязкові поля' });
    }

    try {
        const result = await db.query(
            `INSERT INTO places (owner_id, region_id, category_id, name, address, logo_url, banner_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
            [
                owner_id,
                region_id,
                category_id,
                name,
                address,
                logo_url || '🥐',
                banner_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5'
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Помилка створення закладу:', error);
        res.status(500).json({ error: 'Помилка сервера при створенні закладу' });
    }
};

// 2. Отримати заклади поточного продавця
const getMyPlaces = async (req, res) => {
    const owner_id = req.user.id;

    try {
        const result = await db.query(
            'SELECT * FROM places WHERE owner_id = $1 ORDER BY id DESC',
            [owner_id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Помилка отримання власних закладів:', error);
        res.status(500).json({ error: 'Помилка сервера' });
    }
};

// 3. Отримати один заклад за ID та його активні акції
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
        console.error('Помилка отримання сторінки закладу:', error);
        res.status(500).json({ error: 'Помилка сервера' });
    }
};

// 4. Отримати популярні заклади для головної сторінки
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
        console.error('Помилка отримання популярних закладів:', error);
        res.status(500).json({ error: 'Помилка сервера' });
    }
};

module.exports = {
    createPlace,
    getMyPlaces,
    getPlaceById,
    getPopularPlaces
};