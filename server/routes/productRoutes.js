const express = require('express');

const {
    getProducts,
    getAdminProducts,
    getProductBySlug,
    createProduct,
    updateProduct,
    deactivateProduct,
} = require('../controllers/productController');

const validate = require('../middleware/validateMiddleware');

const {
    protect,
    authorizeAdmin,
} = require('../middleware/authMiddleware');

const {
    productSchema,
    updateProductSchema,
    productIdSchema,
    productQuerySchema,
} = require('../validators/productValidator');

const router = express.Router();

// Public catalogue
router.get('/', validate(productQuerySchema), getProducts);

// Admin catalogue including inactive products
router.get(
    '/admin/all',
    protect,
    authorizeAdmin,
    validate(productQuerySchema),
    getAdminProducts
);

// Product details
router.get('/:slug', getProductBySlug);

// Admin product management
router.post(
    '/',
    protect,
    authorizeAdmin,
    validate(productSchema),
    createProduct
);

router.patch(
    '/:id',
    protect,
    authorizeAdmin,
    validate(updateProductSchema),
    updateProduct
);

router.delete(
    '/:id',
    protect,
    authorizeAdmin,
    validate(productIdSchema),
    deactivateProduct
);

module.exports = router;