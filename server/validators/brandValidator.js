const { z } = require('zod');

const brandBody = z.object({
    name: z.string().trim().min(2).max(80),
    description: z.string().trim().max(500).optional(),
}).strict();

const brandSchema = z.object({
    body: brandBody,
    params: z.object({}),
    query: z.object({}),
});

const updateBrandSchema = z.object({
    body: brandBody.partial().refine(
        data => Object.keys(data).length > 0,
        'At least one field is required'
    ),
    params: z.object({
        id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid brand ID'),
    }),
    query: z.object({}),
});

const brandIdSchema = z.object({
    body: z.object({}),
    params: z.object({
        id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid brand ID'),
    }),
    query: z.object({}),
});

module.exports = {
    brandSchema,
    updateBrandSchema,
    brandIdSchema,
};