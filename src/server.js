require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');

// Завантажуємо згенеровану документацію Swagger
// (Якщо swagger.json лежить у корінні проєкту, вкажіть '../swagger.json')
const swaggerDocument = require('./swagger.json');

const app = express();

// Базові мідлвари
app.use(cors());
app.use(express.json());

// 📖 Підключення Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 🔗 Головні маршрути API
const promoRoutes = require('./routes/promoRoutes');
app.use('/api', promoRoutes);

// Запуск сервера
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Сервер успішно запущено на порту ${PORT} 🚀`);
    console.log(`Swagger UI доступний за адресою: http://localhost:${PORT}/api-docs 📖`);
});