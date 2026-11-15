const express = require('express');
const rateLimit = require('express-rate-limit');

const {
    register,
    login,
    logout,
    getMe,
} = require('../controllers/authController');

const validate = require('../middleware/validateMiddleware');
const { protect } = require('../middleware/authMiddleware');

const {
    registerSchema,
    loginSchema,
} = require('../validators/authValidator');

const router = express.Router();

// Throttle credential endpoints to slow down brute-force attempts.
// 20 attempts per IP per 15 minutes keeps normal testing unaffected.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many authentication attempts. Please try again later.',
    },
});

router.post('/register', authLimiter, validate(registerSchema), register);

router.post('/login', authLimiter, validate(loginSchema), login);

router.post('/logout', logout);

router.get('/me', protect, getMe);

module.exports = router;
