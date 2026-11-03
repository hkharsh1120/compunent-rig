const { strict: assert } = require('node:assert');
const { describe, it } = require('node:test');
const { orderSchema } = require('../../validators/orderValidator');

function validateSchema(schema, data) {
    const result = schema.safeParse(data);
    return {
        success: result.success,
        data: result.success ? result.data : null,
        error: result.success ? null : result.error,
    };
}

describe('orderSchema', () => {
    it('accepts valid order with ID param', () => {
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
            params: { id: '507f1f77bcf86cd799439011' },
            query: {}
        });
        assert.strictEqual(result.success, true);
        assert.strictEqual(result.data.params.id, '507f1f77bcf86cd799439011');
    });

    it('rejects invalid order ID in params', () => {
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
            params: { id: 'invalid-id' },
            query: {}
        });
        assert.strictEqual(result.success, false);
    });
});
