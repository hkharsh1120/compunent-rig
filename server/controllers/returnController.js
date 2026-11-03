const mongoose = require('mongoose');

const Order = require('../models/Order');
const Product = require('../models/Product');
const StockHistory = require('../models/StockHistory');
const Coupon = require('../models/Coupon');
const ReturnRequest = require('../models/ReturnRequest');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// ============================================
// CANCELLATION CONTROLLERS
// ============================================

/**
 * Create a cancellation request for an order
 * Eligible orders: pending, confirmed, processing, shipped (not delivered/cancelled)
 */
const createCancellationRequest = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { reason } = req.validatedData.body;
    const userId = req.user._id;

    // Find order and verify ownership
    const order = await Order.findOne({
        _id: orderId,
        user: userId,
        orderStatus: { $in: ['pending', 'confirmed', 'processing', 'shipped'] },
    });

    if (!order) {
        throw new ApiError(404, 'Order not found or not eligible for cancellation');
    }

    // Check if already cancelled or delivered
    if (order.orderStatus === 'cancelled' || order.orderStatus === 'delivered') {
        throw new ApiError(400, `Cannot cancel a ${order.orderStatus} order`);
    }

    res.json({
        message: 'Cancellation request created successfully',
        order: {
            _id: order._id,
            orderNumber: order.orderNumber,
            orderStatus: order.orderStatus,
            canCancel: true,
        },
    });
});

/**
 * Get my cancellation requests
 */
const getMyCancellationRequests = asyncHandler(async (req, res) => {
    const requests = await Order.find({
        user: req.user._id,
        orderStatus: { $in: ['cancelled', 'pending', 'confirmed', 'processing', 'shipped'] },
    }).select('orderNumber orderStatus totalAmount createdAt updatedAt')
      .sort({ createdAt: -1 });

    res.json(requests);
});

/**
 * Get cancellation status for specific order
 */
const getOrderCancellation = asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    const order = await Order.findOne({
        _id: orderId,
        user: req.user._id,
    });

    if (!order) {
        throw new ApiError(404, 'Order not found');
    }

    const isEligible = ['pending', 'confirmed', 'processing', 'shipped'].includes(order.orderStatus);

    res.json({
        order: {
            _id: order._id,
            orderNumber: order.orderNumber,
            orderStatus: order.orderStatus,
            canCancel: isEligible,
            totalAmount: order.totalAmount,
            createdAt: order.createdAt,
        },
    });
});

/**
 * Cancel order (executes the cancellation with inventory restoration)
 */
const cancelOrder = asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    // Find order and verify ownership
    const order = await Order.findOne({
        _id: orderId,
        user: req.user._id,
        orderStatus: { $in: ['pending', 'confirmed', 'processing', 'shipped'] },
    });

    if (!order) {
        throw new ApiError(404, 'Order not found or not eligible for cancellation');
    }

    if (order.orderStatus === 'cancelled' || order.orderStatus === 'delivered') {
        throw new ApiError(400, `Cannot cancel a ${order.orderStatus} order`);
    }

    // Use existing cancellation logic from orderService
    const orderService = require('../services/orderService');
    const cancelledOrder = await orderService.updateOrderStatus(orderId, 'cancelled');

    res.json({
        message: 'Order cancelled successfully. Inventory has been restored.',
        order: {
            _id: cancelledOrder._id,
            orderNumber: cancelledOrder.orderNumber,
            orderStatus: cancelledOrder.orderStatus,
        },
    });
});

// ============================================
// RETURN CONTROLLERS
// ============================================

/**
 * Create a return request for an order
 * Only for delivered orders within configured return window
 */
const createReturnRequest = asyncHandler(async (req, res) => {
    const { orderId } = req.validatedData.params;
    const { reason, description, items } = req.validatedData.body;
    const userId = req.user._id;

    // Find order and verify ownership
    const order = await Order.findOne({
        _id: orderId,
        user: userId,
        orderStatus: 'delivered',
    });

    if (!order) {
        throw new ApiError(404, 'Order not found or not eligible for return');
    }

    // Check return window (7 days from delivery by default)
    // Configurable via environment variable
    const returnWindowDays = parseInt(process.env.RETURN_WINDOW_DAYS || '7', 10);
    const deliveryDate = order.updatedAt; // Use updated timestamp as proxy for delivery
    const cutoffDate = new Date(deliveryDate);
    cutoffDate.setDate(cutoffDate.getDate() + returnWindowDays);

    if (new Date() > cutoffDate) {
        throw new ApiError(400, `Return window of ${returnWindowDays} days has expired`);
    }

    // Verify items belong to this order
    const orderItemIds = order.items.map(item => item.product.toString());
    for (const item of items) {
        if (!orderItemIds.includes(item.productId)) {
            throw new ApiError(400, `Item ${item.productId} not in this order`);
        }
    }

    // Create return request
    const returnItems = items.map(item => ({
        product: item.productId,
        quantity: item.quantity,
        condition: item.condition,
    }));

    const returnRequest = await ReturnRequest.create({
        order: orderId,
        user: userId,
        reason,
        description,
        items: returnItems,
    });

    res.status(201).json({
        message: 'Return request created successfully. Await admin approval.',
        returnRequest: {
            _id: returnRequest._id,
            order: orderId,
            status: returnRequest.status,
            items: returnItems.length,
            reason,
        },
    });
});

/**
 * Get my return requests
 */
const getMyReturnRequests = asyncHandler(async (req, res) => {
    const requests = await ReturnRequest.find({ user: req.user._id })
        .populate('order', 'orderNumber totalAmount orderStatus')
        .sort({ createdAt: -1 });

    res.json(requests);
});

/**
 * Get specific return request (customer view)
 */
const getReturnRequest = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const request = await ReturnRequest.findOne({
        _id: id,
        user: req.user._id,
    }).populate('order', 'orderNumber totalAmount customerDetails');

    if (!request) {
        throw new ApiError(404, 'Return request not found');
    }

    res.json(request);
});

/**
 * Admin: Get all return requests
 */
const adminGetReturnRequests = asyncHandler(async (req, res) => {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) {
        query.status = status;
    }

    const requests = await ReturnRequest.find(query)
        .populate('order', 'orderNumber totalAmount orderStatus user')
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit, 10));

    const total = await ReturnRequest.countDocuments(query);

    res.json({
        requests,
        pagination: {
            total,
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            totalPages: Math.ceil(total / limit),
        },
    });
});

/**
 * Admin: Approve return request
 */
const adminApproveReturnRequest = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { notes } = req.validatedData.body;

    const request = await ReturnRequest.findById(id);
    if (!request) {
        throw new ApiError(404, 'Return request not found');
    }

    if (request.status !== 'pending') {
        throw new ApiError(400, `Return request is already ${request.status}`);
    }

    request.status = 'approved';
    request.adminNotes = notes;
    request.processedBy = req.user._id;
    request.processedAt = new Date();

    await request.save();

    res.json({
        message: 'Return request approved. Customer will be notified.',
        returnRequest: {
            _id: request._id,
            status: request.status,
        },
    });
});

/**
 * Admin: Reject return request
 */
const adminRejectReturnRequest = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { notes } = req.validatedData.body;

    const request = await ReturnRequest.findById(id);
    if (!request) {
        throw new ApiError(404, 'Return request not found');
    }

    if (request.status !== 'pending') {
        throw new ApiError(400, `Return request is already ${request.status}`);
    }

    request.status = 'rejected';
    request.adminNotes = notes;
    request.processedBy = req.user._id;
    request.processedAt = new Date();

    await request.save();

    res.json({
        message: 'Return request rejected.',
        returnRequest: {
            _id: request._id,
            status: request.status,
        },
    });
});

/**
 * Admin: Mark returned items as received and complete return
 * This restores inventory for returned items
 */
const completeReturn = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { itemsReceived, notes } = req.validatedData.body;

    const request = await ReturnRequest.findById(id);
    if (!request) {
        throw new ApiError(404, 'Return request not found');
    }

    if (request.status !== 'approved') {
        throw new ApiError(400, `Return request must be approved before receiving items (current status: ${request.status})`);
    }

    const session = await mongoose.startSession();

    try {
        await session.withTransaction(async () => {
            const order = await Order.findById(request.order).session(session);
            if (!order) {
                throw new ApiError(404, 'Associated order not found');
            }

            // Update item statuses
            for (const itemReq of request.items) {
                const receivedItem = itemsReceived.find(
                    ri => ri.itemId === itemReq._id || ri.itemId?.toString() === itemReq._id?.toString() ||
                          (itemReq.product && ri.itemId?.toString() === itemReq.product.toString())
                );

                if (receivedItem) {
                    itemReq.status = receivedItem.inGoodCondition ? 'completed' : 'partial';
                }
            }

            // Calculate quantities to restore
            let totalQuantityRestored = 0;

            for (const itemReq of request.items) {
                if (itemReq.status === 'completed' || itemReq.status === 'partial') {
                    const productId = itemReq.product;
                    const quantity = itemReq.quantity;

                    // Get current inventory
                    const product = await Product.findById(productId).session(session);
                    if (!product) continue;

                    const previousStock = product.stock;
                    const newStock = previousStock + quantity;
                    totalQuantityRestored += quantity;

                    // Update product stock
                    await Product.updateOne(
                        { _id: productId },
                        { $inc: { stock: quantity } },
                        { session }
                    );

                    // Create stock history entry for return
                    await StockHistory.create([{
                        product: productId,
                        change: quantity,
                        type: 'return',
                        reference: `Return ${request._id}`,
                        previousStock,
                        newStock,
                        reason: `Return completed: ${request.reason || 'Customer return'}`,
                        changedBy: req.user._id,
                    }], { session });
                }
            }

            // Update order status to returned
            order.orderStatus = 'returned';
            await order.save({ session });

            // Update return request
            request.status = 'completed';
            request.adminNotes = notes;
            request.processedBy = req.user._id;
            request.processedAt = new Date();
            request.stockReturnReference = `Stock restored: ${totalQuantityRestored} items`;

            await request.save({ session });
        });

        res.json({
            message: 'Return completed. Inventory has been restored.',
            returnRequest: {
                _id: request._id,
                status: request.status,
            },
        });
    } finally {
        await session.endSession();
    }
});

module.exports = {
    createCancellationRequest,
    getMyCancellationRequests,
    getOrderCancellation,
    cancelOrder,
    createReturnRequest,
    getMyReturnRequests,
    getReturnRequest,
    adminGetReturnRequests,
    adminApproveReturnRequest,
    adminRejectReturnRequest,
    completeReturn,
};