import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppProvider } from './src/context/AppContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import HomeScreen from './src/screens/HomeScreen';
import TenantsScreen from './src/screens/TenantsScreen';
import RoomsScreen from './src/screens/RoomsScreen';
import RoomDetailsScreen from './src/screens/RoomDetailsScreen';
import TenantDetailScreen from './src/screens/TenantDetailScreen';
import TenantForm from './src/screens/TenantForm';
import RoomForm from './src/screens/RoomForm';
import LoginScreen from './src/screens/LoginScreen';
import AccountScreen from './src/screens/AccountScreen';
import { COLORS } from './src/constants/theme';

import ConfigScreen from './src/screens/ConfigScreen';
import { storage } from './src/utils/storage';
import { updateBaseUrl } from './src/api/api';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const HomeStack = () => (
    <Stack.Navigator
        screenOptions={{
            headerStyle: { backgroundColor: COLORS.white, elevation: 0, shadowOpacity: 0 },
            headerTitleStyle: { fontWeight: 'bold' },
        }}
    >
        <Stack.Screen name="HomeMain" component={HomeScreen} options={{ title: 'Dashboard' }} />
        <Stack.Screen name="Config" component={ConfigScreen} options={{ title: 'Connection Settings' }} />
    </Stack.Navigator>
);

const RoomsStack = () => (
    <Stack.Navigator
        screenOptions={{
            headerStyle: { backgroundColor: COLORS.white, elevation: 0, shadowOpacity: 0 },
            headerTitleStyle: { fontWeight: 'bold' },
        }}
    >
        <Stack.Screen name="RoomsList" component={RoomsScreen} options={{ title: 'Rooms' }} />
        <Stack.Screen name="RoomDetails" component={RoomDetailsScreen} options={({ route }) => ({ title: `Room ${route.params?.roomNumber || ''}` })} />
        <Stack.Screen name="RoomForm" component={RoomForm} options={({ route }) => ({ title: route.params?.room ? 'Edit Room' : 'Add Room' })} />
        <Stack.Screen name="TenantDetail" component={TenantDetailScreen} options={({ route }) => ({ title: route.params?.tenant?.name || 'Tenant Details' })} />
        <Stack.Screen name="TenantForm" component={TenantForm} options={({ route }) => ({ title: route.params?.tenant ? 'Edit Tenant' : 'Add Tenant' })} />
    </Stack.Navigator>
);

const TenantsStack = () => (
    <Stack.Navigator
        screenOptions={{
            headerStyle: { backgroundColor: COLORS.white, elevation: 0, shadowOpacity: 0 },
            headerTitleStyle: { fontWeight: 'bold' },
        }}
    >
        <Stack.Screen name="TenantsList" component={TenantsScreen} options={{ title: 'Tenants' }} />
        <Stack.Screen name="TenantDetail" component={TenantDetailScreen} options={({ route }) => ({ title: route.params?.tenant?.name || 'Tenant Details' })} />
        <Stack.Screen name="TenantForm" component={TenantForm} options={({ route }) => ({ title: route.params?.tenant ? 'Edit Tenant' : 'Add Tenant' })} />
    </Stack.Navigator>
);

const TabNavigator = () => {
    const insets = useSafeAreaInsets();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Home') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'Tenants') {
                        iconName = focused ? 'people' : 'people-outline';
                    } else if (route.name === 'Rooms') {
                        iconName = focused ? 'business' : 'business-outline';
                    } else if (route.name === 'Account') {
                        iconName = focused ? 'person' : 'person-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.textSecondary,
                tabBarStyle: {
                    backgroundColor: COLORS.white,
                    height: 60 + insets.bottom,
                    paddingBottom: insets.bottom || 10,
                    paddingTop: 5,
                    borderTopWidth: 1,
                    borderTopColor: COLORS.border,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                },
                headerShown: false, // Show headers from stacks instead
            })}
        >
            <Tab.Screen
                name="Home"
                component={HomeStack}
            />
            <Tab.Screen
                name="Tenants"
                component={TenantsStack}
            />
            <Tab.Screen
                name="Rooms"
                component={RoomsStack}
            />
            <Tab.Screen
                name="Account"
                component={AccountScreen}
            />
        </Tab.Navigator>
    );
};

const AppContent = () => {
    const { userToken, isLoading } = useAuth();
    const [isIpLoaded, setIsIpLoaded] = useState(false);

    useEffect(() => {
        const initApi = async () => {
            const savedIP = await storage.getIP();
            if (savedIP) {
                updateBaseUrl(`http://${savedIP}:5294/api`);
            }
            setIsIpLoaded(true);
        };
        initApi();
    }, []);

    if (isLoading || !isIpLoaded) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            {userToken ? (
                <AppProvider>
                    <TabNavigator />
                </AppProvider>
            ) : (
                <LoginScreen />
            )}
        </NavigationContainer>
    );
};

const App = () => {
    return (
        <SafeAreaProvider>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </SafeAreaProvider>
    );
};

export default App;
