/**
 * Product Validator Unit Tests
 *
 * Tests the Zod validation schemas used by the product endpoints.
 * These tests do not connect to MongoDB - they only validate the schema logic.
 */

const { strict: assert } = require('node:assert');
const { describe, it } = require('node:test');

const {
    productSchema,
    updateProductSchema,
    productIdSchema,
    productQuerySchema,
} = require('../../validators/productValidator');

function validateSchema(schema, data) {
    const result = schema.safeParse(data);
    return {
        success: result.success,
        data: result.success ? result.data : null,
        error: result.success ? null : result.error,
    };
}

describe('productSchema', () => {
    describe('required fields', () => {
        it('accepts valid product data', () => {
            const result = validateSchema(productSchema, {
                body: {
                    name: 'Test Product',
                    description: 'Test description for validation',
                    price: 100,
                    stock: 10,
                    sku: 'TEST123',
                    category: '507f1f77bcf86cd799439011',
                    brand: '507f1f77bcf86cd799439011',
                },
                params: {},
                query: {},
            });
            assert.strictEqual(result.success, true);
        });

        it('accepts product with images', () => {
            const result = validateSchema(productSchema, {
                body: {
                    name: 'Test Product',
                    description: 'Test description for validation',
                    price: 100,
                    stock: 10,
                    sku: 'TEST123',
                    category: '507f1f77bcf86cd799439011',
                    brand: '507f1f77bcf86cd799439011',
                    images: [
                        { url: 'https://example.com/image.jpg', publicId: 'img1' },
                        { url: 'https://example.com/image2.jpg' },
                    ],
                },
                params: {},
                query: {},
            });
            assert.strictEqual(result.success, true);
        });

        it('accepts product with compatibility fields', () => {
            const result = validateSchema(productSchema, {
                body: {
                    name: 'CPU Product',
                    description: 'Test description for validation',
                    price: 350,
                    stock: 10,
                    sku: 'CPU001',
                    category: '507f1f77bcf86cd799439011',
                    brand: '507f1f77bcf86cd799439011',
                    compatibility: {
                        componentType: 'cpu',
                        socket: 'AM5',
                        ramType: 'DDR5',
                        capacity: 16,
                    },
                },
                params: {},
                query: {},
            });
            assert.strictEqual(result.success, true);
        });

        it('rejects invalid price', () => {
            const result = validateSchema(productSchema, {
                body: {
                    name: 'Test Product',
                    description: 'Test description for validation',
                    price: -100,
                    stock: 10,
                    sku: 'TEST123',
                    category: '507f1f77bcf86cd799439011',
                    brand: '507f1f77bcf86cd799439011',
                },
                params: {},
                query: {},
            });
            assert.strictEqual(result.success, false);
        });

        it('rejects invalid ObjectId for category', () => {
            const result = validateSchema(productSchema, {
                body: {
                    name: 'Test Product',
                    description: 'Test description for validation',
                    price: 100,
                    stock: 10,
                    sku: 'TEST123',
                    category: 'invalid-id',
                    brand: '507f1f77bcf86cd799439011',
                },
                params: {},
                query: {},
            });
            assert.strictEqual(result.success, false);
        });

        it('rejects invalid image URL', () => {
            const result = validateSchema(productSchema, {
                body: {
                    name: 'Test Product',
                    description: 'Test description for validation',
                    price: 100,
                    stock: 10,
                    sku: 'TEST123',
                    category: '507f1f77bcf86cd799439011',
                    brand: '507f1f77bcf86cd799439011',
                    images: [{ url: 'not-a-url' }],
                },
                params: {},
                query: {},
            });
            assert.strictEqual(result.success, false);
        });
    });

    describe('compatibility object', () => {
        it('accepts empty compatibility object', () => {
            const result = validateSchema(productSchema, {
                body: {
                    name: 'Test Product',
                    description: 'Test description for validation',
                    price: 100,
                    stock: 10,
                    sku: 'TEST123',
                    category: '507f1f77bcf86cd799439011',
                    brand: '507f1f77bcf86cd799439011',
                    compatibility: {},
                },
                params: {},
                query: {},
            });
            assert.strictEqual(result.success, true);
        });

        it('accepts supportedStorageInterfaces as array', () => {
            const result = validateSchema(productSchema, {
                body: {
                    name: 'Motherboard Product',
                    description: 'Test description for validation',
                    price: 200,
                    stock: 5,
                    sku: 'MB001',
                    category: '507f1f77bcf86cd799439011',
                    brand: '507f1f77bcf86cd799439011',
                    compatibility: {
                        supportedStorageInterfaces: ['SATA', 'NVMe', 'PCIe'],
                    },
                },
                params: {},
                query: {},
            });
            assert.strictEqual(result.success, true);
        });

        it('rejects invalid componentType', () => {
            const result = validateSchema(productSchema, {
                body: {
                    name: 'Test Product',
                    description: 'Test description for validation',
                    price: 100,
                    stock: 10,
                    sku: 'TEST123',
                    category: '507f1f77bcf86cd799439011',
                    brand: '507f1f77bcf86cd799439011',
                    compatibility: {
                        componentType: 'invalid',
                    },
                },
                params: {},
                query: {},
            });
            assert.strictEqual(result.success, false);
        });

        it('rejects extra fields in compatibility (strict mode)', () => {
            const result = validateSchema(productSchema, {
                body: {
                    name: 'Test Product',
                    description: 'Test description for validation',
                    price: 100,
                    stock: 10,
                    sku: 'TEST123',
                    category: '507f1f77bcf86cd799439011',
                    brand: '507f1f77bcf86cd799439011',
                    compatibility: {
                        extraField: 'should fail',
                    },
                },
                params: {},
                query: {},
            });
            assert.strictEqual(result.success, false);
        });
    });

    describe('specifications', () => {
        it('accepts specifications as object', () => {
            const result = validateSchema(productSchema, {
                body: {
                    name: 'Test Product',
                    description: 'Test description for validation',
                    price: 100,
                    stock: 10,
                    sku: 'TEST123',
                    category: '507f1f77bcf86cd799439011',
                    brand: '507f1f77bcf86cd799439011',
                    specifications: {
                        'Clock Speed': '3.5GHz',
                        'Memory': '16GB DDR4',
                    },
                },
                params: {},
                query: {},
            });
            assert.strictEqual(result.success, true);
        });

        it('accepts empty specifications object', () => {
            const result = validateSchema(productSchema, {
                body: {
                    name: 'Test Product',
                    description: 'Test description for validation',
                    price: 100,
                    stock: 10,
                    sku: 'TEST123',
                    category: '507f1f77bcf86cd799439011',
                    brand: '507f1f77bcf86cd799439011',
                    specifications: {},
                },
                params: {},
                query: {},
            });
            assert.strictEqual(result.success, true);
        });
    });
});

describe('updateProductSchema', () => {
    it('accepts partial update', () => {
        const result = validateSchema(updateProductSchema, {
            body: { isActive: false },
            params: { id: '507f1f77bcf86cd799439011' },
            query: {},
        });
        assert.strictEqual(result.success, true);
    });

    it('rejects update without fields', () => {
        const result = validateSchema(updateProductSchema, {
            body: {},
            params: { id: '507f1f77bcf86cd799439011' },
            query: {},
        });
        assert.strictEqual(result.success, false);
    });
});

describe('productIdSchema', () => {
    it('accepts valid ObjectId', () => {
        const result = validateSchema(productIdSchema, {
            body: {},
            params: { id: '507f1f77bcf86cd799439011' },
            query: {},
        });
        assert.strictEqual(result.success, true);
    });

    it('rejects invalid ObjectId', () => {
        const result = validateSchema(productIdSchema, {
            body: {},
            params: { id: 'invalid' },
            query: {},
        });
        assert.strictEqual(result.success, false);
    });
});

describe('productQuerySchema', () => {
    it('accepts empty query with defaults', () => {
        const result = validateSchema(productQuerySchema, {
            body: {},
            params: {},
            query: {},
        });
        assert.strictEqual(result.success, true);
        assert.strictEqual(result.data.query.page, 1);
        assert.strictEqual(result.data.query.limit, 12);
    });

    it('coerces string page/limit to numbers', () => {
        const result = validateSchema(productQuerySchema, {
            body: {},
            params: {},
            query: { page: '2', limit: '24' },
        });
        assert.strictEqual(result.success, true);
        assert.strictEqual(result.data.query.page, 2);
        assert.strictEqual(result.data.query.limit, 24);
    });

    it('rejects limit over 100', () => {
        const result = validateSchema(productQuerySchema, {
            body: undefined,
            params: {},
            query: { limit: '101' },
        });
        assert.strictEqual(result.success, false);
    });
});