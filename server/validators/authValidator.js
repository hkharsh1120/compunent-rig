
const { z } = require('zod');

const registerSchema = z.object({
    body: z.object({
        name: z.string()
            .trim()
            .min(2, 'Name must contain at least 2 characters')
            .max(50, 'Name cannot exceed 50 characters'),

        email: z.string()
            .trim()
            .email('Please provide a valid email address')
            .max(254, 'Email is too long'),

        password: z.string()
            .min(8, 'Password must contain at least 8 characters')
            .max(128, 'Password cannot exceed 128 characters'),
    }).strict(),

    params: z.object({}),

    query: z.object({}),
});

const loginSchema = z.object({
    body: z.object({
        email: z.string()
            .trim()
            .email('Please provide a valid email address'),

        password: z.string()
            .min(1, 'Password is required')
            .max(128, 'Password cannot exceed 128 characters'),
    }).strict(),

    params: z.object({}),

    query: z.object({}),
});

module.exports = {
    registerSchema,
    loginSchema,
};
