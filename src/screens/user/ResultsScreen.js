import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import * as Location from 'expo-location';
import { api } from '../../api';
import { toSlug } from '../../categories';
import { Image } from 'react-native';

const RADII = [5, 10, 25, 50];

export default function ResultsScreen({ route, navigation }) {
  const { category } = route.params;
  const [coords, setCoords] = useState(null);
  const [radius, setRadius] = useState(10);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 1) get the user's location once
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
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

  return (
    <View style={s.container}>
      <View style={s.radiusRow}>
        {RADII.map((r) => (
          <TouchableOpacity key={r} style={[s.chip, radius === r && s.chipActive]} onPress={() => setRadius(r)}>
            <Text style={[s.chipText, radius === r && s.chipTextActive]}>{r} km</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 40 }} />
      ) : error ? (
        <Text style={s.msg}>{error}</Text>
      ) : (
        <FlatList
          data={vendors}
          keyExtractor={(v) => v._id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<Text style={s.msg}>No {category} vendors within {radius} km. Try a bigger distance.</Text>}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={s.card}
              onPress={() => navigation.navigate('VendorDetail', { id: item._id, distanceKm: item.distanceKm })}
            >
              {item.photos?.[0] && <Image source={{ uri: item.photos[0].url }} style={s.cover} />}
              {index === 0 && <Text style={s.top}>Top rated near you</Text>}
              <Text style={s.name}>{item.businessName}</Text>
              <Text style={s.rating}>
                {item.reviewCount > 0
                  ? `★ ${item.avgRating.toFixed(1)}  (${item.reviewCount} review${item.reviewCount > 1 ? 's' : ''})`
                  : 'No reviews yet'}
                {'   •   '}{item.distanceKm.toFixed(1)} km away
              </Text>
              {!!item.description && <Text style={s.desc} numberOfLines={2}>{item.description}</Text>}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  radiusRow: { flexDirection: 'row', padding: 12, backgroundColor: '#fff' },
  chip: { borderWidth: 1, borderColor: '#ccc', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14, marginRight: 8 },
  chipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  chipText: { color: '#333' },
  chipTextActive: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  top: { color: '#16a34a', fontWeight: '700', fontSize: 12, marginBottom: 4 },
  name: { fontSize: 18, fontWeight: '700' },
  rating: { color: '#555', marginTop: 4 },
  desc: { color: '#666', marginTop: 8 },
  msg: { textAlign: 'center', color: '#666', marginTop: 40, paddingHorizontal: 24 },
  cover: { width: '100%', height: 160, borderRadius: 10, marginBottom: 10 },
});