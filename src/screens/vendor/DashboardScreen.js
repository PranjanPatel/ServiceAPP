import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../api';
import { ScrollView, Image } from 'react-native';

const Stars = ({ value, size = 16 }) => (
  <View style={{ flexDirection: 'row' }}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Text key={n} style={{ fontSize: size, color: n <= value ? '#f59e0b' : '#d1d5db' }}>★</Text>
    ))}
  </View>
);

export default function DashboardScreen({ navigation }) {
  const [vendor, setVendor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const [v, r] = await Promise.all([api('/vendors/me'), api('/reviews/mine')]);
      setVendor(v);
      setReviews(r);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // reload every time this screen comes into focus (e.g. after editing)
  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 80 }} />;
  if (error) return <Text style={s.msg}>{error}</Text>;
  if (!vendor) return <Text style={s.msg}>No business profile found.</Text>;

  const header = (
    <View>
      <Text style={s.name}>{vendor.businessName}</Text>
      <Text style={s.category}>{vendor.category.replace(/-/g, ' ')}</Text>
      {vendor.photos?.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {vendor.photos.map((p) => (
            <Image key={p._id} source={{ uri: p.url }} style={s.thumb} />
          ))}
        </ScrollView>
      ) : (
        <TouchableOpacity style={s.warn} onPress={() => navigation.navigate('EditBusiness', { vendor })}>
          <Text style={s.warnText}>Add at least 1 photo. Businesses without photos are hidden from customers. Tap here.</Text>
        </TouchableOpacity>
      )}
      <View style={s.statsRow}>
        <View style={s.stat}>
          <Text style={s.statValue}>{vendor.reviewCount > 0 ? vendor.avgRating.toFixed(1) : '-'}</Text>
          <Stars value={Math.round(vendor.avgRating)} />
          <Text style={s.statLabel}>Average rating</Text>
        </View>
        <View style={s.stat}>
          <Text style={s.statValue}>{vendor.reviewCount}</Text>
          <Text style={s.statLabel}>Total reviews</Text>
        </View>
      </View>

      {!!vendor.description && <Text style={s.desc}>{vendor.description}</Text>}
      {!!vendor.address && <Text style={s.meta}>📍 {vendor.address}</Text>}
      {!!vendor.phone && <Text style={s.meta}>📞 {vendor.phone}</Text>}

      <TouchableOpacity style={s.editBtn} onPress={() => navigation.navigate('EditBusiness', { vendor })}>
        <Text style={s.editText}>Edit business</Text>
      </TouchableOpacity>

      <Text style={s.tip}>Tip: more good reviews push your business higher in customer searches.</Text>
      <Text style={s.section}>Customer reviews ({reviews.length})</Text>
    </View>
  );

  return (
    <FlatList
      style={{ backgroundColor: '#fff' }}
      contentContainerStyle={{ padding: 20, paddingTop: 60 }}
      data={reviews}
      keyExtractor={(r) => r._id}
      ListHeaderComponent={header}
      ListEmptyComponent={<Text style={s.meta}>No reviews yet.</Text>}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      renderItem={({ item }) => (
        <View style={s.review}>
          <Text style={{ fontWeight: '600' }}>{item.user?.name || 'User'}</Text>
          <Stars value={item.rating} />
          {!!item.comment && <Text style={{ marginTop: 4 }}>{item.comment}</Text>}
          <Text style={s.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
      )}
    />
  );
}

const s = StyleSheet.create({
  name: { fontSize: 26, fontWeight: '700' },
  category: { color: '#2563eb', textTransform: 'capitalize', marginTop: 2, marginBottom: 16 },
  statsRow: { flexDirection: 'row', marginBottom: 16 },
  stat: { flex: 1, backgroundColor: '#eff6ff', borderRadius: 12, padding: 16, alignItems: 'center', marginRight: 10 },
  statValue: { fontSize: 28, fontWeight: '700', color: '#1d4ed8' },
  statLabel: { color: '#555', marginTop: 4, fontSize: 12 },
  desc: { fontSize: 15, lineHeight: 22, marginBottom: 8 },
  meta: { color: '#666', marginTop: 4 },
  editBtn: { borderWidth: 1, borderColor: '#2563eb', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 16 },
  editText: { color: '#2563eb', fontWeight: '600' },
  tip: { color: '#16a34a', marginTop: 14, fontSize: 13 },
  section: { fontSize: 18, fontWeight: '700', marginTop: 24, marginBottom: 8 },
  review: { borderTopWidth: 1, borderTopColor: '#eee', paddingVertical: 12 },
  date: { color: '#999', fontSize: 12, marginTop: 4 },
  msg: { textAlign: 'center', marginTop: 80, color: '#666', paddingHorizontal: 24 },
  thumb: { width: 110, height: 110, borderRadius: 10, marginRight: 8 },
  warn: { backgroundColor: '#fef3c7', borderRadius: 10, padding: 14, marginBottom: 16 },
  warnText: { color: '#92400e' },
});