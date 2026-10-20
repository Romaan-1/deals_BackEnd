const db = require('../config/db');

// 1. Живий пошук міст із лімітом вигрузки (Autocomplete)
const getRegions = async (req, res) => {
    const { search } = req.query;

    try {
        let query = 'SELECT * FROM regions';
        const params = [];

        // Якщо користувач щось ввів у пошук
        if (search && search.trim() !== '') {
            query += ' WHERE name ILIKE $1 ORDER BY name ASC LIMIT 15';
            params.push(`%${search.trim()}%`);
        } else {
            // За замовчуванням показуємо перші 20 популярних міст
            query += ' ORDER BY id ASC LIMIT 20';
        }

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Помилка пошуку міст:', error);
        res.status(500).json({ error: 'Помилка сервера при пошуку міст' });
    }
};

// 2. Створення/додавання нового міста
const createRegion = async (req, res) => {
    const { name } = req.body;

    if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Вкажіть назву міста' });
    }

    try {
        // Вставляємо місто або повертаємо існуюче
        const result = await db.query(
            `INSERT INTO regions (name) 
       VALUES ($1) 
       ON CONFLICT (name) DO NOTHING 
       RETURNING *`,
            [name.trim()]
        );

        if (result.rows.length === 0) {
            const existing = await db.query('SELECT * FROM regions WHERE LOWER(name) = LOWER($1)', [name.trim()]);
            return res.json(existing.rows[0]);
        }

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Помилка додавання міста:', error);
        res.status(500).json({ error: 'Помилка сервера при додаванні міста' });
    }
};

module.exports = {
    getRegions,
    createRegion
};