const Coupon = require('../models/Coupon');
const ApiError = require('../utils/ApiError');
const mongoose = require('mongoose');

/**
 * Get paginated list of coupons for admin
 */
const getCoupons = async (filters = {}, pagination = {}) => {
    const query = {};

    if (filters.isActive !== undefined) {
        query.isActive = filters.isActive;
    }

    if (filters.type) {
        query.type = filters.type;
    }

    if (filters.search) {
        const searchRegex = new RegExp(filters.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        query.code = { $regex: searchRegex };
    }

    const page = Math.max(1, parseInt(pagination.page) || 1);
    const limit = Math.min(Math.max(1, parseInt(pagination.limit) || 20), 100);
    const skip = (page - 1) * limit;

    const [coupons, total] = await Promise.all([
        Coupon.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),

        Coupon.countDocuments(query),
    ]);

    return {
        coupons,
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
 * Get a single coupon by ID
 */
const getCouponById = async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, 'Invalid coupon ID');
    }

    const coupon = await Coupon.findById(id).lean();

    if (!coupon) {
        throw new ApiError(404, 'Coupon not found');
    }

    return coupon;
};

/**
 * Get coupon by code
 */
const getCouponByCode = async (code) => {
    if (!code || typeof code !== 'string') {
        return null;
    }

    const normalizedCode = code.trim().toUpperCase();

    return Coupon.findOne({ code: normalizedCode }).lean();
};

/**
 * Create a new coupon
 */
const createCoupon = async (data, userId) => {
    const { code, type, value, maxDiscount, minOrderAmount, usageLimit, perCustomerLimit, startDate, expiryDate, description } = data;

    // Normalize code
    const normalizedCode = code.trim().toUpperCase();

    // Check if code already exists
    const existing = await Coupon.findOne({ code: normalizedCode });
    if (existing) {
        throw new ApiError(409, 'A coupon with this code already exists');
    }

    // Validate percentage max discount
    if (type === 'percentage' && maxDiscount !== undefined && maxDiscount <= 0) {
        throw new ApiError(400, 'Max discount must be positive for percentage coupons');
    }

    // Validate that percentage + max discount makes sense
    if (type === 'percentage' && maxDiscount !== undefined && value > maxDiscount) {
        // Allow percentage > maxDiscount, but the discount will be capped
    }

    // Validate dates
    if (startDate && new Date(startDate) > new Date(expiryDate)) {
        throw new ApiError(400, 'Start date cannot be after expiry date');
    }

    const coupon = await Coupon.create({
        code: normalizedCode,
        type,
        value,
        maxDiscount,
        minOrderAmount: minOrderAmount || 0,
        usageLimit: usageLimit || null,
        perCustomerLimit: perCustomerLimit || null,
        startDate: startDate ? new Date(startDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        description: description || '',
        createdBy: userId,
    });

    return coupon;
};

/**
 * Update a coupon
 */
const updateCoupon = async (id, data, userId) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, 'Invalid coupon ID');
    }

    const coupon = await Coupon.findById(id);

    if (!coupon) {
        throw new ApiError(404, 'Coupon not found');
    }

    const { type, value, maxDiscount, minOrderAmount, usageLimit, perCustomerLimit, startDate, expiryDate, description, isActive } = data;

    // Check if code would change (we don't allow code updates)
    if (type !== undefined) coupon.type = type;
    if (value !== undefined) coupon.value = value;
    if (maxDiscount !== undefined) coupon.maxDiscount = maxDiscount;
    if (minOrderAmount !== undefined) coupon.minOrderAmount = minOrderAmount;
    if (usageLimit !== undefined) coupon.usageLimit = usageLimit;
    if (perCustomerLimit !== undefined) coupon.perCustomerLimit = perCustomerLimit;
    if (startDate !== undefined) coupon.startDate = startDate ? new Date(startDate) : null;
    if (expiryDate !== undefined) coupon.expiryDate = expiryDate ? new Date(expiryDate) : null;
    if (description !== undefined) coupon.description = description;
    if (isActive !== undefined) coupon.isActive = isActive;

    await coupon.save();

    return coupon;
};

/**
 * Delete (deactivate) a coupon
 */
const deleteCoupon = async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, 'Invalid coupon ID');
    }

    const coupon = await Coupon.findById(id);

    if (!coupon) {
        throw new ApiError(404, 'Coupon not found');
    }

    // Soft delete - just set isActive to false
    coupon.isActive = false;
    await coupon.save();

    return coupon;
};

/**
 * Apply coupon to an order and calculate discount
 */
const applyCoupon = async (couponCode, orderAmount, userId) => {
    // Find the coupon
    const coupon = await Coupon.findOne({
        code: couponCode.trim().toUpperCase(),
    }).lean();

    if (!coupon) {
        throw new ApiError(400, 'Invalid coupon code');
    }

    // Check if coupon can be used
    const validation = coupon.canBeUsed(orderAmount, userId);
    if (!validation.valid) {
        throw new ApiError(400, validation.reason);
    }

    // Calculate discount
    const discount = coupon.getDiscount(orderAmount);

    return {
        couponId: coupon._id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        maxDiscount: coupon.maxDiscount || null,
        discount,
        finalAmount: orderAmount - discount,
    };
};

/**
 * Record coupon usage after successful order
 */
const recordCouponUsage = async (couponId, userId) => {
    const coupon = await Coupon.findById(couponId);

    if (!coupon) {
        throw new ApiError(404, 'Coupon not found');
    }

    await coupon.recordUsage(userId);
};

/**
 * Restore coupon usage after order cancellation
 */
const restoreCouponUsage = async (couponId, userId) => {
    const coupon = await Coupon.findById(couponId);

    if (!coupon) {
        return; // Coupon might have been deleted, that's okay
    }

    coupon.usageCount = Math.max(0, coupon.usageCount - 1);

    if (userId) {
        const usageIndex = coupon.customerUsages.findIndex(u => u.user.equals(userId));
        if (usageIndex >= 0) {
            coupon.customerUsages[usageIndex].count = Math.max(0, coupon.customerUsages[usageIndex].count - 1);
            // Remove empty usage entries
            if (coupon.customerUsages[usageIndex].count === 0) {
                coupon.customerUsages.splice(usageIndex, 1);
            }
        }
    }

    await coupon.save();
};

module.exports = {
    getCoupons,
    getCouponById,
    getCouponByCode,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    applyCoupon,
    recordCouponUsage,
    restoreCouponUsage,
};