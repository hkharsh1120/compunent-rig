const express = require('express');

const {
    applyCoupon,
} = require('../controllers/couponController');

const validate = require('../middleware/validateMiddleware');

const { protect } = require('../middleware/authMiddleware');

const { applyCouponSchema } = require('../validators/couponValidator');

const router = express.Router();

// Customer coupon application route
// Requires authentication but NOT admin role
// Apply coupon to calculate discount for checkout
router.use(protect);

router.post('/apply', validate(applyCouponSchema), applyCoupon);

module.exports = router;