import api from './api';

export const getAdminDashboard = async () => {
    const response = await api.get('/admin/dashboard/stats');
    return response.data.data;
};