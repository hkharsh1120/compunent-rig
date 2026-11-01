const express = require('express');

const {
    getCoupons,
    getCouponById,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    applyCoupon,
} = require('../controllers/couponController');

const validate = require('../middleware/validateMiddleware');

const { protect, authorizeAdmin } = require('../middleware/authMiddleware');

const {
    createCouponSchema,
    updateCouponSchema,
    couponIdSchema,
    applyCouponSchema,
    couponQuerySchema,
    deleteCouponSchema,
} = require('../validators/couponValidator');

const router = express.Router();

// Admin coupon management routes (require authentication + admin role)
// All CRUD operations are admin-only
router.use(protect, authorizeAdmin);

// Coupon listing and search
router.get('/', validate(couponQuerySchema), getCoupons);

// Coupon creation
router.post('/', validate(createCouponSchema), createCoupon);

// Coupon by ID
router.get('/:id', validate(couponIdSchema), getCouponById);

// Coupon update
router.patch('/:id', validate(updateCouponSchema), updateCoupon);

// Coupon deletion
router.delete('/:id', validate(deleteCouponSchema), deleteCoupon);

module.exports = router;