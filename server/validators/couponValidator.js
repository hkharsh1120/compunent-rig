const { z } = require('zod');

// MongoDB ObjectId pattern
const objectId = z.string().regex(
    /^[a-f\d]{24}$/i,
    'Invalid ID'
);

// Coupon code validation - exported for testing
const couponCodeSchema = z.string()
    .trim()
    .min(3, 'Coupon code must be at least 3 characters')
    .max(50, 'Coupon code must be at most 50 characters')
    .regex(/^[A-Za-z0-9-]*$/, 'Coupon code can only contain letters, numbers, and hyphens')
    .transform(val => val.toUpperCase());

// Coupon type enum
const couponTypeEnum = z.enum(['percentage', 'fixed']);

// Base coupon schema for creation
const createCouponSchema = z.object({
    body: z.object({
        code: couponCodeSchema,
        type: couponTypeEnum,
        value: z.number()
            .min(0.01, 'Value must be at least 0.01')
            .max(100000, 'Value must be at most 100000'),
        maxDiscount: z.number()
            .min(0.01, 'Max discount must be at least 0.01')
            .optional()
            .nullable(),
        minOrderAmount: z.number()
            .min(0, 'Minimum order amount cannot be negative')
            .optional()
            .default(0),
        usageLimit: z.number()
            .int()
            .min(1, 'Usage limit must be at least 1')
            .optional()
            .nullable(),
        perCustomerLimit: z.number()
            .int()
            .min(1, 'Per customer limit must be at least 1')
            .optional()
            .nullable(),
        startDate: z.string().optional(),
        expiryDate: z.string().optional(),
        description: z.string()
            .trim()
            .max(500, 'Description must be at most 500 characters')
            .optional()
            .default(''),
    }).strict(),
    params: z.object({}),
    query: z.object({}),
}).refine(
    (data) => {
        // Validate percentage max value
        if (data.body.type === 'percentage' && data.body.value > 100) {
            return false;
        }
        // Validate date range
        if (data.body.startDate && data.body.expiryDate) {
            const start = new Date(data.body.startDate);
            const expiry = new Date(data.body.expiryDate);
            return start <= expiry;
        }
        return true;
    },
    { message: 'Invalid coupon configuration' }
);

// Update coupon schema
const updateCouponSchema = z.object({
    body: z.object({
        type: couponTypeEnum.optional(),
        value: z.number()
            .min(0.01, 'Value must be at least 0.01')
            .max(100000, 'Value must be at most 100000')
            .optional(),
        maxDiscount: z.number()
            .min(0.01, 'Max discount must be at least 0.01')
            .optional()
            .nullable(),
        minOrderAmount: z.number()
            .min(0, 'Minimum order amount cannot be negative')
            .optional(),
        usageLimit: z.number()
            .int()
            .min(1, 'Usage limit must be at least 1')
            .optional()
            .nullable(),
        perCustomerLimit: z.number()
            .int()
            .min(1, 'Per customer limit must be at least 1')
            .optional()
            .nullable(),
        startDate: z.string().optional(),
        expiryDate: z.string().optional(),
        description: z.string()
            .trim()
            .max(500, 'Description must be at most 500 characters')
            .optional(),
        isActive: z.boolean().optional(),
    }).strict(),
    params: z.object({
        id: objectId,
    }),
    query: z.object({}),
}).refine(
    (data) => {
        // Validate percentage max value (only if type and value are provided)
        if (data.body.type === 'percentage' && data.body.value !== undefined && data.body.value > 100) {
            return false;
        }
        // Validate date range
        if (data.body.startDate && data.body.expiryDate) {
            const start = new Date(data.body.startDate);
            const expiry = new Date(data.body.expiryDate);
            return start <= expiry;
        }
        return true;
    },
    { message: 'Invalid coupon configuration' }
);

// Coupon ID schema
const couponIdSchema = z.object({
    body: z.object({}),
    params: z.object({
        id: objectId,
    }),
    query: z.object({}),
});

// Coupon application schema
const applyCouponSchema = z.object({
    body: z.object({
        code: couponCodeSchema,
        orderAmount: z.number()
            .min(0, 'Order amount must be non-negative'),
    }).strict(),
    params: z.object({}),
    query: z.object({}),
});

// Coupon query schema
const couponQuerySchema = z.object({
    body: z.object({}),
    params: z.object({}),
    query: z.object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        isActive: z.coerce.boolean().optional(),
        type: couponTypeEnum.optional(),
        search: z.string().trim().optional(),
    }),
});

// Delete coupon schema
const deleteCouponSchema = z.object({
    body: z.object({}),
    params: z.object({
        id: objectId,
    }),
    query: z.object({}),
});

module.exports = {
    couponCodeSchema,
    createCouponSchema,
    updateCouponSchema,
    couponIdSchema,
    applyCouponSchema,
    couponQuerySchema,
    deleteCouponSchema,
};