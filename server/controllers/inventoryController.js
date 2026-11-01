const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const {
    getInventoryOverview,
    getInventoryProducts,
    getStockHistory,
    adjustStock,
} = require('../services/inventoryService');

const getOverview = asyncHandler(async (req, res) => {
    const { threshold } = req.validatedData.query;

    const stats = await getInventoryOverview(
        threshold ? parseInt(threshold, 10) : undefined
    );

    res.status(200).json(
        new ApiResponse(200, 'Inventory overview retrieved', stats)
    );
});

const getProducts = asyncHandler(async (req, res) => {
    const { page, limit, search, category, brand, stockStatus } = req.validatedData.query;

    const result = await getInventoryProducts({
        page,
        limit,
        search,
        category,
        brand,
        stockStatus,
    });

    res.status(200).json(
        new ApiResponse(200, 'Products retrieved', result)
    );
});

const getProductHistory = asyncHandler(async (req, res) => {
    const { productId } = req.validatedData.params;
    const { page, limit } = req.validatedData.query;

    const history = await getStockHistory(productId, { page, limit });

    res.status(200).json(
        new ApiResponse(200, 'Stock history retrieved', history)
    );
});

const adjustStockHandler = asyncHandler(async (req, res) => {
    const { productId } = req.validatedData.params;
    const { quantity, reason } = req.validatedData.body;
    const adminId = req.user._id;

    const data = {
        quantity,
        reason,
    };

    const product = await adjustStock(productId, data, adminId);

    res.status(200).json(
        new ApiResponse(200, 'Stock adjusted successfully', product)
    );
});

module.exports = {
    getOverview,
    getProducts,
    getProductHistory,
    adjustStockHandler,
};