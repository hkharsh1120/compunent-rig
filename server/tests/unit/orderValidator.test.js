const { strict: assert } = require('node:assert');
const { describe, it } = require('node:test');
const { orderSchema, orderIdSchema } = require('../../validators/orderValidator');

function validateSchema(schema, data) {
    const result = schema.safeParse(data);
    return {
        success: result.success,
        data: result.success ? result.data : null,
        error: result.success ? null : result.error,
    };
}

describe('orderSchema', () => {
    it('accepts valid order with no route params', () => {
        const result = validateSchema(orderSchema, {
            body: {
                items: [
                    { productId: '507f1f77bcf86cd799439011', quantity: 1 }
                ],
                customerDetails: {
                    name: 'John Doe',
                    email: 'john@example.com',
                    phone: '1234567890',
                    address: '123 Main St',
                    city: 'New York',
                    state: 'NY',
                    pincode: '123456'
                },
                paymentMethod: 'offline'
            },
            params: {},
            query: {}
        });
        assert.strictEqual(result.success, true);
    });

    it('rejects invalid order ID in params for order detail schema', () => {
        const result = validateSchema(orderIdSchema, {
            body: {},
            params: { id: 'invalid-id' },
            query: {}
        });
        assert.strictEqual(result.success, false);
    });

    it('accepts valid order ID in params for order detail schema', () => {
        const result = validateSchema(orderIdSchema, {
            body: {},
            params: { id: '507f1f77bcf86cd799439011' },
            query: {}
        });
        assert.strictEqual(result.success, true);
        assert.strictEqual(result.data.params.id, '507f1f77bcf86cd799439011');
    });
});
