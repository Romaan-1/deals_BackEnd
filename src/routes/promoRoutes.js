const express = require('express');
const router = express.Router();

// 1. Імпорт усіх контролерів
const authController = require('../controllers/authController');
const placeController = require('../controllers/placeController');
const promoController = require('../controllers/promoController');

// 2. Імпорт мідлверів авторизації
const { verifyToken, requireAdmin, requireMerchant } = require('../middlewares/authMiddleware');

// ==========================================
// 🔐 МАРШРУТИ АВТОРИЗАЦІЇ ТА ВІДНОВЛЕННЯ
// ==========================================
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/forgot-password', authController.forgotPassword);
router.post('/auth/reset-password', authController.resetPassword);

// ==========================================
// ⭐️ МАРШРУТИ ВІДГУКІВ ТА ОЦІНОК
// ==========================================
// Публічний перегляд відгуків закладу
router.get('/places/:id/reviews', placeController.getPlaceReviews);
// Додавання відгуку (потрібна авторизація)
router.post('/places/:id/reviews', verifyToken, placeController.addReview);

// ==========================================
// 🏬 МАРШРУТИ ЗАКЛАДІВ ТА АКЦІЙ
// ==========================================
// Створення нового закладу (потрібна роль merchant або admin)
router.post('/places', verifyToken, requireMerchant, placeController.createPlace);

// Створення нової акції (потрібна роль merchant або admin)
router.post('/promotions', verifyToken, requireMerchant, promoController.createPromotion);

// ==========================================
// 🛡️ ПАНЕЛЬ АДМІНІСТРАТОРА
// ==========================================
router.get('/admin/pending-places', verifyToken, requireAdmin, placeController.getPendingPlaces);
router.put('/admin/approve-place/:id', verifyToken, requireAdmin, placeController.approvePlace);

module.exports = router;