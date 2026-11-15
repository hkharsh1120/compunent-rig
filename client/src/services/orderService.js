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

// Customers can cancel an order before it ships.
export const cancelOrder = async (orderId, reason) => {
    const response = await api.patch(`/api/orders/${orderId}/cancel`, {
        reason,
    });

    return response.data.data;
};
