
import api from './api';

export const getAdminOrders = async (params = {}) => {
    const response = await api.get('/api/orders/admin/all', { params });
    return response.data.data;
};

export const getAdminOrderDetails = async (id) => {
    const response = await api.get(`/api/orders/${id}`);
    return response.data.data;
};

export const updateAdminOrderStatus = async (id, orderStatus) => {
    const response = await api.patch(`/api/orders/admin/${id}/status`, {
        orderStatus,
    });

    return response.data.data;
};
