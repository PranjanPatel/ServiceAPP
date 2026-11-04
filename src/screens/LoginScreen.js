import React, { useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
  ScrollView, KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focus, setFocus] = useState('');
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const passwordRef = useRef(null);

  const validate = () => {
    const e = {};
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = 'Enter a valid email address';
    if (!password) e.password = 'Enter your password';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onLogin = async () => {
    if (!validate()) return;
    try {
      setBusy(true);
      await login(email.trim(), password);
    } catch (e) {
      Alert.alert('Login failed', e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#F8FAFC' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Blue header */}
        <View style={s.header}>
          <View style={s.logo}>
            <Ionicons name="construct" size={34} color="#2563EB" />
          </View>
          <Text style={s.appName}>ServiceApp</Text>
          <Text style={s.tagline}>Find trusted local pros, rated by real customers</Text>
        </View>

        {/* Form card */}
        <View style={s.card}>
          <Text style={s.title}>Welcome back</Text>
          <Text style={s.sub}>Log in to continue</Text>

          <Text style={s.label}>Email</Text>
          <View style={[s.inputBox, focus === 'email' && s.inputFocus, errors.email && s.inputError]}>
            <Ionicons name="mail-outline" size={20} color={focus === 'email' ? '#2563EB' : '#94A3B8'} />
            <TextInput
              style={s.input}
              placeholder="you@example.com"
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              returnKeyType="next"
              value={email}
              onChangeText={(t) => { setEmail(t); if (errors.email) setErrors({ ...errors, email: null }); }}
              onFocus={() => setFocus('email')}
              onBlur={() => setFocus('')}
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
          </View>
          {!!errors.email && <Text style={s.error}>{errors.email}</Text>}

          <Text style={s.label}>Password</Text>
          <View style={[s.inputBox, focus === 'password' && s.inputFocus, errors.password && s.inputError]}>
            <Ionicons name="lock-closed-outline" size={20} color={focus === 'password' ? '#2563EB' : '#94A3B8'} />
            <TextInput
              ref={passwordRef}
              style={s.input}
              placeholder="Enter your password"
              placeholderTextColor="#94A3B8"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              returnKeyType="done"
              value={password}
              onChangeText={(t) => { setPassword(t); if (errors.password) setErrors({ ...errors, password: null }); }}
              onFocus={() => setFocus('password')}
              onBlur={() => setFocus('')}
              onSubmitEditing={onLogin}
            />
            <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={10}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>
          {!!errors.password && <Text style={s.error}>{errors.password}</Text>}

          <TouchableOpacity style={[s.button, busy && { opacity: 0.7 }]} onPress={onLogin} disabled={busy} activeOpacity={0.85}>
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={s.buttonText}>Log in</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>

          <View style={s.dividerRow}>
            <View style={s.line} />
            <Text style={s.or}>New here?</Text>
            <View style={s.line} />
          </View>

          <TouchableOpacity style={s.secondary} onPress={() => navigation.navigate('Signup')} activeOpacity={0.85}>
            <Text style={s.secondaryText}>Create an account</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.footer}>Customers and service providers sign up for free</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  header: {
    backgroundColor: '#2563EB',
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 100,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  logo: {
    width: 72, height: 72, borderRadius: 22, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    elevation: 6, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  appName: { color: '#fff', fontSize: 28, fontWeight: '800', marginTop: 16 },
  tagline: { color: '#BFDBFE', marginTop: 6, textAlign: 'center', fontSize: 14 },

  card: {
    backgroundColor: '#fff', marginHorizontal: 20, marginTop: -64, borderRadius: 24, padding: 22,
    elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 14, shadowOffset: { width: 0, height: 6 },
  },
  title: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  sub: { color: '#64748B', marginTop: 4, marginBottom: 20 },

  label: { color: '#334155', fontWeight: '600', marginBottom: 8, marginTop: 6, fontSize: 13 },
  inputBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC',
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 14, paddingHorizontal: 14,
  },
  inputFocus: { borderColor: '#2563EB', backgroundColor: '#fff' },
  inputError: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  input: { flex: 1, paddingVertical: 14, paddingHorizontal: 10, fontSize: 16, color: '#0F172A' },
  error: { color: '#DC2626', fontSize: 12, marginTop: 6, marginLeft: 4 },

  button: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#2563EB', borderRadius: 14, paddingVertical: 16, marginTop: 24,
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16, marginRight: 8 },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 22 },
  line: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  or: { color: '#94A3B8', marginHorizontal: 12, fontSize: 13 },

  secondary: {
    borderWidth: 1.5, borderColor: '#2563EB', borderRadius: 14, paddingVertical: 14, alignItems: 'center',
  },
  secondaryText: { color: '#2563EB', fontWeight: '700', fontSize: 15 },

  footer: { textAlign: 'center', color: '#94A3B8', fontSize: 12, marginVertical: 24, paddingHorizontal: 30 },
});