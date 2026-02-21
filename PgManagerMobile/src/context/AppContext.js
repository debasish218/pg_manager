import React, { createContext, useState, useContext, useEffect } from 'react';
import { tenantApi, roomApi } from '../api/api';
import { getErrorMessage } from '../utils/errorHandler';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [tenants, setTenants] = useState([]);
    const [overdueTenants, setOverdueTenants] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchTenants = async () => {
        setLoading(true);
        try {
            const response = await tenantApi.getAll();
            if (response.data.success) {
                setTenants(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching tenants:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchOverdueTenants = async () => {
        try {
            const response = await tenantApi.getOverdue();
            if (response.data.success) {
                setOverdueTenants(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching overdue tenants:', error);
        }
    };

    const fetchRooms = async (sharingType = null) => {
        setLoading(true);
        try {
            const response = await roomApi.getAll(null, sharingType);
            if (response.data.success) {
                setRooms(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching rooms:', error);
        } finally {
            setLoading(false);
        }
    };

    const updatePayment = async (id, paymentData) => {
        try {
            const response = await tenantApi.updatePayment(id, paymentData);
            if (response.data.success) {
                await fetchTenants();
                await fetchOverdueTenants();
                return { success: true };
            }
            return { success: false, message: response.data.message };
        } catch (error) {
            return { success: false, message: getErrorMessage(error) };
        }
    };

    const deleteTenant = async (id) => {
        try {
            const response = await tenantApi.delete(id);
            if (response.data.success) {
                await fetchTenants();
                await fetchOverdueTenants();
                await fetchRooms(); // Update rooms to reflect bed availability
                return { success: true };
            }
            return { success: false, message: response.data.message };
        } catch (error) {
            return { success: false, message: getErrorMessage(error) };
        }
    };

    const deleteRoom = async (id) => {
        try {
            const response = await roomApi.delete(id);
            if (response.data.success) {
                await fetchRooms();
                await fetchTenants(); // Update tenants list if any were affected
                return { success: true };
            }
            return { success: false, message: response.data.message };
        } catch (error) {
            return { success: false, message: getErrorMessage(error) };
        }
    };

    useEffect(() => {
        fetchTenants();
        fetchOverdueTenants();
        fetchRooms();
    }, []);

    return (
        <AppContext.Provider
            value={{
                tenants,
                overdueTenants,
                rooms,
                loading,
                fetchTenants,
                fetchOverdueTenants,
                fetchRooms,
                updatePayment,
                deleteTenant,
                deleteRoom,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => useContext(AppContext);
