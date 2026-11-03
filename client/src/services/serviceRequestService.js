
import api from './api';

export const submitPCBuildRequest = async (data) => {
    const response = await api.post('/api/service-requests/build', data);
    return response.data.data;
};

export const submitLaptopUpgradeRequest = async (data) => {
    const response = await api.post('/api/service-requests/upgrade', data);
    return response.data.data;
};
