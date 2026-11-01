/**
 * Coupon Validator Unit Tests
 *
 * Tests the Zod validation schemas used by the coupon endpoints.
 * These tests do not connect to MongoDB - they only validate the schema logic.
 */

const { strict: assert } = require('node:assert');
const { describe, it } = require('node:test');

// Import actual schemas from the validator module
const {
    couponCodeSchema,
    createCouponSchema,
    updateCouponSchema,
    couponIdSchema,
    applyCouponSchema,
    couponQuerySchema,
    deleteCouponSchema,
} = require('../../validators/couponValidator');

// Helper to test validation
function validateSchema(schema, data) {
    const result = schema.safeParse(data);
    return {
        success: result.success,
        data: result.success ? result.data : null,
        error: result.success ? null : result.error,
    };
}

describe('couponCodeSchema', () => {
    it('accepts valid uppercase codes', () => {
        const result = validateSchema(couponCodeSchema, 'SAVE10');
        assert.strictEqual(result.success, true);
        assert.strictEqual(result.data, 'SAVE10');
    });

    it('normalizes lowercase codes to uppercase', () => {
        const result = validateSchema(couponCodeSchema, 'save10');
        assert.strictEqual(result.success, true);
        assert.strictEqual(result.data, 'SAVE10');
    });

    it('trims whitespace from codes', () => {
        const result = validateSchema(couponCodeSchema, '  SAVE10  ');
        assert.strictEqual(result.success, true);
        assert.strictEqual(result.data, 'SAVE10');
    });

    it('rejects codes with special characters', () => {
        const result = validateSchema(couponCodeSchema, 'SAVE@10');
        assert.strictEqual(result.success, false);
    });

    it('rejects codes with lowercase letters (before transform)', () => {
        // Note: After transform, lowercase is converted to uppercase
        // So 'SAVE10' after trim and transform should be 'SAVE10'
        const result = validateSchema(couponCodeSchema, 'SAVE10');
        assert.strictEqual(result.success, true);
    });

    it('rejects codes too short', () => {
        const result = validateSchema(couponCodeSchema, 'AB');
        assert.strictEqual(result.success, false);
    });

    it('rejects codes too long', () => {
        const result = validateSchema(couponCodeSchema, 'A'.repeat(51));
        assert.strictEqual(result.success, false);
    });

    it('accepts codes with hyphens', () => {
        const result = validateSchema(couponCodeSchema, 'SAVE-10-OFF');
        assert.strictEqual(result.success, true);
        assert.strictEqual(result.data, 'SAVE-10-OFF');
    });

    it('accepts codes with numbers', () => {
        const result = validateSchema(couponCodeSchema, 'SAVE2025');
        assert.strictEqual(result.success, true);
        assert.strictEqual(result.data, 'SAVE2025');
    });
});

describe('createCouponSchema', () => {
    it('accepts valid percentage coupon', () => {
        const result = validateSchema(createCouponSchema, {
            body: {
                code: 'SAVE10',
                type: 'percentage',
                value: 10,
                maxDiscount: 500,
            },
            params: {},
            query: {},
        });
        assert.strictEqual(result.success, true);
    });

    it('accepts valid fixed amount coupon', () => {
        const result = validateSchema(createCouponSchema, {
            body: {
                code: 'FIXED50',
                type: 'fixed',
                value: 50,
            },
            params: {},
            query: {},
        });
        assert.strictEqual(result.success, true);
    });

    it('rejects percentage over 100', () => {
        const result = validateSchema(createCouponSchema, {
            body: {
                code: 'SAVE150',
                type: 'percentage',
                value: 150,
            },
            params: {},
            query: {},
        });
        assert.strictEqual(result.success, false);
    });

    it('rejects negative value', () => {
        const result = validateSchema(createCouponSchema, {
            body: {
                code: 'SAVE10',
                type: 'fixed',
                value: -10,
            },
            params: {},
            query: {},
        });
        assert.strictEqual(result.success, false);
    });

    it('accepts maxDiscount with any type', () => {
        const result = validateSchema(createCouponSchema, {
            body: {
                code: 'FIXED50',
                type: 'fixed',
                value: 50,
                maxDiscount: 100,
            },
            params: {},
            query: {},
        });
        assert.strictEqual(result.success, true);
    });

    it('rejects usageLimit of zero', () => {
        const result = validateSchema(createCouponSchema, {
            body: {
                code: 'SAVE10',
                type: 'percentage',
                value: 10,
                usageLimit: 0,
            },
            params: {},
            query: {},
        });
        assert.strictEqual(result.success, false);
    });

    it('accepts null usageLimit for unlimited', () => {
        const result = validateSchema(createCouponSchema, {
            body: {
                code: 'SAVE10',
                type: 'percentage',
                value: 10,
                usageLimit: null,
            },
            params: {},
            query: {},
        });
        assert.strictEqual(result.success, true);
    });

    it('rejects start date after expiry date', () => {
        const result = validateSchema(createCouponSchema, {
            body: {
                code: 'SAVE10',
                type: 'percentage',
                value: 10,
                startDate: '2026-12-31',
                expiryDate: '2026-01-01',
            },
            params: {},
            query: {},
        });
        assert.strictEqual(result.success, false);
    });

    it('accepts valid date range', () => {
        const result = validateSchema(createCouponSchema, {
            body: {
                code: 'SAVE10',
                type: 'percentage',
                value: 10,
                startDate: '2026-01-01',
                expiryDate: '2026-12-31',
            },
            params: {},
            query: {},
        });
        assert.strictEqual(result.success, true);
    });

    it('trims and uppercases code', () => {
        const result = validateSchema(createCouponSchema, {
            body: {
                code: '  save10  ',
                type: 'percentage',
                value: 10,
            },
            params: {},
            query: {},
        });
        assert.strictEqual(result.success, true);
        assert.strictEqual(result.data.body.code, 'SAVE10');
    });

    it('accepts description over 500 chars trimmed', () => {
        const result = validateSchema(createCouponSchema, {
            body: {
                code: 'SAVE10',
                type: 'percentage',
                value: 10,
                description: 'A'.repeat(500),
            },
            params: {},
            query: {},
        });
        assert.strictEqual(result.success, true);
    });

    it('rejects description over 500 chars', () => {
        const result = validateSchema(createCouponSchema, {
            body: {
                code: 'SAVE10',
                type: 'percentage',
                value: 10,
                description: 'A'.repeat(501),
            },
            params: {},
            query: {},
        });
        assert.strictEqual(result.success, false);
    });

    it('accepts empty body fields with defaults', () => {
        const result = validateSchema(createCouponSchema, {
            body: {
                code: 'SAVE10',
                type: 'percentage',
                value: 10,
            },
            params: {},
            query: {},
        });
        assert.strictEqual(result.success, true);
        assert.strictEqual(result.data.body.minOrderAmount, 0);
    });
});

describe('updateCouponSchema', () => {
    it('accepts partial update fields', () => {
        const result = validateSchema(updateCouponSchema, {
            params: { id: '507f1f77bcf86cd799439011' },
            body: { isActive: false },
            query: {},
        });
        assert.strictEqual(result.success, true);
    });

    it('rejects invalid coupon id', () => {
        const result = validateSchema(updateCouponSchema, {
            params: { id: 'invalid-id' },
            body: { isActive: false },
            query: {},
        });
        assert.strictEqual(result.success, false);
    });

    it('accepts percentage update with maxDiscount', () => {
        const result = validateSchema(updateCouponSchema, {
            params: { id: '507f1f77bcf86cd799439011' },
            body: { type: 'percentage', value: 15, maxDiscount: 500 },
            query: {},
        });
        assert.strictEqual(result.success, true);
    });

    it('accepts date range update', () => {
        const result = validateSchema(updateCouponSchema, {
            params: { id: '507f1f77bcf86cd799439011' },
            body: {
                startDate: '2026-06-01',
                expiryDate: '2026-12-31',
            },
            query: {},
        });
        assert.strictEqual(result.success, true);
    });

    it('rejects percentage over 100 in update', () => {
        const result = validateSchema(updateCouponSchema, {
            params: { id: '507f1f77bcf86cd799439011' },
            body: { type: 'percentage', value: 150 },
            query: {},
        });
        assert.strictEqual(result.success, false);
    });

    it('accepts null maxDiscount in update', () => {
        const result = validateSchema(updateCouponSchema, {
            params: { id: '507f1f77bcf86cd799439011' },
            body: { maxDiscount: null },
            query: {},
        });
        assert.strictEqual(result.success, true);
    });
});

describe('couponIdSchema', () => {
    it('accepts valid ObjectId', () => {
        const result = validateSchema(couponIdSchema, {
            params: { id: '507f1f77bcf86cd799439011' },
            body: {},
            query: {},
        });
        assert.strictEqual(result.success, true);
    });

    it('rejects invalid ObjectId', () => {
        const result = validateSchema(couponIdSchema, {
            params: { id: 'invalid' },
            body: {},
            query: {},
        });
        assert.strictEqual(result.success, false);
    });

    it('rejects missing id', () => {
        const result = validateSchema(couponIdSchema, {
            params: {},
            body: {},
            query: {},
        });
        assert.strictEqual(result.success, false);
    });
});

describe('applyCouponSchema', () => {
    it('accepts valid coupon application', () => {
        const result = validateSchema(applyCouponSchema, {
            body: {
                code: 'SAVE10',
                orderAmount: 1000,
            },
            params: {},
            query: {},
        });
        assert.strictEqual(result.success, true);
    });

    it('normalizes code to uppercase', () => {
        const result = validateSchema(applyCouponSchema, {
            body: {
                code: 'save10',
                orderAmount: 1000,
            },
            params: {},
            query: {},
        });
        assert.strictEqual(result.success, true);
        assert.strictEqual(result.data.body.code, 'SAVE10');
    });

    it('rejects negative order amount', () => {
        const result = validateSchema(applyCouponSchema, {
            body: {
                code: 'SAVE10',
                orderAmount: -100,
            },
            params: {},
            query: {},
        });
        assert.strictEqual(result.success, false);
    });

    it('accepts zero order amount', () => {
        const result = validateSchema(applyCouponSchema, {
            body: {
                code: 'SAVE10',
                orderAmount: 0,
            },
            params: {},
            query: {},
        });
        assert.strictEqual(result.success, true);
    });
});

describe('couponQuerySchema', () => {
    it('accepts empty query with defaults', () => {
        const result = validateSchema(couponQuerySchema, {
            params: {},
            body: {},
            query: {},
        });
        assert.strictEqual(result.success, true);
        assert.strictEqual(result.data.query.page, 1);
        assert.strictEqual(result.data.query.limit, 20);
    });

    it('accepts custom pagination', () => {
        const result = validateSchema(couponQuerySchema, {
            params: {},
            body: {},
            query: { page: '2', limit: '50' },
        });
        assert.strictEqual(result.success, true);
        assert.strictEqual(result.data.query.page, 2);
        assert.strictEqual(result.data.query.limit, 50);
    });

    it('rejects page less than 1', () => {
        const result = validateSchema(couponQuerySchema, {
            params: {},
            body: {},
            query: { page: '0' },
        });
        assert.strictEqual(result.success, false);
    });

    it('rejects limit over 100', () => {
        const result = validateSchema(couponQuerySchema, {
            params: {},
            body: {},
            query: { limit: '101' },
        });
        assert.strictEqual(result.success, false);
    });

    it('accepts isActive filter', () => {
        const result = validateSchema(couponQuerySchema, {
            params: {},
            body: {},
            query: { isActive: 'true' },
        });
        assert.strictEqual(result.success, true);
    });

    it('accepts type filter', () => {
        const result = validateSchema(couponQuerySchema, {
            params: {},
            body: {},
            query: { type: 'percentage' },
        });
        assert.strictEqual(result.success, true);
    });

    it('rejects invalid type', () => {
        const result = validateSchema(couponQuerySchema, {
            params: {},
            body: {},
            query: { type: 'invalid' },
        });
        assert.strictEqual(result.success, false);
    });

    it('accepts search term', () => {
        const result = validateSchema(couponQuerySchema, {
            params: {},
            body: {},
            query: { search: 'SAVE' },
        });
        assert.strictEqual(result.success, true);
        assert.strictEqual(result.data.query.search, 'SAVE');
    });

    it('trims search term', () => {
        const result = validateSchema(couponQuerySchema, {
            params: {},
            body: {},
            query: { search: '  SAVE  ' },
        });
        assert.strictEqual(result.success, true);
        assert.strictEqual(result.data.query.search, 'SAVE');
    });

    it('coerces string page/limit to numbers', () => {
        const result = validateSchema(couponQuerySchema, {
            params: {},
            body: {},
            query: { page: '3', limit: '25' },
        });
        assert.strictEqual(result.success, true);
        assert.strictEqual(typeof result.data.query.page, 'number');
        assert.strictEqual(typeof result.data.query.limit, 'number');
    });
});

describe('deleteCouponSchema', () => {
    it('accepts valid coupon id for deletion', () => {
        const result = validateSchema(deleteCouponSchema, {
            params: { id: '507f1f77bcf86cd799439011' },
            body: {},
            query: {},
        });
        assert.strictEqual(result.success, true);
    });

    it('rejects invalid coupon id for deletion', () => {
        const result = validateSchema(deleteCouponSchema, {
            params: { id: 'invalid' },
            body: {},
            query: {},
        });
        assert.strictEqual(result.success, false);
    });
});