import api from './api';

export const createOrder = async (orderData) => {
    const response = await api.post('/orders', orderData);
    return response.data.data;
};

export const getMyOrders = async () => {
    const response = await api.get('/orders/my-orders');
    return response.data.data;
};

export const getOrderById = async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data.data;
};

// Cancellation services
export const requestOrderCancellation = async (orderId, reason) => {
    const response = await api.post(`/returns/cancellations/${orderId}`, { reason });
    return response.data.data;
};

export const getOrderCancellationStatus = async (orderId) => {
    const response = await api.get(`/returns/cancellations/${orderId}`);
    return response.data.data;
};

export const cancelOrder = async (orderId) => {
    const response = await api.patch(`/returns/cancellations/${orderId}/confirm`);
    return response.data.data;
};

// Return services
export const createReturnRequest = async (orderId, items, reason, description) => {
    const response = await api.post(`/returns/orders/${orderId}/returns`, {
        items,
        reason,
        description,
    });
    return response.data.data;
};

export const getMyReturnRequests = async () => {
    const response = await api.get('/returns/my-returns');
    return response.data.data;
};

export const getReturnRequest = async (id) => {
    const response = await api.get(`/returns/my-returns/${id}`);
    return response.data.data;
};