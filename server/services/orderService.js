const mongoose = require('mongoose');
const crypto = require('crypto');

const Order = require('../models/Order');
const Product = require('../models/Product');
const StockHistory = require('../models/StockHistory');
const Coupon = require('../models/Coupon');
const ApiError = require('../utils/ApiError');

const createOrder = async (userId, data) => {
    const session = await mongoose.startSession();

    try {
        let createdOrder;

        await session.withTransaction(async () => {
            // Combine duplicate product IDs in the cart
            const quantities = new Map();

            for (const item of data.items) {
                quantities.set(
                    item.productId,
                    (quantities.get(item.productId) || 0) + item.quantity
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

            // Calculate coupon discount
            let discount = 0;
            let couponInfo = {
                code: '',
                type: '',
                value: 0,
                maxDiscount: 0,
            };

            if (data.coupon?.code) {
                const coupon = await Coupon.findOne({
                    code: data.coupon.code,
                }).session(session);

                if (!coupon || !coupon.isActive) {
                    throw new ApiError(400, 'Invalid or inactive coupon code');
                }

                // Check expiration
                if (coupon.expiryDate && coupon.expiryDate < new Date()) {
                    throw new ApiError(400, 'Coupon has expired');
                }

                // Check start date
                if (coupon.startDate && coupon.startDate > new Date()) {
                    throw new ApiError(400, 'Coupon is not yet active');
                }

                // Check min order amount
                if (coupon.minOrderAmount > subtotal) {
                    throw new ApiError(
                        400,
                        `Minimum order amount of ₹${coupon.minOrderAmount} required`
                    );
                }

                // Check usage limit
                if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
                    throw new ApiError(400, 'Coupon usage limit reached');
                }

                // Check per-customer limit
                if (coupon.perCustomerLimit) {
                    const customerUsage = coupon.customerUsages.find(
                        u => u.user.equals(userId)
                    );
                    if (customerUsage && customerUsage.count >= coupon.perCustomerLimit) {
                        throw new ApiError(400, 'You have already used this coupon the maximum number of times');
                    }
                }

                // Calculate discount
                if (coupon.type === 'percentage') {
                    discount = (subtotal * coupon.value) / 100;
                    if (coupon.maxDiscount) {
                        discount = Math.min(discount, coupon.maxDiscount);
                    }
                } else {
                    discount = Math.min(coupon.value, subtotal);
                }

                // Increment usage count
                coupon.usageCount += 1;
                const customerUsage = coupon.customerUsages.find(
                    u => u.user.equals(userId)
                );
                if (customerUsage) {
                    customerUsage.count += 1;
                } else {
                    coupon.customerUsages.push({ user: userId, count: 1 });
                }
                await coupon.save({ session });

                couponInfo = {
                    code: coupon.code,
                    type: coupon.type,
                    value: coupon.value,
                    maxDiscount: coupon.maxDiscount || 0,
                };
            }

            const totalAmount = subtotal - discount;

            // Reduce stock only when sufficient stock remains.
            // Also create stock history records within the same transaction
            const stockHistoryEntries = [];

            for (const item of orderItems) {
                const previousStock = products.find(p => p._id.equals(item.product)).stock;

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

                // Queue stock history entry for this product
                stockHistoryEntries.push({
                    product: item.product,
                    change: -item.quantity,
                    type: 'order',
                    reference: null, // Will be set after order creation
                    previousStock,
                    newStock: previousStock - item.quantity,
                    reason: `Order ${data.customerDetails?.email || 'web'}`,
                    changedBy: null,
                });
            }

            const orderNumber = `CR-${Date.now()}-${crypto
                .randomBytes(3)
                .toString('hex')
                .toUpperCase()}`;

            const [order] = await Order.create(
                [{
                    orderNumber,
                    user: userId,
                    items: orderItems,
                    customerDetails: {
                        ...data.customerDetails,
                        email: data.customerDetails.email.toLowerCase(),
                    },
                    subtotal,
                    discount,
                    totalAmount,
                    coupon: couponInfo,
                    paymentMethod: data.paymentMethod,
                    notes: data.notes || '',
                }],
                { session }
            );

            // Update history entries with order reference and insert into StockHistory collection
            const orderHistoryEntries = stockHistoryEntries.map(entry => ({
                ...entry,
                reference: order.orderNumber,
            }));

            if (orderHistoryEntries.length > 0) {
                await StockHistory.insertMany(orderHistoryEntries, { session });
            }

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

    if (['cancelled', 'delivered'].includes(order.orderStatus)) {
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

                if (currentOrder.orderStatus === 'delivered') {
                    throw new ApiError(400, 'Delivered orders cannot be cancelled');
                }

                // Restore coupon usage if coupon was applied
                if (currentOrder.coupon?.code && currentOrder.coupon?.type) {
                    const coupon = await Coupon.findOne({ code: currentOrder.coupon.code }).session(session);
                    if (coupon) {
                        coupon.usageCount = Math.max(0, coupon.usageCount - 1);
                        const usageIndex = coupon.customerUsages.findIndex(
                            u => currentOrder.user && u.user.equals(currentOrder.user)
                        );
                        if (usageIndex >= 0) {
                            coupon.customerUsages[usageIndex].count = Math.max(0, coupon.customerUsages[usageIndex].count - 1);
                            if (coupon.customerUsages[usageIndex].count === 0) {
                                coupon.customerUsages.splice(usageIndex, 1);
                            }
                        }
                        await coupon.save({ session });
                    }
                }

                // Queue stock history entries for each product being restored
                const stockHistoryEntries = [];
                const updatedStocks = [];

                for (const item of currentOrder.items) {
                    const result = await Product.findOne(
                        { _id: item.product },
                        { stock: 1 },
                        { session }
                    );

                    if (result) {
                        const previousStock = result.stock;
                        const newStock = result.stock + item.quantity;
                        updatedStocks.push({
                            product: item.product,
                            previousStock,
                            newStock,
                            quantity: item.quantity,
                        });
                    }
                }

                // Restore stock
                for (const item of currentOrder.items) {
                    await Product.updateOne(
                        { _id: item.product },
                        { $inc: { stock: item.quantity } },
                        { session }
                    );
                }

                // Create stock history entries for restored stock
                for (const stockInfo of updatedStocks) {
                    stockHistoryEntries.push({
                        product: stockInfo.product,
                        change: stockInfo.quantity,
                        type: 'return',
                        reference: currentOrder.orderNumber,
                        previousStock: stockInfo.previousStock,
                        newStock: stockInfo.newStock,
                        reason: `Order cancellation: ${currentOrder.orderNumber}`,
                        changedBy: null,
                    });
                }

                if (stockHistoryEntries.length > 0) {
                    await StockHistory.insertMany(stockHistoryEntries, { session });
                }

                currentOrder.orderStatus = 'cancelled';
                await currentOrder.save({ session });
            });
        } finally {
            await session.endSession();
        }

        return Order.findById(id);
    }

    order.orderStatus = orderStatus;
    await order.save();

    return order;
};

module.exports = {
    createOrder,
    getMyOrders,
    getOrderById,
    getAllOrders,
    updateOrderStatus,
};