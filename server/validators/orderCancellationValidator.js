const { z } = require('zod');

const objectId = z.string().regex(
    /^[a-f\d]{24}$/i,
    'Invalid ID'
);

// Customer can request cancellation for eligible orders
// Eligible: pending, confirmed, processing, shipped (NOT delivered or cancelled)
const cancellationRequestSchema = z.object({
    body: z.object({
        reason: z.string().trim().min(1).max(500),
    }).strict(),

    params: z.object({
        id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid order ID'),
    }),

    query: z.object({}),
});

// Admin can approve/reject return requests
const returnRequestActionSchema = z.object({
    body: z.object({
        action: z.enum(['approve', 'reject']),
        notes: z.string().trim().max(1000).optional(),
    }),

    params: z.object({
        id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid return request ID'),
    }),

    query: z.object({}),
});

// Mark items as received (for returns)
const returnReceiptSchema = z.object({
    body: z.object({
        itemsReceived: z.array(
            z.object({
                itemId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid item ID'),
                quantity: z.number().int().min(1),
                inGoodCondition: z.boolean(),
            }).strict()
        ).min(1),
        notes: z.string().trim().max(500).optional(),
    }).strict(),

    params: z.object({
        id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid return request ID'),
    }),

    query: z.object({}),
});

module.exports = {
    cancellationRequestSchema,
    returnRequestActionSchema,
    returnReceiptSchema,
};