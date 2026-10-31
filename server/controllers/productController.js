const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const productService = require('../services/productService');
const cloudinaryService = require('../services/cloudinaryService');

const getProducts = asyncHandler(async (req, res) => {
    const result = await productService.getProducts(
        req.validatedData.query
    );

    res.status(200).json(
        new ApiResponse(200, 'Products retrieved successfully', result)
    );
});

const getAdminProducts = asyncHandler(async (req, res) => {
    const result = await productService.getProducts(
        req.validatedData.query,
        true
    );

    res.status(200).json(
        new ApiResponse(200, 'Admin products retrieved successfully', result)
    );
});

const getProductBySlug = asyncHandler(async (req, res) => {
    const product = await productService.getProductBySlug(
        req.params.slug
    );

    res.status(200).json(
        new ApiResponse(200, 'Product retrieved successfully', product)
    );
});

const createProduct = asyncHandler(async (req, res) => {
    const product = await productService.createProduct(
        req.validatedData.body
    );

    res.status(201).json(
        new ApiResponse(201, 'Product created successfully', product)
    );
});

const updateProduct = asyncHandler(async (req, res) => {
    const product = await productService.updateProduct(
        req.validatedData.params.id,
        req.validatedData.body
    );

    res.status(200).json(
        new ApiResponse(200, 'Product updated successfully', product)
    );
});

const deactivateProduct = asyncHandler(async (req, res) => {
    const product = await productService.deactivateProduct(
        req.validatedData.params.id
    );

    res.status(200).json(
        new ApiResponse(200, 'Product deactivated successfully', product)
    );
});
const uploadProductImages = asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
        const ApiError = require('../utils/ApiError');
        throw new ApiError(400, 'Please select at least one image');
    }

    const uploadedImages = await Promise.all(
        req.files.map(file =>
            cloudinaryService.uploadImage(file.buffer)
        )
    );

    try {
        const product = await productService.addProductImages(
            req.params.id,
            uploadedImages
        );

        res.status(200).json(
            new ApiResponse(200, 'Product images uploaded successfully', product)
        );
    } catch (error) {
        await Promise.allSettled(
            uploadedImages.map(image =>
                cloudinaryService.deleteImage(image.publicId)
            )
        );

        throw error;
    }
});

const deleteProductImage = asyncHandler(async (req, res) => {
    const publicId = await productService.removeProductImage(
        req.params.id,
        req.params.imageId
    );

    await cloudinaryService.deleteImage(publicId);

    res.status(200).json(
        new ApiResponse(200, 'Product image deleted successfully')
    );
});

module.exports = {
    getProducts,
    getAdminProducts,
    getProductBySlug,
    createProduct,
    updateProduct,
    deactivateProduct,
    uploadProductImages,
    deleteProductImage,
};