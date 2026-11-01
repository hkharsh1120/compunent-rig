const { z } = require('zod');

const mongoose = require('mongoose');

const objectId = z.string().regex(
    /^[a-f\d]{24}$/i,
    'Invalid ID'
);

const productParamSchema = z.object({
    body: z.object({}),
    params: z.object({
        productId: objectId,
    }),
    query: z.object({}),
});

const adjustStockSchema = z.object({
    body: z.object({
        quantity: z.number().int().refine(val => val !== 0, 'Quantity must be a non-zero integer'),
        reason: z.string().trim().min(1).max(500),
    }),
    params: z.object({
        productId: objectId,
    }),
    query: z.object({}),
});

const productIdSchema = z.object({
    body: z.object({}),
    params: z.object({
        productId: objectId,
    }),
    query: z.object({}),
});

const productHistorySchema = z.object({
    body: z.object({}),
    params: z.object({
        productId: objectId,
    }),
    query: z.object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
    }),
});

const productQuerySchema = z.object({
    body: z.object({}),
    params: z.object({}).strict(),
    query: z.object({
        search: z.string().trim().optional(),
        category: objectId.optional(),
        brand: objectId.optional(),
        stockStatus: z.enum(['in_stock', 'low_stock', 'out_of_stock']).optional(),
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
    }),
});

const overviewQuerySchema = z.object({
    body: z.object({}),
    params: z.object({}),
    query: z.object({
        threshold: z.coerce.number().int().min(0).optional(),
    }),
});

module.exports = {
    adjustStockSchema,
    productParamSchema,
    productIdSchema,
    productHistorySchema,
    productQuerySchema,
    overviewQuerySchema,
};