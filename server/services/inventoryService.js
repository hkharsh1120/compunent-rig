const mongoose = require('mongoose');
const Product = require('../models/Product');
const StockHistory = require('../models/StockHistory');
const ApiError = require('../utils/ApiError');
const inventoryConfig = require('../config/inventory');

const DEFAULT_LOW_STOCK_THRESHOLD = inventoryConfig.lowStockThreshold;
const MAX_PAGINATION_LIMIT = inventoryConfig.maxPaginationLimit;

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * Validate and sanitize pagination parameters
 */
const sanitizePagination = (page, limit) => {
    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const defaultLimit = inventoryConfig.defaultPaginationLimit;
    const safeLimit = Math.min(
        Math.max(1, parseInt(limit, 10) || defaultLimit),
        MAX_PAGINATION_LIMIT
    );
    return { page: safePage, limit: safeLimit };
};

/**
 * Validate low stock threshold
 */
const validateLowStockThreshold = (threshold) => {
    const num = parseInt(threshold, 10);
    if (isNaN(num) || num < 0) {
        return DEFAULT_LOW_STOCK_THRESHOLD;
    }
    return num;
};

/**
 * Validate product ID format
 */
const validateProductId = (productId) => {
    if (!isValidObjectId(productId)) {
        throw new ApiError(400, 'Invalid product ID');
    }
};

/**
 * Validate adjustment reason
 */
const validateReason = (reason) => {
    if (typeof reason !== 'string') {
        throw new ApiError(400, 'Reason must be a string');
    }
    const trimmed = reason.trim();
    if (trimmed.length === 0) {
        throw new ApiError(400, 'Reason is required');
    }
    if (trimmed.length > inventoryConfig.maxAdjustmentReasonLength) {
        throw new ApiError(400, 'Reason must not exceed 500 characters');
    }
    return trimmed;
};

/**
 * Validate quantity for stock adjustment
 */
const validateQuantity = (quantity) => {
    if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity === 0) {
        throw new ApiError(400, 'Quantity must be a non-zero integer');
    }
    return quantity;
};

/**
 * Get overview statistics for the inventory dashboard
 */
const getInventoryOverview = async (lowStockThreshold = DEFAULT_LOW_STOCK_THRESHOLD) => {
    const threshold = validateLowStockThreshold(lowStockThreshold);

    const [
        totalProducts,
        totalStock,
        lowStockCount,
        outOfStockCount,
    ] = await Promise.all([
        Product.countDocuments({ isActive: true }),
        Product.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: null, total: { $sum: '$stock' } } },
        ]).then(result => result[0]?.total || 0),
        Product.countDocuments({ isActive: true, stock: { $lte: threshold, $gt: 0 } }),
        Product.countDocuments({ isActive: true, stock: 0 }),
    ]);

    return {
        totalProducts,
        totalStock,
        lowStockCount,
        outOfStockCount,
        lowStockThreshold: threshold,
    };
};

/**
 * Get paginated product listing with stock information
 */
const getInventoryProducts = async (filters = {}) => {
    const {
        search,
        category,
        brand,
        stockStatus,
        lowStockThreshold = DEFAULT_LOW_STOCK_THRESHOLD,
        page,
        limit,
    } = filters;

    const threshold = validateLowStockThreshold(lowStockThreshold);
    const { page: safePage, limit: safeLimit } = sanitizePagination(page, limit);

    const query = { isActive: true };

    if (search) {
        const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        query.name = { $regex: searchRegex };
    }

    if (category) {
        query.category = category;
    }

    if (brand) {
        query.brand = brand;
    }

    if (stockStatus === 'in_stock') {
        query.stock = { $gt: threshold };
    } else if (stockStatus === 'low_stock') {
        query.stock = { $lte: threshold, $gt: 0 };
    } else if (stockStatus === 'out_of_stock') {
        query.stock = 0;
    }

    const skip = (safePage - 1) * safeLimit;

    const [products, total] = await Promise.all([
        Product.find(query)
            .populate('category', 'name slug')
            .populate('brand', 'name slug')
            .select('name slug price stock category brand isActive')
            .sort({ name: 1 })
            .skip(skip)
            .limit(safeLimit),

        Product.countDocuments(query),
    ]);

    return {
        products,
        pagination: {
            total,
            page: safePage,
            limit: safeLimit,
            totalPages: Math.ceil(total / safeLimit),
            hasNextPage: safePage * safeLimit < total,
            hasPreviousPage: safePage > 1,
        },
    };
};

/**
 * Get stock history for a specific product
 */
const getStockHistory = async (productId, pagination = {}) => {
    validateProductId(productId);

    const { page, limit } = sanitizePagination(pagination.page, pagination.limit);
    const skip = (page - 1) * limit;

    const [history, total] = await Promise.all([
        StockHistory.find({ product: productId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),

        StockHistory.countDocuments({ product: productId }),
    ]);

    return {
        history,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page * limit < total,
            hasPreviousPage: page > 1,
        },
    };
};

/**
 * Adjust stock for a product - supports both increases and decreases
 * Uses atomic operations with transactions to prevent race conditions
 */
const adjustStock = async (productId, data, adminId) => {
    const { quantity, reason } = data;

    // Validate product ID format first
    validateProductId(productId);

    // Validate quantity
    const validQuantity = validateQuantity(quantity);

    // Validate reason - required for manual adjustments
    const validReason = validateReason(reason);

    const session = await mongoose.startSession();

    try {
        let result;

        await session.withTransaction(async () => {
            // Validate product exists and is active
            const product = await Product.findById(productId).session(session);

            if (!product) {
                throw new ApiError(404, 'Product not found');
            }

            if (!product.isActive) {
                throw new ApiError(400, 'Cannot adjust stock for an inactive product');
            }

            const previousStock = product.stock;
            const newStock = previousStock + validQuantity;

            // Prevent negative stock
            if (newStock < 0) {
                throw new ApiError(400, `Insufficient stock. Current stock: ${previousStock}`);
            }

            // Atomic update with conditional stock check
            // For decreases (negative quantity): ensure stock >= |quantity|
            // For increases (positive quantity): allow any (no upper limit check)
            const updateQuery = {
                _id: productId,
            };

            if (validQuantity < 0) {
                // For stock reduction, verify we have enough stock atomically
                updateQuery.stock = { $gte: Math.abs(validQuantity) };
            }

            const updateResult = await Product.updateOne(
                updateQuery,
                { $inc: { stock: validQuantity } },
                { session }
            );

            if (updateResult.modifiedCount !== 1) {
                // Could be race condition or stock check failed
                throw new ApiError(
                    409,
                    'Stock was modified concurrently or insufficient stock. Please refresh and try again.'
                );
            }

            // Create stock history record within same transaction
            await StockHistory.create([{
                product: productId,
                change: validQuantity,
                type: 'adjustment',
                reference: `adj_${Date.now()}`,
                previousStock,
                newStock,
                reason: validReason,
                changedBy: adminId,
            }], { session });

            // Fetch the updated product for response
            const updatedProduct = await Product.findById(productId).session(session);

            result = updatedProduct;
        });

        return result;
    } finally {
        await session.endSession();
    }
};

module.exports = {
    getInventoryOverview,
    getInventoryProducts,
    getStockHistory,
    adjustStock,
};