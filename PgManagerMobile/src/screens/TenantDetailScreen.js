import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, SIZES } from '../constants/theme';
import { useAppContext } from '../context/AppContext';

const TenantDetailScreen = ({ route, navigation }) => {
    const { tenant } = route.params;
    const { deleteTenant } = useAppContext();

    const handleEdit = () => {
        navigation.navigate('TenantForm', { tenant });
    };

    const handleDelete = () => {
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
                            navigation.goBack();
                        } else {
                            Alert.alert('Error', result.message);
                        }
                    }
                }
            ]
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const statusColor = tenant.dueAmount > 0 ? COLORS.error : COLORS.success;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Profile Section */}
                <View style={styles.profileSection}>
                    <View style={styles.topActions}>
                        <TouchableOpacity onPress={handleEdit} style={styles.iconOnlyButton}>
                            <Ionicons name="pencil" size={24} color={COLORS.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleDelete} style={styles.iconOnlyButton}>
                            <Ionicons name="trash" size={24} color={COLORS.error} />
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.profileCircle, { backgroundColor: statusColor + '20' }]}>
                        <Text style={[styles.profileInitial, { color: statusColor }]}>
                            {tenant.name[0].toUpperCase()}
                        </Text>
                    </View>
                    <Text style={styles.tenantName}>{tenant.name}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: tenant.isActive ? COLORS.success : COLORS.textSecondary }]}>
                        <Text style={styles.statusText}>{tenant.isActive ? 'Active' : 'Inactive'}</Text>
                    </View>
                </View>

                {/* Personal Information */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Personal Information</Text>
                    <InfoRow icon="person" label="Full Name" value={tenant.name} />
                    <InfoRow icon="call" label="Phone Number" value={tenant.phoneNumber} />
                </View>

                {/* Room Details */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Room Details</Text>
                    <InfoRow icon="home" label="Room Number" value={tenant.roomNumber} />
                    <InfoRow icon="people" label="Sharing Type" value={tenant.sharingType} />
                </View>

                {/* Financial Information */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Financial Information</Text>
                    <InfoRow icon="cash" label="Monthly Rent" value={`₹${tenant.rentAmount}`} valueColor={COLORS.text} />
                    <InfoRow icon="wallet" label="Security Deposit" value={`₹${tenant.advanceAmount}`} />
                    <InfoRow
                        icon="alert-circle"
                        label="Current Due"
                        value={`₹${tenant.currentDue ?? tenant.dueAmount}`}
                        valueColor={(tenant.currentDue ?? tenant.dueAmount) > 0 ? COLORS.error : COLORS.success}
                        valueBold
                    />
                    {(tenant.monthsElapsed ?? 0) > 0 && (
                        <InfoRow
                            icon="time"
                            label="Months Unpaid"
                            value={`${tenant.monthsElapsed} month(s) × ₹${tenant.rentAmount}`}
                            valueColor={COLORS.error}
                        />
                    )}
                </View>

                {/* Payment History */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Payment History</Text>
                    <InfoRow icon="calendar" label="Join Date" value={formatDate(tenant.joinDate)} />
                    <InfoRow
                        icon="time"
                        label="Last Payment"
                        value={formatDate(tenant.lastPaidDate)}
                    />
                    <InfoRow
                        icon="trending-up"
                        label="Days Since Payment"
                        value={tenant.daysSinceLastPayment?.toString() || '0'}
                        valueColor={tenant.isOverdue ? COLORS.error : COLORS.textSecondary}
                    />
                </View>


                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const InfoRow = ({ icon, label, value, valueColor, valueBold }) => (
    <View style={styles.infoRow}>
        <View style={styles.infoLeft}>
            <Ionicons name={icon} size={20} color={COLORS.primary} />
            <Text style={styles.infoLabel}>{label}</Text>
        </View>
        <Text style={[
            styles.infoValue,
            valueColor && { color: valueColor },
            valueBold && { fontWeight: 'bold' }
        ]}>
            {value}
        </Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        padding: SIZES.padding,
    },
    profileSection: {
        alignItems: 'center',
        paddingVertical: 30,
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radius * 1.5,
        marginBottom: 20,
        ...SHADOWS.medium,
    },
    profileCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    profileInitial: {
        fontSize: 40,
        fontWeight: 'bold',
    },
    tenantName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 10,
    },
    statusBadge: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radius * 1.5,
        padding: 20,
        marginBottom: 15,
        ...SHADOWS.small,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 15,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    infoLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    infoLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginLeft: 10,
    },
    infoValue: {
        fontSize: 14,
        color: COLORS.text,
        fontWeight: '500',
    },
    topActions: {
        position: 'absolute',
        top: 15,
        right: 15,
        flexDirection: 'row',
        gap: 15,
    },
    iconOnlyButton: {
        padding: 5,
    },
});

export default TenantDetailScreen;
