import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, StatusBar, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import RoomCard from '../components/RoomCard';

// Defined outside the screen to keep a stable reference across renders
const ListHeader = ({ count, total, searching }) => (
    <View style={styles.header}>
        <Text style={styles.title}>All Rooms</Text>
        <Text style={styles.subtitle}>
            {searching
                ? `${count} of ${total} rooms`
                : `${total} rooms managed`}
        </Text>
    </View>
);

const RoomsScreen = ({ navigation }) => {
    const { rooms, loading, fetchRooms } = useAppContext();
    const [selectedFilter, setSelectedFilter] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Refresh rooms when screen comes into focus (e.g., after deleting a room)
    React.useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchRooms(selectedFilter);
        });
        return unsubscribe;
    }, [navigation, selectedFilter]);

    const filterOptions = [
        { label: 'All', value: null },
        { label: '1 Sharing', value: 1 },
        { label: '2 Sharing', value: 2 },
        { label: '3 Sharing', value: 3 },
        { label: '4 Sharing', value: 4 },
        { label: '5 Sharing', value: 5 },
        { label: '6 Sharing', value: 6 },
    ];

    const handleFilter = (value) => {
        setSelectedFilter(value);
        fetchRooms(value);
    };

    // Client-side filter by room number on top of the sharing-type filtered list
    const filteredRooms = searchQuery.trim()
        ? rooms.filter(r =>
            r.roomNumber?.toString().includes(searchQuery.trim())
        )
        : rooms;

    const isSearching = searchQuery.trim().length > 0;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

            {/* Search bar lives OUTSIDE the FlatList to prevent keyboard dismiss on re-render */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={18} color={COLORS.textSecondary} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by room number..."
                        placeholderTextColor={COLORS.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        keyboardType="numeric"
                        returnKeyType="search"
                        clearButtonMode="while-editing"
                        autoCorrect={false}
                    />
                    {searchQuery.length > 0 && (
                        <Ionicons
                            name="close-circle"
                            size={18}
                            color={COLORS.textSecondary}
                            onPress={() => setSearchQuery('')}
                            style={styles.clearIcon}
                        />
                    )}
                </View>
            </View>

            {/* Sharing-type filter chips */}
            <View style={styles.filterContainer}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={filterOptions}
                    keyExtractor={(item) => (item.value === null ? 'all' : item.value.toString())}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[
                                styles.filterItem,
                                selectedFilter === item.value && styles.filterItemSelected
                            ]}
                            onPress={() => handleFilter(item.value)}
                        >
                            <Text style={[
                                styles.filterText,
                                selectedFilter === item.value && styles.filterTextSelected
                            ]}>
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={styles.filterList}
                />
            </View>

            <FlatList
                data={filteredRooms}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <RoomCard
                        room={item}
                        onPress={() => navigation.navigate('RoomDetails', { roomId: item.id, roomNumber: item.roomNumber })}
                    />
                )}
                refreshing={loading}
                onRefresh={fetchRooms}
                ListHeaderComponent={
                    <ListHeader
                        count={filteredRooms.length}
                        total={rooms.length}
                        searching={isSearching}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="home-outline" size={48} color={COLORS.textSecondary} />
                        <Text style={styles.emptyText}>
                            {isSearching ? `No rooms matching "${searchQuery}"` : 'No rooms found'}
                        </Text>
                    </View>
                }
                contentContainerStyle={styles.listContent}
                keyboardShouldPersistTaps="handled"
            />
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('RoomForm')}
                activeOpacity={0.8}
            >
                <Ionicons name="add" size={28} color={COLORS.white} />
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    searchContainer: {
        backgroundColor: COLORS.white,
        paddingHorizontal: SIZES.padding,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border + '50',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: COLORS.text,
        padding: 0,
    },
    clearIcon: {
        marginLeft: 8,
    },
    header: {
        padding: SIZES.padding,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    listContent: {
        paddingBottom: 80,
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
        gap: 12,
    },
    emptyText: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    filterContainer: {
        backgroundColor: COLORS.white,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border + '50',
    },
    filterList: {
        paddingHorizontal: SIZES.padding,
        gap: 10,
    },
    filterItem: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: COLORS.light,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginRight: 8,
    },
    filterItemSelected: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    filterText: {
        fontSize: 14,
        color: COLORS.text,
        fontWeight: '600',
    },
    filterTextSelected: {
        color: COLORS.white,
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        ...SHADOWS.medium,
    },
});

export default RoomsScreen;
