const swaggerDocument = {
    openapi: '3.0.0',
    info: {
        title: 'LocaSale API',
        version: '1.0.0',
        description: 'REST API платформи локальних знижок та акцій «Promo»'
    },
    servers: [
        {
            url: 'http://localhost:5000/api',
            description: 'Локальний сервер розробки'
        }
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'Введіть JWT-токен, отриманий після /auth/login'
            }
        }
    },
    tags: [
        { name: 'Auth', description: 'Реєстрація, вхід та відновлення пароля' },
        { name: 'Regions & Categories', description: 'Міста та категорії акцій' },
        { name: 'Promotions', description: 'Акції та знижки' },
        { name: 'Places', description: 'Заклади та магазини' },
        { name: 'Reviews', description: 'Відгуки та рейтинг закладів' },
        { name: 'Favorites', description: 'Обрані акції користувача' },
        { name: 'Upload', description: 'Завантаження зображень' },
        { name: 'Admin', description: 'Адміністрування та статистика' }
    ],
    paths: {
        // ================= AUTH =================
        '/auth/register': {
            post: {
                tags: ['Auth'],
                summary: 'Реєстрація нового користувача або мерчанта',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['email', 'password', 'full_name'],
                                properties: {
                                    email: { type: 'string', example: 'user@example.com' },
                                    password: { type: 'string', example: '123456' },
                                    full_name: { type: 'string', example: 'Роман Григоришин' },
                                    role: { type: 'string', enum: ['user', 'merchant'], example: 'user' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: { description: 'Користувача створено' },
                    400: { description: 'Помилка валідації або email вже зайнятий' }
                }
            }
        },
        '/auth/login': {
            post: {
                tags: ['Auth'],
                summary: 'Вхід у систему та отримання JWT-токена',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['email', 'password'],
                                properties: {
                                    email: { type: 'string', example: 'admin@promo.ua' },
                                    password: { type: 'string', example: 'admin123' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: { description: 'Успішний вхід (повертає token і дані user)' },
                    401: { description: 'Невірний email або пароль' }
                }
            }
        },
        '/auth/forgot-password': {
            post: {
                tags: ['Auth'],
                summary: 'Запит на відновлення пароля',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['email'],
                                properties: {
                                    email: { type: 'string', example: 'user@example.com' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: { description: 'Інструкції для скидання пароля сформовано' }
                }
            }
        },
        '/auth/reset-password': {
            post: {
                tags: ['Auth'],
                summary: 'Встановлення нового пароля',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['token', 'newPassword'],
                                properties: {
                                    token: { type: 'string' },
                                    newPassword: { type: 'string', example: 'newpass123' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: { description: 'Пароль успішно змінено' }
                }
            }
        },

        // ================= REGIONS & CATEGORIES =================
        '/regions': {
            get: {
                tags: ['Regions & Categories'],
                summary: 'Список міст',
                responses: {
                    200: { description: 'Масив доступних міст' }
                }
            },
            post: {
                tags: ['Regions & Categories'],
                summary: 'Створити місто',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['name'],
                                properties: {
                                    name: { type: 'string', example: 'Коломия' },
                                    slug: { type: 'string', example: 'kolomyia' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: { description: 'Місто додано' }
                }
            }
        },
        '/categories': {
            get: {
                tags: ['Regions & Categories'],
                summary: 'Список категорій',
                responses: {
                    200: { description: 'Масив категорій' }
                }
            },
            post: {
                tags: ['Regions & Categories'],
                summary: 'Створити категорію',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['name'],
                                properties: {
                                    name: { type: 'string', example: 'Кавʼярні та кафе' },
                                    icon: { type: 'string', example: '☕' },
                                    slug: { type: 'string', example: 'cafes' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: { description: 'Категорію створено' }
                }
            }
        },

        // ================= PROMOTIONS =================
        '/promotions': {
            get: {
                tags: ['Promotions'],
                summary: 'Список акцій з фільтрацією',
                parameters: [
                    {
                        name: 'category_id',
                        in: 'query',
                        required: false,
                        schema: { type: 'integer' },
                        description: 'ID категорії для фільтрації'
                    },
                    {
                        name: 'region_id',
                        in: 'query',
                        required: false,
                        schema: { type: 'integer' },
                        description: 'ID міста для фільтрації'
                    },
                    {
                        name: 'search',
                        in: 'query',
                        required: false,
                        schema: { type: 'string' },
                        description: 'Пошук за назвою акції або закладу'
                    }
                ],
                responses: {
                    200: { description: 'Список активних акцій' }
                }
            },
            post: {
                tags: ['Promotions'],
                summary: 'Додати акцію (Merchant / Admin)',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['place_id', 'title', 'discount_value'],
                                properties: {
                                    place_id: { type: 'integer', example: 1 },
                                    title: { type: 'string', example: 'Знижка -30% на всю каву' },
                                    description: { type: 'string', example: 'Діє щодня до 12:00' },
                                    discount_value: { type: 'string', example: '-30%' },
                                    image_url: { type: 'string', example: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93' },
                                    link_url: { type: 'string', example: 'https://example.com/promo' },
                                    start_date: { type: 'string', format: 'date-time' },
                                    end_date: { type: 'string', format: 'date-time' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: { description: 'Акцію створено' },
                    403: { description: 'Недостатньо прав' }
                }
            }
        },
        '/promotions/{id}': {
            put: {
                tags: ['Promotions'],
                summary: 'Редагувати акцію (Merchant / Admin)',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    title: { type: 'string' },
                                    description: { type: 'string' },
                                    discount_value: { type: 'string' },
                                    is_active: { type: 'boolean' },
                                    link_url: { type: 'string' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: { description: 'Акцію оновлено' },
                    404: { description: 'Акцію не знайдено' }
                }
            },
            delete: {
                tags: ['Promotions'],
                summary: 'Видалити акцію (Власник або Admin)',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                responses: {
                    200: { description: 'Акцію видалено' },
                    403: { description: 'Немає прав для видалення' }
                }
            }
        },

        // ================= PLACES =================
        '/places/popular': {
            get: {
                tags: ['Places'],
                summary: 'Список популярних верифікованих закладів',
                responses: {
                    200: { description: 'Топ-10 закладів за рейтингом' }
                }
            }
        },
        '/places/my': {
            get: {
                tags: ['Places'],
                summary: 'Мої заклади (кабінет Merchant)',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: 'Список закладів поточного користувача' }
                }
            }
        },
        '/places/{id}': {
            get: {
                tags: ['Places'],
                summary: 'Детальна інформація про заклад та його акції',
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                responses: {
                    200: { description: 'Обʼєкт { place, promotions }' },
                    404: { description: 'Заклад не знайдено' }
                }
            }
        },
        '/places': {
            post: {
                tags: ['Places'],
                summary: 'Створити новий заклад (Merchant / Admin)',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['name', 'address', 'category_id', 'region_id'],
                                properties: {
                                    name: { type: 'string', example: 'Львівські Круасани' },
                                    address: { type: 'string', example: 'вул. Галицька, 1' },
                                    category_id: { type: 'integer', example: 2 },
                                    region_id: { type: 'integer', example: 2 },
                                    logo_url: { type: 'string', example: '🥐' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: { description: 'Заклад створено' }
                }
            }
        },

        // ================= REVIEWS =================
        '/places/{id}/reviews': {
            get: {
                tags: ['Reviews'],
                summary: 'Отримати всі відгуки про заклад',
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                responses: {
                    200: { description: 'Список відгуків із оцінками' }
                }
            },
            post: {
                tags: ['Reviews'],
                summary: 'Додати або оновити відгук про заклад',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['rating'],
                                properties: {
                                    rating: { type: 'integer', minimum: 1, maximum: 5, example: 5 },
                                    comment: { type: 'string', example: 'Чудовий сервіс і швидке обслуговування!' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: { description: 'Відгук збережено, рейтинг оновлено' }
                }
            }
        },
        '/reviews/{reviewId}': {
            delete: {
                tags: ['Reviews'],
                summary: 'Видалити відгук (власний для user, будь-який для admin)',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'reviewId', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                responses: {
                    200: { description: 'Відгук видалено' },
                    403: { description: 'Можна видаляти лише власні відгуки' }
                }
            }
        },

        // ================= FAVORITES =================
        '/favorites': {
            get: {
                tags: ['Favorites'],
                summary: 'Отримати список обраних акцій користувача',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: 'Масив збережених акцій' }
                }
            },
            post: {
                tags: ['Favorites'],
                summary: 'Додати акцію в обране',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['promotion_id'],
                                properties: {
                                    promotion_id: { type: 'integer', example: 1 }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: { description: 'Акцію додано в обране' }
                }
            }
        },
        '/favorites/{promotion_id}': {
            delete: {
                tags: ['Favorites'],
                summary: 'Видалити акцію з обраного',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'promotion_id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                responses: {
                    200: { description: 'Акцію видалено з обраного' }
                }
            }
        },

        // ================= UPLOAD =================
        '/upload': {
            post: {
                tags: ['Upload'],
                summary: 'Завантажити зображення на сервер (Multer)',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'multipart/form-data': {
                            schema: {
                                type: 'object',
                                properties: {
                                    image: { type: 'string', format: 'binary' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: { description: 'Повертає URL завантаженого файлу' }
                }
            }
        },

        // ================= ADMIN =================
        '/admin/stats': {
            get: {
                tags: ['Admin'],
                summary: 'Загальна статистика платформи (Admin)',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: 'Статистика закладів, акцій та користувачів' }
                }
            }
        },
        '/admin/users': {
            get: {
                tags: ['Admin'],
                summary: 'Список усіх користувачів (Admin)',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: 'Масив зареєстрованих користувачів' }
                }
            }
        },
        '/admin/users/{id}/role': {
            put: {
                tags: ['Admin'],
                summary: 'Змінити роль користувача (Admin)',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['role'],
                                properties: {
                                    role: { type: 'string', enum: ['user', 'merchant', 'admin'], example: 'merchant' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: { description: 'Роль користувача оновлено' }
                }
            }
        },
        '/admin/places/pending': {
            get: {
                tags: ['Admin'],
                summary: 'Заклади, що очікують на модерацію (Admin)',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: 'Список непідтверджених закладів' }
                }
            }
        },
        '/admin/places/{id}/approve': {
            put: {
                tags: ['Admin'],
                summary: 'Підтвердити або відхилити заклад (Admin)',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['is_verified'],
                                properties: {
                                    is_verified: { type: 'boolean', example: true }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: { description: 'Статус верифікації закладу оновлено' }
                }
            }
        }
    }
};

module.exports = swaggerDocument;