
const mongoose = require('mongoose');
const User = require('../models/User');
const Order = require('../models/Order');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getCustomers = asyncHandler(async (req, res) => {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
        100,
        Math.max(1, Number.parseInt(req.query.limit, 10) || 20)
    );

    const filter = { role: 'customer' };

    if (req.query.search?.trim()) {
        const search = req.query.search.trim().slice(0, 100);
        const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        filter.$or = [
            { name: { $regex: escaped, $options: 'i' } },
            { email: { $regex: escaped, $options: 'i' } },
            { phone: { $regex: escaped, $options: 'i' } },
        ];
    }

    if (req.query.status === 'active') filter.isActive = true;
    if (req.query.status === 'inactive') filter.isActive = false;

    const [customers, total] = await Promise.all([
        User.find(filter)
            .select('name email phone role isActive createdAt')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),

        User.countDocuments(filter),
    ]);

    const customerIds = customers.map((customer) => customer._id);

    const orderCounts = await Order.aggregate([
        { $match: { user: { $in: customerIds } } },
        { $group: { _id: '$user', count: { $sum: 1 } } },
    ]);

    const countMap = new Map(
        orderCounts.map((item) => [String(item._id), item.count])
    );

    const results = customers.map((customer) => ({
        ...customer,
        orderCount: countMap.get(String(customer._id)) || 0,
    }));

    res.status(200).json(
        new ApiResponse(200, 'Customers fetched successfully', {
            customers: results,
            total,
            page,
            pages: Math.ceil(total / limit),
        })
    );
});

const getCustomerDetails = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(400, 'Invalid customer ID.');
    }

    const customer = await User.findOne({
        _id: id,
        role: 'customer',
    })
        .select('name email phone role isActive createdAt')
        .lean();

    if (!customer) {
        throw new ApiError(404, 'Customer not found.');
    }

    const orders = await Order.find({ user: customer._id })
        .select('orderNumber items totalAmount orderStatus paymentStatus createdAt')
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

    res.status(200).json(
        new ApiResponse(200, 'Customer details fetched successfully', {
            customer,
            orders,
        })
    );
});

const updateCustomerStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(400, 'Invalid customer ID.');
    }

    if (typeof isActive !== 'boolean') {
        throw new ApiError(400, 'isActive must be true or false.');
    }

    const customer = await User.findOneAndUpdate(
        { _id: id, role: 'customer' },
        { $set: { isActive } },
        {
            new: true,
            runValidators: true,
        }
    ).select('name email phone role isActive createdAt');

    if (!customer) {
        throw new ApiError(404, 'Customer not found.');
    }

    res.status(200).json(
        new ApiResponse(
            200,
            `Customer ${isActive ? 'activated' : 'deactivated'} successfully`,
            customer
        )
    );
});

module.exports = {
    getCustomers,
    getCustomerDetails,
    updateCustomerStatus,
};
