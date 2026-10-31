const express = require('express');
const upload = require('../middleware/uploadMiddleware');

const {
    getProducts,
    getAdminProducts,
    getProductBySlug,
    createProduct,
    updateProduct,
    deactivateProduct,
    uploadProductImages,
    deleteProductImage,
} = require('../controllers/productController');
const validate = require('../middleware/validateMiddleware');

const {
    protect,
    authorizeAdmin,
} = require('../middleware/authMiddleware');

const {
    productSchema,
    updateProductSchema,
    productIdSchema,
    productQuerySchema,
} = require('../validators/productValidator');

const router = express.Router();

// Public catalogue
router.get('/', validate(productQuerySchema), getProducts);

// Admin catalogue including inactive products
router.get(
    '/admin/all',
    protect,
    authorizeAdmin,
    validate(productQuerySchema),
    getAdminProducts
);

// Product details
router.get('/:slug', getProductBySlug);

// Admin product management
router.post(
    '/',
    protect,
    authorizeAdmin,
    validate(productSchema),
    createProduct
);
// Admin: upload product images
router.post(
    '/:id/images',
    protect,
    authorizeAdmin,
    upload.array('images', 5),
    uploadProductImages
);

// Admin: delete a product image
router.delete(
    '/:id/images/:imageId',
    protect,
    authorizeAdmin,
    deleteProductImage
);

router.patch(
    '/:id',
    protect,
    authorizeAdmin,
    validate(updateProductSchema),
    updateProduct
);

router.delete(
    '/:id',
    protect,
    authorizeAdmin,
    validate(productIdSchema),
    deactivateProduct
);

module.exports = router;