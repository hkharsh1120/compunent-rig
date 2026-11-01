import api from './api';

// List coupons with optional filters
export const getCoupons = async (filters = {}) => {
    const params = new URLSearchParams();

    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.isActive !== undefined) params.append('isActive', filters.isActive);
    if (filters.type) params.append('type', filters.type);
    if (filters.search) params.append('search', filters.search);

    const response = await api.get(`/api/admin/coupons?${params.toString()}`);
    return response.data.data;
};

// Get single coupon
export const getCoupon = async (id) => {
    const response = await api.get(`/api/admin/coupons/${id}`);
    return response.data.data;
};

// Create coupon
export const createCoupon = async (couponData) => {
    const response = await api.post('/api/admin/coupons', couponData);
    return response.data.data;
};

// Update coupon
export const updateCoupon = async (id, couponData) => {
    const response = await api.patch(`/api/admin/coupons/${id}`, couponData);
    return response.data.data;
};

// Delete (deactivate) coupon
export const deleteCoupon = async (id) => {
    const response = await api.delete(`/api/admin/coupons/${id}`);
    return response.data.data;
};

// Apply coupon (customer endpoint)
export const applyCoupon = async (couponData) => {
    const response = await api.post('/api/coupons/apply', couponData);
    return response.data.data;
};