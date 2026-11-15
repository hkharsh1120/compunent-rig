
const PCBuildRequest = require('../models/PCBuildRequest');
const LaptopUpgradeRequest = require('../models/LaptopUpgradeRequest');

const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getCustomerDetails = (req, phone) => ({
    customer: req.user._id,
    customerName: req.user.name,
    email: req.user.email,
    phone: phone || req.user.phone,
});

const createPCBuildRequest = asyncHandler(async (req, res) => {
    const { phone, budget, purpose, requirements } = req.validatedData.body;

    const request = await PCBuildRequest.create({
        ...getCustomerDetails(req, phone),
        budget,
        purpose,
        requirements,
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
    } = req.validatedData.body;

    const request = await LaptopUpgradeRequest.create({
        ...getCustomerDetails(req, phone),
        laptopBrand,
        laptopModel,
        upgradeType,
        currentSpecifications,
        requirements,
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
