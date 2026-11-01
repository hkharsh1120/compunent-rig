const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
            minlength: 3,
            maxlength: 50,
        },

        type: {
            type: String,
            enum: ['percentage', 'fixed'],
            required: true,
        },

        value: {
            type: Number,
            required: true,
            validate: {
                validator: function (value) {
                    if (this.type === 'percentage') {
                        return value > 0 && value <= 100;
                    }
                    return value > 0;
                },
                message: 'Value must be valid for coupon type',
            },
        },

        maxDiscount: {
            type: Number,
            min: 0,
            validate: {
                validator: function () {
                    return this.type !== 'percentage' || this.maxDiscount !== undefined;
                },
                message: 'Max discount is required for percentage coupons',
            },
        },

        minOrderAmount: {
            type: Number,
            min: 0,
            default: 0,
        },

        usageLimit: {
            type: Number,
            min: 1,
            default: null,
        },

        usageCount: {
            type: Number,
            min: 0,
            default: 0,
        },

        perCustomerLimit: {
            type: Number,
            min: 1,
            default: null,
        },

        customerUsages: [{
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
            count: {
                type: Number,
                min: 0,
                default: 0,
            },
        }],

        startDate: {
            type: Date,
            default: null,
        },

        expiryDate: {
            type: Date,
            default: null,
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        description: {
            type: String,
            trim: true,
            maxlength: 500,
            default: '',
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for common queries
couponSchema.index({ isActive: 1 });
couponSchema.index({ code: 1 });
couponSchema.index({ expiryDate: 1, isActive: 1 });

// Virtual for checking if coupon is expired
couponSchema.virtual('isExpired').get(function () {
    if (!this.expiryDate) return false;
    return this.expiryDate < new Date();
});

// Virtual for checking if coupon is within valid date range
couponSchema.virtual('isValidDateRange').get(function () {
    const now = new Date();
    if (this.startDate && this.startDate > now) return false;
    if (this.expiryDate && this.expiryDate < now) return false;
    return true;
});

// Method to check if coupon can be used
couponSchema.methods.canBeUsed = function (orderAmount, userId) {
    if (!this.isActive) return { valid: false, reason: 'Coupon is not active' };
    if (this.isExpired) return { valid: false, reason: 'Coupon has expired' };
    if (!this.isValidDateRange) return { valid: false, reason: 'Coupon is not yet active' };
    if (this.minOrderAmount > orderAmount) {
        return { valid: false, reason: `Minimum order amount of ₹${this.minOrderAmount} required` };
    }
    if (this.usageLimit && this.usageCount >= this.usageLimit) {
        return { valid: false, reason: 'Coupon usage limit reached' };
    }
    if (userId) {
        const usage = this.customerUsages.find(u => u.user.equals(userId));
        if (this.perCustomerLimit && usage && usage.count >= this.perCustomerLimit) {
            return { valid: false, reason: 'You have already used this coupon max times' };
        }
    }
    return { valid: true, reason: 'Coupon is valid' };
};

// Method to get the discount amount
couponSchema.methods.getDiscount = function (orderAmount) {
    if (this.type === 'percentage') {
        const discount = (orderAmount * this.value) / 100;
        return this.maxDiscount ? Math.min(discount, this.maxDiscount) : discount;
    }
    return Math.min(this.value, orderAmount);
};

// Method to record usage
couponSchema.methods.recordUsage = async function (userId) {
    this.usageCount += 1;

    if (userId) {
        const existingUsage = this.customerUsages.find(u => u.user.equals(userId));
        if (existingUsage) {
            existingUsage.count += 1;
        } else {
            this.customerUsages.push({ user: userId, count: 1 });
        }
    }

    await this.save();
};

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;