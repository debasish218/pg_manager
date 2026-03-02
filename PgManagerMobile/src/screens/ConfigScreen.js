import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { COLORS, SHADOWS, SIZES } from '../constants/theme';
import { storage } from '../utils/storage';
import { updateBaseUrl } from '../api/api';
import { getLocalIP } from '../constants/getLocalIP';
import axios from 'axios';

const ConfigScreen = ({ navigation }) => {
    const [ip, setIp] = useState('');
    const [loading, setLoading] = useState(false);
    const [testing, setTesting] = useState(false);
    const defaultIP = getLocalIP();

    useEffect(() => {
        loadSavedIP();
    }, []);

    const loadSavedIP = async () => {
        setLoading(true);
        const savedIP = await storage.getIP();
        if (savedIP) {
            setIp(savedIP);
        } else {
            setIp(defaultIP);
        }
        setLoading(false);
    };

    // Builds the full API base URL from whatever the user typed:
    // - Full URL (http/https)  → used as-is + /api  e.g. https://abc.ngrok-free.app/api
    // - Plain IP               → local format       e.g. http://192.168.1.70:5294/api
    const buildApiUrl = (input) => {
        const trimmed = input.trim();
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
            return trimmed.replace(/\/+$/, '') + '/api';
        }
        return `http://${trimmed}:5294/api`;
    };

    const handleSave = async () => {
        if (!ip.trim()) {
            Alert.alert('Error', 'Please enter an IP address or server URL');
            return;
        }
        saveAndExit();
    };

    const saveAndExit = async () => {
        await storage.saveIP(ip.trim());
        updateBaseUrl(buildApiUrl(ip));
        Alert.alert('Success', 'Settings saved!');
        navigation.goBack();
    };

    const testConnection = async () => {
        setTesting(true);
        try {
            const testUrl = buildApiUrl(ip) + '/tenants';
            const response = await axios.get(testUrl, { timeout: 5000 });
            if (response.status === 200) {
                Alert.alert('✅ Success', `Connected to:\n${testUrl}`);
            } else {
                Alert.alert('Failed', `Server returned status: ${response.status}`);
            }
        } catch (error) {
            console.error('Test connection error:', error);
            Alert.alert(
                'Connection Failed',
                'Could not reach the server. Check:\n• Backend is running\n• IP / URL is correct\n• For local: same WiFi network'
            );
        } finally {
            setTesting(false);
        }
    };

    const resetToDefault = () => {
        setIp(defaultIP);
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>Connection Settings</Text>
            <Text style={styles.description}>
                Enter your laptop's local IP (same WiFi) or a public URL (ngrok / Cloudflare Tunnel).
            </Text>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Backend IP or URL</Text>
                <TextInput
                    style={styles.input}
                    value={ip}
                    onChangeText={setIp}
                    placeholder="192.168.1.70  or  https://abc.ngrok-free.app"
                    keyboardType="default"
                    autoCapitalize="none"
                    autoCorrect={false}
                />
            </View>

            <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                    <Text style={{ fontWeight: 'bold' }}>Default detected:</Text> {defaultIP}
                </Text>
                <TouchableOpacity onPress={resetToDefault}>
                    <Text style={styles.resetLink}>Use Default</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[styles.button, styles.testButton]}
                    onPress={testConnection}
                    disabled={testing}
                >
                    {testing ? (
                        <ActivityIndicator color={COLORS.primary} size="small" />
                    ) : (
                        <Text style={styles.testButtonText}>Test Connection</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
                    <Text style={styles.saveButtonText}>Save & Apply</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.footer}>
                Local IP uses port 5294. Full URLs (ngrok/Cloudflare) are used as-is.
            </Text>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        padding: SIZES.padding,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 10,
    },
    description: {
        fontSize: 16,
        color: COLORS.textSecondary,
        marginBottom: 30,
        lineHeight: 22,
    },
    inputContainer: {
        backgroundColor: COLORS.white,
        padding: 15,
        borderRadius: SIZES.radius,
        ...SHADOWS.small,
        marginBottom: 15,
    },
    label: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 8,
    },
    input: {
        fontSize: 18,
        color: COLORS.text,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        paddingVertical: 5,
    },
    infoBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 5,
        marginBottom: 40,
    },
    infoText: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    resetLink: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    buttonContainer: {
        gap: 15,
    },
    button: {
        height: 55,
        borderRadius: SIZES.radius,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.small,
    },
    testButton: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    testButtonText: {
        color: COLORS.primary,
        fontSize: 16,
        fontWeight: 'bold',
    },
    saveButton: {
        backgroundColor: COLORS.primary,
    },
    saveButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    footer: {
        marginTop: 40,
        textAlign: 'center',
        color: COLORS.textSecondary,
        fontSize: 12,
        fontStyle: 'italic',
    },
});

export default ConfigScreen;
