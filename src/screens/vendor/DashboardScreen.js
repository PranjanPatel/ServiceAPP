import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, ScrollView, Image, TouchableOpacity, RefreshControl,
  ActivityIndicator, StyleSheet, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../api';

const thumb = (url, w = 400) =>
  url.includes('/upload/') ? url.replace('/upload/', `/upload/w_${w},q_auto,f_auto/`) : url;

const Stars = ({ value, size = 14 }) => (
  <View style={{ flexDirection: 'row' }}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Ionicons
        key={n}
        name={n <= value ? 'star' : 'star-outline'}
        size={size}
        color={n <= value ? '#F59E0B' : '#CBD5E1'}
        style={{ marginRight: 1 }}
      />
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

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (error || !vendor) {
    return (
      <View style={s.center}>
        <Ionicons name="alert-circle-outline" size={52} color="#CBD5E1" />
        <Text style={s.emptyTitle}>{error ? 'Could not load' : 'No business profile'}</Text>
        <Text style={s.muted}>{error || 'Your business profile was not found.'}</Text>
        <TouchableOpacity style={s.retryBtn} onPress={() => { setLoading(true); load(); }}>
          <Text style={s.retryText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const photos = vendor.photos || [];
  const hasReviews = vendor.reviewCount > 0;
  const isLive = photos.length > 0;
  const openEdit = () => navigation.navigate('EditBusiness', { vendor });

  // reviews per star (5 -> 1)
  const counts = [5, 4, 3, 2, 1].map((n) => reviews.filter((r) => r.rating === n).length);

  const header = (
    <View>
      {/* Blue header */}
      <View style={s.header}>
        <View style={s.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={s.hSub}>Your business</Text>
            <Text style={s.hName} numberOfLines={2}>{vendor.businessName}</Text>
          </View>
          <View style={[s.status, { backgroundColor: isLive ? '#DCFCE7' : '#FEF3C7' }]}>
            <View style={[s.statusDot, { backgroundColor: isLive ? '#16A34A' : '#D97706' }]} />
            <Text style={[s.statusText, { color: isLive ? '#166534' : '#92400E' }]}>
              {isLive ? 'Live' : 'Hidden'}
            </Text>
          </View>
        </View>
        <View style={s.catChip}>
          <Text style={s.catText}>{vendor.category.replace(/-/g, ' ')}</Text>
        </View>
      </View>

      {/* Stats overlapping the header */}
      <View style={s.statsRow}>
        <View style={s.stat}>
          <Ionicons name="star" size={20} color="#F59E0B" />
          <Text style={s.statValue}>{hasReviews ? vendor.avgRating.toFixed(1) : '-'}</Text>
          <Text style={s.statLabel}>Avg rating</Text>
        </View>
        <View style={s.stat}>
          <Ionicons name="chatbubbles" size={20} color="#2563EB" />
          <Text style={s.statValue}>{vendor.reviewCount}</Text>
          <Text style={s.statLabel}>Reviews</Text>
        </View>
        <View style={s.stat}>
          <Ionicons name="images" size={20} color="#059669" />
          <Text style={s.statValue}>{photos.length}/6</Text>
          <Text style={s.statLabel}>Photos</Text>
        </View>
      </View>

      {/* Photos */}
      <View style={s.block}>
        <View style={s.sectionRow}>
          <Text style={s.sectionTitle}>Photos</Text>
          <TouchableOpacity onPress={openEdit}>
            <Text style={s.sectionLink}>Manage</Text>
          </TouchableOpacity>
        </View>

        {photos.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {photos.map((p) => (
              <Image key={p._id} source={{ uri: thumb(p.url) }} style={s.thumb} />
            ))}
            {photos.length < 6 && (
              <TouchableOpacity style={[s.thumb, s.addThumb]} onPress={openEdit} activeOpacity={0.8}>
                <Ionicons name="add" size={30} color="#2563EB" />
                <Text style={s.addText}>Add</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        ) : (
          <TouchableOpacity style={s.warn} onPress={openEdit} activeOpacity={0.85}>
            <View style={s.warnIcon}>
              <Ionicons name="warning" size={22} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.warnTitle}>Add at least 1 photo</Text>
              <Text style={s.warnText}>Businesses without photos are hidden from customers. Tap to add.</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#D97706" />
          </TouchableOpacity>
        )}
      </View>

      {/* Quick actions */}
      <View style={[s.block, s.actionsRow]}>
        <TouchableOpacity style={s.primaryBtn} onPress={openEdit} activeOpacity={0.85}>
          <Ionicons name="create-outline" size={18} color="#fff" />
          <Text style={s.primaryText}>Edit business</Text>
        </TouchableOpacity>
      </View>

      {/* Listing details */}
      <View style={s.block}>
        <Text style={s.sectionTitle}>Your listing</Text>
        <View style={s.box}>
          <Text style={s.desc}>{vendor.description || 'No description added yet.'}</Text>
          {!!vendor.address && (
            <View style={s.infoRow}>
              <View style={s.infoIcon}><Ionicons name="location-outline" size={18} color="#2563EB" /></View>
              <Text style={s.infoText}>{vendor.address}</Text>
            </View>
          )}
          {!!vendor.phone && (
            <View style={s.infoRow}>
              <View style={s.infoIcon}><Ionicons name="call-outline" size={18} color="#2563EB" /></View>
              <Text style={s.infoText}>{vendor.phone}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Rating breakdown */}
      {hasReviews && (
        <View style={s.block}>
          <Text style={s.sectionTitle}>Rating breakdown</Text>
          <View style={s.box}>
            {[5, 4, 3, 2, 1].map((n, i) => (
              <View key={n} style={s.barRow}>
                <Text style={s.barLabel}>{n}</Text>
                <Ionicons name="star" size={12} color="#F59E0B" />
                <View style={s.barTrack}>
                  <View style={[s.barFill, { width: `${(counts[i] / reviews.length) * 100}%` }]} />
                </View>
                <Text style={s.barCount}>{counts[i]}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Tip */}
      <View style={[s.block, s.tip]}>
        <Ionicons name="trending-up" size={20} color="#16A34A" />
        <Text style={s.tipText}>
          Tip: more good reviews push your business higher in customer searches.
        </Text>
      </View>

      <View style={[s.block, { marginBottom: 4 }]}>
        <Text style={s.sectionTitle}>Customer reviews ({reviews.length})</Text>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" />
      <FlatList
        data={reviews}
        keyExtractor={(r) => r._id}
        ListHeaderComponent={header}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor="#2563EB"
          />
        }
        ListEmptyComponent={
          <View style={[s.box, s.emptyReviews]}>
            <Ionicons name="chatbubble-ellipses-outline" size={36} color="#CBD5E1" />
            <Text style={[s.muted, { marginTop: 8 }]}>No reviews yet. They will show up here.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const nm = item.user?.name || 'User';
          return (
            <View style={[s.box, s.reviewCard]}>
              <View style={s.reviewTop}>
                <View style={s.avatar}>
                  <Text style={s.avatarText}>
                    {nm.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.reviewName}>{nm}</Text>
                  <Stars value={item.rating} size={13} />
                </View>
                <Text style={s.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
              </View>
              {!!item.comment && <Text style={s.reviewText}>{item.comment}</Text>}
            </View>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', paddingHorizontal: 36 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: '#334155', marginTop: 12 },
  muted: { color: '#94A3B8', textAlign: 'center', marginTop: 6 },
  retryBtn: { backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24, marginTop: 18 },
  retryText: { color: '#fff', fontWeight: '700' },

  header: {
    backgroundColor: '#2563EB', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 70,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start' },
  hSub: { color: '#BFDBFE', fontSize: 13 },
  hName: { color: '#fff', fontSize: 26, fontWeight: '800', marginTop: 2 },
  status: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, paddingVertical: 5, paddingHorizontal: 11, marginLeft: 12 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontWeight: '800', fontSize: 12 },
  catChip: {
    alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12,
    paddingVertical: 4, paddingHorizontal: 12, marginTop: 12,
  },
  catText: { color: '#fff', fontWeight: '700', fontSize: 12, textTransform: 'capitalize' },

  statsRow: { flexDirection: 'row', paddingHorizontal: 20, marginTop: -44 },
  stat: {
    flex: 1, backgroundColor: '#fff', borderRadius: 18, paddingVertical: 16, alignItems: 'center', marginHorizontal: 5,
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  statValue: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginTop: 6 },
  statLabel: { color: '#94A3B8', fontSize: 12, marginTop: 2 },

  block: { paddingHorizontal: 20, marginTop: 24 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  sectionLink: { color: '#2563EB', fontWeight: '700', marginBottom: 12 },

  thumb: { width: 110, height: 110, borderRadius: 14, marginRight: 10 },
  addThumb: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#2563EB', backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  addText: { color: '#2563EB', fontWeight: '700', fontSize: 12 },

  warn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB',
    borderWidth: 1, borderColor: '#FDE68A', borderRadius: 16, padding: 14,
  },
  warnIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  warnTitle: { fontWeight: '800', color: '#92400E', fontSize: 15 },
  warnText: { color: '#B45309', fontSize: 12, marginTop: 2 },

  actionsRow: { flexDirection: 'row' },
  primaryBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#2563EB', borderRadius: 14, paddingVertical: 14,
  },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 15, marginLeft: 8 },

  box: {
    backgroundColor: '#fff', borderRadius: 18, padding: 16,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
  },
  desc: { color: '#334155', fontSize: 15, lineHeight: 23 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  infoIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  infoText: { flex: 1, color: '#334155', fontSize: 14 },

  barRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  barLabel: { width: 14, color: '#64748B', fontSize: 12, fontWeight: '700' },
  barTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: '#F1F5F9', marginHorizontal: 10, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#F59E0B', borderRadius: 4 },
  barCount: { width: 20, textAlign: 'right', color: '#94A3B8', fontSize: 12 },

  tip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', borderRadius: 14, padding: 14, marginHorizontal: 20 },
  tipText: { flex: 1, color: '#166534', fontSize: 13, marginLeft: 10 },

  reviewCard: { marginHorizontal: 20, marginBottom: 12 },
  emptyReviews: { marginHorizontal: 20, alignItems: 'center', paddingVertical: 28 },
  reviewTop: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { color: '#2563EB', fontWeight: '800' },
  reviewName: { fontWeight: '700', color: '#0F172A', marginBottom: 3 },
  date: { color: '#94A3B8', fontSize: 12 },
  reviewText: { color: '#475569', marginTop: 12, lineHeight: 21 },
});