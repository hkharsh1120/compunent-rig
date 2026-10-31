const express = require('express');

const {
    getBrands,
    createBrand,
    updateBrand,
    deactivateBrand,
} = require('../controllers/brandController');

const validate = require('../middleware/validateMiddleware');

const {
    protect,
    authorizeAdmin,
} = require('../middleware/authMiddleware');

const {
    brandSchema,
    updateBrandSchema,
    brandIdSchema,
} = require('../validators/brandValidator');

const router = express.Router();

// Public: active brands
router.get('/', getBrands);

// Admin: all brands, including inactive
router.get('/admin/all', protect, authorizeAdmin, getBrands);

// Admin: create brand
router.post(
    '/',
    protect,
    authorizeAdmin,
    validate(brandSchema),
    createBrand
);

// Admin: update brand
router.patch(
    '/:id',
    protect,
    authorizeAdmin,
    validate(updateBrandSchema),
    updateBrand
);

// Admin: deactivate brand
router.delete(
    '/:id',
    protect,
    authorizeAdmin,
    validate(brandIdSchema),
    deactivateBrand
);

module.exports = router;