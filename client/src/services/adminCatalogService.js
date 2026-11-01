
import api from './api';

// Categories
export const getAdminCategories = async () => {
    const response = await api.get('/categories/admin/all');
    return response.data.data;
};

export const createCategory = async (data) => {
    const response = await api.post('/categories', data);
    return response.data.data;
};

export const updateCategory = async (id, data) => {
    const response = await api.patch(`/categories/${id}`, data);
    return response.data.data;
};

export const deactivateCategory = async (id) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
};

// Brands
export const getAdminBrands = async () => {
    const response = await api.get('/brands/admin/all');
    return response.data.data;
};

export const createBrand = async (data) => {
    const response = await api.post('/brands', data);
    return response.data.data;
};

export const updateBrand = async (id, data) => {
    const response = await api.patch(`/brands/${id}`, data);
    return response.data.data;
};

export const deactivateBrand = async (id) => {
    const response = await api.delete(`/brands/${id}`);
    return response.data;
};
