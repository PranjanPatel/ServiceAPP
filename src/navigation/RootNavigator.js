import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';

import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import ProfileScreen from '../screens/ProfileScreen';
import HomeScreen from '../screens/user/HomeScreen';
import DashboardScreen from '../screens/vendor/DashboardScreen';
import ResultsScreen from '../screens/user/ResultsScreen';
import VendorDetailScreen from '../screens/user/VendorDetailScreen';
import EditBusinessScreen from '../screens/vendor/EditBusinessScreen';
import { Ionicons } from '@expo/vector-icons';
import EditProfileScreen from '../screens/EditProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const tabOptions = (icons) => ({ route }) => ({
  tabBarActiveTintColor: '#2563EB',
  tabBarInactiveTintColor: '#94A3B8',
  tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
  tabBarIcon: ({ focused, color, size }) => (
    <Ionicons name={focused ? icons[route.name] : `${icons[route.name]}-outline`} size={size} color={color} />
  ),
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
      <Stack.Screen name="Results" component={ResultsScreen}
        options={({ route }) => ({ title: route.params.category })} />
      <Stack.Screen name="VendorDetail" component={VendorDetailScreen} options={{ title: 'Vendor' }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen}
        options={{ title: 'Edit profile', headerBackTitle: 'Back' }} />
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
      <Stack.Screen name="EditBusiness" component={EditBusinessScreen} options={{ title: 'Edit business' }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen}
        options={{ title: 'Edit profile', headerBackTitle: 'Back' }} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!user ? (
        <Stack.Navigator>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
      ) : user.role === 'vendor' ? (
        <VendorStack />
      ) : (
        <UserStack />
      )}
    </NavigationContainer>
  );
}