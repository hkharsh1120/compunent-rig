// Inventory module configuration
// Values can be overridden via environment variables

const config = {
    // Default low stock threshold - products at or below this count are considered "low stock"
    lowStockThreshold: parseInt(process.env.INVENTORY_LOW_STOCK_THRESHOLD, 10) || 5,

    // Maximum items per page for product listings
    maxPaginationLimit: 100,

    // Default items per page
    defaultPaginationLimit: 20,

    // Maximum reason length for stock adjustments
    maxAdjustmentReasonLength: 500,
};

module.exports = config;