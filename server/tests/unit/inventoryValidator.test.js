/**
 * Inventory Validator Unit Tests
 *
 * Tests the Zod validation schemas used by the inventory endpoints.
 * These tests do not connect to MongoDB - they only validate the schema logic.
 */

const { strict: assert } = require('node:assert');
const { describe, it } = require('node:test');

// Import actual schemas from the validator module
const {
    adjustStockSchema,
    productParamSchema,
    productIdSchema,
    productHistorySchema,
    productQuerySchema,
    overviewQuerySchema,
} = require('../../validators/inventoryValidator');

// Helper to test validation
function validateSchema(schema, data) {
    const result = schema.safeParse(data);
    return {
        success: result.success,
        data: result.success ? result.data : null,
        error: result.success ? null : result.error,
    };
}

describe('inventoryValidator', () => {

    describe('objectId validation', () => {
        const validObjectIds = [
            '507f1f77bcf86cd799439011',
            '507f1f77bcf86cd799439012',
            '507f1f77bcf86cd79943901a',
            '64a6b7c8d9e0f1a2b3c4d5e6',
        ];

        const invalidObjectIds = [
            '507f1f77bcf86cd79943901',      // Too short
            '507f1f77bcf86cd7994390111',    // Too long
            '507f1f77bcf86cd79943901g',     // Invalid character
            'not-an-object-id',              // Not hex
            '507f1g77bcf86cd799439011',     // 'g' is not valid hex
            '',                              // Empty
            'abc',                           // Too short
        ];

        it('accepts valid MongoDB ObjectIds', () => {
            for (const id of validObjectIds) {
                const result = validateSchema(productParamSchema, {
                    params: { productId: id },
                    body: {},
                    query: {},
                });
                assert.strictEqual(result.success, true, `Should accept valid ObjectId: ${id}`);
            }
        });

        it('rejects invalid MongoDB ObjectIds', () => {
            for (const id of invalidObjectIds) {
                const result = validateSchema(productParamSchema, {
                    params: { productId: id },
                    body: {},
                    query: {},
                });
                assert.strictEqual(result.success, false, `Should reject invalid ObjectId: ${id}`);
            }
        });

        it('rejects missing productId param', () => {
            const result = validateSchema(productParamSchema, {
                params: {},
                body: {},
                query: {},
            });
            assert.strictEqual(result.success, false);
        });
    });

    describe('adjustStockSchema', () => {
        it('accepts valid stock adjustment with positive quantity', () => {
            const result = validateSchema(adjustStockSchema, {
                params: { productId: '507f1f77bcf86cd799439011' },
                body: { quantity: 10, reason: 'Received new shipment' },
                query: {},
            });
            assert.strictEqual(result.success, true);
            assert.strictEqual(result.data.body.quantity, 10);
            assert.strictEqual(result.data.body.reason, 'Received new shipment');
        });

        it('accepts valid stock adjustment with negative quantity', () => {
            const result = validateSchema(adjustStockSchema, {
                params: { productId: '507f1f77bcf86cd799439011' },
                body: { quantity: -5, reason: 'Customer return' },
                query: {},
            });
            assert.strictEqual(result.success, true);
            assert.strictEqual(result.data.body.quantity, -5);
        });

        it('rejects zero quantity', () => {
            const result = validateSchema(adjustStockSchema, {
                params: { productId: '507f1f77bcf86cd799439011' },
                body: { quantity: 0, reason: 'Test' },
                query: {},
            });
            assert.strictEqual(result.success, false);
        });

        it('rejects decimal quantity', () => {
            const result = validateSchema(adjustStockSchema, {
                params: { productId: '507f1f77bcf86cd799439011' },
                body: { quantity: 5.5, reason: 'Test' },
                query: {},
            });
            assert.strictEqual(result.success, false);
        });

        it('rejects missing reason', () => {
            const result = validateSchema(adjustStockSchema, {
                params: { productId: '507f1f77bcf86cd799439011' },
                body: { quantity: 5 },
                query: {},
            });
            assert.strictEqual(result.success, false);
        });

        it('rejects whitespace-only reason', () => {
            const result = validateSchema(adjustStockSchema, {
                params: { productId: '507f1f77bcf86cd799439011' },
                body: { quantity: 5, reason: '   ' },
                query: {},
            });
            assert.strictEqual(result.success, false);
        });

        it('accepts reason at minimum length (1 char)', () => {
            const result = validateSchema(adjustStockSchema, {
                params: { productId: '507f1f77bcf86cd799439011' },
                body: { quantity: 5, reason: 'a' },
                query: {},
            });
            assert.strictEqual(result.success, true);
        });

        it('accepts reason at maximum length (500 chars)', () => {
            const result = validateSchema(adjustStockSchema, {
                params: { productId: '507f1f77bcf86cd799439011' },
                body: { quantity: 5, reason: 'x'.repeat(500) },
                query: {},
            });
            assert.strictEqual(result.success, true);
        });

        it('rejects reason over maximum length (501 chars)', () => {
            const result = validateSchema(adjustStockSchema, {
                params: { productId: '507f1f77bcf86cd799439011' },
                body: { quantity: 5, reason: 'x'.repeat(501) },
                query: {},
            });
            assert.strictEqual(result.success, false);
        });

        it('trims reason whitespace', () => {
            const result = validateSchema(adjustStockSchema, {
                params: { productId: '507f1f77bcf86cd799439011' },
                body: { quantity: 5, reason: '  test  ' },
                query: {},
            });
            assert.strictEqual(result.success, true);
            assert.strictEqual(result.data.body.reason, 'test');
        });

        it('rejects invalid productId in params', () => {
            const result = validateSchema(adjustStockSchema, {
                params: { productId: 'invalid-id' },
                body: { quantity: 5, reason: 'Test' },
                query: {},
            });
            assert.strictEqual(result.success, false);
        });
    });

    describe('productIdSchema', () => {
        it('accepts valid productId', () => {
            const result = validateSchema(productIdSchema, {
                params: { productId: '507f1f77bcf86cd799439011' },
                body: {},
                query: {},
            });
            assert.strictEqual(result.success, true);
        });

        it('rejects invalid productId', () => {
            const result = validateSchema(productIdSchema, {
                params: { productId: 'invalid' },
                body: {},
                query: {},
            });
            assert.strictEqual(result.success, false);
        });

        it('rejects missing productId', () => {
            const result = validateSchema(productIdSchema, {
                params: {},
                body: {},
                query: {},
            });
            assert.strictEqual(result.success, false);
        });
    });

    describe('productHistorySchema', () => {
        it('accepts default pagination values', () => {
            const result = validateSchema(productHistorySchema, {
                params: { productId: '507f1f77bcf86cd799439011' },
                body: {},
                query: {},
            });
            assert.strictEqual(result.success, true);
            assert.strictEqual(result.data.query.page, 1);
            assert.strictEqual(result.data.query.limit, 20);
        });

        it('accepts custom pagination values', () => {
            const result = validateSchema(productHistorySchema, {
                params: { productId: '507f1f77bcf86cd799439011' },
                body: {},
                query: { page: '3', limit: '50' },
            });
            assert.strictEqual(result.success, true);
            assert.strictEqual(result.data.query.page, 3);
            assert.strictEqual(result.data.query.limit, 50);
        });

        it('rejects page less than 1', () => {
            const result = validateSchema(productHistorySchema, {
                params: { productId: '507f1f77bcf86cd799439011' },
                body: {},
                query: { page: '0' },
            });
            assert.strictEqual(result.success, false);
        });

        it('rejects limit less than 1', () => {
            const result = validateSchema(productHistorySchema, {
                params: { productId: '507f1f77bcf86cd799439011' },
                body: {},
                query: { limit: '0' },
            });
            assert.strictEqual(result.success, false);
        });

        it('rejects limit greater than 100', () => {
            const result = validateSchema(productHistorySchema, {
                params: { productId: '507f1f77bcf86cd799439011' },
                body: {},
                query: { limit: '101' },
            });
            assert.strictEqual(result.success, false);
        });

        it('accepts limit at maximum (100)', () => {
            const result = validateSchema(productHistorySchema, {
                params: { productId: '507f1f77bcf86cd799439011' },
                body: {},
                query: { limit: '100' },
            });
            assert.strictEqual(result.success, true);
            assert.strictEqual(result.data.query.limit, 100);
        });
    });

    describe('productQuerySchema', () => {
        it('accepts empty query (returns defaults)', () => {
            const result = validateSchema(productQuerySchema, {
                params: {},
                body: {},
                query: {},
            });
            assert.strictEqual(result.success, true);
            assert.strictEqual(result.data.query.page, 1);
            assert.strictEqual(result.data.query.limit, 20);
        });

        it('accepts valid search term', () => {
            const result = validateSchema(productQuerySchema, {
                params: {},
                body: {},
                query: { search: 'CPU' },
            });
            assert.strictEqual(result.success, true);
            assert.strictEqual(result.data.query.search, 'CPU');
        });

        it('trims search term', () => {
            const result = validateSchema(productQuerySchema, {
                params: {},
                body: {},
                query: { search: '  CPU  ' },
            });
            assert.strictEqual(result.success, true);
            assert.strictEqual(result.data.query.search, 'CPU');
        });

        it('accepts valid stock status', () => {
            for (const status of ['in_stock', 'low_stock', 'out_of_stock']) {
                const result = validateSchema(productQuerySchema, {
                    params: {},
                    body: {},
                    query: { stockStatus: status },
                });
                assert.strictEqual(result.success, true, `Should accept status: ${status}`);
            }
        });

        it('rejects invalid stock status', () => {
            const result = validateSchema(productQuerySchema, {
                params: {},
                body: {},
                query: { stockStatus: 'invalid_status' },
            });
            assert.strictEqual(result.success, false);
        });

        it('accepts valid category ObjectId', () => {
            const result = validateSchema(productQuerySchema, {
                params: {},
                body: {},
                query: { category: '507f1f77bcf86cd799439011' },
            });
            assert.strictEqual(result.success, true);
        });

        it('accepts valid brand ObjectId', () => {
            const result = validateSchema(productQuerySchema, {
                params: {},
                body: {},
                query: { brand: '507f1f77bcf86cd799439011' },
            });
            assert.strictEqual(result.success, true);
        });

        it('rejects limit over 100 (schema enforced)', () => {
            const result = validateSchema(productQuerySchema, {
                params: {},
                body: {},
                query: { page: '1000000', limit: '1000000' },
            });
            assert.strictEqual(result.success, false); // limit has .max(100) in schema
        });

        it('accepts large page value (schema has no max for page)', () => {
            const result = validateSchema(productQuerySchema, {
                params: {},
                body: {},
                query: { page: '1000000', limit: '50' },
            });
            assert.strictEqual(result.success, true); // page has no max in schema
            assert.strictEqual(result.data.query.page, 1000000);
        });
    });

    describe('overviewQuerySchema', () => {
        it('accepts empty query (no threshold)', () => {
            const result = validateSchema(overviewQuerySchema, {
                params: {},
                body: {},
                query: {},
            });
            assert.strictEqual(result.success, true);
            assert.strictEqual(result.data.query.threshold, undefined);
        });

        it('accepts valid threshold', () => {
            const result = validateSchema(overviewQuerySchema, {
                params: {},
                body: {},
                query: { threshold: '10' },
            });
            assert.strictEqual(result.success, true);
            assert.strictEqual(result.data.query.threshold, 10);
        });

        it('accepts threshold at minimum (0)', () => {
            const result = validateSchema(overviewQuerySchema, {
                params: {},
                body: {},
                query: { threshold: '0' },
            });
            assert.strictEqual(result.success, true);
            assert.strictEqual(result.data.query.threshold, 0);
        });

        it('rejects negative threshold', () => {
            const result = validateSchema(overviewQuerySchema, {
                params: {},
                body: {},
                query: { threshold: '-5' },
            });
            assert.strictEqual(result.success, false);
        });

        it('rejects decimal threshold', () => {
            const result = validateSchema(overviewQuerySchema, {
                params: {},
                body: {},
                query: { threshold: '5.5' },
            });
            assert.strictEqual(result.success, false);
        });
    });

});