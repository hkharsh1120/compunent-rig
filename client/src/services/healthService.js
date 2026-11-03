import api from './api';

export const getHealthStatus = async () => {
    const response = await api.get('/api/health');

    return {
        ...response.data.data,
        success: response.data.success,
        message: response.data.message,
    };
};