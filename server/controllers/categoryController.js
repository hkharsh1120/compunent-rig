const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const categoryService = require('../services/categoryService');

const getCategories = asyncHandler(async (req, res) => {
    const categories = await categoryService.getCategories(
        req.user?.role === 'admin'
    );

    res.status(200).json(
        new ApiResponse(200, 'Categories retrieved successfully', categories)
    );
});

const createCategory = asyncHandler(async (req, res) => {
    const category = await categoryService.createCategory(
        req.validatedData.body
    );

    res.status(201).json(
        new ApiResponse(201, 'Category created successfully', category)
    );
});

const updateCategory = asyncHandler(async (req, res) => {
    const category = await categoryService.updateCategory(
        req.validatedData.params.id,
        req.validatedData.body
    );

    res.status(200).json(
        new ApiResponse(200, 'Category updated successfully', category)
    );
});

const deactivateCategory = asyncHandler(async (req, res) => {
    const category = await categoryService.deactivateCategory(
        req.validatedData.params.id
    );

    res.status(200).json(
        new ApiResponse(200, 'Category deactivated successfully', category)
    );
});

module.exports = {
    getCategories,
    createCategory,
    updateCategory,
    deactivateCategory,
};