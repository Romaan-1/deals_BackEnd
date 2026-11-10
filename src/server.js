const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const multer = require('multer');
const swaggerUi = require('swagger-ui-express');

const app = express();

// Базові мідлвари
app.use(cors());
app.use(express.json());

// 📁 Створення та публічна роздача папки /uploads для збереження фото
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// 📤 Налаштування Multer для завантаження файлів
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// 🖼️ Ендпоінт завантаження зображення
app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Будь ласка, оберіть файл зображення' });
    }
    const imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    res.json({ imageUrl });
});

// 📖 Повна Swagger документація
const swaggerDocument = {
    openapi: '3.0.0',
    info: { title: 'LocaSale API', version: '1.0.0', description: 'REST API платформи акцій' },
    servers: [{ url: 'http://localhost:5000/api' }],
    paths: {
        '/regions': { get: { summary: 'Список міст' }, post: { summary: 'Створити місто' } },
        '/promotions': { get: { summary: 'Список акцій' }, post: { summary: 'Додати акцію' } }
    }
};
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 🔗 Маршрути API
const promoRoutes = require('./routes/promoRoutes');
app.use('/api', promoRoutes);

// Запуск сервера
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Сервер запущено на порту ${PORT} 🚀`);
    console.log(`Swagger: http://localhost:${PORT}/api-docs 📖`);
});