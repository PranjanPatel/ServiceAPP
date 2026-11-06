import React from "react";
import { ActivityIndicator, View, StyleSheet, Platform } from "react-native";

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "../context/AuthContext";

import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";
import ProfileScreen from "../screens/ProfileScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import HomeScreen from "../screens/user/HomeScreen";
import ResultsScreen from "../screens/user/ResultsScreen";
import VendorDetailScreen from "../screens/user/VendorDetailScreen";
import DashboardScreen from "../screens/vendor/DashboardScreen";
import EditBusinessScreen from "../screens/vendor/EditBusinessScreen";
import PlansScreen from "../screens/vendor/PlansScreen";
import PaymentScreen from "../screens/vendor/PaymentScreen";
import FavoritesScreen from "../screens/user/FavoritesScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const COLORS = {
  primary: "#2563EB",
  primaryLight: "#EAF2FF",
  inactive: "#94A3B8",
  white: "#FFFFFF",
  background: "#F8FAFC",
  text: "#0F172A",
};

// Bottom tab configuration
const tabOptions =
  (icons) =>
  ({ route }) => ({
    headerShown: false,

    tabBarActiveTintColor: COLORS.primary,
    tabBarInactiveTintColor: COLORS.inactive,

    tabBarShowLabel: true,

    tabBarLabelStyle: {
      fontSize: 10,
      fontWeight: "600",
      marginTop: 2,
    },

    tabBarIcon: ({ focused, color }) => {
      const iconName = icons[route.name];

      return (
        <View
          style={[styles.iconContainer, focused && styles.activeIconContainer]}
        >
          <Ionicons
            name={focused ? iconName : `${iconName}-outline`}
            size={21}
            color={color}
          />
        </View>
      );
    },

    tabBarStyle: styles.tabBar,

    tabBarItemStyle: {
      paddingVertical: 2,
    },

    tabBarHideOnKeyboard: true,
  });

// Native stack header
const stackOptions = (title) => ({
  title: title,
  headerBackTitle: "Back",
  headerTintColor: COLORS.primary,

  headerTitleStyle: {
    fontWeight: "700",
    color: COLORS.text,
    fontSize: 17,
  },

  headerShadowVisible: false,

  headerStyle: {
    backgroundColor: COLORS.white,
  },
});

// USER TABS
function UserTabs() {
  return (
    <Tab.Navigator
      screenOptions={tabOptions({
        Home: "home",
        Favorites: "heart",
        Profile: "person",
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: "Explore" }}
      />

      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{ title: "Saved" }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: "Profile" }}
      />
    </Tab.Navigator>
  );
}

// USER STACK
function UserStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="UserTabs"
        component={UserTabs}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="Results"
        component={ResultsScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="VendorDetail"
        component={VendorDetailScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={stackOptions("Edit Profile")}
      />
    </Stack.Navigator>
  );
}

// VENDOR TABS
function VendorTabs() {
  return (
    <Tab.Navigator
      screenOptions={tabOptions({
        Dashboard: "grid",
        Profile: "person",
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: "Dashboard" }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: "Profile" }}
      />
    </Tab.Navigator>
  );
}

// VENDOR STACK
function VendorStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="VendorTabs"
        component={VendorTabs}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="EditBusiness"
        component={EditBusinessScreen}
        options={stackOptions("Edit Business")}
      />

      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={stackOptions("Edit Profile")}
      />

      <Stack.Screen
        name="Plans"
        component={PlansScreen}
        options={stackOptions("Plans")}
      />

      <Stack.Screen
        name="Payment"
        component={PaymentScreen}
        options={stackOptions("Secure Payment")}
      />
    </Stack.Navigator>
  );
}

// ROOT NAVIGATOR
export default function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingIcon}>
          <Ionicons name="briefcase-outline" size={32} color={COLORS.primary} />
        </View>

        <ActivityIndicator
          size="small"
          color={COLORS.primary}
          style={{ marginTop: 18 }}
        />
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
      ) : user.role === "vendor" ? (
        <VendorStack />
      ) : (
        <UserStack />
      )}
    </NavigationContainer>
  );
}

// STYLES
const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",

    left: 0,
    right: 0,
    marginHorizontal: "7%",

    bottom: Platform.OS === "ios" ? 20 : 14,

    height: 64,

    backgroundColor: "rgba(255,255,255,0.80)",
    borderRadius: 22,
    borderTopWidth: 0,

    paddingTop: 5,
    paddingBottom: 4,

    elevation: 12,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },

  iconContainer: {
    width: 42,
    height: 30,
    borderRadius: 11,

    justifyContent: "center",
    alignItems: "center",
  },

  activeIconContainer: {
    backgroundColor: COLORS.primaryLight,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },

  loadingIcon: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
});
