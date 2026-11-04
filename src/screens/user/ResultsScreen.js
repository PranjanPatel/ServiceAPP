import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet,
  StatusBar, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { api } from '../../api';
import { toSlug } from '../../categories';
import VendorCard from '../../components/VendorCard';

const RADII = [5, 10, 25, 50];

export default function ResultsScreen({ route, navigation }) {
  const { category } = route.params;
  const [coords, setCoords] = useState(null);
  const [radius, setRadius] = useState(10);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [denied, setDenied] = useState(false);

  // 1) get the user's location once
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setDenied(true);
        setError('Location permission is needed to find vendors near you.');
        setLoading(false);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
    })().catch((e) => {
      setError(e.message);
      setLoading(false);
    });
  }, []);

  // 2) search whenever location or radius changes
  useEffect(() => {
    if (!coords) return;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const q = `?category=${toSlug(category)}&lat=${coords.latitude}&lng=${coords.longitude}&radius=${radius}`;
        setVendors(await api('/vendors/search' + q));
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [coords, radius, category]);

  const subtitle = loading
    ? 'Searching near you...'
    : error
    ? 'Something went wrong'
    : `${vendors.length} pro${vendors.length === 1 ? '' : 's'} within ${radius} km`;

  const nextRadius = RADII[RADII.indexOf(radius) + 1];

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" />

      {/* Blue header */}
      <View style={s.header}>
        <View style={s.topRow}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} hitSlop={10}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.title} numberOfLines={1}>{category}</Text>
            <Text style={s.subtitle}>{subtitle}</Text>
          </View>
        </View>

        <Text style={s.within}>Search within</Text>
        <View style={s.radiusRow}>
          {RADII.map((r) => (
            <TouchableOpacity
              key={r}
              style={[s.chip, radius === r && s.chipActive]}
              onPress={() => setRadius(r)}
              activeOpacity={0.8}
            >
              <Text style={[s.chipText, radius === r && s.chipTextActive]}>{r} km</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Body */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={s.centerText}>Finding the best {category.toLowerCase()} pros...</Text>
        </View>
      ) : error ? (
        <View style={s.center}>
          <Ionicons name={denied ? 'location-outline' : 'alert-circle-outline'} size={52} color="#CBD5E1" />
          <Text style={s.emptyTitle}>{denied ? 'Location is off' : 'Could not load'}</Text>
          <Text style={s.centerText}>{error}</Text>
          {denied && (
            <TouchableOpacity style={s.actionBtn} onPress={() => Linking.openSettings()}>
              <Text style={s.actionText}>Open settings</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={vendors}
          keyExtractor={(v) => v._id}
          renderItem={({ item, index }) => (
            <VendorCard
              item={item}
              index={index}
              onPress={() =>
                navigation.navigate('VendorDetail', { id: item._id, distanceKm: item.distanceKm })
              }
            />
          )}
          contentContainerStyle={{ padding: 20, paddingBottom: 40, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.center}>
              <Ionicons name="search-outline" size={52} color="#CBD5E1" />
              <Text style={s.emptyTitle}>No {category} pros found</Text>
              <Text style={s.centerText}>
                Nobody within {radius} km yet.{nextRadius ? ' Try a bigger distance.' : ''}
              </Text>
              {nextRadius && (
                <TouchableOpacity style={s.actionBtn} onPress={() => setRadius(nextRadius)}>
                  <Text style={s.actionText}>Search within {nextRadius} km</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  header: {
    backgroundColor: '#2563EB',
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  title: { color: '#fff', fontSize: 24, fontWeight: '800' },
  subtitle: { color: '#BFDBFE', marginTop: 2, fontSize: 14 },

  within: { color: '#BFDBFE', fontSize: 12, marginBottom: 8, fontWeight: '600' },
  radiusRow: { flexDirection: 'row' },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 20,
    paddingVertical: 7, paddingHorizontal: 16, marginRight: 8,
  },
  chipActive: { backgroundColor: '#fff' },
  chipText: { color: '#fff', fontWeight: '600' },
  chipTextActive: { color: '#2563EB' },

  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36, paddingTop: 70 },
  centerText: { color: '#94A3B8', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: '#334155', marginTop: 12 },
  actionBtn: { backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 22, marginTop: 18 },
  actionText: { color: '#fff', fontWeight: '700' },
});