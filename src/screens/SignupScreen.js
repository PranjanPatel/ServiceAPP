import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as Location from 'expo-location';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES } from '../categories';
import { api } from '../api';

export default function SignupScreen({ navigation }) {
  const { register } = useAuth();
  const [role, setRole] = useState('user');
  const [busy, setBusy] = useState(false);
  const [locBusy, setLocBusy] = useState(false);

  // common
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  // vendor only
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [phoneToken, setPhoneToken] = useState(null);
  const [otpBusy, setOtpBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // resend countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const useCurrentLocation = async () => {
    try {
      setLocBusy(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return Alert.alert('Permission needed', 'Allow location access to set your business location.');
      }
      const pos = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = pos.coords;
      setCoords({ latitude, longitude });

      // try to fill the address automatically
      try {
        const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (place && !address) {
          const text = [place.name, place.street, place.district, place.city, place.region]
            .filter(Boolean).join(', ');
          setAddress(text);
        }
      } catch {}
    } catch (e) {
      Alert.alert('Could not get location', e.message);
    } finally {
      setLocBusy(false);
    }
  };

  const sendOtp = async () => {
  if (!/^\d{10,15}$/.test(phone.trim())) return Alert.alert('Enter a valid phone number first');
  try {
    setOtpBusy(true);
    await api('/auth/send-otp', { method: 'POST', body: JSON.stringify({ phone: phone.trim() }) });
    setOtpSent(true);
    setOtp('');
    setCooldown(30);
  } catch (e) {
    Alert.alert('Could not send OTP', e.message);
  } finally {
    setOtpBusy(false);
  }
};

const verifyOtp = async () => {
  if (otp.length !== 6) return Alert.alert('Enter the 6-digit OTP');
  try {
    setOtpBusy(true);
    const data = await api('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone: phone.trim(), code: otp }),
    });
    setPhoneToken(data.phoneToken);
  } catch (e) {
    Alert.alert('Verification failed', e.message);
  } finally {
    setOtpBusy(false);
  }
};

const onPhoneChange = (t) => {
  setPhone(t.replace(/\D/g, ''));
  // changing the number cancels any earlier verification
  setOtpSent(false);
  setOtp('');
  setPhoneToken(null);
};

  const validate = () => {
    if (!name.trim()) return 'Enter your name';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return 'Enter a valid email';
    if (!/^\d{10,15}$/.test(phone.trim())) return 'Enter a valid phone number (digits only)';
    if (!phoneToken) return 'Verify your phone number with OTP';
    if (password.length < 6) return 'Password must be at least 6 characters';
    if (password !== confirm) return 'Passwords do not match';
    if (role === 'vendor') {
      if (!businessName.trim()) return 'Enter your business name';
      if (!category) return 'Select a service category';
      if (!description.trim()) return 'Enter a short business description';
      if (!address.trim()) return 'Enter your business address';
      if (!coords) return 'Tap "Use my current location" to set your business location';
    }
    return null;
  };

  const onSignup = async () => {
    const error = validate();
    if (error) return Alert.alert('Missing details', error);

    const payload = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password,
      role,
      phoneToken,
    };
    if (role === 'vendor') {
      Object.assign(payload, {
        businessName: businessName.trim(),
        category,
        description: description.trim(),
        address: address.trim(),
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
    }

    try {
      setBusy(true);
      await register(payload);
    } catch (e) {
      Alert.alert('Signup failed', e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        <Text style={s.title}>Create account</Text>

        <View style={s.toggle}>
          {['user', 'vendor'].map((r) => (
            <TouchableOpacity key={r} style={[s.toggleBtn, role === r && s.toggleActive]}
              onPress={() => setRole(r)}>
              <Text style={[s.toggleText, role === r && s.toggleTextActive]}>
                {r === 'user' ? 'I need a service' : 'I provide a service'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.section}>Your details</Text>
        <TextInput style={s.input} placeholder="Full name" value={name} onChangeText={setName} />
        <TextInput style={s.input} placeholder="Email" autoCapitalize="none"
          keyboardType="email-address" value={email} onChangeText={setEmail} />
        <TextInput
  style={[s.input, phoneToken && s.verifiedInput]}
  placeholder="Phone number"
  keyboardType="phone-pad"
  value={phone}
  onChangeText={onPhoneChange}
  maxLength={15}
  editable={!phoneToken}
/>

{phoneToken ? (
  <Text style={s.verified}>✓ Phone number verified</Text>
) : (
  <>
    {!otpSent ? (
      <TouchableOpacity style={s.otpBtn} onPress={sendOtp} disabled={otpBusy}>
        {otpBusy ? <ActivityIndicator /> : <Text style={s.otpBtnText}>Send OTP</Text>}
      </TouchableOpacity>
    ) : (
      <View>
        <TextInput
          style={[s.input, { letterSpacing: 8, textAlign: 'center', fontSize: 20 }]}
          placeholder="------"
          keyboardType="number-pad"
          maxLength={6}
          value={otp}
          onChangeText={(t) => setOtp(t.replace(/\D/g, ''))}
        />
        <TouchableOpacity style={s.otpBtn} onPress={verifyOtp} disabled={otpBusy}>
          {otpBusy ? <ActivityIndicator /> : <Text style={s.otpBtnText}>Verify OTP</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={sendOtp} disabled={cooldown > 0 || otpBusy}>
          <Text style={[s.resend, cooldown > 0 && { color: '#999' }]}>
            {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
          </Text>
        </TouchableOpacity>
      </View>
    )}
  </>
)}
        <TextInput style={s.input} placeholder="Password (min 6 characters)" secureTextEntry
          value={password} onChangeText={setPassword} />
        <TextInput style={s.input} placeholder="Confirm password" secureTextEntry
          value={confirm} onChangeText={setConfirm} />

        {role === 'vendor' && (
          <>
            <Text style={s.section}>Business details</Text>
            <TextInput style={s.input} placeholder="Business name" value={businessName}
              onChangeText={setBusinessName} />

            <Text style={s.label}>Service category</Text>
            <View style={s.chips}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity key={c} style={[s.chip, category === c && s.chipActive]}
                  onPress={() => setCategory(c)}>
                  <Text style={[s.chipText, category === c && s.chipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput style={[s.input, { height: 100, textAlignVertical: 'top' }]}
              placeholder="Describe your business and services" multiline
              value={description} onChangeText={setDescription} />

            <TouchableOpacity style={s.locationBtn} onPress={useCurrentLocation} disabled={locBusy}>
              {locBusy
                ? <ActivityIndicator />
                : <Text style={s.locationText}>
                    {coords ? 'Location set. Tap to update' : 'Use my current location'}
                  </Text>}
            </TouchableOpacity>
            {coords && (
              <Text style={s.coords}>
                {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}
              </Text>
            )}

            <TextInput style={s.input} placeholder="Business address" value={address}
              onChangeText={setAddress} multiline />
          </>
        )}

        <TouchableOpacity style={s.button} onPress={onSignup} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>Sign up</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.link}>Already have an account? Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { padding: 24, paddingTop: 60, paddingBottom: 48 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 20 },
  toggle: { flexDirection: 'row', marginBottom: 16, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#2563eb' },
  toggleBtn: { flex: 1, padding: 12, alignItems: 'center' },
  toggleActive: { backgroundColor: '#2563eb' },
  toggleText: { color: '#2563eb', fontWeight: '600' },
  toggleTextActive: { color: '#fff' },
  section: { fontSize: 16, fontWeight: '700', marginTop: 8, marginBottom: 10 },
  label: { color: '#555', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, marginBottom: 12, fontSize: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  chip: { borderWidth: 1, borderColor: '#ccc', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14, marginRight: 8, marginBottom: 8 },
  chipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  chipText: { color: '#333' },
  chipTextActive: { color: '#fff' },
  locationBtn: { borderWidth: 1, borderColor: '#2563eb', borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 6 },
  locationText: { color: '#2563eb', fontWeight: '600' },
  coords: { color: '#16a34a', marginBottom: 12, textAlign: 'center' },
  button: { backgroundColor: '#2563eb', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  link: { color: '#2563eb', textAlign: 'center', marginTop: 18 },
  verifiedInput: { backgroundColor: '#f0fdf4', borderColor: '#16a34a' },
  verified: { color: '#16a34a', fontWeight: '600', marginBottom: 12 },
  otpBtn: { borderWidth: 1, borderColor: '#2563eb', borderRadius: 10, padding: 12, alignItems: 'center', marginBottom: 10 },
  otpBtnText: { color: '#2563eb', fontWeight: '600' },
  resend: { color: '#2563eb', textAlign: 'center', marginBottom: 12 },
});