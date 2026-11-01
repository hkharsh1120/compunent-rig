
const PCBuildRequest = require('../models/PCBuildRequest');
const LaptopUpgradeRequest = require('../models/LaptopUpgradeRequest');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const getBuildRequests = asyncHandler(async (req, res) => {
    const requests = await PCBuildRequest.find()
        .sort({ createdAt: -1 })
        .lean();

    res.status(200).json(
        new ApiResponse(200, 'PC build requests fetched successfully', {
            requests,
        })
    );
});

const getUpgradeRequests = asyncHandler(async (req, res) => {
    const requests = await LaptopUpgradeRequest.find()
        .sort({ createdAt: -1 })
        .lean();

    res.status(200).json(
        new ApiResponse(200, 'Laptop upgrade requests fetched successfully', {
            requests,
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
    updateBuildRequest,
    updateUpgradeRequest,
};
