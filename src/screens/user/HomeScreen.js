import React, { useState } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, StatusBar, Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORIES } from '../../categories';
import { useAuth } from '../../context/AuthContext';

// icon + colors for each category (unknown categories get the default)
const STYLES = {
  'AC Repair':        { icon: 'snow',          color: '#0EA5E9', bg: '#E0F2FE' },
  'Plumber':          { icon: 'water',         color: '#2563EB', bg: '#DBEAFE' },
  'Electrician':      { icon: 'flash',         color: '#F59E0B', bg: '#FEF3C7' },
  'Carpenter':        { icon: 'hammer',        color: '#B45309', bg: '#FFEDD5' },
  'Painter':          { icon: 'color-palette', color: '#DB2777', bg: '#FCE7F3' },
  'Home Cleaning':    { icon: 'sparkles',      color: '#059669', bg: '#D1FAE5' },
  'Appliance Repair': { icon: 'construct',     color: '#7C3AED', bg: '#EDE9FE' },
  'Pest Control':     { icon: 'bug',           color: '#DC2626', bg: '#FEE2E2' },
};
const DEFAULT_STYLE = { icon: 'build', color: '#475569', bg: '#F1F5F9' };

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');

  const firstName = (user?.name || 'there').split(' ')[0];
  const initials = (user?.name || 'U')
    .split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();

  const filtered = CATEGORIES.filter((c) =>
    c.toLowerCase().includes(query.trim().toLowerCase())
  );

  const open = (category) => {
    Keyboard.dismiss();
    navigation.navigate('Results', { category });
  };

  const header = (
    <View>
      <View style={s.header}>
        <View style={s.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.hello}>Hello, {firstName} 👋</Text>
            <Text style={s.sub}>What service do you need today?</Text>
          </View>
          <TouchableOpacity style={s.avatar} onPress={() => navigation.navigate('Profile')}>
            <Text style={s.avatarText}>{initials}</Text>
          </TouchableOpacity>
        </View>

        <View style={s.searchBox}>
          <Ionicons name="search" size={20} color="#94A3B8" />
          <TextInput
            style={s.searchInput}
            placeholder="Search e.g. AC Repair"
            placeholderTextColor="#94A3B8"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            onSubmitEditing={() => filtered.length === 1 && open(filtered[0])}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={10}>
              <Ionicons name="close-circle" size={20} color="#CBD5E1" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={s.banner}>
        <View style={s.bannerIcon}>
          <Ionicons name="star" size={22} color="#F59E0B" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.bannerTitle}>Top-rated pros near you</Text>
          <Text style={s.bannerText}>Vendors are ranked by customer reviews and distance.</Text>
        </View>
      </View>

      <View style={s.sectionRow}>
        <Text style={s.sectionTitle}>{query ? 'Search results' : 'All services'}</Text>
        <Text style={s.count}>{filtered.length}</Text>
      </View>
    </View>
  );

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item}
        numColumns={2}
        ListHeaderComponent={header}
        columnWrapperStyle={s.col}
        contentContainerStyle={{ paddingBottom: 30 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.emptyBox}>
            <Ionicons name="search-outline" size={44} color="#CBD5E1" />
            <Text style={s.emptyTitle}>No matching service</Text>
            <Text style={s.emptyText}>Try a different word, like "plumber" or "cleaning".</Text>
          </View>
        }
        renderItem={({ item }) => {
          const st = STYLES[item] || DEFAULT_STYLE;
          return (
            <TouchableOpacity style={s.card} activeOpacity={0.8} onPress={() => open(item)}>
              <View style={[s.iconCircle, { backgroundColor: st.bg }]}>
                <Ionicons name={st.icon} size={28} color={st.color} />
              </View>
              <Text style={s.cardText}>{item}</Text>
              <Text style={s.cardSub}>View nearby</Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#efeff0' },

  header: {
    backgroundColor: '#2563EB',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 26,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  hello: { color: '#fff', fontSize: 24, fontWeight: '800' },
  sub: { color: '#BFDBFE', marginTop: 4, fontSize: 14 },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarText: { color: '#fff', fontWeight: '800' },

  searchBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 14, paddingHorizontal: 14,
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
  },
  searchInput: { flex: 1, paddingVertical: 14, paddingHorizontal: 10, fontSize: 16, color: '#0F172A' },

  banner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB',
    borderRadius: 14, padding: 14, marginHorizontal: 20, marginTop: 20,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  bannerIcon: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: '#FEF3C7',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  bannerTitle: { fontWeight: '700', color: '#92400E', fontSize: 15 },
  bannerText: { color: '#B45309', fontSize: 12, marginTop: 2 },

  sectionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, marginTop: 24, marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  count: {
    backgroundColor: '#E2E8F0', color: '#475569', fontWeight: '700', fontSize: 12,
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, overflow: 'hidden',
  },

  col: { justifyContent: 'space-between', paddingHorizontal: 20 },
  card: {
    width: '48%', backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 14,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
  },
  iconCircle: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  cardText: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  cardSub: { fontSize: 12, color: '#94A3B8', marginTop: 3 },

  emptyBox: { alignItems: 'center', marginTop: 30, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#334155', marginTop: 10 },
  emptyText: { color: '#94A3B8', textAlign: 'center', marginTop: 4 },
});