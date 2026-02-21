import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS, SIZES } from '../constants/theme';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';

const LoginScreen = () => {
    const { login, setup } = useAuth();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSetupMode, setIsSetupMode] = useState(false);
    const [setupData, setSetupData] = useState(null); // { secret, qrCodeUri }

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
    }
});

export default LoginScreen;
