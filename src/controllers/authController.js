const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// 🔑 1. Авторизація користувача (login)
const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({ error: 'Заповніть email та пароль' });
        }

        const result = await db.query('SELECT * FROM users WHERE email = $1', [email.trim().toLowerCase()]);

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Користувача з таким email не знайдено' });
        }

        const user = result.rows[0];

        const isMatch = await bcrypt.compare(password, user.password_hash || user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Невірний пароль' });
        }

        const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key_2026';
        const token = jwt.sign(
            { id: user.id, role: user.role, email: user.email },
            jwtSecret,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('❌ Помилка при авторизації:', error.message);
        res.status(500).json({ error: `Помилка сервера при вході: ${error.message}` });
    }
};

// 📝 2. Реєстрація користувача (register)
const register = async (req, res) => {
    const { email, password, full_name, role } = req.body;

    try {
        if (!email || !password || !full_name) {
            return res.status(400).json({ error: 'Заповніть усі обов\'язкові поля' });
        }

        const existing = await db.query('SELECT * FROM users WHERE email = $1', [email.trim().toLowerCase()]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Користувач з таким email вже існує' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const result = await db.query(
            'INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, full_name, role',
            [email.trim().toLowerCase(), passwordHash, full_name, role || 'user']
        );

        const user = result.rows[0];
        const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key_2026';
        const token = jwt.sign(
            { id: user.id, role: user.role, email: user.email },
            jwtSecret,
            { expiresIn: '7d' }
        );

        res.status(201).json({ token, user });
    } catch (error) {
        console.error('❌ Помилка реєстрації:', error);
        res.status(500).json({ error: 'Помилка сервера при реєстрації' });
    }
};

// 📧 3. Запит на скидання пароля (forgotPassword)
const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const userRes = await db.query('SELECT * FROM users WHERE email = $1', [email.trim().toLowerCase()]);
        if (userRes.rows.length === 0) {
            return res.status(404).json({ error: 'Користувача з таким email не знайдено' });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 3600000); // 1 година

        await db.query(
            'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE email = $3',
            [token, expires, email.trim().toLowerCase()]
        );

        const resetUrl = `http://localhost:5173/reset-password/${token}`;
        console.log(`\n🔑 ПОСИЛАННЯ ДЛЯ СКИДАННЯ ПАРОЛЯ ДЛЯ ${email}:\n${resetUrl}\n`);

        res.json({ message: 'Посилання для відновлення пароля сформовано та надіслано!' });
    } catch (error) {
        console.error('❌ Помилка forgotPassword:', error);
        res.status(500).json({ error: 'Помилка сервера при обробці запиту' });
    }
};

// 🔑 4. Встановлення нового пароля (resetPassword)
const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        if (!token || !newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: 'Пароль повинен містити щонайменше 6 символів' });
        }

        const userRes = await db.query(
            'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
            [token]
        );

        if (userRes.rows.length === 0) {
            return res.status(400).json({ error: 'Токен відновлення застарів або є недійсним' });
        }

        const user = userRes.rows[0];
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        await db.query(
            'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
            [passwordHash, user.id]
        );

        res.json({ message: 'Пароль успішно змінено! Тепер ви можете увійти.' });
    } catch (error) {
        console.error('❌ Помилка resetPassword:', error);
        res.status(500).json({ error: 'Помилка сервера при зміні пароля' });
    }
};

module.exports = {
    login,
    register,
    forgotPassword,
    resetPassword
};