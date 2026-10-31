
const { z } = require('zod');

const productSchema = z.object({
    body: z.object({
        name: z.string().trim().min(2).max(150),
        description: z.string().trim().min(10).max(5000),
        price: z.number().positive(),
        stock: z.number().int().min(0),
        category: z.string().min(1),
        brand: z.string().min(1),
        sku: z.string().trim().min(2).max(50),
        images: z.array(z.string().url()).optional(),
    }).strict(),
    params: z.object({}),
    query: z.object({}),
});

module.exports = { productSchema };
