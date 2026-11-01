const { getDashboardStats } = require('../services/adminDashboardService');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getDashboard = asyncHandler(async (req, res) => {
    const stats = await getDashboardStats();

    res.status(200).json(
        new ApiResponse(200, 'Dashboard statistics fetched successfully', stats)
    );
});

module.exports = { getDashboard };