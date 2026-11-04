
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen({navigation }) {
  const { user, logout } = useAuth();

  const name = user?.name || 'User';
  const email = user?.email || 'No email available';
  const role = user?.role || 'Member';

  const initials = name
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Profile</Text>
          <Text style={styles.headerSubtitle}>
            Manage your account and preferences
          </Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          <Text style={styles.name}>{name}</Text>
          <Text style={styles.email}>{email}</Text>

          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{role.toUpperCase()}</Text>
          </View>
        </View>

        {/* Account Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>

          <View style={styles.infoCard}>
            <InfoRow
              label="Full Name"
              value={name}
              icon="👤"
            />

            <View style={styles.divider} />

            <InfoRow
              label="Email Address"
              value={email}
              icon="✉️"
            />

            <View style={styles.divider} />

            <InfoRow
              label="Phone Number"
              value={user?.phone || 'Not added yet'}
              icon="📞"
            />
            <View style={styles.divider} />

            <InfoRow
              label="Account Role"
              value={role}
              icon="🛡️"
            />
          </View>
        </View>

       {/* Account Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Settings</Text>

        <View style={styles.settingsCard}>
          <TouchableOpacity
            style={styles.settingItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.settingIcon}>✏️</Text>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Edit Profile</Text>
              <Text style={styles.settingSubtitle}>Update your name and phone number</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={logout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutIcon}>↪</Text>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>Your account, your control.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value, icon }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Text>{icon}</Text>
      </View>

      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  container: {
    padding: 22,
    paddingBottom: 40,
  },

  header: {
    marginTop: 12,
    marginBottom: 25,
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
  },

  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 5,
  },

  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#BFDBFE',
  },

  avatarText: {
    fontSize: 30,
    fontWeight: '800',
    color: '#2563EB',
  },

  name: {
    fontSize: 23,
    fontWeight: '800',
    color: '#0F172A',
  },

  email: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 6,
  },

  roleBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    marginTop: 14,
  },

  roleText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 1,
  },

  section: {
    marginTop: 28,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 13,
  },

  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },

  infoIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  infoContent: {
    flex: 1,
  },

  infoLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
  },

  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },

  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },

  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
  },

  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 17,
  },

  settingIcon: {
    fontSize: 21,
    marginRight: 14,
  },

  settingContent: {
    flex: 1,
  },

  settingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },

  settingSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },

  arrow: {
    fontSize: 26,
    color: '#94A3B8',
  },

  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    borderWidth: 1,
    borderColor: '#FECACA',
  },

  logoutIcon: {
    fontSize: 20,
    color: '#DC2626',
    marginRight: 10,
  },

  logoutText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#DC2626',
  },

  footer: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 20,
  },
});

