import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, StatusBar, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { COLORS, SIZES } from '../constants/theme';
import TenantCard from '../components/TenantCard';

// Defined outside the screen to keep a stable reference across renders
const ListHeader = ({ count, total, searching }) => (
    <View style={styles.header}>
        <Text style={styles.title}>Your Tenants</Text>
        <Text style={styles.subtitle}>
            {searching
                ? `${count} of ${total} residents`
                : `${total} total residents`}
        </Text>
    </View>
);

const TenantsScreen = ({ navigation }) => {
    const { tenants, loading, fetchTenants } = useAppContext();
    const [searchQuery, setSearchQuery] = useState('');

    // Refresh tenants when screen comes into focus (e.g., after deleting a tenant)
    React.useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchTenants();
        });
        return unsubscribe;
    }, [navigation]);

    const onRefresh = () => {
        fetchTenants();
    };

    // Sort by currentDue descending (highest due first), then filter by search query
    const sortedTenants = [...tenants].sort((a, b) => {
        const dueA = a.currentDue ?? a.dueAmount ?? 0;
        const dueB = b.currentDue ?? b.dueAmount ?? 0;
        return dueB - dueA;
    });

    const filteredTenants = searchQuery.trim()
        ? sortedTenants.filter(t =>
            t.name?.toLowerCase().includes(searchQuery.trim().toLowerCase())
        )
        : sortedTenants;

    const isSearching = searchQuery.trim().length > 0;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

            {/* Search bar lives OUTSIDE the FlatList to prevent keyboard dismiss on re-render */}
            <View style={styles.searchBar}>
                <Ionicons name="search" size={18} color={COLORS.textSecondary} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by name..."
                    placeholderTextColor={COLORS.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
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

            <FlatList
                data={filteredTenants}
                keyExtractor={(item) => item.id.toString()}
                ListHeaderComponent={
                    <ListHeader
                        count={filteredTenants.length}
                        total={tenants.length}
                        searching={isSearching}
                    />
                }
                renderItem={({ item }) => <TenantCard tenant={item} />}
                refreshing={loading}
                onRefresh={onRefresh}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="people-outline" size={48} color={COLORS.textSecondary} />
                        <Text style={styles.emptyText}>
                            {isSearching ? `No tenants matching "${searchQuery}"` : 'No tenants found'}
                        </Text>
                    </View>
                }
                contentContainerStyle={styles.listContent}
                keyboardShouldPersistTaps="handled"
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        marginHorizontal: SIZES.padding,
        marginTop: SIZES.padding,
        marginBottom: 8,
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
        paddingTop: 8,
        paddingHorizontal: SIZES.padding,
        paddingBottom: 12,
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
        paddingBottom: 30,
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
});

export default TenantsScreen;
