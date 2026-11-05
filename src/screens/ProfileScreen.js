import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();

  const name = user?.name || 'User';
  const email = user?.email || 'No email available';
  const phone = user?.phone || 'Not added yet';
  const isVendor = user?.role === 'vendor';

  const initials = name
    .split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();

  const confirmLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Blue header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>My Profile</Text>
          <Text style={s.headerSub}>Manage your account</Text>
        </View>

        {/* Profile card overlapping the header */}
        <View style={s.profileCard}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <Text style={s.name}>{name}</Text>
          <Text style={s.email}>{email}</Text>
          <View style={s.roleBadge}>
            <Ionicons name={isVendor ? 'briefcase' : 'person'} size={12} color="#2563EB" />
            <Text style={s.roleText}>{isVendor ? 'SERVICE PROVIDER' : 'CUSTOMER'}</Text>
          </View>
        </View>

        {/* Role shortcut */}
        <View style={s.block}>
          {isVendor ? (
            <View style={s.shortcutRow}>
              <TouchableOpacity style={s.shortcut} activeOpacity={0.8}
                onPress={() => navigation.navigate('Dashboard')}>
                <View style={[s.shortcutIcon, { backgroundColor: '#DBEAFE' }]}>
                  <Ionicons name="grid" size={22} color="#2563EB" />
                </View>
                <Text style={s.shortcutText}>Dashboard</Text>
                <Text style={s.shortcutSub}>Ratings and reviews</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.shortcut} activeOpacity={0.8}
                onPress={() => navigation.navigate('Dashboard')}>
                <View style={[s.shortcutIcon, { backgroundColor: '#D1FAE5' }]}>
                  <Ionicons name="storefront" size={22} color="#059669" />
                </View>
                <Text style={s.shortcutText}>My business</Text>
                <Text style={s.shortcutSub}>Edit from Dashboard</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={s.findCard} activeOpacity={0.8}
              onPress={() => navigation.navigate('Home')}>
              <View style={[s.shortcutIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="search" size={22} color="#F59E0B" />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={s.shortcutText}>Find a service</Text>
                <Text style={s.shortcutSub}>Browse top-rated pros near you</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Account information */}
        <View style={s.block}>
          <Text style={s.sectionTitle}>Account information</Text>
          <View style={s.card}>
            <InfoRow icon="person-outline" label="Full name" value={name} />
            <View style={s.divider} />
            <InfoRow icon="mail-outline" label="Email address" value={email} />
            <View style={s.divider} />
            <InfoRow icon="call-outline" label="Phone number" value={phone} />
            <View style={s.divider} />
            <InfoRow icon="shield-checkmark-outline" label="Account type"
              value={isVendor ? 'Service provider' : 'Customer'} />
          </View>
        </View>

        {/* Actions */}
        <View style={s.block}>
          <Text style={s.sectionTitle}>Account</Text>
          <View style={s.card}>
            <TouchableOpacity style={s.actionRow} activeOpacity={0.7}
              onPress={() => navigation.navigate('EditProfile')}>
              <View style={[s.actionIcon, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="create-outline" size={20} color="#2563EB" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.actionTitle}>Edit profile</Text>
                <Text style={s.actionSub}>Update your name and phone number</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </TouchableOpacity>

            <View style={s.divider} />

            <TouchableOpacity style={s.actionRow} activeOpacity={0.7} onPress={confirmLogout}>
              <View style={[s.actionIcon, { backgroundColor: '#FEF2F2' }]}>
                <Ionicons name="log-out-outline" size={20} color="#DC2626" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.actionTitle, { color: '#DC2626' }]}>Log out</Text>
                <Text style={s.actionSub}>Sign out of this device</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={s.footer}>Your account, your control.</Text>
      </ScrollView>
    </View>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={s.infoRow}>
      <View style={s.infoIcon}>
        <Ionicons name={icon} size={20} color="#2563EB" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.infoLabel}>{label}</Text>
        <Text style={s.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#efeff0' },

  header: {
    backgroundColor: '#2563EB',
    paddingTop: 60,
    paddingHorizontal: 22,
    paddingBottom: 90,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTitle: { color: '#fff', fontSize: 26, fontWeight: '800' },
  headerSub: { color: '#BFDBFE', marginTop: 4, fontSize: 14 },

  profileCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: -64,
    borderRadius: 22,
    paddingBottom: 22,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
  },
  avatar: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: '#DBEAFE',
    alignItems: 'center', justifyContent: 'center',
    marginTop: -44, borderWidth: 4, borderColor: '#fff',
  },
  avatarText: { fontSize: 30, fontWeight: '800', color: '#2563EB' },
  name: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginTop: 12 },
  email: { fontSize: 14, color: '#64748B', marginTop: 4 },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#EFF6FF', paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, marginTop: 14,
  },
  roleText: { fontSize: 11, fontWeight: '800', color: '#2563EB', letterSpacing: 1, marginLeft: 6 },

  block: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A', marginBottom: 12 },

  shortcutRow: { flexDirection: 'row', justifyContent: 'space-between' },
  shortcut: {
    width: '48%', backgroundColor: '#fff', borderRadius: 18, padding: 16,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
  },
  findCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 18, padding: 16,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
  },
  shortcutIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  shortcutText: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  shortcutSub: { fontSize: 12, color: '#94A3B8', marginTop: 2 },

  card: {
    backgroundColor: '#fff', borderRadius: 18, paddingHorizontal: 16,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
  },
  divider: { height: 1, backgroundColor: '#F1F5F9' },

  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  infoIcon: {
    width: 42, height: 42, borderRadius: 12, backgroundColor: '#EFF6FF',
    alignItems: 'center', justifyContent: 'center', marginRight: 13,
  },
  infoLabel: { fontSize: 12, color: '#94A3B8', marginBottom: 3 },
  infoValue: { fontSize: 15, fontWeight: '600', color: '#334155' },

  actionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  actionIcon: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginRight: 13,
  },
  actionTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  actionSub: { fontSize: 12, color: '#94A3B8', marginTop: 2 },

  footer: { textAlign: 'center', color: '#94A3B8', fontSize: 12, marginTop: 26 },
});