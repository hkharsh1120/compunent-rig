
const { z } = require('zod');

const pcBuildSchema = z.object({
    body: z.object({
        phone: z.string().trim().min(10).max(15),
        budget: z.number().positive(),
        purpose: z.enum([
            'gaming',
            'office',
            'editing',
            'programming',
            'workstation',
            'other',
        ]),
        requirements: z.string().trim().min(10).max(2000),
    }).strict(),
    params: z.object({}),
    query: z.object({}),
});

const laptopUpgradeSchema = z.object({
    body: z.object({
        phone: z.string().trim().min(10).max(15),
        laptopBrand: z.string().trim().min(2).max(50),
        laptopModel: z.string().trim().min(2).max(100),
        upgradeType: z.enum(['ram', 'storage', 'both']),
        currentSpecifications: z.string().trim().max(1000).optional(),
        requirements: z.string().trim().max(2000).optional(),
    }).strict(),
    params: z.object({}),
    query: z.object({}),
});

module.exports = {
    pcBuildSchema,
    laptopUpgradeSchema,
};
