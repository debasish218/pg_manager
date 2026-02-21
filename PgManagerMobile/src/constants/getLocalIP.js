import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * AUTO-DETECTS LOCAL IP FOR DEVELOPMENT
 * DO NOT USE IN PRODUCTION - This file is for local dev only
 * When deploying, use a fixed production URL instead
 */
export const getLocalIP = () => {
    // For development, try to auto-detect from Expo manifest
    if (__DEV__) {
        try {
            // Priority 1: Expo's host URI (most reliable for physical devices)
            const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;

            if (hostUri) {
                // Remove port if present (e.g., 192.168.1.70:8081 -> 192.168.1.70)
                const ip = hostUri.split(':')[0];
                console.log('📡 [Auto-Detect] IP from hostUri:', ip);
                return ip;
            }

            // Priority 2: Alternative manifest properties if available
            const manifest = Constants.manifest;
            if (manifest && manifest.debuggerHost) {
                const ip = manifest.debuggerHost.split(':')[0];
                console.log('📡 [Auto-Detect] IP from debuggerHost:', ip);
                return ip;
            }
        } catch (error) {
            console.warn('⚠️ Could not auto-detect IP via Expo Constants:', error);
        }
    }

    // Fallback to the current machine IP detected earlier
    // This is the fallback for when Expo is run in local mode or hostUri is missing
    return '192.168.1.70';
};
