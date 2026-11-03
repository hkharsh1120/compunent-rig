import api from './api';

export const getProducts = async (params = {}) => {
    const response = await api.get('/api/products', { params });
    return response.data.data;
};

export const getProductBySlug = async (slug) => {
    const response = await api.get(`/api/products/${slug}`);
    return response.data.data;
};

export const getCategories = async () => {
    const response = await api.get('/api/categories');
    return response.data.data;
};

export const getBrands = async () => {
    const response = await api.get('/api/brands');
    return response.data.data;
};