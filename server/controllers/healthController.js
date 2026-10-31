const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const healthService = require('../services/healthService');

const getHealth = asyncHandler(async (req, res) => {
    const health = healthService.getHealth();

    res.status(200).json(
        new ApiResponse(
            200,
            'Compunent Rig API is running!',
            health
        )
    );
});

module.exports = {
    getHealth,
};