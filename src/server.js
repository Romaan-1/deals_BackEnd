const express = require('express');
const cors = require('cors');
require('dotenv').config();

const promoRoutes = require('./routes/promoRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', promoRoutes);

const PORT = process.env.PORT || 5000;
app.get('/', (req, res) => {
    res.send('Сервер Promo API працює! Перейдіть на /api/promotions');
});
app.listen(PORT, () => {
    console.log(` Сервер запущено на http://localhost:${PORT}`);
});