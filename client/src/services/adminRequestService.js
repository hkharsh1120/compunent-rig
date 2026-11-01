
import api from './api';

export const getBuildRequests = async () => {
    const response = await api.get('/admin/requests/build');
    return response.data.data.requests;
};

export const getUpgradeRequests = async () => {
    const response = await api.get('/admin/requests/upgrade');
    return response.data.data.requests;
};

export const updateBuildRequest = async (id, data) => {
    const response = await api.patch(`/admin/requests/build/${id}`, data);
    return response.data.data;
};

export const updateUpgradeRequest = async (id, data) => {
    const response = await api.patch(`/admin/requests/upgrade/${id}`, data);
    return response.data.data;
};
