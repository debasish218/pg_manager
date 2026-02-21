export const COLORS = {
    primary: '#6200EE',
    primaryLight: '#BB86FC',
    primaryDark: '#3700B3',
    secondary: '#03DAC6',
    success: '#4CAF50',
    error: '#B00020',
    warning: '#FF9800',
    info: '#2196F3',
    light: '#F8F9FA',
    dark: '#121212',
    white: '#FFFFFF',
    text: '#000000',
    textSecondary: '#757575',
    border: '#E0E0E0',
    overdue: '#F44336',
    paid: '#4CAF50',
    cardBackground: '#FFFFFF',
    background: '#F0F2F5',
};

export const SHADOWS = {
    small: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    medium: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
};

export const SIZES = {
    padding: 20,
    margin: 15,
    radius: 12,
};

// ==================== API CONFIGURATION ====================
// Development: Auto-detects your local IP (no manual updates needed!)
// Production: Uses fixed AWS URL (set before deployment)
// ===========================================================

import { getLocalIP } from './getLocalIP';

const ENV = {
    development: {
        // Auto-detects IP - no need to change when IP changes!
        apiUrl: `http://${getLocalIP()}:5294/api`,
    },
    production: {
        // TODO: Replace with your AWS URL before deployment
        apiUrl: 'https://your-api-domain.com/api',
    },
};

const currentEnv = __DEV__ ? 'development' : 'production';
export const API_BASE_URL = ENV[currentEnv].apiUrl;
