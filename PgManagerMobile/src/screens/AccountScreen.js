import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Modal,
    TextInput,
    ScrollView
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

const AccountScreen = () => {
    const { userData, logout, updateProfile, deleteProfile, isLoading } = useAuth();
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editPgName, setEditPgName] = useState('');
    const [editName, setEditName] = useState('');
    const [updating, setUpdating] = useState(false);

    const handleLogout = () => {
        Alert.alert(
            'Confirm Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await logout();
                        } catch (error) {
                            console.error('Error during logout:', error);
                            Alert.alert('Error', 'Failed to logout');
                        }
                    }
                }
            ]
        );
    };

    const openEditModal = () => {
        setEditPgName(userData?.pgName || '');
        setEditName(userData?.name || '');
        setEditModalVisible(true);
    };

    const handleUpdateProfile = async () => {
        if (!editPgName.trim()) {
            Alert.alert('Error', 'PG Name is required');
            return;
        }

        setUpdating(true);
        const result = await updateProfile(editPgName, editName);
        setUpdating(false);

        if (result.success) {
            setEditModalVisible(false);
            Alert.alert('Success', 'Profile updated successfully');
        } else {
            Alert.alert('Error', result.message || 'Failed to update profile');
        }
    };

    const handleDeleteProfile = () => {
        Alert.alert(
            'Delete Profile',
            'Are you sure you want to delete your profile? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        // Second confirmation
                        Alert.alert(
                            'Final Confirmation',
                            'This will permanently delete your account and all associated data (rooms, tenants). Are you absolutely sure?',
                            [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                    text: 'Yes, Delete',
                                    style: 'destructive',
                                    onPress: async () => {
                                        const result = await deleteProfile();
                                        if (!result.success) {
                                            Alert.alert('Error', result.message || 'Failed to delete profile');
                                        }
                                        // If successful, user is already logged out
                                    }
                                }
                            ]
                        );
                    }
                }
            ]
        );
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <View>
                        <Text style={styles.headerTitle}>Account</Text>
                        <Text style={styles.headerSubtitle}>Profile Information</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.deleteIconButton}
                        onPress={handleDeleteProfile}
                    >
                        <Ionicons name="trash-outline" size={22} color={COLORS.error} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.sectionTitle}>
                    <Text style={styles.sectionTitleText}>PG Information</Text>
                </View>

                <View style={styles.infoSection}>
                    <Text style={styles.label}>PG Name</Text>
                    <Text style={styles.value}>{userData?.pgName || 'N/A'}</Text>
                </View>

                <View style={styles.sectionTitle}>
                    <Text style={styles.sectionTitleText}>Personal Details</Text>
                </View>

                {userData?.name && (
                    <View style={styles.infoSection}>
                        <Text style={styles.label}>Name</Text>
                        <Text style={styles.value}>{userData.name}</Text>
                    </View>
                )}

                <View style={styles.infoSection}>
                    <Text style={styles.label}>Phone Number</Text>
                    <Text style={styles.value}>{userData?.phoneNumber || 'N/A'}</Text>
                </View>

                <View style={styles.infoSection}>
                    <Text style={styles.label}>User ID</Text>
                    <Text style={styles.value}>#{userData?.id || 'N/A'}</Text>
                </View>

                <View style={styles.infoSection}>
                    <Text style={styles.label}>Role</Text>
                    <Text style={styles.value}>{userData?.role || 'User'}</Text>
                </View>

                <TouchableOpacity
                    style={styles.editButton}
                    onPress={openEditModal}
                >
                    <Ionicons name="create-outline" size={20} color={COLORS.primary} />
                    <Text style={styles.editButtonText}>Edit Profile</Text>
                </TouchableOpacity>
            </ScrollView>

            <View style={styles.actions}>
                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogout}
                >
                    <Text style={styles.logoutButtonText}>Logout</Text>
                </TouchableOpacity>
            </View>

            {/* Edit Profile Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={editModalVisible}
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Profile</Text>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                <Ionicons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalBody}>
                            <Text style={styles.inputLabel}>PG Name *</Text>
                            <TextInput
                                style={styles.input}
                                value={editPgName}
                                onChangeText={setEditPgName}
                                placeholder="Enter PG name"
                                editable={!updating}
                            />

                            <Text style={styles.inputLabel}>Your Name</Text>
                            <TextInput
                                style={styles.input}
                                value={editName}
                                onChangeText={setEditName}
                                placeholder="Enter your name (optional)"
                                editable={!updating}
                            />

                            <TouchableOpacity
                                style={[styles.saveButton, updating && styles.saveButtonDisabled]}
                                onPress={handleUpdateProfile}
                                disabled={updating}
                            >
                                {updating ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.saveButtonText}>Save Changes</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background
    },
    header: {
        backgroundColor: COLORS.primary,
        padding: 20,
        paddingTop: 60,
        paddingBottom: 30
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 4
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        fontWeight: '500'
    },
    deleteIconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    content: {
        flex: 1,
        padding: 20
    },
    sectionTitle: {
        marginBottom: 12,
        marginTop: 8
    },
    sectionTitleText: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    infoSection: {
        backgroundColor: 'white',
        padding: 18,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: COLORS.border || '#e0e0e0'
    },
    label: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginBottom: 6,
        textTransform: 'uppercase',
        fontWeight: '600',
        letterSpacing: 0.5
    },
    value: {
        fontSize: 18,
        color: COLORS.text,
        fontWeight: '600'
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        marginTop: 8,
        marginBottom: 20,
        borderWidth: 2,
        borderColor: COLORS.primary,
        gap: 8
    },
    editButtonText: {
        color: COLORS.primary,
        fontSize: 16,
        fontWeight: '700'
    },
    actions: {
        padding: 20,
        paddingBottom: 30
    },
    logoutButton: {
        backgroundColor: COLORS.error,
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: COLORS.error,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4
    },
    logoutButtonText: {
        color: COLORS.white,
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: 0.5
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end'
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 40
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0'
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text
    },
    modalBody: {
        padding: 20
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 8,
        marginTop: 12
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: 'white'
    },
    saveButton: {
        backgroundColor: COLORS.primary,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 24
    },
    saveButtonDisabled: {
        opacity: 0.6
    },
    saveButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '700'
    }
});

export default AccountScreen;
