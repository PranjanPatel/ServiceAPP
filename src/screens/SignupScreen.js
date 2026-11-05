import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
  ScrollView, KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES } from '../categories';
import { api } from '../api';

// Reusable input with icon, focus + error states
function Field({ icon, label, error, focused, children, right }) {
  return (
    <View>
      {!!label && <Text style={s.label}>{label}</Text>}
      <View style={[s.inputBox, focused && s.inputFocus, !!error && s.inputError]}>
        <Ionicons name={icon} size={20} color={focused ? '#2563EB' : '#94A3B8'} />
        {children}
        {right}
      </View>
      {!!error && <Text style={s.error}>{error}</Text>}
    </View>
  );
}

export default function SignupScreen({ navigation }) {
  const { register } = useAuth();
  const [role, setRole] = useState('user');
  const [busy, setBusy] = useState(false);
  const [locBusy, setLocBusy] = useState(false);
  const [focus, setFocus] = useState('');
  const [errors, setErrors] = useState({});
  const [showPw, setShowPw] = useState(false);

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

  // otp
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [phoneToken, setPhoneToken] = useState(null);
  const [otpBusy, setOtpBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const emailRef = useRef(null);
  const phoneRef = useRef(null);
  const pwRef = useRef(null);
  const confirmRef = useRef(null);

  const isVendor = role === 'vendor';
  const clear = (k) => errors[k] && setErrors((e) => ({ ...e, [k]: null }));

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
      clear('coords');

      try {
        const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (place && !address) {
          setAddress([place.name, place.street, place.district, place.city, place.region]
            .filter(Boolean).join(', '));
        }
      } catch {}
    } catch (e) {
      Alert.alert('Could not get location', e.message);
    } finally {
      setLocBusy(false);
    }
  };

  const sendOtp = async () => {
    if (!/^\d{10,15}$/.test(phone.trim())) {
      return setErrors((e) => ({ ...e, phone: 'Enter a valid phone number first' }));
    }
    try {
      setOtpBusy(true);
      await api('/auth/send-otp', { method: 'POST', body: JSON.stringify({ phone: phone.trim() }) });
      setOtpSent(true);
      setOtp('');
      setCooldown(30);
      clear('phone');
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
      clear('phone');
    } catch (e) {
      Alert.alert('Verification failed', e.message);
    } finally {
      setOtpBusy(false);
    }
  };

  const onPhoneChange = (t) => {
    setPhone(t.replace(/\D/g, ''));
    clear('phone');
    // changing the number cancels any earlier verification
    setOtpSent(false);
    setOtp('');
    setPhoneToken(null);
  };

  const changeNumber = () => {
    setPhoneToken(null);
    setOtpSent(false);
    setOtp('');
  };

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = 'Enter your name';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = 'Enter a valid email';
    if (!/^\d{10,15}$/.test(phone.trim())) e.phone = 'Enter a valid phone number (digits only)';
    else if (!phoneToken) e.phone = 'Verify your phone number with OTP';
    if (password.length < 6) e.password = 'Password must be at least 6 characters';
    if (password !== confirm) e.confirm = 'Passwords do not match';
    if (isVendor) {
      if (!businessName.trim()) e.businessName = 'Enter your business name';
      if (!category) e.category = 'Select a service category';
      if (!description.trim()) e.description = 'Enter a short business description';
      if (!coords) e.coords = 'Tap "Use my current location" to set your business location';
      if (!address.trim()) e.address = 'Enter your business address';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSignup = async () => {
    if (!validate()) {
      return Alert.alert('Missing details', 'Please fix the highlighted fields.');
    }

    const payload = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password,
      role,
      phoneToken,
    };
    if (isVendor) {
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

  const ph = '#94A3B8';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#efeff0' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" />
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Blue header */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} hitSlop={10}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={s.title}>Create account</Text>
          <Text style={s.subtitle}>
            {isVendor ? 'List your business and get found by nearby customers'
                      : 'Find trusted local pros near you'}
          </Text>
        </View>

        <View style={s.card}>
          {/* Role switch */}
          <View style={s.toggle}>
            {[
              { key: 'user', label: 'I need a service', icon: 'search' },
              { key: 'vendor', label: 'I provide a service', icon: 'briefcase' },
            ].map((r) => {
              const active = role === r.key;
              return (
                <TouchableOpacity key={r.key} style={[s.toggleBtn, active && s.toggleActive]}
                  onPress={() => setRole(r.key)} activeOpacity={0.85}>
                  <Ionicons name={r.icon} size={16} color={active ? '#fff' : '#2563EB'} />
                  <Text style={[s.toggleText, active && s.toggleTextActive]}>{r.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={s.section}>Your details</Text>

          <Field icon="person-outline" label="Full name" focused={focus === 'name'} error={errors.name}>
            <TextInput style={s.input} placeholder="Your full name" placeholderTextColor={ph}
              value={name} onChangeText={(t) => { setName(t); clear('name'); }}
              onFocus={() => setFocus('name')} onBlur={() => setFocus('')}
              returnKeyType="next" onSubmitEditing={() => emailRef.current?.focus()} />
          </Field>

          <Field icon="mail-outline" label="Email" focused={focus === 'email'} error={errors.email}>
            <TextInput ref={emailRef} style={s.input} placeholder="you@example.com" placeholderTextColor={ph}
              autoCapitalize="none" autoCorrect={false} keyboardType="email-address"
              value={email} onChangeText={(t) => { setEmail(t); clear('email'); }}
              onFocus={() => setFocus('email')} onBlur={() => setFocus('')}
              returnKeyType="next" onSubmitEditing={() => phoneRef.current?.focus()} />
          </Field>

          {/* Phone + OTP */}
          <Field
            icon="call-outline"
            label="Phone number"
            focused={focus === 'phone'}
            error={errors.phone}
            right={
              phoneToken ? (
                <View style={s.verifiedChip}>
                  <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
                  <Text style={s.verifiedChipText}>Verified</Text>
                </View>
              ) : !otpSent ? (
                <TouchableOpacity style={s.inlineBtn} onPress={sendOtp} disabled={otpBusy}>
                  {otpBusy ? <ActivityIndicator size="small" color="#fff" />
                           : <Text style={s.inlineBtnText}>Send OTP</Text>}
                </TouchableOpacity>
              ) : null
            }
          >
            <TextInput ref={phoneRef} style={s.input} placeholder="10-digit mobile number"
              placeholderTextColor={ph} keyboardType="phone-pad" maxLength={15}
              value={phone} onChangeText={onPhoneChange} editable={!phoneToken}
              onFocus={() => setFocus('phone')} onBlur={() => setFocus('')} />
          </Field>

          {phoneToken && (
            <TouchableOpacity onPress={changeNumber}>
              <Text style={s.linkSmall}>Change number</Text>
            </TouchableOpacity>
          )}

          {otpSent && !phoneToken && (
            <View style={s.otpBox}>
              <Text style={s.otpHint}>Enter the 6-digit code sent to {phone}</Text>
              <TextInput
                style={s.otpInput}
                placeholder="------"
                placeholderTextColor="#CBD5E1"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={(t) => setOtp(t.replace(/\D/g, ''))}
              />
              <TouchableOpacity style={s.verifyBtn} onPress={verifyOtp} disabled={otpBusy} activeOpacity={0.85}>
                {otpBusy ? <ActivityIndicator color="#fff" />
                         : <Text style={s.verifyText}>Verify OTP</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={sendOtp} disabled={cooldown > 0 || otpBusy}>
                <Text style={[s.resend, cooldown > 0 && { color: '#94A3B8' }]}>
                  {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <Field icon="lock-closed-outline" label="Password" focused={focus === 'pw'} error={errors.password}
            right={
              <TouchableOpacity onPress={() => setShowPw((v) => !v)} hitSlop={10}>
                <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={20} color="#94A3B8" />
              </TouchableOpacity>
            }>
            <TextInput ref={pwRef} style={s.input} placeholder="Min 6 characters" placeholderTextColor={ph}
              secureTextEntry={!showPw} autoCapitalize="none"
              value={password} onChangeText={(t) => { setPassword(t); clear('password'); }}
              onFocus={() => setFocus('pw')} onBlur={() => setFocus('')}
              returnKeyType="next" onSubmitEditing={() => confirmRef.current?.focus()} />
          </Field>

          <Field icon="shield-checkmark-outline" label="Confirm password" focused={focus === 'confirm'}
            error={errors.confirm}>
            <TextInput ref={confirmRef} style={s.input} placeholder="Re-enter password" placeholderTextColor={ph}
              secureTextEntry={!showPw} autoCapitalize="none"
              value={confirm} onChangeText={(t) => { setConfirm(t); clear('confirm'); }}
              onFocus={() => setFocus('confirm')} onBlur={() => setFocus('')} />
          </Field>

          {/* Vendor-only */}
          {isVendor && (
            <>
              <Text style={[s.section, { marginTop: 22 }]}>Business details</Text>

              <Field icon="storefront-outline" label="Business name" focused={focus === 'biz'}
                error={errors.businessName}>
                <TextInput style={s.input} placeholder="e.g. Cool Air AC Repair" placeholderTextColor={ph}
                  value={businessName} onChangeText={(t) => { setBusinessName(t); clear('businessName'); }}
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
              {!!errors.category && <Text style={[s.error, { marginTop: -6, marginBottom: 8 }]}>{errors.category}</Text>}

              <Text style={s.label}>Description</Text>
              <View style={[s.inputBox, s.textAreaBox, focus === 'desc' && s.inputFocus, !!errors.description && s.inputError]}>
                <TextInput
                  style={[s.input, { height: 100, textAlignVertical: 'top', paddingHorizontal: 0 }]}
                  placeholder="Describe your business and services" placeholderTextColor={ph} multiline
                  value={description} onChangeText={(t) => { setDescription(t); clear('description'); }}
                  onFocus={() => setFocus('desc')} onBlur={() => setFocus('')}
                />
              </View>
              {!!errors.description && <Text style={s.error}>{errors.description}</Text>}

              <Text style={[s.label, { marginTop: 12 }]}>Business location</Text>
              <TouchableOpacity
                style={[s.locCard, coords && s.locCardDone, !!errors.coords && s.inputError]}
                onPress={useCurrentLocation} disabled={locBusy} activeOpacity={0.85}>
                <View style={[s.locIcon, coords && { backgroundColor: '#DCFCE7' }]}>
                  {locBusy ? <ActivityIndicator />
                    : <Ionicons name={coords ? 'checkmark-circle' : 'locate'} size={22}
                        color={coords ? '#16A34A' : '#2563EB'} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.locTitle}>{coords ? 'Location set' : 'Use my current location'}</Text>
                  <Text style={s.locSub}>
                    {coords
                      ? `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}  •  Tap to update`
                      : 'Customers nearby will find you. Stand at your shop.'}
                  </Text>
                </View>
              </TouchableOpacity>
              {!!errors.coords && <Text style={s.error}>{errors.coords}</Text>}

              <View style={{ height: 12 }} />
              <Field icon="navigate-outline" label="Business address" focused={focus === 'addr'} error={errors.address}>
                <TextInput style={s.input} placeholder="Shop / street / area" placeholderTextColor={ph} multiline
                  value={address} onChangeText={(t) => { setAddress(t); clear('address'); }}
                  onFocus={() => setFocus('addr')} onBlur={() => setFocus('')} />
              </Field>

              <View style={s.note}>
                <Ionicons name="images-outline" size={18} color="#1D4ED8" />
                <Text style={s.noteText}>
                  After signing up, add 1 to 6 photos from Dashboard, Edit business. Businesses without photos are hidden from customers.
                </Text>
              </View>
            </>
          )}

          <TouchableOpacity style={[s.button, busy && { opacity: 0.7 }]} onPress={onSignup}
            disabled={busy} activeOpacity={0.85}>
            {busy ? <ActivityIndicator color="#fff" /> : (
              <>
                <Text style={s.buttonText}>Create account</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={s.link}>Already have an account? <Text style={{ fontWeight: '800' }}>Log in</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  header: {
    backgroundColor: '#2563EB',
    paddingTop: 56, paddingHorizontal: 22, paddingBottom: 90,
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  title: { color: '#fff', fontSize: 28, fontWeight: '800' },
  subtitle: { color: '#BFDBFE', marginTop: 6, fontSize: 14, lineHeight: 20 },

  card: {
    backgroundColor: '#fff', marginHorizontal: 20, marginTop: -60, borderRadius: 24, padding: 20,
    elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 14, shadowOffset: { width: 0, height: 6 },
  },

  toggle: { flexDirection: 'row', backgroundColor: '#EFF6FF', borderRadius: 14, padding: 4, marginBottom: 20 },
  toggleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 11, borderRadius: 11,
  },
  toggleActive: { backgroundColor: '#2563EB' },
  toggleText: { color: '#2563EB', fontWeight: '700', fontSize: 13, marginLeft: 6 },
  toggleTextActive: { color: '#fff' },

  section: { fontSize: 17, fontWeight: '800', color: '#0F172A', marginBottom: 6 },
  label: { color: '#334155', fontWeight: '600', marginBottom: 8, marginTop: 10, fontSize: 13 },

  inputBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#efeff0',
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 14, paddingHorizontal: 14,
  },
  textAreaBox: { alignItems: 'flex-start', paddingVertical: 4 },
  inputFocus: { borderColor: '#2563EB', backgroundColor: '#fff' },
  inputError: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  input: { flex: 1, paddingVertical: 14, paddingHorizontal: 10, fontSize: 16, color: '#0F172A' },
  error: { color: '#DC2626', fontSize: 12, marginTop: 6, marginLeft: 4 },

  inlineBtn: { backgroundColor: '#2563EB', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, minWidth: 80, alignItems: 'center' },
  inlineBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  verifiedChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#DCFCE7', borderRadius: 10, paddingVertical: 5, paddingHorizontal: 8 },
  verifiedChipText: { color: '#16A34A', fontWeight: '700', fontSize: 12, marginLeft: 4 },
  linkSmall: { color: '#2563EB', fontSize: 12, fontWeight: '600', marginTop: 6, marginLeft: 4 },

  otpBox: { backgroundColor: '#EFF6FF', borderRadius: 14, padding: 14, marginTop: 10 },
  otpHint: { color: '#1E40AF', fontSize: 13, textAlign: 'center' },
  otpInput: {
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#BFDBFE', borderRadius: 12,
    textAlign: 'center', fontSize: 24, fontWeight: '800', letterSpacing: 10,
    paddingVertical: 12, marginTop: 10, color: '#0F172A',
  },
  verifyBtn: { backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 12 },
  verifyText: { color: '#fff', fontWeight: '700' },
  resend: { color: '#2563EB', textAlign: 'center', marginTop: 12, fontWeight: '600' },

  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 },
  chip: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#E2E8F0',
    backgroundColor: '#efeff0', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14,
    marginRight: 8, marginBottom: 8,
  },
  chipActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  chipText: { color: '#334155', fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: '#fff' },

  locCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF',
    borderWidth: 1.5, borderColor: '#BFDBFE', borderRadius: 14, padding: 14,
  },
  locCardDone: { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' },
  locIcon: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: '#DBEAFE',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  locTitle: { fontWeight: '700', color: '#0F172A', fontSize: 15 },
  locSub: { color: '#64748B', fontSize: 12, marginTop: 2 },

  note: {
    flexDirection: 'row', backgroundColor: '#EFF6FF', borderRadius: 12, padding: 12, marginTop: 14,
  },
  noteText: { flex: 1, color: '#1E40AF', fontSize: 12, marginLeft: 10, lineHeight: 18 },

  button: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#2563EB', borderRadius: 14, paddingVertical: 16, marginTop: 24,
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16, marginRight: 8 },
  link: { color: '#2563EB', textAlign: 'center', marginTop: 18 },
});