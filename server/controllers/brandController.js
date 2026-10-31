const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const brandService = require('../services/brandService');

const getBrands = asyncHandler(async (req, res) => {
    const brands = await brandService.getBrands(
        req.user?.role === 'admin'
    );

    res.status(200).json(
        new ApiResponse(200, 'Brands retrieved successfully', brands)
    );
});

const createBrand = asyncHandler(async (req, res) => {
    const brand = await brandService.createBrand(
        req.validatedData.body
    );

    res.status(201).json(
        new ApiResponse(201, 'Brand created successfully', brand)
    );
});

const updateBrand = asyncHandler(async (req, res) => {
    const brand = await brandService.updateBrand(
        req.validatedData.params.id,
        req.validatedData.body
    );

    res.status(200).json(
        new ApiResponse(200, 'Brand updated successfully', brand)
    );
});

const deactivateBrand = asyncHandler(async (req, res) => {
    const brand = await brandService.deactivateBrand(
        req.validatedData.params.id
    );

    res.status(200).json(
        new ApiResponse(200, 'Brand deactivated successfully', brand)
    );
});

module.exports = {
    getBrands,
    createBrand,
    updateBrand,
    deactivateBrand,
};