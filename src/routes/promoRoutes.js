const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const placeController = require('../controllers/placeController');
const promoController = require('../controllers/promoController');
const favoriteController = require('../controllers/favoriteController');
const regionController = require('../controllers/regionController');
const categoryController = require('../controllers/categoryController');
const adminController = require('../controllers/adminController');

const { verifyToken, requireAdmin, requireMerchant } = require('../middlewares/authMiddleware');

// 🔐 АВТОРИЗАЦІЯ
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/forgot-password', authController.forgotPassword);
router.post('/auth/reset-password', authController.resetPassword);

// 🏷️ КАТЕГОРІЇ ТА РЕГІОНИ
router.get('/categories', categoryController.getCategories);
router.post('/categories', categoryController.createCategory);
router.get('/regions', regionController.getRegions);
router.post('/regions', regionController.createRegion);

// 🏬 ЗАКЛАДИ
router.get('/places/popular', placeController.getPopularPlaces);
router.get('/places/my', verifyToken, requireMerchant, placeController.getMyPlaces);
router.get('/places/:id', placeController.getPlaceById);
router.post('/places', verifyToken, requireMerchant, placeController.createPlace);

// ⭐️ ВІДГУКИ
router.get('/places/:id/reviews', placeController.getPlaceReviews);
router.post('/places/:id/reviews', verifyToken, placeController.addReview);

// 🔥 АКЦІЇ
router.get('/promotions', promoController.getPromotions);
router.post('/promotions', verifyToken, requireMerchant, promoController.createPromotion);
router.put('/promotions/:id', verifyToken, requireMerchant, promoController.updatePromotion);
router.delete('/promotions/:id', verifyToken, requireMerchant, promoController.deletePromotion);

// ❤️ ОБРАНЕ
router.get('/favorites', verifyToken, favoriteController.getMyFavorites);
router.post('/favorites', verifyToken, favoriteController.addFavorite);
router.delete('/favorites/:promotion_id', verifyToken, favoriteController.removeFavorite);

// 🛡️ АДМІН-ПАНЕЛЬ
router.get('/admin/stats', verifyToken, requireAdmin, adminController.getAdminStats);
router.get('/admin/users', verifyToken, requireAdmin, adminController.getAllUsers);
router.put('/admin/users/:id/role', verifyToken, requireAdmin, adminController.updateUserRole);
router.get('/admin/places/pending', verifyToken, requireAdmin, adminController.getPendingPlaces);
router.put('/admin/places/:id/approve', verifyToken, requireAdmin, adminController.approvePlace);

module.exports = router;