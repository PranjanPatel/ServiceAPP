import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function EditProfileScreen({ navigation }) {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!name.trim()) return Alert.alert('Enter your name');
    if (!/^\d{10,15}$/.test(phone.trim())) return Alert.alert('Enter a valid phone number (10 to 15 digits)');

    try {
      setBusy(true);
      const data = await api('/auth/me', {
        method: 'PUT',
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });
      await updateUser(data.user);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Could not save', e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#F8FAFC' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        <Text style={s.label}>Full name</Text>
        <TextInput style={s.input} value={name} onChangeText={setName} placeholder="Full name" />

        <Text style={s.label}>Phone number</Text>
        <TextInput style={s.input} value={phone} keyboardType="phone-pad" maxLength={15}
          onChangeText={(t) => setPhone(t.replace(/\D/g, ''))} placeholder="Phone number" />

        <Text style={s.label}>Email</Text>
        <TextInput style={[s.input, s.disabled]} value={user?.email} editable={false} />
        <Text style={s.hint}>Email and account type cannot be changed.</Text>

        <TouchableOpacity style={s.button} onPress={save} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>Save changes</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { padding: 20 },
  label: { color: '#64748B', marginBottom: 6, marginTop: 6, fontSize: 13 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 8 },
  disabled: { backgroundColor: '#F1F5F9', color: '#94A3B8' },
  hint: { color: '#94A3B8', fontSize: 12, marginBottom: 20 },
  button: { backgroundColor: '#2563EB', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});