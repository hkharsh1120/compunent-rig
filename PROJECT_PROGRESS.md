# Project Progress - Compunent Rig

## Technology Stack

Same as before...
---

## Completed Modules

### 8. Coupons & Discounts Management ✅ (COMPLETED)

### 9. Order Cancellation & Returns Management ✅ (COMPLETED)

---

## Order Cancellation & Returns Management - FINAL

### Database Models

**File:** `server/models/ReturnRequest.js` (NEW)

```javascript
{
    order: ObjectId (ref: Order),
    user: ObjectId (ref: User),
    reason: String (required, max 500 chars),
    description: String (optional, max 1000 chars),
    items: [{
        product: ObjectId (ref: Product),
        quantity: Number,
        condition: 'new'|'opened'|'damaged'|'defective',
        status: 'pending'|'approved'|'rejected'|'completed'|'cancelled',
    }],
    status: 'pending'|'approved'|'rejected'|'completed'|'cancelled',
    adminNotes: String,
    processedBy: ObjectId (ref: User),
    processedAt: Date,
    stockReturnReference: String,
}
```

**Order Model Updated:** Added `deliveredAt: Date` field and `returned` status

---

### API Endpoints

**Customer Endpoints (authenticated):**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/returns/cancellations/:orderId | Request order cancellation |
| GET | /api/returns/cancellations | List my cancellation requests |
| GET | /api/returns/cancellations/:orderId | Get cancellation status |
| PATCH | /api/returns/cancellations/:orderId/confirm | Confirm cancellation |
| POST | /api/returns/orders/:orderId/returns | Create return request |
| GET | /api/returns/my-returns | List my return requests |
| GET | /api/returns/my-returns/:id | Get return request details |

**Admin Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/returns/admin/returns | List all return requests (filter by status) |
| PATCH | /api/returns/admin/returns/:id/approve | Approve return request |
| PATCH | /api/returns/admin/returns/:id/reject | Reject return request |
| PATCH | /api/returns/admin/returns/:id/receive | Mark returned items as received |

---

### Business Rules & State Transitions

#### Order Cancellation State Machine

```
Eligible States for Cancellation:
- pending      → cancelled (inventory restored)
- confirmed    → cancelled (inventory restored)  
- processing   → cancelled (inventory restored)

NOT Eligible for Cancellation:
- shipped      → CANNOT cancel (items in transit)
- delivered    → CANNOT cancel
- returned     → CANNOT cancel
- cancelled    → CANNOT cancel (already cancelled)

Coupon Usage:
- Restored exactly once during cancellation transaction
- Per-customer usage count updated atomically
- Global usage count updated atomically
```

#### Return Request State Machine

```
created → pending   → approved  → completed  → Inventory restored
                      ↓             ↓
                   rejected     cancelled
```

**Status Transitions:**
1. `createReturnRequest()` - Request created in `pending` status
2. `adminApproveReturnRequest()` - Status changes to `approved`
3. `adminRejectReturnRequest()` - Status changes to `rejected`
4. `completeReturn()` - Items received, inventory restored, status to `completed`

**Inventory Restoration Rules:**
- ⛔ NOT restored on return request creation
- ⛔ NOT restored on request approval
- ✅ RESTORED only when admin marks items as received via `completeReturn()`
- ✅ Stored in `returned` state on Order

**Return Window:**
- 7 days from delivery (configurable via `RETURN_WINDOW_DAYS` env var)
- Uses `deliveredAt` timestamp (NOT `updatedAt`)
- Clear error message when window expires

---

### Payment and Refund Handling

**COD and Offline Payments:**
- Orders with `cash_on_delivery`, `pay_at_store`, `offline` payment methods
- NO automatic refund processing implemented
- `paymentStatus` remains unchanged on cancellation
- Manual refund handling required by admin

**Refund States:**
- `paymentStatus: 'refunded'` - exists in schema for future integration
- No payment provider integration currently implemented

---

### Security & Authorization

| Role | Cancellation | Return Request | Return Approval | Return Completion |
|------|-------------|----------------|-----------------|-------------------|
| Customer | ✅ Own eligible orders only | ✅ Own delivered orders | ❌ | ❌ |
| Admin | ✅ All orders | ❌ | ✅ All requests | ✅ All requests |

---

### MongoDB Transaction Safety

**All critical operations use MongoDB transactions:**

1. **Order Creation:** `createOrder()`
   - Product stock reduction
   - Coupon usage increment
   - Stock history entries
   - Order document creation

2. **Order Cancellation:** `updateOrderStatus('cancelled')`
   - Coupon usage restoration
   - Stock restoration
   - Stock history entries
   - Order status update

3. **Return Completion:** `completeReturn()`
   - Product stock restoration
   - Stock history entries
   - Order status to 'returned'
   - ReturnRequest status update

**Rollback Behavior:**
- All operations use `session.withTransaction()`
- Changes are atomic - all succeed or all rollback
- Session properly ended in `finally` block

---

### Tests & Verification

```
✔ cancellationRequestSchema    - 6 tests passing
✔ returnRequestActionSchema  - 6 tests passing
✔ returnReceiptSchema        - 6 tests passing
───────────────────────────────────────────
Total: 18 new tests passing

Total all tests: 141 tests passing, 0 failing
```

**Test Coverage:**
- ✅ Validation schema tests
- ✅ Cancellation eligibility
- ✅ Return window enforcement
- ✅ Status transition validation
- ✅ Duplicate operation prevention

---

### MongoDB Integration Test Status

**⚠️ Integration tests cannot execute without MongoDB replica-set**

The following require `mongodb-memory-server` with replica-set configuration:
- Transaction atomicity tests
- Concurrent operation tests
- Rollback behavior tests
- Coupon usage restoration atomicity
- Stock restoration atomicity

**Unit tests verify:**
- ✅ Schema validation
- ✅ Business logic (stock calculations, date handling)
- ✅ Authorization checks
- ✅ Error handling

---

## Files Created

| File | Purpose |
|------|---------|
| `server/models/ReturnRequest.js` | Return request Mongoose model |
| `server/validators/orderCancellationValidator.js` | Zod validation schemas |
| `server/controllers/returnController.js` | Request handlers |
| `server/routes/returnRoutes.js` | API routes |
| `server/tests/unit/orderCancellationValidator.test.js` | Unit tests (18 tests) |
| `client/src/services/orderService.js` | Added cancellation/return API calls |
| `client/src/services/adminOrderService.js` | Added return management functions |

---

## Files Modified

| File | Changes |
|------|---------|
| `server/models/Order.js` | Added `deliveredAt` field, `returned` status |
| `server/services/orderService.js` | Add deliveredAt on delivery, prevent shipped cancellation |
| `server/controllers/returnController.js` | Improved shipped order handling |
| `server/app.js` | Added `/api/returns` route mount |
| `client/src/pages/MyOrders.jsx` | Added cancellation UI |
| `client/src/pages/admin/AdminOrders.jsx` | Added return management UI |

---

## Commits Created

1. `f0761e9` - feat: Implement Order Cancellation and Returns Management module
2. `db6b7e4` - fix: Prevent shipped order cancellation and add deliveredAt tracking

---

## Remaining Work

| Task | Status | Notes |
|------|--------|-------|
| Frontend visual testing | ⏳ Pending | Manual testing of cancellation/returns UI |
| MongoDB replication tests | ⏳ Pending | Requires replica-set for transaction tests |
| Payment refund integration | ⏳ Future | No payment provider currently integrated |

---

## Authentication Bug Fix - Registration

### Root Cause
Multiple issues found:

1. **API Base URL Issue**: The `VITE_API_BASE_URL` in `client/.env` was incorrectly set to `http://localhost:5000/api`. Since the backend routes are already prefixed with `/api` (e.g., `/api/auth/register`), this caused the frontend to call `http://localhost:5000/api/api/auth/register` (double `/api`), resulting in a 404.

2. **Inconsistent Frontend Paths**: Multiple frontend service files had inconsistent API paths - some used `/api/admin/...` while others used `/admin/...`. This inconsistency would cause issues once the base URL was fixed.

### HTTP Status and Error
- **Status:** 404 Not Found
- **Original sanitized error:** "Route not found: /auth/login"

### Files Modified

**Client .env files:**
1. `client/.env` - Fixed `VITE_API_BASE_URL` from `http://localhost:5000/api` to `http://localhost:5000`
2. `client/.env.example` - Updated example to match correct URL format

**Frontend Service Files (added `/api` prefix to all paths):**
1. `client/src/services/authService.js` - `/auth/register`, `/auth/login`, etc.
2. `client/src/services/adminCouponService.js` - Fixed double `/api` paths
3. `client/src/services/adminCatalogService.js` - Added `/api` prefix
4. `client/src/services/adminCustomerService.js` - Added `/api` prefix
5. `client/src/services/adminInventoryService.js` - Added `/api` prefix
6. `client/src/services/adminOrderService.js` - Added `/api` prefix
7. `client/src/services/adminProductService.js` - Added `/api` prefix
8. `client/src/services/adminRequestService.js` - Added `/api` prefix
9. `client/src/services/adminService.js` - Added `/api` prefix
10. `client/src/services/healthService.js` - Added `/api` prefix
11. `client/src/services/orderService.js` - Added `/api` prefix
12. `client/src/services/productService.js` - Added `/api` prefix
13. `client/src/services/serviceRequestService.js` - Added `/api` prefix

### Fix Implemented
1. Set `VITE_API_BASE_URL=http://localhost:5000` (without trailing `/api`)
2. Added `/api` prefix to all frontend API paths to match backend route mounting
3. This ensures consistency: `baseURL + '/api/...` = `http://localhost:5000/api/...`

### Test Results
- ✅ Register new user: Status 201, "Account created successfully"
- ✅ Login with registered user: Status 200, "Login successful"  
- ✅ Duplicate email detection: Status 409, "An account with this email already exists"
- ✅ Invalid credentials rejection: Status 401, "Invalid email or password"
- ✅ Protected route access: Status 200 with valid JWT cookie
- ✅ Logout: Status 200, cookie cleared
- ✅ Password hashing verified: bcrypt hash stored in database
- ✅ All 141 backend tests passing
- ✅ Frontend production build successful

### MongoDB Runtime Testing
✅ Completed - Full registration, login, and logout flow verified with actual MongoDB database.

---

## Order Creation Bug Fix - Coupon Validation

### Root Cause
Two issues were found in order creation:

1. **Coupon Schema Issue**: The `coupon.type` field in the Order model had `default: ''` (empty string), but the enum only allows `['percentage', 'fixed']`. When creating an order without a coupon, the empty string violated the enum constraint, causing: "coupon.type: "" is not a valid enum value for path coupon.type"

2. **Map Key Type Mismatch**: In `orderService.js`, the `quantities` Map was using ObjectId instances as keys (from `item.productId`), but lookups used `product._id.toString()` (string). Since JavaScript Maps use reference equality for objects, different ObjectId instances with the same value are NOT the same key. This caused:
   - `quantities.get(product._id.toString())` returned `undefined`
   - `item.quantity` became `NaN` in arithmetic
   - `{ $inc: { stock: -NaN } }` caused "Cast to Number failed for value NaN"

### HTTP Status and Error
- **Status:** 400 Bad Request (validation error)
- **Original sanitized error:** "Order validation failed: coupon.type: "" is not a valid enum value for path coupon.type"

### Files Modified
1. `server/models/Order.js` - Changed `coupon.type` default from `''` to `null`
2. `server/services/orderService.js` - 
   - Changed `couponInfo` initialization to empty object `{}` (no coupon)
   - Added conditional coupon field inclusion (only when couponapplied)
   - Fixed Map key type mismatch by using `toString()` consistently for both set and get operations

### Fix Implemented
1. **Order Schema**: Changed `coupon.type` default to `null` so empty coupon objects don't violate enum
2. **couponInfo**: Initialize as `{}` instead of `{code: '', type: '', value: 0, maxDiscount: 0}` to avoid invalid enum values
3. **Coupon Field**: Only include `coupon` field in order document when a valid coupon is applied (check `Object.keys(couponInfo).length > 0`)
4. **Map Keys**: Use string representation consistently: `quantities.set(item.productId.toString(), ...)` and `quantities.get(product._id.toString())`

### How Orders Are Stored

**Order WITHOUT coupon:**
```javascript
{
    orderNumber: "CR-...",
    user: ObjectId(...),
    items: [...],
    subtotal: 100,
    discount: 0,
    totalAmount: 100,
    // coupon field is NOT included
    paymentMethod: "offline",
    ...
}
```

**Order WITH coupon:**
```javascript
{
    orderNumber: "CR-...",
    user: ObjectId(...),
    items: [...],
    subtotal: 100,
    discount: 10,
    totalAmount: 90,
    coupon: {
        code: "TEST10",
        type: "percentage",  // Valid enum value
        value: 10,
        maxDiscount: 0
    },
    paymentMethod: "offline",
    ...
}
```

### Test Results
- ✅ Order without coupon: Created successfully with no coupon field
- ✅ Order with percentage coupon: Discount calculated correctly (10% off)
- ✅ Coupon usage count incremented on order
- ✅ All 141 backend tests passing

### MongoDB Runtime Testing
✅ Completed - Orders without coupon and with coupon both created successfully.

---

## Admin Order Details Bug Fix

### Root Cause
The `GET /api/orders/:id` route was missing the validation middleware. The controller `getOrderById` expected `req.validatedData.params.id`, but since the validation middleware was never called, `req.validatedData` was `undefined`, leading to the error: `Cannot read properties of undefined (reading 'params')`. 

Additionally, the `orderSchema` in `orderValidator.js` had an empty `params` object, which wouldn't have captured the `id` even if the middleware was present.

### HTTP Status and Error
- **Status:** 500 Internal Server Error (originally)
- **Error:** `TypeError: Cannot read properties of undefined (reading 'params')` at `server/controllers/orderController.js:26`

### Files Modified
1. `server/validators/orderValidator.js` - Added `id` validation to `params` in `orderSchema`
2. `server/routes/orderRoutes.js` - Added `validate(orderSchema)` middleware to `GET /:id` route
3. `server/tests/unit/orderValidator.test.js` - (NEW) Regression tests for order validation

### Fix Implemented
1. Updated `orderSchema` to validate the `id` parameter as a valid MongoDB ObjectId.
2. Registered the validation middleware for the `GET /:id` route in `orderRoutes.js`.
3. This ensures `req.validatedData` is correctly populated before the controller is called.

### Test Results
- ✅ Valid order ID: Returns order details (Status 200)
- ✅ Invalid order ID: Returns validation error (Status 400)
- ✅ All 143 backend tests passing (including 2 new regression tests)

---
📝 Document updated: 2026-11-03
👤 Last updated by: Claude Code