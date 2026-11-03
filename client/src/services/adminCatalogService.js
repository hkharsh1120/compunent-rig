
import api from './api';

// Categories
export const getAdminCategories = async () => {
    const response = await api.get('/api/categories/admin/all');
    return response.data.data;
};

export const createCategory = async (data) => {
    const response = await api.post('/api/categories', data);
    return response.data.data;
};

export const updateCategory = async (id, data) => {
    const response = await api.patch(`/api/categories/${id}`, data);
    return response.data.data;
};

export const deactivateCategory = async (id) => {
    const response = await api.delete(`/api/categories/${id}`);
    return response.data;
};

// Brands
export const getAdminBrands = async () => {
    const response = await api.get('/api/brands/admin/all');
    return response.data.data;
};

export const createBrand = async (data) => {
    const response = await api.post('/api/brands', data);
    return response.data.data;
};

export const updateBrand = async (id, data) => {
    const response = await api.patch(`/api/brands/${id}`, data);
    return response.data.data;
};

export const deactivateBrand = async (id) => {
    const response = await api.delete(`/api/brands/${id}`);
    return response.data;
};
