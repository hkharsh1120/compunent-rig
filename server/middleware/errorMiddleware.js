
const ApiError = require('../utils/ApiError');

const errorMiddleware = (err, req, res, next) => {
    // Delegate if response headers have already been sent
    if (res.headersSent) {
        return next(err);
    }

    let statusCode = err.statusCode || err.status || 500;
    let message = err.message || 'Internal Server Error';
    let errors = err.errors || [];

    // Mongoose validation errors
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Database validation failed';

        errors = Object.values(err.errors).map((item) => ({
            field: item.path,
            message: item.message,
        }));
    }

    // MongoDB duplicate key errors
    else if (err.code === 11000) {
        statusCode = 409;
        message = 'A record with this value already exists';
    }

    // Mongoose invalid ObjectId / cast errors
    else if (err.name === 'CastError') {
        statusCode = 400;
        message = 'Invalid resource identifier';
    }

    // JWT errors
    else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Authentication token has expired';
    }

    else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid authentication token';
    }

    // Invalid JSON request body
    else if (err.type === 'entity.parse.failed') {
        statusCode = 400;
        message = 'Invalid JSON request body';
    }

    // Log detailed errors on the server
    console.error('API Error:', {
        message: err.message,
        path: req.originalUrl,
        method: req.method,
        stack: err.stack,
    });

    const response = {
        success: false,
        message:
            statusCode >= 500 && process.env.NODE_ENV === 'production'
                ? 'Internal Server Error'
                : message,
        errors,
    };

    // Include stack only during development
    if (process.env.NODE_ENV === 'development') {
        response.stack = err.stack;
    }

    return res.status(statusCode).json(response);
};

module.exports = errorMiddleware;
