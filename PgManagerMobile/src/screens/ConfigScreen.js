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

    const handleSave = async () => {
        if (!ip) {
            Alert.alert('Error', 'Please enter an IP address');
            return;
        }

        // Basic IP format validation (optional but good)
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!ipRegex.test(ip)) {
            Alert.alert('Warning', 'This doesn\'t look like a standard IP address. Continue anyway?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Yes', onPress: saveAndExit }
            ]);
        } else {
            saveAndExit();
        }
    };

    const saveAndExit = async () => {
        await storage.saveIP(ip);
        updateBaseUrl(`http://${ip}:5294/api`);
        Alert.alert('Success', 'Settings saved!');
        navigation.goBack();
    };

    const testConnection = async () => {
        setTesting(true);
        try {
            const testUrl = `http://${ip}:5294/api/tenants`;
            const response = await axios.get(testUrl, { timeout: 5000 });
            if (response.status === 200) {
                Alert.alert('Success', 'Connection successful!');
            } else {
                Alert.alert('Failed', `Server returned status: ${response.status}`);
            }
        } catch (error) {
            console.error('Test connection error:', error);
            Alert.alert(
                'Connection Failed',
                'Could not reach the server. Make sure:\n1. The backend is running\n2. Mobile & Laptop are on SAME WiFi\n3. IP address is correct'
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
                If the app cannot connect to the backend, enter your laptop's current IP address below.
            </Text>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Backend IP Address</Text>
                <TextInput
                    style={styles.input}
                    value={ip}
                    onChangeText={setIp}
                    placeholder="e.g. 192.168.1.70"
                    keyboardType="numeric"
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
                Backend port is fixed to 5294 (Standard for this project).
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
