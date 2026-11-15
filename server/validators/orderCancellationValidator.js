const { z } = require('zod');

// Customer can cancel an order before it ships.
// Eligible: pending, confirmed, processing.
const cancellationRequestSchema = z.object({
    body: z.object({
        reason: z.string().trim().min(1).max(500),
    }).strict(),

    params: z.object({
        id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid order ID'),
    }),

    query: z.object({}),
});

module.exports = {
    cancellationRequestSchema,
};
