const db = require('../config/db');

// 1. Отримати всі акції (вже існує)
const getPromotions = async (req, res) => {
    const { category_id, region_id } = req.query;

    try {
        let query = `
      SELECT 
        p.id, 
        p.title, 
        p.description, 
        p.discount_value, 
        p.start_date, 
        p.end_date, 
        p.is_active,
        pl.id AS place_id,
        pl.name AS place_name, 
        pl.address, 
        pl.user_id AS owner_id,
        r.name AS region_name,
        c.name AS category_name
      FROM promotions p
      JOIN places pl ON p.place_id = pl.id
      JOIN regions r ON pl.region_id = r.id
      JOIN categories c ON pl.category_id = c.id
      WHERE p.is_active = TRUE
    `;

        const values = [];

        if (region_id) {
            values.push(region_id);
            query += ` AND r.id = $${values.length}`;
        }

        if (category_id) {
            values.push(category_id);
            query += ` AND c.id = $${values.length}`;
        }

        query += ` ORDER BY p.id DESC`;

        const result = await db.query(query, values);
        res.json(result.rows);
    } catch (error) {
        console.error('Помилка виконання запиту:', error);
        res.status(500).json({ error: 'Помилка сервера при отриманні акцій' });
    }
};

// 2. Створення нової акції
const createPromotion = async (req, res) => {
    const { place_id, title, description, discount_value, start_date, end_date } = req.body;

    if (!place_id || !title || !discount_value || !start_date || !end_date) {
        return res.status(400).json({ error: 'Заповніть усі обовʼязкові поля' });
    }

    try {
        // Перевіряємо, чи цей заклад дійсно належить поточному користувачу (або користувач — адмін)
        const placeCheck = await db.query('SELECT * FROM places WHERE id = $1', [place_id]);

        if (placeCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Заклад не знайдено' });
        }

        if (placeCheck.rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Ви не можете додавати акції для чужого закладу' });
        }

        const newPromo = await db.query(
            `INSERT INTO promotions (place_id, title, description, discount_value, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
            [place_id, title, description || '', discount_value, start_date, end_date]
        );

        res.status(201).json({
            message: 'Акцію успішно створено!',
            promotion: newPromo.rows[0]
        });
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

module.exports = {
    getPromotions,
    createPromotion,
    updatePromotion,
    deletePromotion
};