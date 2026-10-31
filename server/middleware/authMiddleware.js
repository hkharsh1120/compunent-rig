const jwt = require('jsonwebtoken');

const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const protect = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.token;

    if (!token) {
        throw new ApiError(401, 'Please log in to access this resource');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
        throw new ApiError(401, 'Invalid or inactive account');
    }

    req.user = user;

    next();
});

const authorizeAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return next(
            new ApiError(403, 'Administrator access required')
        );
    }

    next();
};

module.exports = {
    protect,
    authorizeAdmin,
};