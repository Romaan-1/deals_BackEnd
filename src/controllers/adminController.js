const db = require('../config/db');

// 1. Отримати список усіх користувачів
const getAllUsers = async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, email, full_name, role, created_at FROM users ORDER BY id DESC'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Помилка отримання користувачів:', error);
        res.status(500).json({ error: 'Помилка сервера' });
    }
};

// 2. Змінити роль користувача (user, merchant, admin)
const updateUserRole = async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'merchant', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Некоректна роль' });
    }

    try {
        const result = await db.query(
            'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, full_name, role',
            [role, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Користувача не знайдено' });
        }

        res.json({ message: 'Роль успішно змінено', user: result.rows[0] });
    } catch (error) {
        console.error('Помилка зміни ролі:', error);
        res.status(500).json({ error: 'Помилка сервера' });
    }
};

// 3. Підтвердити або відхилити заклад
const approvePlace = async (req, res) => {
    const { id } = req.params;
    const { is_verified } = req.body;

    try {
        const result = await db.query(
            'UPDATE places SET is_verified = $1 WHERE id = $2 RETURNING *',
            [is_verified, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Заклад не знайдено' });
        }

        res.json({ message: 'Статус закладу оновлено', place: result.rows[0] });
    } catch (error) {
        console.error('Помилка модерації:', error);
        res.status(500).json({ error: 'Помилка сервера' });
    }
};

// 4. Отримати заклади, які очікують підтвердження
const getPendingPlaces = async (req, res) => {
    try {
        const query = `
      SELECT p.*, c.name AS category_name, r.name AS region_name 
      FROM places p
      JOIN categories c ON p.category_id = c.id
      JOIN regions r ON p.region_id = r.id
      WHERE p.is_verified = FALSE
      ORDER BY p.id DESC
    `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Помилка отримання закладів на модерацію:', error);
        res.status(500).json({ error: 'Помилка сервера' });
    }
};

module.exports = {
    getAllUsers,
    updateUserRole,
    approvePlace,
    getPendingPlaces
};