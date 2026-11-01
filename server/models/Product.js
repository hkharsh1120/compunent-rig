const mongoose = require('mongoose');

const compatibilitySchema = new mongoose.Schema(
    {
        componentType: {
            type: String,
            enum: [
                'cpu',
                'motherboard',
                'ram',
                'gpu',
                'storage',
                'psu',
                'case',
                'cooler',
            ],
        },

        socket: {
            type: String,
            trim: true,
        },

        ramType: {
            type: String,
            trim: true,
        },
        capacity: {
            type: Number,
            min: 0,
        },

        wattage: {
            type: Number,
            min: 0,
        },

        recommendedPsuWattage: {
            type: Number,
            min: 0,
        },

        interface: {
            type: String,
            trim: true,
        },
        supportedStorageInterfaces: {
            type: [String],
            default: [],
        },
        maxRamCapacity: {
            type: Number,
            min: 0,
        },
    },
    { _id: false }
);

const productSchema = new mongoose.Schema(
    {
        compatibility: {
            type: compatibilitySchema,
            default: () => ({}),
        },
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 150,
        },

        slug: {
            type: String,
            unique: true,
            lowercase: true,
            trim: true,
        },

        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 5000,
        },

        price: {
            type: Number,
            required: true,
            min: 0,
        },

        originalPrice: {
            type: Number,
            min: 0,
            default: null,
        },

        stock: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
            validate: {
                validator: Number.isInteger,
                message: 'Stock must be a whole number',
            },
        },

        sku: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },

        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: true,
        },

        brand: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Brand',
            required: true,
        },

        images: [{
            url: {
                type: String,
                required: true,
            },
            publicId: {
                type: String,
                default: '',
            },
        }],

        specifications: {
            type: Map,
            of: String,
            default: {},
        },

        isFeatured: {
            type: Boolean,
            default: false,
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

// Generate URL-friendly slug from product name
productSchema.pre('validate', function () {
    if (this.isModified('name') && this.name) {
        this.slug = this.name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }
});

// Indexes for catalogue filtering and search
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ brand: 1, isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ isFeatured: 1, isActive: 1 });
productSchema.index({ name: 'text', description: 'text' });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;