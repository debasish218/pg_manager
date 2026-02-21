import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { roomApi } from '../api/api';
import { getErrorMessage } from '../utils/errorHandler';
import { COLORS, SHADOWS, SIZES } from '../constants/theme';
import { useAppContext } from '../context/AppContext';

const FormInput = ({ label, value, onChangeText, placeholder, keyboardType = 'default', required = false }) => (
    <View style={styles.formGroup}>
        <Text style={styles.label}>{label} {required && <Text style={styles.required}>*</Text>}</Text>
        <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={COLORS.textSecondary + '80'}
            keyboardType={keyboardType}
        />
    </View>
);

const RoomForm = ({ route, navigation }) => {
    const { rooms } = useAppContext();
    const { room } = route.params || {};
    const isEdit = !!room;

    const [formData, setFormData] = useState({
        roomNumber: room?.roomNumber?.toString() || '',
        totalBeds: room?.totalBeds?.toString() || '',
        rentPerBed: room?.rentPerBed?.toString() || '',
        floor: room?.floor?.toString() || '',
    });

    // Auto-determine sharing type from total beds
    const getSharingType = (totalBeds) => {
        const beds = parseInt(totalBeds);
        if (isNaN(beds) || beds < 1) return 1;
        if (beds > 6) return 6; // Cap at 6
        return beds;
    };

    const handleSave = async () => {
        if (!formData.roomNumber || !formData.totalBeds || !formData.rentPerBed) {
            Alert.alert("Required Fields", "Please fill room number, total beds, and rent per bed.");
            return;
        }

        const roomNumParsed = parseInt(formData.roomNumber);
        if (isNaN(roomNumParsed) || roomNumParsed <= 0) {
            Alert.alert("Invalid Room Number", "Room number must be a positive number.");
            return;
        }

        const totalBedsNum = parseInt(formData.totalBeds);
        if (isNaN(totalBedsNum) || totalBedsNum < 1 || totalBedsNum > 6) {
            Alert.alert("Invalid Input", "Total beds must be between 1 and 6.");
            return;
        }

        const rentParsed = parseInt(formData.rentPerBed);
        if (isNaN(rentParsed) || rentParsed <= 0) {
            Alert.alert("Invalid Rent", "Rent per bed must be greater than ₹0.");
            return;
        }

        const floorParsed = formData.floor ? parseInt(formData.floor) : 0;
        if (isNaN(floorParsed) || floorParsed < 0 || floorParsed > 100) {
            Alert.alert("Invalid Floor", "Floor must be between 0 and 100.");
            return;
        }

        // Exclude the current room itself when editing (room?.id is undefined when creating)
        const roomExists = rooms.some(r =>
            r.roomNumber === roomNumParsed &&
            r.id !== room?.id
        );

        if (roomExists) {
            Alert.alert("Room Already Exists", `Room number ${formData.roomNumber} is already taken.`);
            return;
        }

        const data = {
            roomNumber: roomNumParsed,
            sharingType: getSharingType(formData.totalBeds), // Auto-determine from total beds
            totalBeds: totalBedsNum,
            rentPerBed: rentParsed,
            floor: floorParsed,
        };

        try {
            let response;
            if (isEdit) {
                response = await roomApi.update(room.id, data);
            } else {
                response = await roomApi.create(data);
            }

            if (response.data.success) {
                Alert.alert("Success", `Room ${isEdit ? 'updated' : 'added'} successfully`);
                navigation.goBack();
            } else {
                Alert.alert("Error", response.data.message || "Failed to save room.");
            }
        } catch (error) {
            console.error("Submit Error:", error);
            const errorMsg = getErrorMessage(error);
            Alert.alert("Error", errorMsg);
        }
    };

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Get sharing type label for display
    const getSharingLabel = () => {
        const beds = parseInt(formData.totalBeds);
        if (isNaN(beds) || beds < 1) return '';

        const labels = {
            1: 'Single Sharing',
            2: 'Double Sharing',
            3: 'Triple Sharing',
            4: 'Four Sharing',
            5: 'Five Sharing',
            6: 'Six Sharing'
        };

        return labels[beds > 6 ? 6 : beds] || '';
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Room Information</Text>
                        <FormInput
                            label="Room Number"
                            value={formData.roomNumber}
                            onChangeText={(text) => updateField('roomNumber', text)}
                            placeholder="101, 102, etc."
                            keyboardType="numeric"
                            required
                        />
                        <FormInput
                            label="Floor"
                            value={formData.floor}
                            onChangeText={(text) => updateField('floor', text)}
                            placeholder="1, 2, 3, etc."
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Capacity Details</Text>
                        <FormInput
                            label="Total Beds"
                            value={formData.totalBeds}
                            onChangeText={(text) => updateField('totalBeds', text)}
                            placeholder="Enter number of beds (1-6)"
                            keyboardType="numeric"
                            required
                        />

                        {formData.totalBeds && getSharingLabel() && (
                            <View style={styles.sharingIndicator}>
                                <Text style={styles.sharingIndicatorLabel}>Sharing Type:</Text>
                                <Text style={styles.sharingIndicatorValue}>{getSharingLabel()}</Text>
                            </View>
                        )}

                        <FormInput
                            label="Rent Per Bed"
                            value={formData.rentPerBed}
                            onChangeText={(text) => updateField('rentPerBed', text)}
                            placeholder="5000"
                            keyboardType="numeric"
                            required
                        />
                    </View>

                    <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.8}>
                        <Text style={styles.saveButtonText}>{isEdit ? 'Save Changes' : 'Create Room'}</Text>
                    </TouchableOpacity>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        padding: SIZES.padding,
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radius * 1.5,
        padding: 20,
        marginBottom: 20,
        ...SHADOWS.small,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 20,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    formGroup: {
        marginBottom: 15,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 8,
    },
    required: {
        color: COLORS.error,
    },
    input: {
        backgroundColor: COLORS.light,
        borderRadius: 10,
        padding: 15,
        fontSize: 16,
        color: COLORS.text,
    },
    sharingIndicator: {
        backgroundColor: COLORS.primary + '10',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary,
    },
    sharingIndicatorLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginBottom: 4,
        fontWeight: '600',
    },
    sharingIndicatorValue: {
        fontSize: 16,
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    saveButton: {
        backgroundColor: COLORS.primary,
        padding: 18,
        borderRadius: SIZES.radius,
        alignItems: 'center',
        marginVertical: 10,
        ...SHADOWS.medium,
    },
    saveButtonText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default RoomForm;
