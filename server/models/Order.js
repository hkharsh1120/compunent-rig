const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },

        name: {
            type: String,
            required: true,
            trim: true,
        },

        sku: {
            type: String,
            required: true,
        },

        image: {
            type: String,
            default: '',
        },

        quantity: {
            type: Number,
            required: true,
            min: 1,
        },

        price: {
            type: Number,
            required: true,
            min: 0,
        },

        subtotal: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    { _id: false }
);

const orderSchema = new mongoose.Schema(
    {
        orderNumber: {
            type: String,
            required: true,
            unique: true,
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        items: {
            type: [orderItemSchema],
            required: true,
            validate: {
                validator: items => items.length > 0,
                message: 'An order must contain at least one item',
            },
        },

        customerDetails: {
            name: {
                type: String,
                required: true,
                trim: true,
            },

            email: {
                type: String,
                required: true,
                trim: true,
                lowercase: true,
            },

            phone: {
                type: String,
                required: true,
                trim: true,
            },

            address: {
                type: String,
                required: true,
                trim: true,
            },

            city: {
                type: String,
                required: true,
                trim: true,
            },

            state: {
                type: String,
                required: true,
                trim: true,
            },

            pincode: {
                type: String,
                required: true,
                trim: true,
            },
        },

        subtotal: {
            type: Number,
            required: true,
            min: 0,
        },

        discount: {
            type: Number,
            min: 0,
            default: 0,
        },

        totalAmount: {
            type: Number,
            required: true,
            min: 0,
        },

        coupon: {
            code: {
                type: String,
                default: '',
            },
            type: {
                type: String,
                enum: ['percentage', 'fixed'],
                default: '',
            },
            value: {
                type: Number,
                default: 0,
            },
            maxDiscount: {
                type: Number,
                default: 0,
            },
        },

        orderStatus: {
            type: String,
            enum: [
                'pending',
                'confirmed',
                'processing',
                'shipped',
                'delivered',
                'cancelled',
                'returned',
            ],
            default: 'pending',
        },

        paymentMethod: {
            type: String,
            enum: ['cash_on_delivery', 'pay_at_store', 'offline'],
            default: 'offline',
        },

        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'failed', 'refunded'],
            default: 'pending',
        },

        notes: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: '',
        },
    },
    {
        timestamps: true,
    }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;