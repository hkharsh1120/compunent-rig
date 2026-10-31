const { z } = require('zod');

const categoryBody = z.object({
    name: z.string().trim().min(2).max(80),
    description: z.string().trim().max(500).optional(),
    sortOrder: z.number().int().min(0).optional(),
}).strict();

const categorySchema = z.object({
    body: categoryBody,
    params: z.object({}),
    query: z.object({}),
});

const updateCategorySchema = z.object({
    body: categoryBody.partial().refine(
        data => Object.keys(data).length > 0,
        'At least one field is required'
    ),
    params: z.object({
        id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid category ID'),
    }),
    query: z.object({}),
});

const categoryIdSchema = z.object({
    body: z.object({}),
    params: z.object({
        id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid category ID'),
    }),
    query: z.object({}),
});

module.exports = {
    categorySchema,
    updateCategorySchema,
    categoryIdSchema,
};