import React, { createContext, useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import apiClient from '../api/api';

const AuthContext = createContext();

// Normalizes user data from either a decoded JWT payload or an API response,
// because JWT claim names differ from the plain API field names.
const normalizeUserData = (data) => {
    if (!data) return null;

    return {
        id: data.id || data.nameid || data['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'],
        phoneNumber: data.phoneNumber || data['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/mobilephone'],
        name: data.name || data['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'],
        pgName: data.pgName || data.pgname,
        role: data.role || data['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || 'User',
        ...data
    };
};

export const AuthProvider = ({ children }) => {
    const [userToken, setUserToken] = useState(null);
    const [userData, setUserData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadUser = async () => {
        setIsLoading(true);
        try {
            const token = await SecureStore.getItemAsync('userToken');
            if (token) {
                const decoded = jwtDecode(token);
                // Check if token is expired
                if (decoded.exp * 1000 < Date.now()) {
                    await logout();
                } else {
                    setUserToken(token);
                    setUserData(normalizeUserData(decoded));
                    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                }
            }
        } catch (error) {
            console.error('Error loading user:', error);
            await logout();
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (phoneNumber, code) => {
        try {
            const response = await apiClient.post('/auth/login', { phoneNumber, code });
            if (response.status === 200) {
                const { token, user } = response.data;
                await SecureStore.setItemAsync('userToken', token);
                setUserToken(token);
                setUserData(normalizeUserData(user));
                apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                return { success: true };
            }
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.response?.data || 'Login failed'
            };
        }
    };

    const setup = async (phoneNumber, pgName, name) => {
        try {
            const response = await apiClient.post('/auth/setup', { phoneNumber, pgName, name });
            if (response.status === 200) {
                return { success: true, data: response.data };
            }
        } catch (error) {
            console.error('Setup error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Setup failed'
            };
        }
    }

    const logout = async () => {
        await SecureStore.deleteItemAsync('userToken');
        setUserToken(null);
        setUserData(null);
        delete apiClient.defaults.headers.common['Authorization'];
    };

    const updateProfile = async (pgName, name) => {
        try {
            const response = await apiClient.put('/auth/profile', { pgName, name });
            if (response.status === 200) {
                const updatedUser = response.data;
                // Update local user data
                setUserData(normalizeUserData(updatedUser));
                return { success: true };
            }
        } catch (error) {
            console.error('Update profile error:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.response?.data || 'Update failed'
            };
        }
    };

    const deleteProfile = async () => {
        try {
            const response = await apiClient.delete('/auth/profile');
            if (response.status === 200) {
                // Logout after successful deletion
                await logout();
                return { success: true };
            }
        } catch (error) {
            console.error('Delete profile error:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.response?.data || 'Delete failed'
            };
        }
    };

    useEffect(() => {
        loadUser();
    }, []);

    return (
        <AuthContext.Provider value={{
            userToken,
            userData,
            isLoading,
            login,
            logout,
            setup,
            updateProfile,
            deleteProfile
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
