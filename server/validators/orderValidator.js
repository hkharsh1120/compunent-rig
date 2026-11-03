const { z } = require('zod');

const objectId = z.string().regex(
    /^[a-f\d]{24}$/i,
    'Invalid ID'
);

const orderSchema = z.object({
    body: z.object({
        items: z.array(
            z.object({
                productId: z.string().regex(
                    /^[a-f\d]{24}$/i,
                    'Invalid product ID'
                ),
                quantity: z.number().int().min(1).max(50),
            }).strict()
        ).min(1).max(50),

        customerDetails: z.object({
            name: z.string().trim().min(2).max(50),
            email: z.string().trim().email(),
            phone: z.string().trim().min(10).max(15),
            address: z.string().trim().min(5).max(300),
            city: z.string().trim().min(2).max(80),
            state: z.string().trim().min(2).max(80),
            pincode: z.string().trim().regex(/^\d{6}$/),
        }).strict(),

        paymentMethod: z.enum([
            'cash_on_delivery',
            'pay_at_store',
            'offline',
        ]).default('offline'),

        notes: z.string().trim().max(1000).optional(),
    }).strict(),

    params: z.object({
        id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid order ID'),
    }),
    query: z.object({}),
});

const updateOrderStatusSchema = z.object({
    body: z.object({
        orderStatus: z.enum([
            'confirmed',
            'processing',
            'shipped',
            'delivered',
            'cancelled',
        ]),
    }).strict(),

    params: z.object({
        id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid order ID'),
    }),

    query: z.object({}),
});

module.exports = {
    orderSchema,
    updateOrderStatusSchema,
};