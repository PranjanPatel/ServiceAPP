import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Image,
  ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { api } from '../../api';
import { CATEGORIES, toSlug } from '../../categories';

const MAX_PHOTOS = 6;

const thumb = (url, w = 400) =>
  url.includes('/upload/') ? url.replace('/upload/', `/upload/w_${w},q_auto,f_auto/`) : url;

// Reusable input with icon, focus + error states
function Field({ icon, label, error, focused, children, multiline }) {
  return (
    <View style={{ marginBottom: 6 }}>
      {!!label && <Text style={s.label}>{label}</Text>}
      <View style={[s.inputBox, multiline && s.textAreaBox, focused && s.inputFocus, !!error && s.inputError]}>
        {!!icon && <Ionicons name={icon} size={20} color={focused ? '#2563EB' : '#94A3B8'}
          style={multiline ? { marginTop: 14 } : null} />}
        {children}
      </View>
      {!!error && <Text style={s.error}>{error}</Text>}
    </View>
  );
}

export default function EditBusinessScreen({ route, navigation }) {
  const { vendor } = route.params;

  const initial = useRef({
    businessName: vendor.businessName || '',
    category: CATEGORIES.find((c) => toSlug(c) === vendor.category) || '',
    description: vendor.description || '',
    phone: vendor.phone || '',
    address: vendor.address || '',
    lat: vendor.location.coordinates[1],
    lng: vendor.location.coordinates[0],
  }).current;

  const [businessName, setBusinessName] = useState(initial.businessName);
  const [category, setCategory] = useState(initial.category);
  const [description, setDescription] = useState(initial.description);
  const [phone, setPhone] = useState(initial.phone);
  const [address, setAddress] = useState(initial.address);
  const [coords, setCoords] = useState({ latitude: initial.lat, longitude: initial.lng });
  const [photos, setPhotos] = useState(vendor.photos || []);

  const [busy, setBusy] = useState(false);
  const [locBusy, setLocBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [focus, setFocus] = useState('');
  const [errors, setErrors] = useState({});
  const saved = useRef(false);

  const clear = (k) => errors[k] && setErrors((e) => ({ ...e, [k]: null }));

  const dirty =
    businessName !== initial.businessName ||
    category !== initial.category ||
    description !== initial.description ||
    phone !== initial.phone ||
    address !== initial.address ||
    coords.latitude !== initial.lat ||
    coords.longitude !== initial.lng;

  // warn before leaving with unsaved text changes
  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', (e) => {
      if (!dirty || saved.current) return;
      e.preventDefault();
      Alert.alert('Discard changes?', 'You have unsaved changes.', [
        { text: 'Keep editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
      ]);
    });
    return unsub;
  }, [navigation, dirty]);

  const updateLocation = async () => {
    try {
      setLocBusy(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return Alert.alert('Permission needed', 'Allow location access.');
      const pos = await Location.getCurrentPositionAsync({});
      setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
    } catch (e) {
      Alert.alert('Could not get location', e.message);
    } finally {
      setLocBusy(false);
    }
  };

  const validate = () => {
    const e = {};
    if (!businessName.trim()) e.businessName = 'Enter your business name';
    if (!category) e.category = 'Select a service category';
    if (!description.trim()) e.description = 'Enter a short business description';
    if (!/^\d{10,15}$/.test(phone.trim())) e.phone = 'Enter a valid phone number (10 to 15 digits)';
    if (!address.trim()) e.address = 'Enter your business address';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) return Alert.alert('Missing details', 'Please fix the highlighted fields.');

    try {
      setBusy(true);
      await api('/vendors/me', {
        method: 'PUT',
        body: JSON.stringify({
          businessName: businessName.trim(),
          category,
          description: description.trim(),
          phone: phone.trim(),
          address: address.trim(),
          latitude: coords.latitude,
          longitude: coords.longitude,
        }),
      });
      saved.current = true;
      Alert.alert('Saved', 'Your business profile is updated.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Could not save', e.message);
    } finally {
      setBusy(false);
    }
  };

  const addPhotos = async () => {
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) {
      return Alert.alert('Limit reached', 'Maximum 6 photos allowed.');
    }

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        return Alert.alert('Permission needed', 'Allow photo access.');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: remaining,
        quality: 0.7,
      });
      if (result.canceled) return;

      setUploading(true);
      const form = new FormData();

      for (let i = 0; i < result.assets.length; i++) {
        // compress first: max 1200px wide, JPEG quality 60%
        const small = await ImageManipulator.manipulateAsync(
          result.assets[i].uri,
          [{ resize: { width: 1200 } }],
          { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
        );

        const response = await fetch(small.uri);
        const blob = await response.blob();
        form.append('photos', blob, `photo_${Date.now()}_${i}.jpg`);
      }

      const updatedPhotos = await api('/vendors/me/photos', { method: 'POST', body: form });
      setPhotos(updatedPhotos);
    } catch (error) {
      console.log('PHOTO UPLOAD ERROR:', error);
      Alert.alert('Upload failed', error.message);
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (photo) => {
    if (photos.length <= 1) return Alert.alert('Cannot delete', 'At least 1 photo is required.');
    Alert.alert('Delete photo?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            setPhotos(await api(`/vendors/me/photos/${photo._id}`, { method: 'DELETE' }));
          } catch (e) {
            Alert.alert('Could not delete', e.message);
          }
        },
      },
    ]);
  };

  const ph = '#94A3B8';

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#F8FAFC' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 130 }}
        keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Photos */}
        <View style={s.card}>
          <View style={s.cardHead}>
            <View style={s.cardIcon}><Ionicons name="images" size={18} color="#2563EB" /></View>
            <Text style={s.cardTitle}>Photos</Text>
            <View style={[s.counter, photos.length < 1 && { backgroundColor: '#FEE2E2' }]}>
              <Text style={[s.counterText, photos.length < 1 && { color: '#DC2626' }]}>
                {photos.length}/{MAX_PHOTOS}
              </Text>
            </View>
          </View>
          <Text style={s.hint}>
            Add 1 to 6 photos. The first photo is your cover. Businesses without photos are hidden from customers.
          </Text>

          <View style={s.photoGrid}>
            {photos.map((p, i) => (
              <View key={p._id} style={s.photoBox}>
                <Image source={{ uri: thumb(p.url) }} style={s.photo} />
                {i === 0 && (
                  <View style={s.coverTag}><Text style={s.coverText}>Cover</Text></View>
                )}
                <TouchableOpacity style={s.removeBtn} onPress={() => removePhoto(p)} hitSlop={6}>
                  <Ionicons name="close" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            {photos.length < MAX_PHOTOS && (
              <TouchableOpacity style={[s.photoBox, s.addBox]} onPress={addPhotos}
                disabled={uploading} activeOpacity={0.8}>
                {uploading ? <ActivityIndicator color="#2563EB" /> : (
                  <>
                    <Ionicons name="add" size={28} color="#2563EB" />
                    <Text style={s.addText}>Add</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
          {uploading && <Text style={s.uploading}>Uploading photos, please wait...</Text>}
          <Text style={s.note}>Photos save instantly, you don't need to tap Save for them.</Text>
        </View>

        {/* Business info */}
        <View style={s.card}>
          <View style={s.cardHead}>
            <View style={s.cardIcon}><Ionicons name="storefront" size={18} color="#2563EB" /></View>
            <Text style={s.cardTitle}>Business info</Text>
          </View>

          <Field icon="storefront-outline" label="Business name" focused={focus === 'biz'} error={errors.businessName}>
            <TextInput style={s.input} value={businessName} placeholder="e.g. Cool Air AC Repair"
              placeholderTextColor={ph}
              onChangeText={(t) => { setBusinessName(t); clear('businessName'); }}
              onFocus={() => setFocus('biz')} onBlur={() => setFocus('')} />
          </Field>

          <Text style={s.label}>Service category</Text>
          <View style={s.chips}>
            {CATEGORIES.map((c) => {
              const active = category === c;
              return (
                <TouchableOpacity key={c} style={[s.chip, active && s.chipActive]}
                  onPress={() => { setCategory(c); clear('category'); }} activeOpacity={0.8}>
                  {active && <Ionicons name="checkmark" size={14} color="#fff" style={{ marginRight: 4 }} />}
                  <Text style={[s.chipText, active && s.chipTextActive]}>{c}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {!!errors.category && <Text style={[s.error, { marginTop: -4, marginBottom: 8 }]}>{errors.category}</Text>}

          <Field icon="document-text-outline" label="Description" multiline focused={focus === 'desc'}
            error={errors.description}>
            <TextInput style={[s.input, { height: 110, textAlignVertical: 'top' }]} multiline
              value={description} placeholder="Describe your business and services"
              placeholderTextColor={ph}
              onChangeText={(t) => { setDescription(t); clear('description'); }}
              onFocus={() => setFocus('desc')} onBlur={() => setFocus('')} />
          </Field>
          <Text style={s.charCount}>{description.length} characters</Text>
        </View>

        {/* Contact and location */}
        <View style={s.card}>
          <View style={s.cardHead}>
            <View style={s.cardIcon}><Ionicons name="location" size={18} color="#2563EB" /></View>
            <Text style={s.cardTitle}>Contact and location</Text>
          </View>

          <Field icon="call-outline" label="Business phone" focused={focus === 'phone'} error={errors.phone}>
            <TextInput style={s.input} keyboardType="phone-pad" value={phone} maxLength={15}
              placeholder="10-digit mobile number" placeholderTextColor={ph}
              onChangeText={(t) => { setPhone(t.replace(/\D/g, '')); clear('phone'); }}
              onFocus={() => setFocus('phone')} onBlur={() => setFocus('')} />
          </Field>

          <Field icon="navigate-outline" label="Address" multiline focused={focus === 'addr'} error={errors.address}>
            <TextInput style={[s.input, { minHeight: 60, textAlignVertical: 'top' }]} multiline
              value={address} placeholder="Shop / street / area" placeholderTextColor={ph}
              onChangeText={(t) => { setAddress(t); clear('address'); }}
              onFocus={() => setFocus('addr')} onBlur={() => setFocus('')} />
          </Field>

          <Text style={[s.label, { marginTop: 8 }]}>Map location</Text>
          <TouchableOpacity style={s.locCard} onPress={updateLocation} disabled={locBusy} activeOpacity={0.85}>
            <View style={s.locIcon}>
              {locBusy ? <ActivityIndicator /> : <Ionicons name="locate" size={22} color="#2563EB" />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.locTitle}>Update to my current location</Text>
              <Text style={s.locSub}>
                Saved: {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}
              </Text>
            </View>
          </TouchableOpacity>
          <Text style={s.note}>Customers find you by this location, so stand at your shop when updating.</Text>
        </View>
      </ScrollView>

      {/* Sticky save bar */}
      <View style={s.bar}>
        <TouchableOpacity style={[s.save, (busy || !dirty) && { opacity: 0.6 }]} onPress={save}
          disabled={busy || !dirty} activeOpacity={0.85}>
          {busy ? <ActivityIndicator color="#fff" /> : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={s.saveText}>{dirty ? 'Save changes' : 'No changes to save'}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 16,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardIcon: {
    width: 34, height: 34, borderRadius: 10, backgroundColor: '#EFF6FF',
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  cardTitle: { flex: 1, fontSize: 17, fontWeight: '800', color: '#0F172A' },
  counter: { backgroundColor: '#DBEAFE', borderRadius: 10, paddingVertical: 3, paddingHorizontal: 10 },
  counterText: { color: '#1D4ED8', fontWeight: '800', fontSize: 12 },
  hint: { color: '#64748B', fontSize: 12, lineHeight: 18, marginBottom: 12 },
  note: { color: '#94A3B8', fontSize: 12, marginTop: 8 },
  uploading: { color: '#2563EB', fontSize: 12, fontWeight: '600', marginTop: 4 },

  label: { color: '#334155', fontWeight: '600', marginBottom: 8, marginTop: 8, fontSize: 13 },
  inputBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC',
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 14, paddingHorizontal: 14,
  },
  textAreaBox: { alignItems: 'flex-start' },
  inputFocus: { borderColor: '#2563EB', backgroundColor: '#fff' },
  inputError: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  input: { flex: 1, paddingVertical: 14, paddingHorizontal: 10, fontSize: 16, color: '#0F172A' },
  error: { color: '#DC2626', fontSize: 12, marginTop: 6, marginLeft: 4 },
  charCount: { color: '#94A3B8', fontSize: 11, textAlign: 'right', marginTop: 2 },

  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14,
    marginRight: 8, marginBottom: 8,
  },
  chipActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  chipText: { color: '#334155', fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: '#fff' },

  photoGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  photoBox: {
    width: '31.3%', aspectRatio: 1, marginRight: '2%', marginBottom: 8, borderRadius: 14,
    overflow: 'hidden', backgroundColor: '#E2E8F0', borderWidth: 1, borderColor: '#E2E8F0',
  },
  photo: { width: '100%', height: '100%' },
  coverTag: {
    position: 'absolute', left: 6, bottom: 6, backgroundColor: '#2563EB',
    borderRadius: 8, paddingVertical: 2, paddingHorizontal: 7,
  },
  coverText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  removeBtn: {
    position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(0,0,0,0.65)',
    width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center',
  },
  addBox: {
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#2563EB',
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
  },
  addText: { color: '#2563EB', fontWeight: '700', fontSize: 12 },

  locCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF',
    borderWidth: 1.5, borderColor: '#BFDBFE', borderRadius: 14, padding: 14,
  },
  locIcon: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: '#DBEAFE',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  locTitle: { fontWeight: '700', color: '#0F172A', fontSize: 15 },
  locSub: { color: '#64748B', fontSize: 12, marginTop: 2 },

  bar: {
    position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff',
    padding: 16, paddingBottom: 28, borderTopWidth: 1, borderTopColor: '#E2E8F0',
  },
  save: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#2563EB', borderRadius: 14, paddingVertical: 15,
  },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 16, marginLeft: 8 },
});