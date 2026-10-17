const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
require('dotenv').config();

const promoRoutes = require('./routes/promoRoutes');
const { getCategories, createCategory } = require('./controllers/categoryController');
const { getRegions, createRegion } = require('./controllers/regionController');

const app = express();
app.use(cors());
app.use(express.json());

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Promo REST API 🏷️',
            version: '1.0.0',
            description: 'Інтерактивна документація та панель тестування API для проєкту Promo',
        },
        servers: [
            {
                url: 'http://localhost:5000',
                description: 'Локальний сервер розробки',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Введіть JWT токен, отриманий після реєстрації або входу',
                },
            },
        },
    },
    apis: ['./src/routes/*.js', './src/server.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api', promoRoutes);

app.get('/api/categories', getCategories);
app.post('/api/categories', createCategory);
app.get('/api/regions', getRegions);
app.post('/api/regions', createRegion);

app.get('/', (req, res) => {
    res.send('🚀 Сервер LocaSale API працює! Документація доступна на /api-docs');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущено на http://localhost:${PORT}`);
    console.log(`📚 Swagger UI документація доступна на: http://localhost:5000/api-docs`);
});