import api from './api';

export const getAdminProducts = async (params = {}) => {
    const response = await api.get('/products/admin/all', { params });
    return response.data.data;
};

export const createProduct = async (productData) => {
    const response = await api.post('/products', productData);
    return response.data.data;
};

export const updateProduct = async (id, productData) => {
    const response = await api.patch(`/products/${id}`, productData);
    return response.data.data;
};

export const deactivateProduct = async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
};

export const uploadProductImages = async (id, files) => {
    const formData = new FormData();

    Array.from(files).forEach((file) => {
        formData.append('images', file);
    });

    const response = await api.post(
        `/products/${id}/images`,
        formData
    );

    return response.data.data;
};

export const deleteProductImage = async (productId, imageId) => {
    const response = await api.delete(
        `/products/${productId}/images/${imageId}`
    );

    return response.data;
};