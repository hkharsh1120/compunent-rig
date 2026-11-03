const express = require('express');

const {
    createCancellationRequest,
    getMyCancellationRequests,
    getOrderCancellation,
    cancelOrder,
    createReturnRequest,
    getMyReturnRequests,
    getReturnRequest,
    adminGetReturnRequests,
    adminApproveReturnRequest,
    adminRejectReturnRequest,
    completeReturn,
} = require('../controllers/returnController');

const validate = require('../middleware/validateMiddleware');

const {
    protect,
    authorizeAdmin,
} = require('../middleware/authMiddleware');

const {
    cancellationRequestSchema,
    returnRequestActionSchema,
    returnReceiptSchema,
} = require('../validators/orderCancellationValidator');

const router = express.Router();

// All routes require authentication
router.use(protect);

// ==================== CUSTOMER ROUTES ====================

// Create cancellation request for order
router.post(
    '/cancellations/:orderId',
    validate(cancellationRequestSchema),
    createCancellationRequest
);

// Get my cancellation requests
router.get('/cancellations', getMyCancellationRequests);

// Get my order's cancellation status
router.get('/cancellations/:orderId', getOrderCancellation);

// Cancel my order (only if eligible)
router.patch(
    '/cancellations/:orderId/confirm',
    cancelOrder
);

// Create return request for order
router.post(
    '/orders/:orderId/returns',
    async (req, res, next) => {
        // Auto-generate validation schema for orders/:id/returns
        const { z } = require('zod');
        const schema = z.object({
            body: z.object({
                reason: z.string().trim().min(1).max(500),
                description: z.string().trim().max(1000).optional(),
                items: z.array(z.object({
                    productId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid product ID'),
                    quantity: z.number().int().min(1),
                    condition: z.enum(['new', 'opened', 'damaged', 'defective']),
                }).strict()).min(1),
            }).strict(),
            params: z.object({
                orderId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid order ID'),
            }),
            query: z.object({}),
        });

        try {
            const result = schema.safeParse({
                body: req.body,
                params: req.params,
                query: req.query,
            });

            if (!result.success) {
                const ApiError = require('../utils/ApiError');
                throw new ApiError(400, result.error.errors[0].message);
            }

            req.validatedData = result;
            next();
        } catch (err) {
            next(err);
        }
    },
    createReturnRequest
);

// Get my return requests
router.get('/my-returns', getMyReturnRequests);

// Get specific return request
router.get('/my-returns/:id', getReturnRequest);

// ==================== ADMIN ROUTES ====================

// Get all return requests (with filters)
router.get(
    '/admin/returns',
    authorizeAdmin,
    adminGetReturnRequests
);

// Approve return request
router.patch(
    '/admin/returns/:id/approve',
    authorizeAdmin,
    validate(returnRequestActionSchema),
    adminApproveReturnRequest
);

// Reject return request
router.patch(
    '/admin/returns/:id/reject',
    authorizeAdmin,
    validate(returnRequestActionSchema),
    adminRejectReturnRequest
);

// Mark returned items as received and inspect
router.patch(
    '/admin/returns/:id/receive',
    authorizeAdmin,
    validate(returnReceiptSchema),
    completeReturn
);

module.exports = router;