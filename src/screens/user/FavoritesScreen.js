import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { api } from "../../api";
import { useFavorites } from "../../context/FavoritesContext";
import VendorCard from "../../components/VendorCard";

export default function FavoritesScreen({ navigation }) {
  const { ids } = useFavorites();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      setVendors(await api("/favorites"));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // reload each time the tab is opened
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // an un-liked vendor disappears from the list immediately
  const data = vendors.filter((v) => ids.includes(String(v._id)));

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" />

      <View style={s.header}>
        <Text style={s.title}>Saved</Text>
        <Text style={s.sub}>
          {data.length} vendor{data.length === 1 ? "" : "s"} you liked
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#2563EB"
          style={{ marginTop: 50 }}
        />
      ) : error ? (
        <View style={s.center}>
          <Ionicons name="alert-circle-outline" size={52} color="#CBD5E1" />
          <Text style={s.emptyTitle}>Could not load</Text>
          <Text style={s.muted}>{error}</Text>
          <TouchableOpacity
            style={s.btn}
            onPress={() => {
              setLoading(true);
              load();
            }}
          >
            <Text style={s.btnText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(v) => v._id}
          contentContainerStyle={{
            padding: 20,
            paddingBottom: 40,
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              tintColor="#2563EB"
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
            />
          }
          renderItem={({ item, index }) => (
            <VendorCard
              item={item}
              index={index + 3} // no top-3 rank badges in this list
              onPress={() =>
                navigation.navigate("VendorDetail", { id: item._id })
              }
            />
          )}
          ListEmptyComponent={
            <View style={s.center}>
              <Ionicons name="heart-outline" size={52} color="#CBD5E1" />
              <Text style={s.emptyTitle}>No saved vendors yet</Text>
              <Text style={s.muted}>
                Tap the heart on a vendor to save it here.
              </Text>
              <TouchableOpacity
                style={s.btn}
                onPress={() => navigation.navigate("Home")}
              >
                <Text style={s.btnText}>Find services</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    backgroundColor: "#2563EB",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  title: { color: "#fff", fontSize: 26, fontWeight: "800" },
  sub: { color: "#BFDBFE", marginTop: 4 },
  center: { alignItems: "center", paddingHorizontal: 36, paddingTop: 70 },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#334155",
    marginTop: 12,
  },
  muted: { color: "#94A3B8", textAlign: "center", marginTop: 6 },
  btn: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 18,
  },
  btnText: { color: "#fff", fontWeight: "700" },
});
