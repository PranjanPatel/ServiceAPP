import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image, StyleSheet, Linking, useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Cloudinary: serve a smaller, auto-optimised version
const thumb = (url, w = 800) =>
  url.includes('/upload/') ? url.replace('/upload/', `/upload/w_${w},q_auto,f_auto/`) : url;

const RANK = [
  { label: 'Top match', bg: '#FDE68A', color: '#92400E', icon: 'trophy' },
  { label: '#2', bg: '#E2E8F0', color: '#334155', icon: 'medal' },
  { label: '#3', bg: '#FFEDD5', color: '#9A3412', icon: 'medal' },
];

const Stars = ({ value }) => (
  <View style={{ flexDirection: 'row' }}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Ionicons
        key={n}
        name={n <= Math.round(value) ? 'star' : 'star-outline'}
        size={14}
        color={n <= Math.round(value) ? '#F59E0B' : '#CBD5E1'}
        style={{ marginRight: 1 }}
      />
    ))}
  </View>
);

export default function VendorCard({ item, index, onPress }) {
  const { width } = useWindowDimensions();
  const cardWidth = width - 40; // screen minus 20px padding on each side
  const [page, setPage] = useState(0);

  const photos = item.photos || [];
  const hasReviews = item.reviewCount > 0;
  const rank = index < 3 && hasReviews ? RANK[index] : null;

  const call = () => Linking.openURL(`tel:${item.phone}`);

  return (
    <View style={s.card}>
      {/* Photo carousel */}
      <View>
        {photos.length > 0 ? (
          <FlatList
            data={photos}
            keyExtractor={(p) => p._id || p.url}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / cardWidth))}
            scrollEventThrottle={16}
            renderItem={({ item: p }) => (
              <TouchableOpacity activeOpacity={0.95} onPress={onPress}>
                <Image source={{ uri: thumb(p.url) }} style={{ width: cardWidth, height: 190 }} />
              </TouchableOpacity>
            )}
          />
        ) : (
          <View style={[s.noCover, { width: cardWidth }]}>
            <Ionicons name="image-outline" size={40} color="#CBD5E1" />
          </View>
        )}

        {rank && (
          <View style={[s.badge, { backgroundColor: rank.bg }]}>
            <Ionicons name={rank.icon} size={12} color={rank.color} />
            <Text style={[s.badgeText, { color: rank.color }]}>{rank.label}</Text>
          </View>
        )}
        {!hasReviews && (
          <View style={[s.badge, { backgroundColor: '#DBEAFE' }]}>
            <Ionicons name="sparkles" size={12} color="#1D4ED8" />
            <Text style={[s.badgeText, { color: '#1D4ED8' }]}>New</Text>
          </View>
        )}

        {photos.length > 1 && (
          <>
            <View style={s.counter}>
              <Ionicons name="images" size={12} color="#fff" />
              <Text style={s.counterText}>{page + 1}/{photos.length}</Text>
            </View>
            <View style={s.dots}>
              {photos.map((_, i) => (
                <View key={i} style={[s.dot, i === page && s.dotActive]} />
              ))}
            </View>
          </>
        )}
      </View>

      {/* Details */}
      <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={s.body}>
        <View style={s.titleRow}>
          <Text style={s.name} numberOfLines={1}>{item.businessName}</Text>
          <View style={s.distChip}>
            <Ionicons name="location" size={12} color="#2563EB" />
            <Text style={s.distText}>{Number(item.distanceKm || 0).toFixed(1)} km</Text>
          </View>
        </View>

        <View style={s.ratingRow}>
          {hasReviews ? (
            <>
              <Text style={s.ratingNum}>{Number(item.avgRating).toFixed(1)}</Text>
              <Stars value={item.avgRating} />
              <Text style={s.reviewCount}>
                ({item.reviewCount} review{item.reviewCount > 1 ? 's' : ''})
              </Text>
            </>
          ) : (
            <Text style={s.reviewCount}>No reviews yet. Be the first to review</Text>
          )}
        </View>

        {!!item.description && <Text style={s.desc} numberOfLines={2}>{item.description}</Text>}

        {!!item.address && (
          <View style={s.addrRow}>
            <Ionicons name="navigate-outline" size={14} color="#94A3B8" />
            <Text style={s.addr} numberOfLines={1}>{item.address}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Actions */}
      <View style={s.actions}>
        {!!item.phone && (
          <TouchableOpacity style={s.callBtn} onPress={call} activeOpacity={0.8}>
            <Ionicons name="call" size={16} color="#059669" />
            <Text style={s.callText}>Call</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={s.detailBtn} onPress={onPress} activeOpacity={0.8}>
          <Text style={s.detailText}>View details</Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: 20, marginBottom: 18, overflow: 'hidden',
    elevation: 3, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  noCover: { height: 190, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },

  badge: {
    position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, paddingVertical: 5, paddingHorizontal: 10,
  },
  badgeText: { fontWeight: '800', fontSize: 11, marginLeft: 5 },
  counter: {
    position: 'absolute', top: 12, right: 12, flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 12, paddingVertical: 4, paddingHorizontal: 9,
  },
  counterText: { color: '#fff', fontSize: 12, fontWeight: '700', marginLeft: 5 },
  dots: { position: 'absolute', bottom: 10, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.55)', marginHorizontal: 3 },
  dotActive: { backgroundColor: '#fff', width: 16 },

  body: { paddingHorizontal: 16, paddingTop: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { flex: 1, fontSize: 19, fontWeight: '800', color: '#0F172A', marginRight: 10 },
  distChip: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF',
    borderRadius: 12, paddingVertical: 4, paddingHorizontal: 9,
  },
  distText: { color: '#1D4ED8', fontWeight: '700', fontSize: 12, marginLeft: 4 },

  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  ratingNum: { fontWeight: '800', color: '#92400E', marginRight: 6, fontSize: 15 },
  reviewCount: { color: '#94A3B8', fontSize: 13, marginLeft: 6 },

  desc: { color: '#64748B', marginTop: 10, lineHeight: 20 },
  addrRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  addr: { flex: 1, color: '#94A3B8', fontSize: 12, marginLeft: 5 },

  actions: { flexDirection: 'row', padding: 16, paddingTop: 14 },
  callBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#ECFDF5', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 18, marginRight: 10,
  },
  callText: { color: '#059669', fontWeight: '700', marginLeft: 6 },
  detailBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 12,
  },
  detailText: { color: '#fff', fontWeight: '700', marginRight: 6 },
});