
import api from './api';

export const getBuildRequests = async (params = {}) => {
    const response = await api.get('/admin/requests/build', { params });
    return response.data.data;
};

export const getUpgradeRequests = async (params = {}) => {
    const response = await api.get('/admin/requests/upgrade', { params });
    return response.data.data;
};

export const getStatusOptions = async (type = 'build') => {
    const response = await api.get('/admin/requests/status-options', { params: { type } });
    return response.data.data.statuses;
};

export const updateBuildRequest = async (id, data) => {
    const response = await api.patch(`/admin/requests/build/${id}`, data);
    return response.data.data;
};

export const updateUpgradeRequest = async (id, data) => {
    const response = await api.patch(`/admin/requests/upgrade/${id}`, data);
    return response.data.data;
};
