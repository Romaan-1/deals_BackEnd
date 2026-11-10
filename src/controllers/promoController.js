const db = require('../config/db');

// 1. Отримати всі акції з фільтрацією
const getPromotions = async (req, res) => {
    const { category_id, region_id, search } = req.query;

    try {
        let query = `
      SELECT 
        p.id, 
        p.title, 
        p.description, 
        p.discount_value, 
        p.image_url,
        p.link_url,
        p.start_date, 
        p.end_date, 
        p.is_active,
        pl.id AS place_id,
        pl.name AS place_name, 
        pl.address, 
        pl.logo_url AS place_logo,
        r.name AS region_name,
        c.name AS category_name
      FROM promotions p
      JOIN places pl ON p.place_id = pl.id
      JOIN regions r ON pl.region_id = r.id
      JOIN categories c ON pl.category_id = c.id
      WHERE p.is_active = TRUE AND pl.is_verified = TRUE
    `;

        const values = [];

        if (region_id && region_id !== 'all' && region_id !== 'undefined') {
            values.push(region_id);
            query += ` AND r.id = $${values.length}`;
        }

        if (category_id && category_id !== 'all' && category_id !== 'undefined') {
            values.push(category_id);
            query += ` AND c.id = $${values.length}`;
        }

        if (search && search.trim() !== '') {
            values.push(`%${search.trim().toLowerCase()}%`);
            query += ` AND (LOWER(p.title) LIKE $${values.length} OR LOWER(pl.name) LIKE $${values.length})`;
        }

        query += ` ORDER BY p.id DESC`;

        const result = await db.query(query, values);
        res.json(result.rows);
    } catch (error) {
        console.error('❌ Помилка при отриманні акцій:', error);
        res.status(500).json({ error: 'Помилка сервера при отриманні акцій' });
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
        console.error('❌ Помилка створення акції:', error);
        res.status(500).json({ error: 'Помилка сервера при створенні акції' });
    }
};

// 3. Редагування акції
const updatePromotion = async (req, res) => {
    const { id } = req.params;
    const { title, description, discount_value, is_active, start_date, end_date, link_url } = req.body;

    try {
        const checkQuery = `
      SELECT p.id, pl.merchant_id 
      FROM promotions p
      JOIN places pl ON p.place_id = pl.id
      WHERE p.id = $1
    `;
        const checkResult = await db.query(checkQuery, [id]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Акцію не знайдено' });
        }

        if (checkResult.rows[0].merchant_id !== req.user.id && req.user.role !== 'admin') {
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
        end_date = COALESCE($6, end_date),
        link_url = COALESCE($7, link_url)
      WHERE id = $8
      RETURNING *
    `;

        const updated = await db.query(updateQuery, [
            title, description, discount_value, is_active, start_date, end_date, link_url, id
        ]);

        res.json({ message: 'Акцію оновлено', promotion: updated.rows[0] });
    } catch (error) {
        console.error('❌ Помилка оновлення акції:', error);
        res.status(500).json({ error: 'Помилка сервера при оновленні акції' });
    }
};

// 4. Видалення акції (для власника закладу або Admin)
const deletePromotion = async (req, res) => {
    const { id } = req.params;

    try {
        // Якщо запит робить Адміністратор — видаляємо одразу без перевірки власності
        if (req.user && req.user.role === 'admin') {
            const adminDelete = await db.query('DELETE FROM promotions WHERE id = $1 RETURNING *', [id]);
            if (adminDelete.rows.length === 0) {
                return res.status(404).json({ error: 'Акцію не знайдено' });
            }
            return res.json({ message: 'Акцію успішно видалено адміністратором' });
        }

        // Якщо це Merchant — перевіряємо, чи належить акція його закладу
        const checkQuery = `
      SELECT p.id, pl.merchant_id 
      FROM promotions p
      JOIN places pl ON p.place_id = pl.id
      WHERE p.id = $1
    `;
        const checkResult = await db.query(checkQuery, [id]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Акцію не знайдено' });
        }

        if (checkResult.rows[0].merchant_id !== req.user.id) {
            return res.status(403).json({ error: 'Немає прав для видалення цієї акції' });
        }

        await db.query('DELETE FROM promotions WHERE id = $1', [id]);
        res.json({ message: 'Акцію успішно видалено' });
    } catch (error) {
        console.error('❌ Помилка видалення акції:', error);
        res.status(500).json({ error: 'Помилка сервера при видаленні акції' });
    }
};

module.exports = {
    getPromotions,
    createPromotion,
    updatePromotion,
    deletePromotion
};