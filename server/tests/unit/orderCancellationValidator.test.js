/**
 * Order Cancellation and Returns Validator Unit Tests
 *
 * Tests the Zod validation schemas for cancellation and return requests.
 */

const { strict: assert } = require('node:assert');
const { describe, it } = require('node:test');

const {
    cancellationRequestSchema,
    returnRequestActionSchema,
    returnReceiptSchema,
} = require('../../validators/orderCancellationValidator');

function validateSchema(schema, data) {
    const result = schema.safeParse(data);
    return {
        success: result.success,
        data: result.success ? result.data : null,
        error: result.success ? null : result.error,
    };
}

describe('cancellationRequestSchema', () => {
    it('accepts valid cancellation request', () => {
        const result = validateSchema(cancellationRequestSchema, {
            body: { reason: 'Customer changed mind' },
            params: { id: '507f1f77bcf86cd799439011' },
            query: {},
        });
        assert.strictEqual(result.success, true);
        assert.strictEqual(result.data.body.reason, 'Customer changed mind');
        assert.strictEqual(result.data.params.id, '507f1f77bcf86cd799439011');
    });

    it('rejects invalid order ID', () => {
        const result = validateSchema(cancellationRequestSchema, {
            body: { reason: 'Customer changed mind' },
            params: { id: 'invalid-id' },
            query: {},
        });
        assert.strictEqual(result.success, false);
    });

    it('rejects missing reason', () => {
        const result = validateSchema(cancellationRequestSchema, {
            body: {},
            params: { id: '507f1f77bcf86cd799439011' },
            query: {},
        });
        assert.strictEqual(result.success, false);
    });

    it('rejects empty reason', () => {
        const result = validateSchema(cancellationRequestSchema, {
            body: { reason: '' },
            params: { id: '507f1f77bcf86cd799439011' },
            query: {},
        });
        assert.strictEqual(result.success, false);
    });

    it('rejects reason that is too long', () => {
        const result = validateSchema(cancellationRequestSchema, {
            body: { reason: 'a'.repeat(501) },
            params: { id: '507f1f77bcf86cd799439011' },
            query: {},
        });
        assert.strictEqual(result.success, false);
    });
});

describe('returnRequestActionSchema', () => {
    it('accepts valid approve action', () => {
        const result = validateSchema(returnRequestActionSchema, {
            body: { action: 'approve', notes: 'Customer return approved' },
            params: { id: '507f1f77bcf86cd799439011' },
            query: {},
        });
        assert.strictEqual(result.success, true);
        assert.strictEqual(result.data.body.action, 'approve');
    });

    it('accepts valid reject action', () => {
        const result = validateSchema(returnRequestActionSchema, {
            body: { action: 'reject' },
            params: { id: '507f1f77bcf86cd799439011' },
            query: {},
        });
        assert.strictEqual(result.success, true);
        assert.strictEqual(result.data.body.action, 'reject');
    });

    it('rejects invalid action', () => {
        const result = validateSchema(returnRequestActionSchema, {
            body: { action: 'invalid' },
            params: { id: '507f1f77bcf86cd799439011' },
            query: {},
        });
        assert.strictEqual(result.success, false);
    });

    it('rejects invalid return request ID', () => {
        const result = validateSchema(returnRequestActionSchema, {
            body: { action: 'approve' },
            params: { id: 'invalid' },
            query: {},
        });
        assert.strictEqual(result.success, false);
    });

    it('rejects notes that are too long', () => {
        const result = validateSchema(returnRequestActionSchema, {
            body: { action: 'approve', notes: 'a'.repeat(1001) },
            params: { id: '507f1f77bcf86cd799439011' },
            query: {},
        });
        assert.strictEqual(result.success, false);
    });
});

describe('returnReceiptSchema', () => {
    it('accepts valid receipt data', () => {
        const result = validateSchema(returnReceiptSchema, {
            body: {
                itemsReceived: [
                    { itemId: '507f1f77bcf86cd799439012', quantity: 1, inGoodCondition: true },
                ],
                notes: 'Item received in original packaging',
            },
            params: { id: '507f1f77bcf86cd799439011' },
            query: {},
        });
        assert.strictEqual(result.success, true);
        assert.strictEqual(result.data.body.itemsReceived.length, 1);
    });

    it('rejects missing itemsReceived', () => {
        const result = validateSchema(returnReceiptSchema, {
            body: { notes: 'Test' },
            params: { id: '507f1f77bcf86cd799439011' },
            query: {},
        });
        assert.strictEqual(result.success, false);
    });

    it('rejects empty itemsReceived', () => {
        const result = validateSchema(returnReceiptSchema, {
            body: { itemsReceived: [] },
            params: { id: '507f1f77bcf86cd799439011' },
            query: {},
        });
        assert.strictEqual(result.success, false);
    });

    it('rejects invalid item ID format', () => {
        const result = validateSchema(returnReceiptSchema, {
            body: {
                itemsReceived: [
                    { itemId: 'invalid', quantity: 1, inGoodCondition: true },
                ],
            },
            params: { id: '507f1f77bcf86cd799439011' },
            query: {},
        });
        assert.strictEqual(result.success, false);
    });

    it('rejects non-positive quantity', () => {
        const result = validateSchema(returnReceiptSchema, {
            body: {
                itemsReceived: [
                    { itemId: '507f1f77bcf86cd799439011', quantity: 0, inGoodCondition: true },
                ],
            },
            params: { id: '507f1f77bcf86cd799439011' },
            query: {},
        });
        assert.strictEqual(result.success, false);
    });

    it('rejects missing inGoodCondition', () => {
        const result = validateSchema(returnReceiptSchema, {
            body: {
                itemsReceived: [
                    { itemId: '507f1f77bcf86cd799439011', quantity: 1 },
                ],
            },
            params: { id: '507f1f77bcf86cd799439011' },
            query: {},
        });
        assert.strictEqual(result.success, false);
    });

    it('rejects notes that are too long', () => {
        const result = validateSchema(returnReceiptSchema, {
            body: {
                itemsReceived: [
                    { itemId: '507f1f77bcf86cd799439011', quantity: 1, inGoodCondition: true },
                ],
                notes: 'a'.repeat(1001),
            },
            params: { id: '507f1f77bcf86cd799439011' },
            query: {},
        });
        assert.strictEqual(result.success, false);
    });
});