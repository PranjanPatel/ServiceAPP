import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Alert,
  ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as Location from 'expo-location';
import { api } from '../../api';
import { CATEGORIES, toSlug } from '../../categories';
import { Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

export default function EditBusinessScreen({ route, navigation }) {
  const { vendor } = route.params;

  const [businessName, setBusinessName] = useState(vendor.businessName || '');
  const [category, setCategory] = useState(
    CATEGORIES.find((c) => toSlug(c) === vendor.category) || ''
  );
  const [description, setDescription] = useState(vendor.description || '');
  const [phone, setPhone] = useState(vendor.phone || '');
  const [address, setAddress] = useState(vendor.address || '');
  const [coords, setCoords] = useState({
    latitude: vendor.location.coordinates[1],
    longitude: vendor.location.coordinates[0],
  });
  const [busy, setBusy] = useState(false);
  const [locBusy, setLocBusy] = useState(false);
  const MAX_PHOTOS = 6;
  const [photos, setPhotos] = useState(vendor.photos || []);
  const [uploading, setUploading] = useState(false);


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

  const save = async () => {
    if (!businessName.trim()) return Alert.alert('Enter business name');
    if (!category) return Alert.alert('Select a category');
    if (!/^\d{10,15}$/.test(phone.trim())) return Alert.alert('Enter a valid phone number');
    if (!address.trim()) return Alert.alert('Enter address');

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
        const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

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

        const updatedPhotos = await api('/vendors/me/photos', {
        method: 'POST',
        body: form,
        });

        setPhotos(updatedPhotos);

    } catch (error) {
        console.log('PHOTO UPLOAD ERROR:', error);
        Alert.alert('Upload failed', error.message);
    } finally {
    }
        setUploading(false);
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

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#fff' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        <Text style={s.label}>Business name</Text>
        <TextInput style={s.input} value={businessName} onChangeText={setBusinessName} />
        <Text style={s.label}>Photos ({photos.length}/6). At least 1 required</Text>
        <View style={s.photoGrid}>
        {photos.map((p) => (
            <View key={p._id} style={s.photoBox}>
            <Image source={{ uri: p.url }} style={s.photo} />
            <TouchableOpacity style={s.removeBtn} onPress={() => removePhoto(p)}>
                <Text style={s.removeText}>✕</Text>
            </TouchableOpacity>
            </View>
        ))}
        {photos.length < MAX_PHOTOS && (
            <TouchableOpacity style={[s.photoBox, s.addBox]} onPress={addPhotos} disabled={uploading}>
            {uploading ? <ActivityIndicator /> : <Text style={s.addText}>+</Text>}
            </TouchableOpacity>
        )}
        </View>
        <Text style={s.label}>Service category</Text>
        <View style={s.chips}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity key={c} style={[s.chip, category === c && s.chipActive]} onPress={() => setCategory(c)}>
              <Text style={[s.chipText, category === c && s.chipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.label}>Description</Text>
        <TextInput style={[s.input, { height: 110, textAlignVertical: 'top' }]} multiline
          value={description} onChangeText={setDescription} />

        <Text style={s.label}>Phone</Text>
        <TextInput style={s.input} keyboardType="phone-pad" value={phone}
          onChangeText={(t) => setPhone(t.replace(/\D/g, ''))} maxLength={15} />

        <Text style={s.label}>Address</Text>
        <TextInput style={s.input} multiline value={address} onChangeText={setAddress} />

        <TouchableOpacity style={s.locBtn} onPress={updateLocation} disabled={locBusy}>
          {locBusy ? <ActivityIndicator /> : <Text style={s.locText}>Update to my current location</Text>}
        </TouchableOpacity>
        <Text style={s.coords}>{coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}</Text>

        <TouchableOpacity style={s.save} onPress={save} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.saveText}>Save changes</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  label: { color: '#555', marginBottom: 6, marginTop: 4 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, marginBottom: 12, fontSize: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  chip: { borderWidth: 1, borderColor: '#ccc', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14, marginRight: 8, marginBottom: 8 },
  chipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  chipText: { color: '#333' },
  chipTextActive: { color: '#fff' },
  locBtn: { borderWidth: 1, borderColor: '#2563eb', borderRadius: 10, padding: 14, alignItems: 'center' },
  locText: { color: '#2563eb', fontWeight: '600' },
  coords: { color: '#16a34a', textAlign: 'center', marginVertical: 8 },
  save: { backgroundColor: '#2563eb', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  saveText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  photoBox: { width: '31%', aspectRatio: 1, marginRight: '2%', marginBottom: 8, borderRadius: 10, overflow: 'hidden' },
  photo: { width: '100%', height: '100%' },
  removeBtn: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.65)', width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  removeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  addBox: { borderWidth: 1, borderStyle: 'dashed', borderColor: '#2563eb', alignItems: 'center', justifyContent: 'center' },
  addText: { fontSize: 32, color: '#2563eb' },
});