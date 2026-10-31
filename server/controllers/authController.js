const jwt = require('jsonwebtoken');

const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const authService = require('../services/authService');
const cookieOptions = require('../utils/cookieOptions');

const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        }
    );
};

const getSafeUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    createdAt: user.createdAt,
});

const register = asyncHandler(async (req, res) => {
    const user = await authService.registerUser(req.validatedData.body);

    const token = generateToken(user._id);

    res.cookie('token', token, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json(
        new ApiResponse(201, 'Account created successfully', {
            user: getSafeUser(user),
        })
    );
});

const login = asyncHandler(async (req, res) => {
    const user = await authService.loginUser(req.validatedData.body);

    const token = generateToken(user._id);

    res.cookie('token', token, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json(
        new ApiResponse(200, 'Login successful', {
            user: getSafeUser(user),
        })
    );
});

const logout = asyncHandler(async (req, res) => {
    res.clearCookie('token', cookieOptions);

    res.status(200).json(
        new ApiResponse(200, 'Logged out successfully')
    );
});

const getMe = asyncHandler(async (req, res) => {
    res.status(200).json(
        new ApiResponse(200, 'User profile retrieved successfully', {
            user: getSafeUser(req.user),
        })
    );
});

module.exports = {
    register,
    login,
    logout,
    getMe,
};