import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { CATEGORIES } from '../../categories';
import { useAuth } from '../../context/AuthContext';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');

  const filtered = CATEGORIES.filter((c) =>
    c.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <View style={s.container}>
      <Text style={s.hello}>Hi, {user.name.split(' ')[0]}</Text>
      <Text style={s.sub}>What service do you need?</Text>

      <TextInput
        style={s.search}
        placeholder="Search e.g. AC Repair"
        value={query}
        onChangeText={setQuery}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        ListEmptyComponent={<Text style={s.empty}>No matching service found</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={s.card}
            onPress={() => navigation.navigate('Results', { category: item })}
          >
            <Text style={s.cardText}>{item}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20, paddingTop: 60 },
  hello: { fontSize: 26, fontWeight: '700' },
  sub: { color: '#666', marginBottom: 16, marginTop: 2 },
  search: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, fontSize: 16, marginBottom: 16 },
  card: { width: '48%', backgroundColor: '#eff6ff', borderRadius: 12, paddingVertical: 28, alignItems: 'center', marginBottom: 12 },
  cardText: { fontWeight: '600', color: '#1d4ed8', fontSize: 15 },
  empty: { textAlign: 'center', color: '#888', marginTop: 30 },
});