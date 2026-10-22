const db = require('../config/db');

// Генерація slug для таблиці regions
const slugify = (text) => {
    const cyrToLat = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'h', 'ґ': 'g', 'д': 'd', 'е': 'e', 'є': 'ye',
        'ж': 'zh', 'з': 'z', 'и': 'y', 'і': 'i', 'ї': 'yi', 'й': 'y', 'к': 'k', 'л': 'l',
        'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
        'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ь': '', 'ю': 'yu', 'я': 'ya'
    };
    return text
        .toLowerCase()
        .split('')
        .map(char => cyrToLat[char] || char)
        .join('')
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
};

// Пошук та отримання міст
const getRegions = async (req, res) => {
    const { search } = req.query;

    try {
        let query = 'SELECT * FROM regions';
        const params = [];

        if (search && search.trim() !== '') {
            query += ' WHERE name ILIKE $1 ORDER BY name ASC LIMIT 15';
            params.push(`%${search.trim()}%`);
        } else {
            query += ' ORDER BY id ASC LIMIT 20';
        }

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Помилка отримання міст:', error);
        res.status(500).json({ error: 'Помилка сервера' });
    }
};

// Додавання нового міста
const createRegion = async (req, res) => {
    const { name } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Вкажіть назву міста' });
    }

    const cityName = name.trim();
    const citySlug = slugify(cityName);

    try {
        const result = await db.query(
            `INSERT INTO regions (name, slug) 
       VALUES ($1, $2) 
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name 
       RETURNING *`,
            [cityName, citySlug]
        );

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