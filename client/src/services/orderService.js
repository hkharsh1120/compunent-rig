import api from './api';

export const createOrder = async (orderData) => {
    const response = await api.post('/api/orders', orderData);
    return response.data.data;
};

export const getMyOrders = async () => {
    const response = await api.get('/api/orders/my-orders');
    return response.data.data;
};

export const getOrderById = async (id) => {
    const response = await api.get(`/api/orders/${id}`);
    return response.data.data;
};

// Cancellation services
export const requestOrderCancellation = async (orderId, reason) => {
    const response = await api.post(`/api/returns/cancellations/${orderId}`, { reason });
    return response.data.data;
};

export const getOrderCancellationStatus = async (orderId) => {
    const response = await api.get(`/api/returns/cancellations/${orderId}`);
    return response.data.data;
};

export const cancelOrder = async (orderId) => {
    const response = await api.patch(`/api/returns/cancellations/${orderId}/confirm`);
    return response.data.data;
};

// Return services
export const createReturnRequest = async (orderId, items, reason, description) => {
    const response = await api.post(`/api/returns/orders/${orderId}/returns`, {
        items,
        reason,
        description,
    });
    return response.data.data;
};

export const getMyReturnRequests = async () => {
    const response = await api.get('/api/returns/my-returns');
    return response.data.data;
};

export const getReturnRequest = async (id) => {
    const response = await api.get(`/api/returns/my-returns/${id}`);
    return response.data.data;
};