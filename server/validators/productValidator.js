const { z } = require('zod');

const objectId = z.string().regex(
    /^[a-f\d]{24}$/i,
    'Invalid ID'
);

const compatibilitySchema = z.object({
    componentType: z.enum([
        'cpu',
        'motherboard',
        'ram',
        'gpu',
        'storage',
        'psu',
        'case',
        'cooler'
    ]).optional(),

    socket: z.string().trim().max(50).optional(),
    ramType: z.string().trim().max(30).optional(),
    wattage: z.number().positive().optional(),
    recommendedPsuWattage: z.number().positive().optional(),
    interface: z.string().trim().max(50).optional(),

    // New motherboard compatibility fields
    supportedStorageInterfaces: z.array(
        z.enum(['SATA', 'NVMe', 'PCIe'])
    ).optional(),

    maxRamCapacity: z.number().positive().optional(),
    capacity: z.number().positive().optional(),
}).strict();
const productBody = z.object({
    name: z.string().trim().min(2).max(150),

    description: z.string().trim().min(10).max(5000),

    price: z.number().positive(),

    originalPrice: z.number().positive().nullable().optional(),

    stock: z.number().int().min(0),

    sku: z.string().trim().min(2).max(50),

    category: objectId,

    brand: objectId,

    images: z.array(
        z.object({
            url: z.string().url(),
            publicId: z.string().optional(),
        }).strict()
    ).optional(),

    specifications: z.record(
        z.string(),
        z.string()
    ).optional(),

    compatibility: compatibilitySchema.optional(),

    isFeatured: z.boolean().optional(),

    isActive: z.boolean().optional(),
}).strict();

const productSchema = z.object({
    body: productBody,
    params: z.object({}),
    query: z.object({}),
});

const updateProductSchema = z.object({
    body: productBody.partial().refine(
        data => Object.keys(data).length > 0,
        'At least one field is required'
    ),
    params: z.object({
        id: objectId,
    }),
    query: z.object({}),
});

const productIdSchema = z.object({
    body: z.object({}),
    params: z.object({
        id: objectId,
    }),
    query: z.object({}),
});

const productQuerySchema = z.object({
    body: z.any().optional(),
    params: z.object({}),
    query: z.object({
        search: z.string().trim().optional(),
        category: objectId.optional(),
        brand: objectId.optional(),
        minPrice: z.coerce.number().min(0).optional(),
        maxPrice: z.coerce.number().min(0).optional(),
        sort: z.enum([
            'newest',
            'oldest',
            'price-low',
            'price-high',
            'name',
        ]).default('newest'),
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(12),
    }).refine(
        data => data.minPrice === undefined ||
            data.maxPrice === undefined ||
            data.minPrice <= data.maxPrice,
        {
            message: 'Minimum price cannot exceed maximum price',
        }
    ),
});

module.exports = {
    productSchema,
    updateProductSchema,
    productIdSchema,
    productQuerySchema,
};