import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, SIZES } from '../constants/theme';
import { useAppContext } from '../context/AppContext';
import { useNavigation } from '@react-navigation/native';
import { getErrorMessage } from '../utils/errorHandler';
import DatePickerModal from './DatePickerModal';

const TenantCard = ({ tenant, isHorizontal }) => {
    const { updatePayment, deleteTenant } = useAppContext();
    const navigation = useNavigation();
    const [menuVisible, setMenuVisible] = useState(false);
    const [paymentModalVisible, setPaymentModalVisible] = useState(false);
    const [paidAmount, setPaidAmount] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString());
    const [showDatePicker, setShowDatePicker] = useState(false);

    const handlePayment = async () => {
        const amount = parseInt(paidAmount);
        if (!paidAmount || isNaN(amount) || amount <= 0) {
            Alert.alert('Invalid Amount', 'Please enter a payment amount greater than ₹0.');
            return;
        }
        if (amount > due) {
            Alert.alert(
                'Overpayment Not Allowed',
                `Payment of ₹${amount.toLocaleString()} exceeds current due of ₹${due.toLocaleString()}. Please enter ₹${due.toLocaleString()} or less.`
            );
            return;
        }
        const result = await updatePayment(tenant.id, {
            paymentDate: paymentDate,
            paidAmount: amount,
        });
        if (result.success) {
            setPaymentModalVisible(false);
            setPaidAmount('');
        } else {
            Alert.alert('Error', result.message);
        }
    };

    const handleEdit = () => {
        setMenuVisible(false);
        navigation.navigate('TenantForm', { tenant });
    };

    const handleDelete = () => {
        setMenuVisible(false);
        Alert.alert(
            'Delete Tenant',
            `Are you sure you want to delete ${tenant.name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        const result = await deleteTenant(tenant.id);
                        if (result.success) {
                            Alert.alert('Success', 'Tenant deleted successfully');
                        } else {
                            Alert.alert('Error', result.message);
                        }
                    }
                }
            ]
        );
    };

    const handlePayPress = () => {
        setMenuVisible(false);
        setPaidAmount(tenant.rentAmount?.toString() || '');
        setPaymentDate(new Date().toISOString());
        setPaymentModalVisible(true);
    };

    const handleCardPress = () => {
        navigation.navigate('TenantDetail', { tenant });
    };

    // Color based on current due: Red if due > 0, Green if no dues
    const due = tenant.currentDue ?? tenant.dueAmount;
    const statusColor = due > 0 ? COLORS.error : COLORS.success;

    return (
        <>
            <TouchableOpacity
                style={[styles.card, isHorizontal ? styles.horizontalCard : styles.verticalCard]}
                onPress={handleCardPress}
                activeOpacity={0.7}
            >
                <View style={[styles.profileCircle, { backgroundColor: statusColor + '20' }]}>
                    <Text style={[styles.profileInitial, { color: statusColor }]}>{tenant.name[0]}</Text>
                </View>
                <View style={styles.infoContainer}>
                    <Text style={styles.name}>{tenant.name}</Text>
                    <Text style={styles.details}>Room {tenant.roomNumber} • {tenant.sharingType}</Text>
                    <View style={styles.dueContainer}>
                        <Text style={styles.dueLabel}>Due Amount:</Text>
                        <Text style={[styles.dueValue, { color: statusColor }]}>₹{due}</Text>
                    </View>
                </View>
                {!isHorizontal && (
                    <TouchableOpacity
                        style={styles.menuButton}
                        onPress={(e) => {
                            e.stopPropagation();
                            setMenuVisible(true);
                        }}
                    >
                        <Ionicons name="ellipsis-vertical" size={24} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                )}
            </TouchableOpacity>

            {/* 3-Dot Menu Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={menuVisible}
                onRequestClose={() => setMenuVisible(false)}
            >
                <TouchableOpacity
                    style={styles.menuOverlay}
                    activeOpacity={1}
                    onPress={() => setMenuVisible(false)}
                >
                    <View style={styles.menuContainer}>
                        <TouchableOpacity style={styles.menuItem} onPress={handleEdit}>
                            <Ionicons name="create-outline" size={22} color={COLORS.primary} />
                            <Text style={styles.menuText}>Edit</Text>
                        </TouchableOpacity>

                        <View style={styles.menuDivider} />

                        <TouchableOpacity style={styles.menuItem} onPress={handlePayPress}>
                            <Ionicons name="cash-outline" size={22} color={COLORS.success} />
                            <Text style={styles.menuText}>Pay</Text>
                        </TouchableOpacity>

                        <View style={styles.menuDivider} />

                        <TouchableOpacity style={styles.menuItem} onPress={handleDelete}>
                            <Ionicons name="trash-outline" size={22} color={COLORS.error} />
                            <Text style={[styles.menuText, { color: COLORS.error }]}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Payment Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={paymentModalVisible}
                onRequestClose={() => setPaymentModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>Add Payment</Text>
                        <Text style={styles.modalSubtitle}>
                            {tenant.name} owes ₹{due}. How much did they pay?
                        </Text>

                        <View style={styles.inputContainer}>
                            <Text style={styles.currencySymbol}>₹</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="0"
                                keyboardType="numeric"
                                value={paidAmount}
                                onChangeText={setPaidAmount}
                                autoFocus
                            />
                        </View>

                        <View style={styles.dateContainer}>
                            <Text style={styles.inputLabel}>Payment Date</Text>
                            <TouchableOpacity
                                style={styles.dateButton}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                                <Text style={styles.dateText}>
                                    {new Date(paymentDate).toLocaleDateString('en-IN', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric'
                                    })}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.button, styles.buttonClose]}
                                onPress={() => setPaymentModalVisible(false)}
                            >
                                <Text style={styles.buttonTextClose}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.button, styles.buttonConfirm]}
                                onPress={handlePayment}
                            >
                                <Text style={styles.buttonTextConfirm}>Confirm</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            <DatePickerModal
                visible={showDatePicker}
                value={paymentDate}
                title="Select Payment Date"
                onConfirm={(iso) => {
                    const selectedDate = new Date(iso);
                    const joinDate = new Date(tenant.joinDate);
                    selectedDate.setHours(0, 0, 0, 0);
                    joinDate.setHours(0, 0, 0, 0);
                    if (selectedDate < joinDate) {
                        Alert.alert(
                            'Invalid Date',
                            `Payment date cannot be before the tenant's join date (${joinDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}).`
                        );
                        setShowDatePicker(false);
                        return;
                    }
                    setPaymentDate(iso);
                    setShowDatePicker(false);
                }}
                onCancel={() => setShowDatePicker(false)}
            />
        </>
    );
};

const styles = StyleSheet.create({
    // ... existing styles ...
    dateContainer: {
        width: '100%',
        marginBottom: 30,
    },
    inputLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 8,
        fontWeight: 'bold',
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.light,
        padding: 15,
        borderRadius: SIZES.radius,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    dateText: {
        fontSize: 16,
        color: COLORS.text,
        marginLeft: 10,
        fontWeight: '500',
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radius,
        padding: 16,
        marginVertical: 6,
        marginHorizontal: SIZES.padding,
        flexDirection: 'row',
        alignItems: 'center',
        ...SHADOWS.small,
    },
    verticalCard: {
        flexDirection: 'row',
    },
    horizontalCard: {
        width: 220,
        marginHorizontal: 10,
        flexDirection: 'column',
        alignItems: 'center',
        padding: 20,
    },
    profileCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    profileInitial: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    infoContainer: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    details: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    dueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
    },
    dueLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginRight: 4,
    },
    dueValue: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    menuButton: {
        padding: 8,
        marginLeft: 10,
    },
    menuOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    menuContainer: {
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radius * 1.5,
        padding: 8,
        minWidth: 200,
        ...SHADOWS.medium,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    menuText: {
        fontSize: 16,
        color: COLORS.text,
        marginLeft: 12,
        fontWeight: '500',
    },
    menuDivider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginHorizontal: 8,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
        padding: 20,
    },
    modalView: {
        width: '100%',
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radius * 2,
        padding: 30,
        alignItems: 'center',
        ...SHADOWS.medium,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 24,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: COLORS.primary,
        marginBottom: 30,
        width: '100%',
        justifyContent: 'center',
    },
    currencySymbol: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        marginRight: 8,
    },
    input: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.text,
        paddingVertical: 10,
        textAlign: 'center',
        minWidth: 100,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    button: {
        borderRadius: SIZES.radius,
        paddingVertical: 16,
        flex: 0.48,
        alignItems: 'center',
    },
    buttonClose: {
        backgroundColor: COLORS.light,
    },
    buttonConfirm: {
        backgroundColor: COLORS.primary,
    },
    buttonTextClose: {
        color: COLORS.textSecondary,
        fontWeight: 'bold',
        fontSize: 16,
    },
    buttonTextConfirm: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default TenantCard;
