const mongoose = require('mongoose');

const stockHistorySchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },

        change: {
            type: Number,
            required: true,
            description: 'Positive for addition, negative for reduction',
        },

        type: {
            type: String,
            enum: ['order', 'manual', 'return', 'adjustment'],
            required: true,
            description: 'Type of stock change event',
        },

        reference: {
            type: String,
            trim: true,
            maxlength: 100,
            default: '',
            description: 'Order ID, adjustment ID, or other reference',
        },

        previousStock: {
            type: Number,
            required: true,
            min: 0,
            description: 'Stock level before the change',
        },

        newStock: {
            type: Number,
            required: true,
            min: 0,
            description: 'Stock level after the change',
        },

        reason: {
            type: String,
            trim: true,
            maxlength: 500,
            default: '',
            description: 'Optional reason for the stock change',
        },

        changedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
            description: 'User who made the change (null for system-generated)',
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for efficient querying
// Compound index for product-specific history sorted by recency
stockHistorySchema.index({ product: 1, createdAt: -1 });

// Simple index for overall timeline queries
stockHistorySchema.index({ createdAt: -1 });

const StockHistory = mongoose.model('StockHistory', stockHistorySchema);

module.exports = StockHistory;