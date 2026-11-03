const express = require('express');

const {
    createOrder,
    getMyOrders,
    getOrderById,
    getAllOrders,
    updateOrderStatus,
} = require('../controllers/orderController');

const validate = require('../middleware/validateMiddleware');

const {
    protect,
    authorizeAdmin,
} = require('../middleware/authMiddleware');

const {
    orderSchema,
    updateOrderStatusSchema,
} = require('../validators/orderValidator');

const router = express.Router();

// All order routes require authentication
router.use(protect);

// Customer: create order
router.post(
    '/',
    validate(orderSchema),
    createOrder
);

// Customer: own order history
router.get('/my-orders', getMyOrders);

// Admin: all orders
router.get(
    '/admin/all',
    authorizeAdmin,
    getAllOrders
);

// Admin: update order status
router.patch(
    '/admin/:id/status',
    authorizeAdmin,
    validate(updateOrderStatusSchema),
    updateOrderStatus
);

// Customer: own order details; admin: any order
router.get('/:id', validate(orderSchema), getOrderById);

module.exports = router;