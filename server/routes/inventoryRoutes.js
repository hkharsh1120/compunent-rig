const express = require('express');

const validate = require('../middleware/validateMiddleware');

const {
    protect,
    authorizeAdmin,
} = require('../middleware/authMiddleware');

const {
    getOverview,
    getProducts,
    getProductHistory,
    adjustStockHandler,
} = require('../controllers/inventoryController');

const {
    adjustStockSchema,
    productHistorySchema,
    productQuerySchema,
    overviewQuerySchema,
} = require('../validators/inventoryValidator');

const router = express.Router();

// All inventory routes are admin-only
router.use(protect, authorizeAdmin);

// GET /api/inventory/overview - Get inventory overview stats
router.get('/overview', validate(overviewQuerySchema), getOverview);

// GET /api/inventory/products - Get products with stock info
router.get('/products', validate(productQuerySchema), getProducts);

// GET /api/inventory/products/:productId/history - Get product stock history
router.get(
    '/products/:productId/history',
    validate(productHistorySchema),
    getProductHistory
);

// POST /api/inventory/products/:productId/adjust - Adjust product stock
router.post(
    '/products/:productId/adjust',
    validate(adjustStockSchema),
    adjustStockHandler
);

module.exports = router;