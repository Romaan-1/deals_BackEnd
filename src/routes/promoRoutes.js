const express = require('express');
const router = express.Router();

const {
    getPromotions,
    createPromotion,
    updatePromotion,
    deletePromotion
} = require('../controllers/promoController');

const { register, login } = require('../controllers/authController');
const { createPlace, getMyPlaces } = require('../controllers/placeController');
const { verifyToken, requireMerchant } = require('../middlewares/authMiddleware');

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Реєстрація нового користувача
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, full_name]
 *             properties:
 *               email:
 *                 type: string
 *                 example: merchant@locasale.com
 *               password:
 *                 type: string
 *                 example: secret123
 *               full_name:
 *                 type: string
 *                 example: Піцерія Челентано
 *               role:
 *                 type: string
 *                 enum: [user, merchant, admin]
 *                 example: merchant
 *     responses:
 *       201:
 *         description: Користувач успішно зареєстрований
 */
router.post('/auth/register', register);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Вхід у систему (Отримання JWT)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: merchant@locasale.com
 *               password:
 *                 type: string
 *                 example: secret123
 *     responses:
 *       200:
 *         description: Успішний вхід, повертає token та об'єкт user
 */
router.post('/auth/login', login);

/**
 * @openapi
 * /api/promotions:
 *   get:
 *     summary: Отримати список активних акцій з фільтрацією
 *     tags: [Promotions]
 *     parameters:
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: integer
 *         description: ID категорії
 *       - in: query
 *         name: region_id
 *         schema:
 *           type: integer
 *         description: ID міста/регіону
 *     responses:
 *       200:
 *         description: Масив активних акцій
 */
router.get('/promotions', getPromotions);

/**
 * @openapi
 * /api/promotions:
 *   post:
 *     summary: Створити нову акцію (Тільки для Merchant/Admin)
 *     tags: [Promotions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [place_id, title, discount_value, start_date, end_date]
 *             properties:
 *               place_id:
 *                 type: integer
 *                 example: 1
 *               title:
 *                 type: string
 *                 example: Знижка -30% на піцу Пепероні!
 *               description:
 *                 type: string
 *                 example: При замовленні від 300 грн
 *               discount_value:
 *                 type: string
 *                 example: -30%
 *               start_date:
 *                 type: string
 *                 example: 2026-10-15T08:00:00Z
 *               end_date:
 *                 type: string
 *                 example: 2026-11-15T22:00:00Z
 *     responses:
 *       201:
 *         description: Акцію створено
 */
router.post('/promotions', verifyToken, requireMerchant, createPromotion);

/**
 * @openapi
 * /api/promotions/{id}:
 *   put:
 *     summary: Оновити акцію (Тільки власник закладу або Admin)
 *     tags: [Promotions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               discount_value:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Акцію оновлено
 */
router.put('/promotions/:id', verifyToken, requireMerchant, updatePromotion);

/**
 * @openapi
 * /api/promotions/{id}:
 *   delete:
 *     summary: Видалити акцію
 *     tags: [Promotions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Акцію успішно видалено
 */
router.delete('/promotions/:id', verifyToken, requireMerchant, deletePromotion);

/**
 * @openapi
 * /api/places:
 *   post:
 *     summary: Створити новий заклад (Тільки для Merchant/Admin)
 *     tags: [Places]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [region_id, category_id, name, address]
 *             properties:
 *               region_id:
 *                 type: integer
 *                 example: 1
 *               category_id:
 *                 type: integer
 *                 example: 1
 *               name:
 *                 type: string
 *                 example: Домінос Піца
 *               address:
 *                 type: string
 *                 example: вул. Франка, 10
 *     responses:
 *       201:
 *         description: Заклад створено
 */
router.post('/places', verifyToken, requireMerchant, createPlace);

/**
 * @openapi
 * /api/places/my:
 *   get:
 *     summary: Отримати заклади поточного продавця
 *     tags: [Places]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список моїх закладів
 */
router.get('/places/my', verifyToken, requireMerchant, getMyPlaces);

module.exports = router;