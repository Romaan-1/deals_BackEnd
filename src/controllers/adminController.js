const db = require('../config/db');

// Отримати список усіх користувачів (тільки для Admin)
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

// Змінити роль користувача (тільки для Admin)
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

module.exports = { getAllUsers, updateUserRole };