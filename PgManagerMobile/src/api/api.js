import axios from 'axios';
import { API_BASE_URL } from '../constants/theme';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const updateBaseUrl = (newUrl) => {
    apiClient.defaults.baseURL = newUrl;
};

export const tenantApi = {
    getAll: (searchTerm, sharingType, isActive) =>
        apiClient.get('/tenants', { params: { searchTerm, sharingType, isActive } }),
    getById: (id) => apiClient.get(`/tenants/${id}`),
    getOverdue: () => apiClient.get('/tenants/overdue'),
    create: (data) => apiClient.post('/tenants', data),
    update: (id, data) => apiClient.put(`/tenants/${id}`, data),
    updatePayment: (id, data) => apiClient.patch(`/tenants/${id}/payment`, data),
    delete: (id) => apiClient.delete(`/tenants/${id}`),
};

export const roomApi = {
    getAll: (searchTerm, sharingType) =>
        apiClient.get('/rooms', { params: { searchTerm, sharingType } }),
    getById: (id) => apiClient.get(`/rooms/${id}`),
    getAvailable: (sharingType) => apiClient.get('/rooms/available', { params: { sharingType } }),
    create: (data) => apiClient.post('/rooms', data),
    update: (id, data) => apiClient.put(`/rooms/${id}`, data),
    delete: (id) => apiClient.delete(`/rooms/${id}`),
};

export default apiClient;
