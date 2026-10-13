const express = require('express');
const router = express.Router();
const { getPromotions } = require('../controllers/promoController');

router.get('/promotions', getPromotions);

module.exports = router;