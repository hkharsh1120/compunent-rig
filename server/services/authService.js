const User = require('../models/User');
const ApiError = require('../utils/ApiError');

const registerUser = async ({ name, email, password }) => {
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
        throw new ApiError(409, 'An account with this email already exists');
    }

    const user = await User.create({
        name,
        email: normalizedEmail,
        password,
        role: 'customer',
    });

    return user;
};

const loginUser = async ({ email, password }) => {
    const user = await User.findOne({
        email: email.toLowerCase().trim(),
    }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
        throw new ApiError(401, 'Invalid email or password');
    }

    if (!user.isActive) {
        throw new ApiError(403, 'Your account has been deactivated');
    }

    return user;
};

module.exports = {
    registerUser,
    loginUser,
};