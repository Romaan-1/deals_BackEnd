const db = require('../config/db');

// Отримати всі міста
const getRegions = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM regions ORDER BY name ASC');
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Помилка отримання регіонів' });
    }
};

// Створити нове місто
const createRegion = async (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Назва міста обовʼязкова' });
    }

    const slug = name.toLowerCase().trim().replace(/[^a-z0-9а-яєіїґ]/g, '-');

    try {
        const result = await db.query(
            'INSERT INTO regions (name, slug) VALUES ($1, $2) RETURNING *',
            [name, slug + '-' + Date.now()]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Помилка створення міста' });
    }
};

module.exports = { getRegions, createRegion };