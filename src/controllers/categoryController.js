const db = require('../config/db');

// Отримати всі категорії
const getCategories = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM categories ORDER BY id ASC');
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Помилка отримання категорій' });
    }
};

// Створити нову категорію
const createCategory = async (req, res) => {
    const { name, icon } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Назва категорії обовʼязкова' });
    }
    const slug = name.toLowerCase().trim().replace(/[^a-z0-9а-яєіїґ]/g, '-');

    try {
        const result = await db.query(
            'INSERT INTO categories (name, icon, slug) VALUES ($1, $2, $3) RETURNING *',
            [name, icon || '🏷️', slug + '-' + Date.now()]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Помилка створення категорії' });
    }
};

module.exports = { getCategories, createCategory };