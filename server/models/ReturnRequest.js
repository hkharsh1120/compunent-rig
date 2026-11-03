const mongoose = require('mongoose');

const returnItemSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },

        quantity: {
            type: Number,
            required: true,
            min: 1,
        },

        condition: {
            type: String,
            enum: ['new', 'opened', 'damaged', 'defective'],
            required: true,
        },

        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'],
            default: 'pending',
        },
    },
    { _id: false }
);

const returnRequestSchema = new mongoose.Schema(
    {
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            required: true,
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        reason: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500,
        },

        description: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: '',
        },

        items: {
            type: [returnItemSchema],
            required: true,
            validate: {
                validator: items => items.length > 0,
                message: 'Return must include at least one item',
            },
        },

        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'],
            default: 'pending',
        },

        adminNotes: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: '',
        },

        processedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },

        processedAt: {
            type: Date,
            default: null,
        },

        // Reference to the created stock return entry (for inventory restoration)
        stockReturnReference: {
            type: String,
            trim: true,
            default: '',
        },
    },
    {
        timestamps: true,
    }
);

// Ensure one active return request per order for returns workflow
returnRequestSchema.index({ order: 1, status: 1 });

const ReturnRequest = mongoose.model('ReturnRequest', returnRequestSchema);

module.exports = ReturnRequest;