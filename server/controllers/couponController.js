const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const couponService = require('../services/couponService');

const getCoupons = asyncHandler(async (req, res) => {
    const coupons = await couponService.getCoupons(
        req.query,
        req.validatedData.query
    );

    res.status(200).json(
        new ApiResponse(200, 'Coupons retrieved successfully', coupons)
    );
});

const getCouponById = asyncHandler(async (req, res) => {
    const coupon = await couponService.getCouponById(
        req.validatedData.params.id
    );

    res.status(200).json(
        new ApiResponse(200, 'Coupon retrieved successfully', coupon)
    );
});

const createCoupon = asyncHandler(async (req, res) => {
    const coupon = await couponService.createCoupon(
        req.validatedData.body,
        req.user._id
    );

    res.status(201).json(
        new ApiResponse(201, 'Coupon created successfully', coupon)
    );
});

const updateCoupon = asyncHandler(async (req, res) => {
    const coupon = await couponService.updateCoupon(
        req.validatedData.params.id,
        req.validatedData.body,
        req.user._id
    );

    res.status(200).json(
        new ApiResponse(200, 'Coupon updated successfully', coupon)
    );
});

const deleteCoupon = asyncHandler(async (req, res) => {
    const coupon = await couponService.deleteCoupon(
        req.validatedData.params.id
    );

    res.status(200).json(
        new ApiResponse(200, 'Coupon deleted successfully', coupon)
    );
});

const applyCoupon = asyncHandler(async (req, res) => {
    const { code, orderAmount } = req.validatedData.body;

    // Get current user ID if authenticated
    const userId = req.user ? req.user._id : null;

    const result = await couponService.applyCoupon(code, orderAmount, userId);

    res.status(200).json(
        new ApiResponse(200, 'Coupon applied successfully', result)
    );
});

module.exports = {
    getCoupons,
    getCouponById,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    applyCoupon,
};