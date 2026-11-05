import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import HomeScreen from '../screens/user/HomeScreen';
import ResultsScreen from '../screens/user/ResultsScreen';
import VendorDetailScreen from '../screens/user/VendorDetailScreen';
import DashboardScreen from '../screens/vendor/DashboardScreen';
import EditBusinessScreen from '../screens/vendor/EditBusinessScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// bottom tab look + icons (screens draw their own blue headers)
const tabOptions = (icons) => ({ route }) => ({
  headerShown: false,
  tabBarActiveTintColor: '#2563EB',
  tabBarInactiveTintColor: '#94A3B8',
  tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
  tabBarStyle: { height: 62, paddingBottom: 8, paddingTop: 6 },
  tabBarIcon: ({ focused, color, size }) => (
    <Ionicons
      name={focused ? icons[route.name] : `${icons[route.name]}-outline`}
      size={size}
      color={color}
    />
  ),
});

// native header for screens that don't draw their own (Edit profile, Edit business)
const stackOptions = (title) => ({
  title,
  headerBackTitle: 'Back',
  headerTintColor: '#2563EB',
  headerTitleStyle: { fontWeight: '700', color: '#0F172A' },
  headerShadowVisible: false,
  headerStyle: { backgroundColor: '#efeff0' },
});

function UserTabs() {
  return (
    <Tab.Navigator screenOptions={tabOptions({ Home: 'home', Profile: 'person' })}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function UserStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="UserTabs" component={UserTabs} options={{ headerShown: false }} />
      <Stack.Screen name="Results" component={ResultsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="VendorDetail" component={VendorDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={stackOptions('Edit profile')} />
    </Stack.Navigator>
  );
}

function VendorTabs() {
  return (
    <Tab.Navigator screenOptions={tabOptions({ Dashboard: 'grid', Profile: 'person' })}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function VendorStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="VendorTabs" component={VendorTabs} options={{ headerShown: false }} />
      <Stack.Screen name="EditBusiness" component={EditBusinessScreen} options={stackOptions('Edit business')} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={stackOptions('Edit profile')} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#efeff0' }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!user ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
        </Stack.Navigator>
      ) : user.role === 'vendor' ? (
        <VendorStack />
      ) : (
        <UserStack />
      )}
    </NavigationContainer>
  );
}