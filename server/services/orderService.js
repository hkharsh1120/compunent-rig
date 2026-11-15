const mongoose = require('mongoose');
const crypto = require('crypto');

const Order = require('../models/Order');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');

const createOrder = async (userId, data) => {
    const session = await mongoose.startSession();

    try {
        let createdOrder;

        await session.withTransaction(async () => {
            // Combine duplicate product IDs in the cart
            // Use string representation as Map keys for consistent lookups
            const quantities = new Map();

            for (const item of data.items) {
                const productIdStr = item.productId.toString();
                quantities.set(
                    productIdStr,
                    (quantities.get(productIdStr) || 0) + item.quantity
                );
            }

            const productIds = [...quantities.keys()];

            const products = await Product.find({
                _id: { $in: productIds },
                isActive: true,
            }).session(session);

            if (products.length !== productIds.length) {
                throw new ApiError(
                    400,
                    'One or more products are unavailable'
                );
            }

            const orderItems = [];
            let subtotal = 0;

            for (const product of products) {
                const quantity = quantities.get(product._id.toString());

                if (product.stock < quantity) {
                    throw new ApiError(
                        400,
                        `Insufficient stock for ${product.name}`
                    );
                }

                const itemSubtotal = product.price * quantity;
                subtotal += itemSubtotal;

                orderItems.push({
                    product: product._id,
                    name: product.name,
                    sku: product.sku,
                    image: product.images?.[0]?.url || '',
                    quantity,
                    price: product.price,
                    subtotal: itemSubtotal,
                });
            }

            // No discounts: the order total is the product subtotal.
            const totalAmount = subtotal;

            // Reduce stock only when sufficient stock remains.
            for (const item of orderItems) {
                const result = await Product.updateOne(
                    {
                        _id: item.product,
                        isActive: true,
                        stock: { $gte: item.quantity },
                    },
                    {
                        $inc: { stock: -item.quantity },
                    },
                    { session }
                );

                if (result.modifiedCount !== 1) {
                    throw new ApiError(
                        409,
                        `Stock changed while placing order for ${item.name}. Please try again.`
                    );
                }
            }

            const orderNumber = `CR-${Date.now()}-${crypto
                .randomBytes(3)
                .toString('hex')
                .toUpperCase()}`;

            // Build order object
            const orderDoc = {
                orderNumber,
                user: userId,
                items: orderItems,
                customerDetails: {
                    ...data.customerDetails,
                    email: data.customerDetails.email.toLowerCase(),
                },
                subtotal,
                totalAmount,
                paymentMethod: data.paymentMethod,
                notes: data.notes || '',
            };

            const [order] = await Order.create([orderDoc], { session });

            createdOrder = order;
        });

        return createdOrder;
    } finally {
        await session.endSession();
    }
};

const getMyOrders = async (userId) => {
    return Order.find({ user: userId })
        .sort({ createdAt: -1 })
        .populate('items.product', 'name slug');
};

const getOrderById = async (orderId, userId, isAdmin = false) => {
    const filter = { _id: orderId };

    if (!isAdmin) {
        filter.user = userId;
    }

    const order = await Order.findOne(filter)
        .populate('items.product', 'name slug');

    if (!order) {
        throw new ApiError(404, 'Order not found');
    }

    return order;
};

const getAllOrders = async (filters = {}) => {
    const query = {};

    if (filters.status) {
        query.orderStatus = filters.status;
    }

    return Order.find(query)
        .populate('user', 'name email')
        .sort({ createdAt: -1 });
};

const updateOrderStatus = async (id, orderStatus) => {
    const order = await Order.findById(id);

    if (!order) {
        throw new ApiError(404, 'Order not found');
    }

    if (['cancelled', 'delivered', 'returned'].includes(order.orderStatus)) {
        throw new ApiError(
            400,
            `A ${order.orderStatus} order cannot be updated`
        );
    }

    if (orderStatus === 'cancelled') {
        const session = await mongoose.startSession();

        try {
            await session.withTransaction(async () => {
                const currentOrder = await Order.findById(id).session(session);

                if (!currentOrder) {
                    throw new ApiError(404, 'Order not found');
                }

                if (currentOrder.orderStatus === 'cancelled') {
                    throw new ApiError(400, 'Order is already cancelled');
                }

                if (currentOrder.orderStatus === 'delivered' || currentOrder.orderStatus === 'returned') {
                    throw new ApiError(400, 'Cannot cancel a delivered/returned order');
                }

                if (currentOrder.orderStatus === 'shipped') {
                    throw new ApiError(400, 'Cannot cancel a shipped order - items are in transit');
                }

                // Restore stock for every item in the order
                for (const item of currentOrder.items) {
                    await Product.updateOne(
                        { _id: item.product },
                        { $inc: { stock: item.quantity } },
                        { session }
                    );
                }

                currentOrder.orderStatus = 'cancelled';
                currentOrder.updatedAt = new Date();
                await currentOrder.save({ session });
            });
        } finally {
            await session.endSession();
        }

        return Order.findById(id);
    }

    // For delivered status, set deliveredAt timestamp
    if (orderStatus === 'delivered') {
        order.orderStatus = orderStatus;
        order.deliveredAt = order.deliveredAt || new Date();
        await order.save();
        return order;
    }

    order.orderStatus = orderStatus;
    await order.save();

    return order;
};

const cancelMyOrder = async (orderId, userId) => {
    const order = await Order.findOne({
        _id: orderId,
        user: userId,
        orderStatus: { $in: ['pending', 'confirmed', 'processing'] },
    });

    if (!order) {
        throw new ApiError(
            404,
            'Order not found or not eligible for cancellation'
        );
    }

    return updateOrderStatus(orderId, 'cancelled');
};

module.exports = {
    createOrder,
    getMyOrders,
    getOrderById,
    getAllOrders,
    updateOrderStatus,
    cancelMyOrder,
};