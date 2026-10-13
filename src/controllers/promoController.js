const db = require('../config/db');

// Отримати всі активні акції
const getPromotions = async (req, res) => {
    try {
        const query = `
      SELECT 
        p.id, 
        p.title, 
        p.description, 
        p.discount_value, 
        p.start_date, 
        p.end_date, 
        pl.name AS place_name, 
        pl.address, 
        r.name AS region_name
      FROM promotions p
      JOIN places pl ON p.place_id = pl.id
      JOIN regions r ON pl.region_id = r.id
      WHERE p.is_active = TRUE
    `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Помилка виконання запиту:', error);
        res.status(500).json({ error: 'Помилка сервера при отриманні акцій' });
    }
};

module.exports = { getPromotions };