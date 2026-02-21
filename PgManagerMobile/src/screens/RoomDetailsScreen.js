import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Alert, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { roomApi, tenantApi } from '../api/api';
import { COLORS, SHADOWS, SIZES } from '../constants/theme';
import { useAppContext } from '../context/AppContext';
import TenantCard from '../components/TenantCard';

const RoomDetailsScreen = ({ route, navigation }) => {
    const { roomId } = route.params;
    const { deleteRoom, tenants } = useAppContext();
    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchRoomDetails = async () => {
        setLoading(true);
        try {
            const response = await roomApi.getById(roomId);
            if (response.data.success) {
                setRoom(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching room details:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchRoomDetails();
        });
        return unsubscribe;
    }, [navigation, roomId, tenants]);

    // Filter tenants for this room from global state
    const roomTenants = tenants.filter(t => t.roomId === roomId);
    const activeTenantCount = roomTenants.filter(t => t.isActive).length;

    const handleDeleteRoom = () => {
        const activeTenantsCount = roomTenants.filter(t => t.isActive).length;
        if (activeTenantsCount > 0) {
            Alert.alert(
                "Cannot Delete Room",
                "Please remove all active tenants from this room before deleting it.",
                [{ text: "OK" }]
            );
            return;
        }

        Alert.alert(
            "Delete Room",
            `Are you sure you want to delete Room ${room.roomNumber}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        const result = await deleteRoom(roomId);
                        if (result.success) {
                            Alert.alert("Success", "Room deleted successfully");
                            navigation.goBack();
                        } else {
                            Alert.alert("Error", result.message);
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.loadingText}>Loading room details...</Text>
            </View>
        );
    }

    if (!room) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>Room not found</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
            <View style={styles.header}>
                <View style={styles.headerTitleRow}>
                    <Text style={styles.headerTitle}>Room {room.roomNumber}</Text>
                    <View style={styles.headerActions}>
                        <TouchableOpacity onPress={() => navigation.navigate('RoomForm', { room })} style={styles.iconOnlyButton}>
                            <Ionicons name="pencil" size={24} color={COLORS.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleDeleteRoom} style={styles.iconOnlyButton}>
                            <Ionicons name="trash" size={24} color={COLORS.error} />
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={[styles.badge, { backgroundColor: COLORS.primary + '15', alignSelf: 'flex-start', marginTop: 8 }]}>
                    <Text style={[styles.badgeText, { color: COLORS.primary }]}>{room.sharingType} Sharing</Text>
                </View>
                <View style={styles.occupancyBarContainer}>
                    <View style={styles.occupancyBarBackground}>
                        <View
                            style={[
                                styles.occupancyBarFill,
                                {
                                    width: `${(activeTenantCount / room.totalBeds) * 100}%`,
                                    backgroundColor: activeTenantCount >= room.totalBeds ? COLORS.error : COLORS.primary
                                }
                            ]}
                        />
                    </View>
                    <Text style={styles.occupancyText}>{activeTenantCount} of {room.totalBeds} beds occupied</Text>
                </View>

            </View>

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Room Residents ({roomTenants.length})</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => {
                        if (activeTenantCount >= room.totalBeds) {
                            Alert.alert(
                                'Room Full',
                                `Room ${room.roomNumber} is already full (${activeTenantCount}/${room.totalBeds} beds occupied). Please choose a different room or remove a tenant first.`
                            );
                            return;
                        }
                        navigation.navigate('TenantForm', { roomId: roomId });
                    }}
                >
                    <Text style={styles.addButtonText}>+ Add Tenant</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={roomTenants}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <TenantCard tenant={item} />
                )}
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No tenants currently in this room</Text>
                        <TouchableOpacity
                            style={styles.emptyButton}
                            onPress={() => navigation.navigate('TenantForm', { roomId: roomId })}
                        >
                            <Text style={styles.emptyButtonText}>Add First Tenant</Text>
                        </TouchableOpacity>
                    </View>
                )}
                contentContainerStyle={styles.listContent}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    loadingText: {
        fontSize: 16,
        color: COLORS.textSecondary,
    },
    errorText: {
        fontSize: 16,
        color: COLORS.error,
    },
    header: {
        backgroundColor: COLORS.white,
        padding: SIZES.padding,
        borderBottomLeftRadius: SIZES.radius * 2,
        borderBottomRightRadius: SIZES.radius * 2,
        ...SHADOWS.medium,
        marginBottom: 10,
    },
    headerTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    occupancyBarContainer: {
        marginTop: 20,
        marginBottom: 15,
    },
    occupancyBarBackground: {
        height: 10,
        backgroundColor: COLORS.light,
        borderRadius: 5,
        overflow: 'hidden',
        marginBottom: 8,
    },
    occupancyBarFill: {
        height: '100%',
        borderRadius: 5,
    },
    occupancyText: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 15,
    },
    iconOnlyButton: {
        padding: 5,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SIZES.padding,
        paddingVertical: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    addButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: SIZES.radius,
        ...SHADOWS.small,
    },
    addButtonText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 14,
    },
    listContent: {
        paddingBottom: 40,
    },
    emptyContainer: {
        padding: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        color: COLORS.textSecondary,
        fontSize: 15,
        textAlign: 'center',
        marginBottom: 20,
    },
    emptyButton: {
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: SIZES.radius,
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    emptyButtonText: {
        color: COLORS.primary,
        fontWeight: 'bold',
    },
});

export default RoomDetailsScreen;
