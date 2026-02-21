import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
    API_IP: 'api_ip_address',
};

export const storage = {
    saveIP: async (ip) => {
        try {
            await AsyncStorage.setItem(KEYS.API_IP, ip);
            return true;
        } catch (error) {
            console.error('Error saving IP:', error);
            return false;
        }
    },
    getIP: async () => {
        try {
            return await AsyncStorage.getItem(KEYS.API_IP);
        } catch (error) {
            console.error('Error getting IP:', error);
            return null;
        }
    },
    clearIP: async () => {
        try {
            await AsyncStorage.removeItem(KEYS.API_IP);
            return true;
        } catch (error) {
            console.error('Error clearing IP:', error);
            return false;
        }
    },
};
