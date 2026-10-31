const mongoose = require('mongoose');

const laptopUpgradeRequestSchema = new mongoose.Schema(
    {
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        customerName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 50,
        },

        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },

        phone: {
            type: String,
            required: true,
            trim: true,
        },

        laptopBrand: {
            type: String,
            required: true,
            trim: true,
            maxlength: 50,
        },

        laptopModel: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },

        upgradeType: {
            type: String,
            required: true,
            enum: ['ram', 'storage', 'both'],
        },

        currentSpecifications: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: '',
        },

        requirements: {
            type: String,
            trim: true,
            maxlength: 2000,
            default: '',
        },

        status: {
            type: String,
            enum: [
                'pending',
                'contacted',
                'compatibility_check',
                'quoted',
                'approved',
                'completed',
                'cancelled',
            ],
            default: 'pending',
        },

        adminNotes: {
            type: String,
            default: '',
            maxlength: 2000,
        },
    },
    {
        timestamps: true,
    }
);

laptopUpgradeRequestSchema.index({ customer: 1, createdAt: -1 });
laptopUpgradeRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model(
    'LaptopUpgradeRequest',
    laptopUpgradeRequestSchema
);