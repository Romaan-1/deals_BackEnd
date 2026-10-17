const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Реєстрація користувача / адміна
const register = async (req, res) => {
    const { email, password, full_name, role } = req.body;

    if (!email || !password || !full_name) {
        return res.status(400).json({ error: 'Заповніть усі обовʼязкові поля' });
    }

    try {
        // Перевірка, чи існує email
        const userCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ error: 'Користувач з таким email вже існує' });
        }

        // Хешування пароля
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Роль за замовчуванням 'user' (якщо не вказано інше)
        const userRole = role || 'user';

        const newUser = await db.query(
            'INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, full_name, role',
            [email, passwordHash, full_name, userRole]
        );

        const user = newUser.rows[0];

        // Генерація JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({ user, token });
    } catch (error) {
        console.error('Помилка реєстрації:', error);
        res.status(500).json({ error: 'Помилка сервера при реєстрації' });
    }
};

// Вхід у систему (Login)
const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Введіть email та пароль' });
    }

    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Невірний email або пароль' });
        }

        const user = result.rows[0];

        // Перевірка пароля
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(400).json({ error: 'Невірний email або пароль' });
        }

        // Генерація JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Помилка входу:', error);
        res.status(500).json({ error: 'Помилка сервера при вході' });
    }
};

// Перевірка поточного токена
const getMe = async (req, res) => {
    res.json({ user: req.user });
};

module.exports = { register, login, getMe };