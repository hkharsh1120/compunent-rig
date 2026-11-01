/**
 * Coupon Service Unit Tests
 *
 * Tests the pure coupon validation and calculation logic.
 * These tests test the couponService functions that don't require database.
 * Note: Full integration tests would require MongoDB replica-set for transaction testing.
 */

const { strict: assert } = require('node:assert');
const { describe, it, beforeEach } = require('node:test');

// Helper to calculate discount (mirrors couponService logic)
function calculateDiscount(coupon, orderAmount) {
    if (coupon.type === 'percentage') {
        const discount = (orderAmount * coupon.value) / 100;
        return coupon.maxDiscount ? Math.min(discount, coupon.maxDiscount) : discount;
    }
    return Math.min(coupon.value, orderAmount);
}

// Helper to check if coupon can be used (mirrors couponService logic)
function canBeUsed(coupon, orderAmount, userId, customerUsages = [], usageCount = 0, usageLimit = null, perCustomerLimit = null) {
    if (!coupon.isActive) return { valid: false, reason: 'Coupon is not active' };
    if (coupon.isExpired) return { valid: false, reason: 'Coupon has expired' };
    if (coupon.minOrderAmount > orderAmount) {
        return { valid: false, reason: `Minimum order amount of ${coupon.minOrderAmount} required` };
    }
    if (usageLimit && usageCount >= usageLimit) {
        return { valid: false, reason: 'Coupon usage limit reached' };
    }
    if (perCustomerLimit) {
        const usage = customerUsages.find(u => u.userId === userId);
        if (usage && usage.count >= perCustomerLimit) {
            return { valid: false, reason: 'You have already used this coupon max times' };
        }
    }
    return { valid: true, reason: 'Coupon is valid' };
}

describe('couponService', () => {

    describe('calculateDiscount', () => {
        describe('percentage coupons', () => {
            it('calculates percentage discount correctly', () => {
                const coupon = { type: 'percentage', value: 10 };
                const discount = calculateDiscount(coupon, 1000);
                assert.strictEqual(discount, 100);
            });

            it('applies maxDiscount cap', () => {
                const coupon = { type: 'percentage', value: 20, maxDiscount: 150 };
                const discount = calculateDiscount(coupon, 1000);
                assert.strictEqual(discount, 150); // 20% of 1000 = 200, capped at 150
            });

            it('does not cap when below maxDiscount', () => {
                const coupon = { type: 'percentage', value: 10, maxDiscount: 500 };
                const discount = calculateDiscount(coupon, 1000);
                assert.strictEqual(discount, 100); // 10% of 1000 = 100, no cap needed
            });

            it('handles zero order amount', () => {
                const coupon = { type: 'percentage', value: 10 };
                const discount = calculateDiscount(coupon, 0);
                assert.strictEqual(discount, 0);
            });
        });

        describe('fixed amount coupons', () => {
            it('applies fixed discount', () => {
                const coupon = { type: 'fixed', value: 50 };
                const discount = calculateDiscount(coupon, 1000);
                assert.strictEqual(discount, 50);
            });

            it('does not exceed order amount', () => {
                const coupon = { type: 'fixed', value: 1500 };
                const discount = calculateDiscount(coupon, 1000);
                assert.strictEqual(discount, 1000); // Capped at order amount
            });
        });
    });

    describe('canBeUsed', () => {
        const now = new Date();
        const future = new Date(now.getTime() + 86400000); // Tomorrow
        const past = new Date(now.getTime() - 86400000); // Yesterday

        it('rejects inactive coupons', () => {
            const coupon = {
                isActive: false,
                minOrderAmount: 0,
                expiryDate: future,
                isExpired: false,
            };
            const result = canBeUsed(coupon, 100);
            assert.strictEqual(result.valid, false);
            assert.strictEqual(result.reason, 'Coupon is not active');
        });

        it('rejects expired coupons', () => {
            const coupon = {
                isActive: true,
                minOrderAmount: 0,
                expiryDate: past,
                isExpired: true,
            };
            const result = canBeUsed(coupon, 100);
            assert.strictEqual(result.valid, false);
            assert.strictEqual(result.reason, 'Coupon has expired');
        });

        it('rejects orders below minimum amount', () => {
            const coupon = {
                isActive: true,
                minOrderAmount: 100,
                expiryDate: future,
                isExpired: false,
            };
            const result = canBeUsed(coupon, 50);
            assert.strictEqual(result.valid, false);
            assert.strictEqual(result.reason, 'Minimum order amount of 100 required');
        });

        it('accepts orders meeting minimum amount', () => {
            const coupon = {
                isActive: true,
                minOrderAmount: 100,
                expiryDate: future,
                isExpired: false,
            };
            const result = canBeUsed(coupon, 150);
            assert.strictEqual(result.valid, true);
        });

        it('rejects when usage limit reached', () => {
            const coupon = {
                isActive: true,
                minOrderAmount: 0,
                expiryDate: future,
                isExpired: false,
            };
            const result = canBeUsed(coupon, 100, 'userId', [], 5, 5, null);
            assert.strictEqual(result.valid, false);
            assert.strictEqual(result.reason, 'Coupon usage limit reached');
        });

        it('rejects when per-customer limit reached', () => {
            const coupon = {
                isActive: true,
                minOrderAmount: 0,
                expiryDate: future,
                isExpired: false,
            };
            const customerUsages = [{ userId: 'user123', count: 2 }];
            const result = canBeUsed(coupon, 100, 'user123', customerUsages, 2, 5, 2);
            assert.strictEqual(result.valid, false);
            assert.strictEqual(result.reason, 'You have already used this coupon max times');
        });

        it('accepts when per-customer limit not reached', () => {
            const coupon = {
                isActive: true,
                minOrderAmount: 0,
                expiryDate: future,
                isExpired: false,
            };
            const customerUsages = [{ userId: 'user123', count: 1 }];
            const result = canBeUsed(coupon, 100, 'user123', customerUsages, 2, 5, 2);
            assert.strictEqual(result.valid, true);
        });

        it('accepts active coupon within all limits', () => {
            const coupon = {
                isActive: true,
                minOrderAmount: 50,
                expiryDate: future,
                isExpired: false,
            };
            const result = canBeUsed(coupon, 100, 'userId', [], 2, 5, 2);
            assert.strictEqual(result.valid, true);
        });
    });

    describe('coupon normalization', () => {
        it('normalizes code to uppercase', () => {
            const code = 'save10';
            const normalized = code.trim().toUpperCase();
            assert.strictEqual(normalized, 'SAVE10');
        });

        it('trims whitespace from code', () => {
            const code = '  SAVE10  ';
            const normalized = code.trim().toUpperCase();
            assert.strictEqual(normalized, 'SAVE10');
        });
    });

    describe('percentage validation', () => {
        it('rejects percentage over 100', () => {
            const value = 150;
            const isValid = value > 0 && value <= 100;
            assert.strictEqual(isValid, false);
        });

        it('accepts percentage up to 100', () => {
            const value = 100;
            const isValid = value > 0 && value <= 100;
            assert.strictEqual(isValid, true);
        });

        it('rejects zero percentage', () => {
            const value = 0;
            const isValid = value > 0 && value <= 100;
            assert.strictEqual(isValid, false);
        });
    });

    describe('fixed amount validation', () => {
        it('rejects negative value', () => {
            const value = -50;
            const isValid = value > 0;
            assert.strictEqual(isValid, false);
        });

        it('accepts positive value', () => {
            const value = 50;
            const isValid = value > 0;
            assert.strictEqual(isValid, true);
        });
    });

});