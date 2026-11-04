import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity, ActivityIndicator,
  StyleSheet, Alert, Linking,
} from 'react-native';
import { api } from '../../api';
import { Image, Modal } from 'react-native';

const Stars = ({ value, onChange, size = 28 }) => (
  <View style={{ flexDirection: 'row' }}>
    {[1, 2, 3, 4, 5].map((n) => (
      <TouchableOpacity key={n} disabled={!onChange} onPress={() => onChange(n)}>
        <Text style={{ fontSize: size, color: n <= value ? '#f59e0b' : '#d1d5db' }}>★</Text>
      </TouchableOpacity>
    ))}
  </View>
);

export default function VendorDetailScreen({ route }) {
  const { id, distanceKm } = route.params;
  const [viewer, setViewer] = useState(null);
  const [data, setData] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await api(`/vendors/${id}`));
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const submitReview = async () => {
    if (!rating) return Alert.alert('Select a star rating');
    try {
      setBusy(true);
      await api('/reviews', {
        method: 'POST',
        body: JSON.stringify({ vendorId: id, rating, comment: comment.trim() }),
      });
      setRating(0);
      setComment('');
      Alert.alert('Thank you!', 'Your review was submitted.');
      load();
    } catch (e) {
      Alert.alert('Could not submit', e.message);
    } finally {
      setBusy(false);
    }
  };

  if (!data) return <ActivityIndicator size="large" style={{ marginTop: 60 }} />;
  const { vendor, reviews } = data;

  return (
    <ScrollView style={{ backgroundColor: '#fff' }} contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
      <Text style={s.name}>{vendor.businessName}</Text>
      <Text style={s.category}>{vendor.category.replace(/-/g, ' ')}</Text>

      <View style={s.row}>
        <Stars value={Math.round(vendor.avgRating)} size={20} />
        <Text style={s.ratingText}>
          {vendor.reviewCount > 0 ? ` ${vendor.avgRating.toFixed(1)} (${vendor.reviewCount})` : ' No reviews yet'}
        </Text>
      </View>
      {distanceKm != null && <Text style={s.meta}>{distanceKm.toFixed(1)} km away</Text>}
      {vendor.photos?.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 14 }}>
            {vendor.photos.map((p) => (
            <TouchableOpacity key={p._id} onPress={() => setViewer(p.url)}>
                <Image source={{ uri: p.url }} style={s.galleryImg} />
            </TouchableOpacity>
            ))}
        </ScrollView>
        )}

        <Modal visible={!!viewer} transparent animationType="fade" onRequestClose={() => setViewer(null)}>
        <TouchableOpacity style={s.modalBg} activeOpacity={1} onPress={() => setViewer(null)}>
            {viewer && <Image source={{ uri: viewer }} style={s.fullImg} resizeMode="contain" />}
        </TouchableOpacity>
        </Modal>
      {!!vendor.description && <Text style={s.desc}>{vendor.description}</Text>}
      {!!vendor.address && <Text style={s.meta}>📍 {vendor.address}</Text>}

      {!!vendor.phone && (
        <TouchableOpacity style={s.callBtn} onPress={() => Linking.openURL(`tel:${vendor.phone}`)}>
          <Text style={s.callText}>Call {vendor.phone}</Text>
        </TouchableOpacity>
      )}

      <Text style={s.section}>Rate this vendor</Text>
      <Stars value={rating} onChange={setRating} />
      <TextInput
        style={s.input}
        placeholder="Write a comment (optional)"
        multiline
        value={comment}
        onChangeText={setComment}
      />
      <TouchableOpacity style={s.submit} onPress={submitReview} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.submitText}>Submit review</Text>}
      </TouchableOpacity>
      <Text style={s.hint}>Submitting again updates your earlier review.</Text>

      <Text style={s.section}>Reviews ({reviews.length})</Text>
      {reviews.length === 0 && <Text style={s.meta}>Be the first to review.</Text>}
      {reviews.map((r) => (
        <View key={r._id} style={s.review}>
          <Text style={{ fontWeight: '600' }}>{r.user?.name || 'User'}</Text>
          <Stars value={r.rating} size={16} />
          {!!r.comment && <Text style={{ marginTop: 4 }}>{r.comment}</Text>}
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { padding: 20, paddingBottom: 48 },
  name: { fontSize: 26, fontWeight: '700' },
  category: { color: '#2563eb', textTransform: 'capitalize', marginTop: 2, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { color: '#555' },
  meta: { color: '#666', marginTop: 6 },
  desc: { marginTop: 14, fontSize: 15, lineHeight: 22 },
  callBtn: { backgroundColor: '#16a34a', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 18 },
  callText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  section: { fontSize: 18, fontWeight: '700', marginTop: 28, marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, marginTop: 10, minHeight: 70, textAlignVertical: 'top' },
  submit: { backgroundColor: '#2563eb', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 12 },
  submitText: { color: '#fff', fontWeight: '600' },
  hint: { color: '#999', fontSize: 12, marginTop: 6 },
  review: { borderTopWidth: 1, borderTopColor: '#eee', paddingVertical: 12 },
  galleryImg: { width: 220, height: 160, borderRadius: 12, marginRight: 10 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center' },
  fullImg: { width: '100%', height: '80%' },
});