import api from './api';

export const getInventoryOverview = async () => {
    const response = await api.get('/inventory/overview');
    return response.data.data;
};

export const getInventoryProducts = async (filters = {}) => {
    const response = await api.get('/inventory/products', { params: filters });
    return response.data.data;
};

export const getStockHistory = async (productId, pagination = {}) => {
    const response = await api.get(`/inventory/products/${productId}/history`, {
        params: pagination,
    });
    return response.data.data;
};

export const adjustStock = async (productId, data) => {
    const response = await api.post(`/inventory/products/${productId}/adjust`, data);
    return response.data.data;
};