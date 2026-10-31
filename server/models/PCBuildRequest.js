const mongoose = require('mongoose');

const pcBuildRequestSchema = new mongoose.Schema(
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

        budget: {
            type: Number,
            required: true,
            min: 1,
        },

        purpose: {
            type: String,
            required: true,
            enum: [
                'gaming',
                'office',
                'editing',
                'programming',
                'workstation',
                'other',
            ],
        },

        requirements: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000,
        },

        status: {
            type: String,
            enum: [
                'pending',
                'contacted',
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

pcBuildRequestSchema.index({ customer: 1, createdAt: -1 });
pcBuildRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model(
    'PCBuildRequest',
    pcBuildRequestSchema
);