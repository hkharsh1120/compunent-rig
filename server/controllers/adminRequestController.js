
const mongoose = require('mongoose');
const PCBuildRequest = require('../models/PCBuildRequest');
const LaptopUpgradeRequest = require('../models/LaptopUpgradeRequest');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// Default pagination values
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

// Build requests status values
const BUILD_STATUSES = ['pending', 'contacted', 'quoted', 'approved', 'completed', 'cancelled'];

// Upgrade requests status values
const UPGRADE_STATUSES = ['pending', 'contacted', 'compatibility_check', 'quoted', 'approved', 'completed', 'cancelled'];

// Sanitize pagination parameters
const sanitizePagination = (page, limit) => {
    const safePage = Math.max(DEFAULT_PAGE, parseInt(page, 10) || DEFAULT_PAGE);
    const safeLimit = Math.min(Math.max(1, parseInt(limit, 10) || DEFAULT_LIMIT), MAX_LIMIT);
    return { page: safePage, limit: safeLimit };
};

// Build MongoDB query for service requests
const buildQuery = (query, modelName) => {
    const { search, status, dateFrom, dateTo } = query;
    const statuses = modelName === 'build' ? BUILD_STATUSES : UPGRADE_STATUSES;

    const mongoQuery = {};

    // Search by name, email, or ObjectId
    if (search) {
        const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const searchRegex = new RegExp(escapeRegex(search.trim()), 'i');

        const orConditions = [
            { customerName: { $regex: searchRegex } },
            { email: { $regex: searchRegex } },
        ];

        // If search is a valid ObjectId, also search by _id
        if (mongoose.Types.ObjectId.isValid(search.trim())) {
            orConditions.push({ _id: search.trim() });
        }

        mongoQuery.$or = orConditions;
    }

    // Filter by status (support single status or comma-separated list)
    if (status) {
        const statusArray = Array.isArray(status)
            ? status
            : status.split(',').map(s => s.trim());

        // Validate statuses
        const validStatuses = statusArray.filter(s => statuses.includes(s));
        if (validStatuses.length > 0) {
            mongoQuery.status = { $in: validStatuses };
        }
    }

    // Date range filtering
    if (dateFrom || dateTo) {
        mongoQuery.createdAt = {};

        if (dateFrom) {
            const fromDate = new Date(dateFrom);
            if (isNaN(fromDate.getTime())) {
                throw new ApiError(400, 'Invalid dateFrom format');
            }
            mongoQuery.createdAt.$gte = fromDate;
        }

        if (dateTo) {
            const toDate = new Date(dateTo);
            if (isNaN(toDate.getTime())) {
                throw new ApiError(400, 'Invalid dateTo format');
            }
            // Set to end of day
            toDate.setHours(23, 59, 59, 999);
            mongoQuery.createdAt.$lte = toDate;
        }
    }

    return mongoQuery;
};

// Get paginated build requests
const getBuildRequests = asyncHandler(async (req, res) => {
    const { search, status, dateFrom, dateTo, page, limit } = req.query;

    const { page: safePage, limit: safeLimit } = sanitizePagination(page, limit);
    const skip = (safePage - 1) * safeLimit;

    const query = buildQuery(req.query, 'build');
    const sort = { createdAt: -1 };

    const [requests, total] = await Promise.all([
        PCBuildRequest.find(query)
            .sort(sort)
            .skip(skip)
            .limit(safeLimit)
            .lean(),
        PCBuildRequest.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / safeLimit);

    res.status(200).json(
        new ApiResponse(200, 'PC build requests fetched successfully', {
            requests,
            pagination: {
                page: safePage,
                limit: safeLimit,
                total,
                totalPages,
            },
        })
    );
});

// Get paginated upgrade requests
const getUpgradeRequests = asyncHandler(async (req, res) => {
    const { search, status, dateFrom, dateTo, page, limit } = req.query;

    const { page: safePage, limit: safeLimit } = sanitizePagination(page, limit);
    const skip = (safePage - 1) * safeLimit;

    const query = buildQuery(req.query, 'upgrade');
    const sort = { createdAt: -1 };

    const [requests, total] = await Promise.all([
        LaptopUpgradeRequest.find(query)
            .sort(sort)
            .skip(skip)
            .limit(safeLimit)
            .lean(),
        LaptopUpgradeRequest.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / safeLimit);

    res.status(200).json(
        new ApiResponse(200, 'Laptop upgrade requests fetched successfully', {
            requests,
            pagination: {
                page: safePage,
                limit: safeLimit,
                total,
                totalPages,
            },
        })
    );
});

// Get available status options for a request type
const getStatusOptions = asyncHandler(async (req, res) => {
    const { type } = req.query;

    if (type === 'upgrade') {
        return res.status(200).json(
            new ApiResponse(200, 'Status options fetched', {
                statuses: UPGRADE_STATUSES,
            })
        );
    }

    // Default to build type
    return res.status(200).json(
        new ApiResponse(200, 'Status options fetched', {
            statuses: BUILD_STATUSES,
        })
    );
});

const updateRequest = async (Model, id, body, allowedStatuses) => {
    const updates = {};

    if (body.status !== undefined) {
        if (!allowedStatuses.includes(body.status)) {
            throw new ApiError(400, 'Invalid request status.');
        }

        updates.status = body.status;
    }

    if (body.adminNotes !== undefined) {
        if (typeof body.adminNotes !== 'string' || body.adminNotes.length > 5000) {
            throw new ApiError(400, 'Admin notes must be a string of at most 5000 characters.');
        }

        updates.adminNotes = body.adminNotes;
    }

    if (Object.keys(updates).length === 0) {
        throw new ApiError(400, 'Provide a status or admin note to update.');
    }

    const request = await Model.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true }
    );

    if (!request) {
        throw new ApiError(404, 'Service request not found.');
    }

    return request;
};

const updateBuildRequest = asyncHandler(async (req, res) => {
    const request = await updateRequest(
        PCBuildRequest,
        req.params.id,
        req.body,
        ['pending', 'contacted', 'quoted', 'approved', 'completed', 'cancelled']
    );

    res.status(200).json(
        new ApiResponse(200, 'PC build request updated successfully', request)
    );
});

const updateUpgradeRequest = asyncHandler(async (req, res) => {
    const request = await updateRequest(
        LaptopUpgradeRequest,
        req.params.id,
        req.body,
        [
            'pending',
            'contacted',
            'compatibility_check',
            'quoted',
            'approved',
            'completed',
            'cancelled',
        ]
    );

    res.status(200).json(
        new ApiResponse(200, 'Laptop upgrade request updated successfully', request)
    );
});

module.exports = {
    getBuildRequests,
    getUpgradeRequests,
    getStatusOptions,
    updateBuildRequest,
    updateUpgradeRequest,
};
