const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const PCBuildRequest = require('../models/PCBuildRequest');
const LaptopUpgradeRequest = require('../models/LaptopUpgradeRequest');

const getDashboardStats = async () => {
    const [
        totalCustomers,
        totalProducts,
        totalOrders,
        pendingOrders,
        pendingBuildRequests,
        pendingUpgradeRequests,
        revenueResult,
        orderStatusCounts,
        recentOrders,
    ] = await Promise.all([
        User.countDocuments({ role: 'customer', isActive: true }),
        Product.countDocuments({ isActive: true }),
        Order.countDocuments(),
        Order.countDocuments({ orderStatus: 'pending' }),
        PCBuildRequest.countDocuments({ status: 'pending' }),
        LaptopUpgradeRequest.countDocuments({ status: 'pending' }),

        Order.aggregate([
            { $match: { paymentStatus: 'paid' } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]),

        Order.aggregate([
            { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
        ]),

        Order.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('orderNumber customerDetails.name totalAmount orderStatus createdAt')
            .lean(),
    ]);

    return {
        totalCustomers,
        totalProducts,
        totalOrders,
        pendingOrders,
        pendingBuildRequests,
        pendingUpgradeRequests,
        totalRevenue: revenueResult[0]?.total || 0,
        orderStatusCounts,
        recentOrders,
    };
};

module.exports = { getDashboardStats };