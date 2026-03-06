import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
// Ionicons import removed – not used after server settings removal
import { useAuth } from '../context/AuthContext';
import { COLORS, SIZES } from '../constants/theme';
import { GoogleSignin, GoogleSigninButton } from '@react-native-google-signin/google-signin';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { storage } from '../utils/storage';
import { updateBaseUrl } from '../api/api';

const LoginScreen = () => {
    const { login, googleLogin, setup } = useAuth();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSetupMode, setIsSetupMode] = useState(false);
    const [setupData, setSetupData] = useState(null);
    // Server settings state removed

    // Google Sign-In initialization retained; server URL loading removed

    const handleSaveServer = async () => {
        const trimmed = serverUrl.trim();
        if (!trimmed) {
            Alert.alert('Error', 'Please enter a server IP or URL');
            return;
        }
        await storage.saveIP(trimmed);
        const url = (trimmed.startsWith('http://') || trimmed.startsWith('https://'))
            ? trimmed.replace(/\/+$/, '') + '/api'
            : `http://${trimmed}:5294/api`;
        updateBaseUrl(url);
        Alert.alert('✅ Saved', `Connected to:\n${url}`);
        setShowServerSettings(false);
    };

    const handleLogin = async () => {
        if (!phoneNumber || !code) {
            Alert.alert('Error', 'Please enter phone number and code');
            return;
        }

        setLoading(true);
        const result = await login(phoneNumber, code);
        setLoading(false);

        if (!result.success) {
            Alert.alert('Login Failed', result.message);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            await GoogleSignin.hasPlayServices();
            await GoogleSignin.signOut(); // Clear cached account so picker always shows
            const userInfo = await GoogleSignin.signIn();

            // Handle different versions of google-signin package returns
            const idToken = userInfo.data?.idToken || userInfo.idToken;

            if (!idToken) {
                throw new Error("No Google token received");
            }

            const result = await googleLogin(idToken);
            if (!result.success) {
                Alert.alert('Google Login Failed', result.message);
            }
        } catch (error) {
            console.error('Google Sign-In Error:', error);
            Alert.alert('Google Login Error', error.message || 'An error occurred during Google Sign-In.');
        } finally {
            setLoading(false);
        }
    };

    const handleSetup = async () => {
        if (!phoneNumber) {
            Alert.alert('Error', 'Please enter phone number');
            return;
        }
        setLoading(true);
        const result = await setup(phoneNumber, "Default PG", "Admin"); // Using default values for now
        setLoading(false);

        if (result.success) {
            setSetupData(result.data);
            Alert.alert('Setup Success', 'Authenticator secret generated. Please add it to your Google Authenticator app.');
        } else {
            Alert.alert('Setup Failed', result.message);
        }
    }

    const copyToClipboard = async () => {
        if (setupData?.secret) {
            await Clipboard.setStringAsync(setupData.secret);
            Alert.alert('Copied', 'Secret copied to clipboard');
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <View style={styles.card}>
                <Text style={styles.title}>PgManager Login</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Phone Number"
                    placeholderTextColor={COLORS.textSecondary || '#999'}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                />

                {isSetupMode && setupData ? (
                    <View style={styles.setupContainer}>
                        <Text style={styles.label}>Scan QR Code or Enter Secret:</Text>
                        <View style={{ alignItems: 'center', marginVertical: 10 }}>
                            {setupData.qrCodeUri && <QRCode value={setupData.qrCodeUri} size={150} />}
                        </View>
                        <TouchableOpacity onPress={copyToClipboard}>
                            <Text style={styles.secretText}>{setupData.secret}</Text>
                            <Text style={styles.copyText}>(Tap to Copy)</Text>
                        </TouchableOpacity>
                    </View>
                ) : null}

                <TextInput
                    style={styles.input}
                    placeholder="Authenticator Code (6 digits)"
                    placeholderTextColor={COLORS.textSecondary || '#999'}
                    value={code}
                    onChangeText={setCode}
                    keyboardType="number-pad"
                    maxLength={6}
                />

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleLogin}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
                </TouchableOpacity>

                <View style={styles.orDivider}>
                    <View style={styles.orLine} />
                    <Text style={styles.orText}>OR</Text>
                    <View style={styles.orLine} />
                </View>

                <GoogleSigninButton
                    style={{ width: '100%', height: 50, marginTop: 10 }}
                    size={GoogleSigninButton.Size.Wide}
                    color={GoogleSigninButton.Color.Light}
                    onPress={handleGoogleLogin}
                    disabled={loading}
                />

                <TouchableOpacity
                    style={[styles.linkButton, { marginTop: 20 }]}
                    onPress={() => {
                        setIsSetupMode(!isSetupMode);
                        setSetupData(null);
                    }}
                >
                    <Text style={styles.linkText}>
                        {isSetupMode ? "Back to Login" : "First time? Setup Authenticator"}
                    </Text>
                </TouchableOpacity>

                {isSetupMode && !setupData && (
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: COLORS.secondary, marginTop: 10 }]}
                        onPress={handleSetup}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Generate Secret</Text>}
                    </TouchableOpacity>
                )}

                {/* Server Settings — accessible before login */}
                // Server settings UI removed – app now uses fixed ngrok URL
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: COLORS.background,
    },
    card: {
        backgroundColor: COLORS.white,
        padding: 20,
        borderRadius: 10,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: COLORS.primary,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 15, // Improved padding
        borderRadius: 8,
        marginBottom: 15,
        fontSize: 16,
    },
    button: {
        backgroundColor: COLORS.primary,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    linkButton: {
        alignItems: 'center',
    },
    linkText: {
        color: COLORS.primary,
        textDecorationLine: 'underline',
    },
    orDivider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 15,
    },
    orLine: {
        flex: 1,
        height: 1,
        backgroundColor: COLORS.border,
    },
    orText: {
        width: 40,
        textAlign: 'center',
        color: COLORS.textSecondary,
        fontWeight: 'bold',
    },
    setupContainer: {
        marginBottom: 15,
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 8
    },
    label: {
        marginBottom: 5,
        fontWeight: '600'
    },
    secretText: {
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1,
        color: '#333'
    },
    copyText: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center'
    },
    serverToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 24,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    serverToggleText: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    serverBox: {
        marginTop: 12,
        backgroundColor: COLORS.background,
        borderRadius: 8,
        padding: 14,
        gap: 10,
    },
    serverLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontWeight: '600',
        marginBottom: 2,
    },
    serverInput: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        color: COLORS.text,
    },
    serverSaveBtn: {
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
    },
    serverSaveBtnText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 14,
    },
});

export default LoginScreen;
