
const PCBuildRequest = require('../models/PCBuildRequest');
const LaptopUpgradeRequest = require('../models/LaptopUpgradeRequest');

const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getCustomerDetails = (req, phone) => ({
    customer: req.user._id,
    customerName: req.user.name,
    email: req.user.email,
    phone: phone || req.user.phone,
});

const createPCBuildRequest = asyncHandler(async (req, res) => {
    const { phone, budget, purpose, requirements } = req.body;

    if (!phone?.trim() || !budget?.trim() ||
        !purpose?.trim() || !requirements?.trim()) {
        throw new ApiError(400, 'Please provide all required PC build details.');
    }

    const request = await PCBuildRequest.create({
        ...getCustomerDetails(req, phone),
        budget: budget.trim(),
        purpose: purpose.trim(),
        requirements: requirements.trim(),
    });

    res.status(201).json(
        new ApiResponse(
            201,
            'PC build request submitted successfully.',
            request
        )
    );
});

const createLaptopUpgradeRequest = asyncHandler(async (req, res) => {
    const {
        phone,
        laptopBrand,
        laptopModel,
        upgradeType,
        currentSpecifications,
        requirements,
    } = req.body;

    const allowedUpgradeTypes = ['ram', 'storage', 'both'];

    if (
        !phone?.trim() ||
        !laptopBrand?.trim() ||
        !laptopModel?.trim() ||
        !allowedUpgradeTypes.includes(upgradeType) ||
        !currentSpecifications?.trim() ||
        !requirements?.trim()
    ) {
        throw new ApiError(400, 'Please provide all required laptop upgrade details.');
    }

    const request = await LaptopUpgradeRequest.create({
        ...getCustomerDetails(req, phone),
        laptopBrand: laptopBrand.trim(),
        laptopModel: laptopModel.trim(),
        upgradeType,
        currentSpecifications: currentSpecifications.trim(),
        requirements: requirements.trim(),
    });

    res.status(201).json(
        new ApiResponse(
            201,
            'Laptop upgrade request submitted successfully.',
            request
        )
    );
});

module.exports = {
    createPCBuildRequest,
    createLaptopUpgradeRequest,
};
