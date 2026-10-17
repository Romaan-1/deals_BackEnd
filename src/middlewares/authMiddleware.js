const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Доступ заборонено. Токен відсутній.' });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_key');
        req.user = verified;
        next();
    } catch (error) {
        res.status(403).json({ error: 'Недійсний або прострочений токен.' });
    }
};

const requireAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Потрібні права Адміністратора.' });
    }
};

const requireMerchant = (req, res, next) => {
    if (req.user && (req.user.role === 'merchant' || req.user.role === 'admin')) {
        next();
    } else {
        res.status(403).json({ error: 'Доступ лише для представників закладів.' });
    }
};

module.exports = { verifyToken, requireAdmin, requireMerchant };