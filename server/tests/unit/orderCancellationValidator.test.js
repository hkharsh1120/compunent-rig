/**
 * Order Cancellation Validator Unit Tests
 *
 * Tests the Zod validation schema for customer order cancellation.
 */

const { strict: assert } = require('node:assert');
const { describe, it } = require('node:test');

const {
    cancellationRequestSchema,
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
