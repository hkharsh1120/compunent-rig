const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            maxlength: 80,
        },

        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        logo: {
            url: {
                type: String,
                default: '',
            },
            publicId: {
                type: String,
                default: '',
            },
        },

        description: {
            type: String,
            trim: true,
            maxlength: 500,
            default: '',
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

brandSchema.index({ isActive: 1 });

const Brand = mongoose.model('Brand', brandSchema);

module.exports = Brand;