import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, SIZES } from '../constants/theme';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

// Extracted outside the screen so it is not re-created on every render
const StatCard = ({ title, value, subValue, color }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
        {subValue && <Text style={styles.statSubValue}>{subValue}</Text>}
    </View>
);

const HomeScreen = ({ navigation }) => {
    const { rooms, tenants, loading, fetchRooms, fetchTenants } = useAppContext();
    const { userData } = useAuth();
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity
                    style={{ marginRight: 20 }}
                    onPress={() => navigation.navigate('Config')}
                >
                    <Ionicons name="settings-outline" size={24} color={COLORS.primary} />
                </TouchableOpacity>
            ),
        });
    }, [navigation]);

    // Refresh data when screen comes into focus (e.g., after deleting room/tenant)
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchRooms();
            fetchTenants();
        });
        return unsubscribe;
    }, [navigation]);

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([fetchRooms(), fetchTenants()]);
        setRefreshing(false);
    };

    const totalBeds = rooms.reduce((acc, room) => acc + room.totalBeds, 0);
    const occupiedBeds = rooms.reduce((acc, room) => acc + room.occupiedBeds, 0);
    const occupancyRate = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;
    const totalDue = tenants.reduce((acc, tenant) => acc + (tenant.currentDue || 0), 0);
    const tenantsWithDues = tenants.filter(t => (t.currentDue ?? t.dueAmount ?? 0) > 0);


    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <View style={styles.header}>
                <Text style={styles.greeting}>{userData?.pgName || 'Dashboard'}</Text>
                <Text style={styles.subGreeting}>An overview of your PG performance</Text>
            </View>

            <View style={styles.statsGrid}>
                <StatCard
                    title="Occupancy"
                    value={`${occupancyRate.toFixed(1)}%`}
                    subValue={`${occupiedBeds}/${totalBeds} Beds occupied`}
                    color={COLORS.primary}
                />
                <StatCard
                    title="Total Due"
                    value={`₹${totalDue.toLocaleString()}`}
                    subValue={`${tenantsWithDues.length} Tenants with dues`}
                    color={COLORS.error}
                />
                <StatCard
                    title="Total Rooms"
                    value={rooms.length}
                    subValue={`${rooms.filter(r => r.occupiedBeds < r.totalBeds).length} Rooms available`}
                    color={COLORS.success}
                />
            </View>

            <View style={styles.quickActions}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => navigation.navigate('Rooms', { screen: 'RoomsList' })}
                    >
                        <Text style={styles.actionText}>Manage Rooms</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => navigation.navigate('Tenants')}
                    >
                        <Text style={styles.actionText}>View Tenants</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.recentActivity}>
                <Text style={styles.sectionTitle}>Next Steps</Text>
                <View style={styles.activityCard}>
                    <Text style={styles.activityText}>
                        {tenantsWithDues.length > 0
                            ? `${tenantsWithDues.length} tenant(s) have pending dues.`
                            : 'All payments are up to date! Great job.'}
                    </Text>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        padding: SIZES.padding,
        backgroundColor: COLORS.white,
        borderBottomLeftRadius: SIZES.radius * 2,
        borderBottomRightRadius: SIZES.radius * 2,
        marginBottom: SIZES.margin,
        ...SHADOWS.medium,
    },
    greeting: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    subGreeting: {
        fontSize: 16,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: SIZES.padding / 2,
        justifyContent: 'space-between',
    },
    statCard: {
        width: (width - SIZES.padding * 2) / 2,
        backgroundColor: COLORS.white,
        padding: 15,
        borderRadius: SIZES.radius,
        marginBottom: SIZES.margin,
        marginHorizontal: SIZES.padding / 4,
        borderLeftWidth: 5,
        ...SHADOWS.small,
    },
    statTitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        fontWeight: '600',
    },
    statValue: {
        fontSize: 22,
        fontWeight: 'bold',
        marginVertical: 4,
    },
    statSubValue: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    quickActions: {
        padding: SIZES.padding,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 12,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    actionButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: SIZES.radius,
        width: '48%',
        alignItems: 'center',
        ...SHADOWS.small,
    },
    actionText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 14,
    },
    recentActivity: {
        paddingHorizontal: SIZES.padding,
        paddingBottom: SIZES.padding * 2,
    },
    activityCard: {
        backgroundColor: COLORS.white,
        padding: 15,
        borderRadius: SIZES.radius,
        ...SHADOWS.small,
    },
    activityText: {
        fontSize: 15,
        color: COLORS.text,
        lineHeight: 22,
    },
});

export default HomeScreen;
