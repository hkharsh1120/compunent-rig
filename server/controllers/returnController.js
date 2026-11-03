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
 * Eligible orders: pending, confirmed, processing (NOT shipped/delivered/cancelled/returned)
 * Shipped orders cannot be cancelled - items are in transit
 */
const createCancellationRequest = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { reason } = req.validatedData.body;
    const userId = req.user._id;

    // Find order and verify ownership
    // NOTE: shipped orders are NOT eligible for customer cancellation
    const order = await Order.findOne({
        _id: orderId,
        user: userId,
        orderStatus: { $in: ['pending', 'confirmed', 'processing'] },
    });

    if (!order) {
        throw new ApiError(404, 'Order not found or not eligible for cancellation');
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
        orderStatus: { $in: ['cancelled', 'pending', 'confirmed', 'processing'] },
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

    // Shipped orders are not eligible for customer cancellation
    // Only pending, confirmed, processing can be cancelled
    const isEligible = ['pending', 'confirmed', 'processing'].includes(order.orderStatus);

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
 * ONLY for orders NOT yet shipped - shipped items are in transit
 * Uses existing orderService cancellation logic
 */
const cancelOrder = asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    // Find order and verify ownership
    // Shipped orders cannot be cancelled by customer
    const order = await Order.findOne({
        _id: orderId,
        user: req.user._id,
        orderStatus: { $in: ['pending', 'confirmed', 'processing'] },
    });

    if (!order) {
        throw new ApiError(404, 'Order not found or not eligible for cancellation');
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
 * Uses deliveredAt timestamp for accurate return window calculation
 */
const createReturnRequest = asyncHandler(async (req, res) => {
    const { orderId } = req.validatedData.params;
    const { reason, description, items } = req.validatedData.body;
    const userId = req.user._id;

    // Find order and verify ownership
    // Must be delivered to be returnable
    const order = await Order.findOne({
        _id: orderId,
        user: userId,
        orderStatus: 'delivered',
    });

    if (!order) {
        throw new ApiError(404, 'Order not found or not eligible for return (only delivered orders can be returned)');
    }

    // Check return window using deliveredAt timestamp
    // Default: 7 days from delivery
    const returnWindowDays = parseInt(process.env.RETURN_WINDOW_DAYS || '7', 10);

    // Use deliveredAt if available, otherwise fall back to createdAt + delivery marker
    const deliveryDate = order.deliveredAt || order.updatedAt;
    const cutoffDate = new Date(deliveryDate);
    cutoffDate.setDate(cutoffDate.getDate() + returnWindowDays);

    if (new Date() > cutoffDate) {
        throw new ApiError(400, `Return window of ${returnWindowDays} days has expired. Returns can only be requested within ${returnWindowDays} days of delivery.`);
    }

    // Verify items belong to this order
    const orderItemProducts = order.items.map(item => item.product.toString());
    for (const item of items) {
        if (!orderItemProducts.includes(item.productId)) {
            throw new ApiError(400, `Item ${item.productId} not found in this order`);
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
            itemsCount: returnItems.length,
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
 * Only owner can view their own return requests
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
            order: request.order,
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
 * This restores inventory for returned items ONLY when physically received
 * CRITICAL: Inventory is NOT restored on approval, only on receipt
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

            // Track if any stock was restored
            let totalQuantityRestored = 0;

            // Process each item in the return request
            for (const itemReq of request.items) {
                // Find the matching received item
                const receivedItem = itemsReceived.find(ri => {
                    // Match by various possible formats
                    return ri.itemId === itemReq.product?.toString() ||
                           ri.itemId?.toString() === itemReq.product?.toString();
                });

                // Mark status based on actual receipt
                if (receivedItem && receivedItem.inGoodCondition) {
                    // Item received in good condition - restore inventory
                    const productId = itemReq.product;
                    const quantity = itemReq.quantity;

                    // Get current inventory
                    const product = await Product.findById(productId).session(session);
                    if (!product) {
                        // Product not found, skip this item
                        itemReq.status = 'error';
                        continue;
                    }

                    const previousStock = product.stock;

                    // Prevent double-restoration: check if this return already processed
                    // This is ensured by the status transition from 'approved' to 'completed'

                    // Update product stock
                    await Product.updateOne(
                        { _id: productId },
                        { $inc: { stock: quantity } },
                        { session }
                    );

                    const newStock = previousStock + quantity;
                    totalQuantityRestored += quantity;

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

                    itemReq.status = 'completed';
                } else if (receivedItem && !receivedItem.inGoodCondition) {
                    itemReq.status = 'partial';
                    // Partial returns don't restore full quantity
                } else {
                    itemReq.status = 'pending';
                }
            }

            // Update order status to returned
            order.orderStatus = 'returned';
            await order.save({ session });

            // Update return request
            request.status = 'completed';
            request.adminNotes = notes || '';
            request.processedBy = req.user._id;
            request.processedAt = new Date();
            request.stockReturnReference = totalQuantityRestored > 0
                ? `Stock restored: ${totalQuantityRestored} items`
                : 'No stock restored (partial/completed return)';

            await request.save({ session });
        });

        res.json({
            message: 'Return completed. Inventory has been restored.',
            returnRequest: {
                _id: request._id,
                status: request.status,
                quantityRestored: totalQuantityRestored || 0,
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