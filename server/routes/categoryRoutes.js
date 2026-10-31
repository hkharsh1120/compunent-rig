const express = require('express');

const {
    getCategories,
    createCategory,
    updateCategory,
    deactivateCategory,
} = require('../controllers/categoryController');

const validate = require('../middleware/validateMiddleware');

const {
    protect,
    authorizeAdmin,
} = require('../middleware/authMiddleware');

const {
    categorySchema,
    updateCategorySchema,
    categoryIdSchema,
} = require('../validators/categoryValidator');

const router = express.Router();

// Public: active categories
router.get('/', getCategories);

// Admin: all categories, including inactive
router.get('/admin/all', protect, authorizeAdmin, getCategories);

// Admin: create category
router.post(
    '/',
    protect,
    authorizeAdmin,
    validate(categorySchema),
    createCategory
);

// Admin: update category
router.patch(
    '/:id',
    protect,
    authorizeAdmin,
    validate(updateCategorySchema),
    updateCategory
);

// Admin: deactivate category
router.delete(
    '/:id',
    protect,
    authorizeAdmin,
    validate(categoryIdSchema),
    deactivateCategory
);

module.exports = router;