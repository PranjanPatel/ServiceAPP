import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const onLogin = async () => {
    if (!email || !password) return Alert.alert('Enter email and password');
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
    <View style={s.container}>
      <Text style={s.title}>Welcome back</Text>
      <TextInput style={s.input} placeholder="Email" autoCapitalize="none"
        keyboardType="email-address" value={email} onChangeText={setEmail} />
      <TextInput style={s.input} placeholder="Password" secureTextEntry
        value={password} onChangeText={setPassword} />
      <TouchableOpacity style={s.button} onPress={onLogin} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>Login</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
        <Text style={s.link}>New here? Create an account</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 24 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, marginBottom: 12, fontSize: 16 },
  button: { backgroundColor: '#2563eb', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 4 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  link: { color: '#2563eb', textAlign: 'center', marginTop: 18 },
});