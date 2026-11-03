
import api from './api';

export const getAdminCustomers = async (params = {}) => {
    const response = await api.get('/api/admin/customers', { params });
    return response.data.data;
};

export const getAdminCustomerDetails = async (id) => {
    const response = await api.get(`/api/admin/customers/${id}`);
    return response.data.data;
};

export const updateCustomerStatus = async (id, isActive) => {
    const response = await api.patch(`/api/admin/customers/${id}/status`, {
        isActive,
    });

    return response.data.data;
};
