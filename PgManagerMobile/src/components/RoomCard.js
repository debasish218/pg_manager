import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, SIZES } from '../constants/theme';

const RoomCard = ({ room, onPress }) => {
    const isAvailable = room.occupiedBeds < room.totalBeds;
    const statusColor = isAvailable ? COLORS.success : COLORS.error;
    const tenants = room.tenants || [];

    const hasDues = tenants.some(t => (t.currentDue ?? t.dueAmount) > 0);
    const dueColor = hasDues ? COLORS.error : COLORS.success;

    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.header}>
                <View style={styles.roomHeaderRow}>
                    <Text style={styles.roomNumber}>Room {room.roomNumber}</Text>
                    <View style={[styles.dueIndicatorDot, { backgroundColor: dueColor }]} />
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>
                        {isAvailable ? 'Available' : 'Full'}
                    </Text>
                </View>
            </View>

            <View style={styles.details}>
                <Text style={styles.typeText}>{room.sharingType} Sharing</Text>
                <View style={styles.occupancyContainer}>
                    <View style={styles.progressBarBackground}>
                        <View
                            style={[
                                styles.progressBarFill,
                                {
                                    width: `${(room.occupiedBeds / room.totalBeds) * 100}%`,
                                    backgroundColor: room.occupiedBeds === room.totalBeds ? COLORS.error : COLORS.primary
                                }
                            ]}
                        />
                    </View>
                    <Text style={styles.occupancyText}>
                        {room.occupiedBeds} / {room.totalBeds}
                    </Text>
                </View>
            </View>

            {/* Tenants Section */}
            {tenants.length > 0 && (
                <View style={styles.tenantsSection}>
                    <View style={styles.tenantsSectionHeader}>
                        <Ionicons name="people" size={14} color={COLORS.textSecondary} />
                        <Text style={styles.tenantsLabel}>Residents:</Text>
                    </View>
                    <View style={styles.tenantsList}>
                        {tenants.map((tenant, index) => {
                            const due = tenant.currentDue ?? tenant.dueAmount ?? 0;
                            const tenantColor = due > 0 ? COLORS.error : COLORS.success;
                            return (
                                <View key={tenant.id} style={styles.tenantItem}>
                                    <View style={[styles.tenantIndicator, { backgroundColor: tenantColor }]} />
                                    <Text style={styles.tenantName} numberOfLines={1}>
                                        {tenant.name}
                                    </Text>
                                    {due > 0 && (
                                        <Text style={styles.dueAmount}>₹{due}</Text>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radius,
        padding: 16,
        marginHorizontal: SIZES.padding,
        marginVertical: 8,
        ...SHADOWS.small,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    roomNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    details: {
        marginTop: 4,
    },
    typeText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 8,
    },
    occupancyContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    progressBarBackground: {
        flex: 1,
        height: 8,
        backgroundColor: COLORS.light,
        borderRadius: 4,
        marginRight: 10,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    occupancyText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textSecondary,
        minWidth: 40,
        textAlign: 'right',
    },
    tenantsSection: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    tenantsSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    tenantsLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginLeft: 4,
    },
    tenantsList: {
        gap: 6,
    },
    tenantItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
    },
    tenantIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    tenantName: {
        flex: 1,
        fontSize: 14,
        color: COLORS.text,
        fontWeight: '500',
    },
    dueAmount: {
        fontSize: 12,
        color: COLORS.error,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    roomHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dueIndicatorDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
});

export default RoomCard;
