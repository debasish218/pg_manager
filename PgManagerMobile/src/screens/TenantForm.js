import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    ScrollView, SafeAreaView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tenantApi, roomApi } from '../api/api';
import { COLORS, SHADOWS, SIZES } from '../constants/theme';
import DatePickerModal from '../components/DatePickerModal';
import { getErrorMessage } from '../utils/errorHandler';
import { useAppContext } from '../context/AppContext';

// FormInput component defined outside to prevent re-creation on parent re-renders
const FormInput = ({ label, value, onChangeText, placeholder, keyboardType = 'default', required = false, editable = true }) => (
    <View style={styles.formGroup}>
        <Text style={styles.label}>{label} {required && <Text style={styles.required}>*</Text>}</Text>
        <TextInput
            style={[styles.input, !editable && styles.inputDisabled]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={COLORS.textSecondary + '80'}
            keyboardType={keyboardType}
            editable={editable}
        />
    </View>
);

const TenantForm = ({ route, navigation }) => {
    const { fetchTenants, fetchRooms } = useAppContext();
    const { tenant, roomId } = route.params || {};
    const isEdit = !!tenant;

    const [formData, setFormData] = useState({
        name: tenant?.name || '',
        phoneNumber: tenant?.phoneNumber || '',
        sharingType: tenant?.sharingType || '',
        rentAmount: tenant?.rentAmount?.toString() || '',
        advanceAmount: tenant?.advanceAmount?.toString() || '',
        joinDate: tenant?.joinDate || new Date().toISOString(),
        // New tenants have no payment record — null means N/A
        lastPaidDate: tenant?.lastPaidDate || '',
        isActive: tenant?.isActive ?? true,
        roomId: roomId || tenant?.roomId,
        dueAmount: tenant?.dueAmount?.toString() || '0',
    });

    // Room change state (edit mode only)
    const [currentRoom, setCurrentRoom] = useState(null);
    const [newRoomNumber, setNewRoomNumber] = useState('');
    const [roomCheckLoading, setRoomCheckLoading] = useState(false);
    const [allRooms, setAllRooms] = useState([]);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showJoinDatePicker, setShowJoinDatePicker] = useState(false);

    // Fetch room details to get sharingType and rentPerBed for new tenants
    useEffect(() => {
        const fetchRoomDetails = async () => {
            if (roomId && !isEdit) {
                try {
                    const response = await roomApi.getById(roomId);
                    if (response.data.success) {
                        const room = response.data.data;
                        const sharingTypeMap = {
                            'Single': 1, 'Double': 2, 'Triple': 3,
                            'Four': 4, 'Five': 5, 'Six': 6
                        };
                        const sharingTypeNumber = sharingTypeMap[room.sharingType] || room.totalBeds;
                        setFormData(prev => ({
                            ...prev,
                            sharingType: sharingTypeNumber.toString(),
                            rentAmount: room.rentPerBed?.toString() || prev.rentAmount,
                        }));
                    }
                } catch (error) {
                    console.error('Error fetching room details:', error);
                }
            }
        };
        fetchRoomDetails();
    }, [roomId, isEdit]);

    // In edit mode, fetch all rooms, set current room, and sync rentAmount to current room's rentPerBed
    useEffect(() => {
        if (isEdit) {
            const loadRooms = async () => {
                try {
                    const response = await roomApi.getAll();
                    if (response.data.success) {
                        setAllRooms(response.data.data);
                        const cur = response.data.data.find(r => r.id === tenant.roomId);
                        if (cur) {
                            setCurrentRoom(cur);
                            // Update rentAmount to match the room's current rentPerBed
                            setFormData(prev => ({
                                ...prev,
                                rentAmount: cur.rentPerBed?.toString() || prev.rentAmount,
                            }));
                        }
                    }
                } catch (e) {
                    console.error('Error loading rooms:', e);
                }
            };
            loadRooms();
        }
    }, [isEdit]);

    // Format ISO date for display
    const formatDateDisplay = (iso) => {
        if (!iso) return 'Tap to select date';
        const d = new Date(iso);
        if (isNaN(d)) return 'Tap to select date';
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    };

    // Handle room change with vacancy check
    const handleRoomChange = async () => {
        const trimmed = newRoomNumber.trim();
        if (!trimmed) {
            Alert.alert('Error', 'Please enter a room number to transfer to.');
            return;
        }

        const targetRoomNum = parseInt(trimmed);
        if (isNaN(targetRoomNum)) {
            Alert.alert('Error', 'Please enter a valid room number.');
            return;
        }

        if (currentRoom && targetRoomNum === currentRoom.roomNumber) {
            Alert.alert('Same Room', 'Tenant is already in this room.');
            return;
        }

        setRoomCheckLoading(true);
        try {
            const response = await roomApi.getAll();
            if (!response.data.success) {
                Alert.alert('Error', 'Could not fetch rooms. Try again.');
                return;
            }

            const targetRoom = response.data.data.find(r => r.roomNumber === targetRoomNum);

            if (!targetRoom) {
                Alert.alert('Not Found', `Room ${targetRoomNum} does not exist.`);
                return;
            }

            const availableBeds = targetRoom.totalBeds - targetRoom.occupiedBeds;

            if (availableBeds <= 0) {
                Alert.alert(
                    'Room Full',
                    `Room ${targetRoomNum} is already full (${targetRoom.occupiedBeds}/${targetRoom.totalBeds} beds occupied).`
                );
                return;
            }

            // Vacancy available — ask for confirmation
            Alert.alert(
                'Confirm Room Transfer',
                `Move ${tenant.name} from Room ${currentRoom?.roomNumber ?? '?'} to Room ${targetRoomNum}?\n\n` +
                `Room ${targetRoomNum} has ${availableBeds} bed(s) available.`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Move',
                        style: 'default',
                        onPress: () => {
                            setFormData(prev => ({
                                ...prev,
                                roomId: targetRoom.id,
                                // Auto-update rent to new room's rentPerBed
                                rentAmount: targetRoom.rentPerBed?.toString() || prev.rentAmount,
                            }));
                            setCurrentRoom(targetRoom);
                            setNewRoomNumber('');
                            Alert.alert(
                                'Room Selected',
                                `Room ${targetRoomNum} selected. Monthly rent updated to ₹${targetRoom.rentPerBed?.toLocaleString() ?? '?'}. Save changes to confirm transfer.`
                            );
                        }
                    }
                ]
            );
        } catch (e) {
            console.error('Room check error:', e);
            Alert.alert('Error', 'Could not check room availability.');
        } finally {
            setRoomCheckLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name || !formData.phoneNumber) {
            Alert.alert("Required Fields", "Please fill in name and phone number.");
            return;
        }

        if (formData.phoneNumber.length !== 10 || isNaN(formData.phoneNumber)) {
            Alert.alert("Invalid Phone", "Phone number must be exactly 10 digits.");
            return;
        }

        if (parseInt(formData.rentAmount) <= 0) {
            Alert.alert("Invalid Rent", "Monthly rent must be greater than ₹0.");
            return;
        }

        const advanceNum = formData.advanceAmount ? parseInt(formData.advanceAmount) : 0;
        if (isNaN(advanceNum) || advanceNum < 0) {
            Alert.alert("Invalid Security Deposit", "Security deposit cannot be negative.");
            return;
        }

        const dueNum = formData.dueAmount ? parseInt(formData.dueAmount) : 0;
        if (isNaN(dueNum) || dueNum < 0) {
            Alert.alert("Invalid Opening Balance", "Opening due balance cannot be negative.");
            return;
        }

        const data = {
            ...formData,
            rentAmount: parseInt(formData.rentAmount),
            advanceAmount: formData.advanceAmount ? parseInt(formData.advanceAmount) : 0,
            sharingType: parseInt(formData.sharingType),
            lastPaidDate: formData.lastPaidDate || null,
            dueAmount: parseInt(formData.dueAmount) || 0,
        };

        try {
            let response;
            if (isEdit) {
                response = await tenantApi.update(tenant.id, data);
            } else {
                response = await tenantApi.create(data);
            }

            if (response.data.success) {
                // Refresh global state
                await fetchTenants();
                await fetchRooms();

                Alert.alert("Success", `Tenant ${isEdit ? 'updated' : 'added'} successfully`);
                navigation.goBack();
            } else {
                Alert.alert("Error", response.data.message || "Failed to save tenant.");
            }
        } catch (error) {
            console.error("Submit Error:", error);
            const msg = getErrorMessage(error);
            Alert.alert("Error", msg);
        }
    };

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>

                    {/* Personal Info */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Personal Information</Text>
                        <FormInput
                            label="Full Name"
                            value={formData.name}
                            onChangeText={(text) => updateField('name', text)}
                            placeholder="John Doe"
                            required
                        />
                        <FormInput
                            label="Phone Number"
                            value={formData.phoneNumber}
                            onChangeText={(text) => updateField('phoneNumber', text)}
                            placeholder="1234567890"
                            keyboardType="phone-pad"
                            required
                        />
                    </View>

                    {/* Lease Details */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Lease Details</Text>
                        {/* Monthly Rent is auto-filled from the room's rentPerBed — not editable by user */}
                        <FormInput
                            label="Monthly Rent (from room)"
                            value={formData.rentAmount ? `₹${parseInt(formData.rentAmount).toLocaleString()}` : 'Loading...'}
                            onChangeText={() => { }}
                            placeholder="Auto-filled from room"
                            keyboardType="numeric"
                            editable={false}
                        />
                        <FormInput
                            label="Security Deposit"
                            value={formData.advanceAmount}
                            onChangeText={(text) => updateField('advanceAmount', text)}
                            keyboardType="numeric"
                        />
                        <FormInput
                            label="Opening Due Balance"
                            value={formData.dueAmount}
                            onChangeText={(text) => updateField('dueAmount', text)}
                            placeholder="0"
                            keyboardType="numeric"
                        />

                        {/* Joining Date — always editable */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Joining Date <Text style={styles.required}>*</Text></Text>
                            <TouchableOpacity
                                style={styles.dateButton}
                                onPress={() => setShowJoinDatePicker(true)}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                                <Text style={styles.dateButtonText}>
                                    {formatDateDisplay(formData.joinDate)}
                                </Text>
                                <Ionicons name="chevron-down" size={16} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                            <DatePickerModal
                                visible={showJoinDatePicker}
                                value={formData.joinDate}
                                title="Select Joining Date"
                                onConfirm={(iso) => {
                                    updateField('joinDate', iso);
                                    setShowJoinDatePicker(false);
                                }}
                                onCancel={() => setShowJoinDatePicker(false)}
                            />
                        </View>

                        {/* Last Payment Date — edit mode only */}
                        {isEdit && (
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Last Payment Date</Text>
                                <TouchableOpacity
                                    style={styles.dateButton}
                                    onPress={() => setShowDatePicker(true)}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                                    <Text style={[
                                        styles.dateButtonText,
                                        !formData.lastPaidDate && styles.dateButtonPlaceholder
                                    ]}>
                                        {formatDateDisplay(formData.lastPaidDate)}
                                    </Text>
                                    <Ionicons name="chevron-down" size={16} color={COLORS.textSecondary} />
                                </TouchableOpacity>

                                <DatePickerModal
                                    visible={showDatePicker}
                                    value={formData.lastPaidDate || new Date().toISOString()}
                                    title="Select Last Payment Date"
                                    onConfirm={(iso) => {
                                        const selectedDate = new Date(iso);
                                        const joinDateObj = new Date(formData.joinDate);
                                        selectedDate.setHours(0, 0, 0, 0);
                                        joinDateObj.setHours(0, 0, 0, 0);
                                        if (selectedDate < joinDateObj) {
                                            Alert.alert(
                                                'Invalid Date',
                                                `Last payment date cannot be before the join date (${formatDateDisplay(formData.joinDate)}).`
                                            );
                                            setShowDatePicker(false);
                                            return;
                                        }
                                        updateField('lastPaidDate', iso);
                                        setShowDatePicker(false);
                                    }}
                                    onCancel={() => setShowDatePicker(false)}
                                />
                            </View>
                        )}
                    </View>

                    {/* Room Transfer — edit mode only */}
                    {isEdit && (
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Room Assignment</Text>

                            <View style={styles.currentRoomRow}>
                                <Ionicons name="home" size={18} color={COLORS.primary} />
                                <Text style={styles.currentRoomText}>
                                    Current Room:{' '}
                                    <Text style={styles.currentRoomNumber}>
                                        {currentRoom ? `Room ${currentRoom.roomNumber}` : 'Loading...'}
                                    </Text>
                                </Text>
                            </View>

                            <Text style={styles.label}>Transfer to Room Number</Text>
                            <View style={styles.roomInputRow}>
                                <TextInput
                                    style={[styles.input, styles.roomInput]}
                                    value={newRoomNumber}
                                    onChangeText={setNewRoomNumber}
                                    placeholder="Enter room number"
                                    placeholderTextColor={COLORS.textSecondary + '80'}
                                    keyboardType="numeric"
                                />
                                <TouchableOpacity
                                    style={styles.checkButton}
                                    onPress={handleRoomChange}
                                    disabled={roomCheckLoading}
                                >
                                    {roomCheckLoading
                                        ? <ActivityIndicator color="white" size="small" />
                                        : <Text style={styles.checkButtonText}>Check</Text>
                                    }
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.hint}>
                                Enter a room number and tap Check to verify vacancy before transferring.
                            </Text>
                        </View>
                    )}

                    <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.8}>
                        <Text style={styles.saveButtonText}>{isEdit ? 'Save Changes' : 'Register Tenant'}</Text>
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
    hint: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 5,
    },
    input: {
        backgroundColor: COLORS.light,
        borderRadius: 10,
        padding: 15,
        fontSize: 16,
        color: COLORS.text,
    },
    inputDisabled: {
        opacity: 0.5,
    },
    currentRoomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: COLORS.primary + '12',
        padding: 12,
        borderRadius: 10,
        marginBottom: 16,
    },
    currentRoomText: {
        fontSize: 14,
        color: COLORS.text,
    },
    currentRoomNumber: {
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    roomInputRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 6,
    },
    roomInput: {
        flex: 1,
    },
    checkButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 10,
        paddingHorizontal: 18,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 70,
    },
    checkButtonText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 14,
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.light,
        borderRadius: 10,
        padding: 15,
        gap: 10,
    },
    dateButtonText: {
        flex: 1,
        fontSize: 16,
        color: COLORS.text,
        fontWeight: '500',
    },
    dateButtonPlaceholder: {
        color: COLORS.textSecondary + '80',
        fontWeight: 'normal',
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

export default TenantForm;
