const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const orderService = require('../services/orderService');

const createOrder = asyncHandler(async (req, res) => {
    const order = await orderService.createOrder(
        req.user._id,
        req.validatedData.body
    );

    res.status(201).json(
        new ApiResponse(201, 'Order placed successfully', order)
    );
});

const getMyOrders = asyncHandler(async (req, res) => {
    const orders = await orderService.getMyOrders(req.user._id);

    res.status(200).json(
        new ApiResponse(200, 'Your orders retrieved successfully', orders)
    );
});

const getOrderById = asyncHandler(async (req, res) => {
    const order = await orderService.getOrderById(
        req.validatedData.params.id,
        req.user._id,
        req.user.role === 'admin'
    );

    res.status(200).json(
        new ApiResponse(200, 'Order retrieved successfully', order)
    );
});

const getAllOrders = asyncHandler(async (req, res) => {
    const orders = await orderService.getAllOrders(req.query);

    res.status(200).json(
        new ApiResponse(200, 'Orders retrieved successfully', orders)
    );
});

const updateOrderStatus = asyncHandler(async (req, res) => {
    const order = await orderService.updateOrderStatus(
        req.validatedData.params.id,
        req.validatedData.body.orderStatus
    );

    res.status(200).json(
        new ApiResponse(200, 'Order status updated successfully', order)
    );
});

module.exports = {
    createOrder,
    getMyOrders,
    getOrderById,
    getAllOrders,
    updateOrderStatus,
};