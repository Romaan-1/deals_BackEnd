require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const promoRoutes = require('./routes/promoRoutes');
app.use('/api', promoRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Сервер успішно запущено на порту ${PORT} 🚀`);
});