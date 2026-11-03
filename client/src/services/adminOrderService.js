
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

// Admin return management services
export const adminGetReturnRequests = async (params = {}) => {
    const response = await api.get('/api/returns/admin/returns', { params });
    return response.data.data;
};

export const adminApproveReturnRequest = async (id, notes) => {
    const response = await api.patch(`/api/returns/admin/returns/${id}/approve`, { notes });
    return response.data.data;
};

export const adminRejectReturnRequest = async (id, notes) => {
    const response = await api.patch(`/api/returns/admin/returns/${id}/reject`, { notes });
    return response.data.data;
};

export const adminCompleteReturn = async (id, itemsReceived, notes) => {
    const response = await api.patch(`/api/returns/admin/returns/${id}/receive`, {
        itemsReceived,
        notes,
    });
    return response.data.data;
};
