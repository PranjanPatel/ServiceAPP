import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  Linking,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { api } from "../../api";
import { toSlug } from "../../categories";
import VendorCard from "../../components/VendorCard";

const RADII = [5, 10, 25, 50];
const RATINGS = [
  { value: 0, label: "Any rating" },
  { value: 3, label: "3.0+" },
  { value: 4, label: "4.0+" },
  { value: 4.5, label: "4.5+" },
];

export default function ResultsScreen({ route, navigation }) {
  const { category } = route.params;
  const [coords, setCoords] = useState(null);
  const [radius, setRadius] = useState(10);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [denied, setDenied] = useState(false);

  // filters
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [minRating, setMinRating] = useState(0);

  // 1) get the user's location once
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setDenied(true);
        setError("Location permission is needed to find vendors near you.");
        setLoading(false);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      setCoords({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
    })().catch((e) => {
      setError(e.message);
      setLoading(false);
    });
  }, []);

  // 2) search whenever location or radius changes
  useEffect(() => {
    if (!coords) return;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const q = `?category=${toSlug(category)}&lat=${coords.latitude}&lng=${coords.longitude}&radius=${radius}`;
        setVendors(await api("/vendors/search" + q));
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [coords, radius, category]);

  // 3) apply filters (the order from the server is kept)
  const filtered = vendors.filter((v) => {
    if (verifiedOnly && !v.verified) return false;
    if (
      minRating > 0 &&
      !(Number(v.reviewCount) > 0 && Number(v.avgRating) >= minRating)
    )
      return false;
    return true;
  });

  const filtersOn = verifiedOnly || minRating > 0;
  const clearFilters = () => {
    setVerifiedOnly(false);
    setMinRating(0);
  };

  const subtitle = loading
    ? "Searching near you..."
    : error
      ? "Something went wrong"
      : filtersOn
        ? `${filtered.length} of ${vendors.length} within ${radius} km`
        : `${vendors.length} pro${vendors.length === 1 ? "" : "s"} within ${radius} km`;

  const nextRadius = RADII[RADII.indexOf(radius) + 1];

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" />

      {/* Blue header */}
      <View style={s.header}>
        <View style={s.topRow}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={10}
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.title} numberOfLines={1}>
              {category}
            </Text>
            <Text style={s.subtitle}>{subtitle}</Text>
          </View>
        </View>

        <Text style={s.within}>Search within</Text>
        <View style={s.radiusRow}>
          {RADII.map((r) => (
            <TouchableOpacity
              key={r}
              style={[s.chip, radius === r && s.chipActive]}
              onPress={() => setRadius(r)}
              activeOpacity={0.8}
            >
              <Text style={[s.chipText, radius === r && s.chipTextActive]}>
                {r} km
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Filters */}
      {!error && (
        <View style={s.filterBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.filterContent}
          >
            <TouchableOpacity
              style={[s.fChip, verifiedOnly && s.fChipActive]}
              onPress={() => setVerifiedOnly((v) => !v)}
              activeOpacity={0.8}
            >
              <Ionicons
                name="shield-checkmark"
                size={14}
                color={verifiedOnly ? "#fff" : "#2563EB"}
              />
              <Text style={[s.fText, verifiedOnly && s.fTextActive]}>
                Verified
              </Text>
            </TouchableOpacity>

            <View style={s.sep} />

            {RATINGS.map((r) => {
              const active = minRating === r.value;
              return (
                <TouchableOpacity
                  key={r.value}
                  style={[s.fChip, active && s.fChipActive]}
                  onPress={() => setMinRating(r.value)}
                  activeOpacity={0.8}
                >
                  {r.value > 0 && (
                    <Ionicons
                      name="star"
                      size={13}
                      color={active ? "#fff" : "#F59E0B"}
                    />
                  )}
                  <Text style={[s.fText, active && s.fTextActive]}>
                    {r.label}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {filtersOn && (
              <TouchableOpacity
                style={s.clear}
                onPress={clearFilters}
                hitSlop={8}
              >
                <Text style={s.clearText}>Clear</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      )}

      {/* Body */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={s.centerText}>
            Finding the best {category.toLowerCase()} pros...
          </Text>
        </View>
      ) : error ? (
        <View style={s.center}>
          <Ionicons
            name={denied ? "location-outline" : "alert-circle-outline"}
            size={52}
            color="#CBD5E1"
          />
          <Text style={s.emptyTitle}>
            {denied ? "Location is off" : "Could not load"}
          </Text>
          <Text style={s.centerText}>{error}</Text>
          {denied && (
            <TouchableOpacity
              style={s.actionBtn}
              onPress={() => Linking.openSettings()}
            >
              <Text style={s.actionText}>Open settings</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(v) => v._id}
          renderItem={({ item }) => (
            <VendorCard
              item={item}
              index={vendors.indexOf(item)} // keeps "Top match" tied to the real ranking
              onPress={() =>
                navigation.navigate("VendorDetail", {
                  id: item._id,
                  distanceKm: item.distanceKm,
                })
              }
            />
          )}
          contentContainerStyle={{
            padding: 20,
            paddingBottom: 40,
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            filtersOn && vendors.length > 0 ? (
              <View style={s.center}>
                <Ionicons name="funnel-outline" size={52} color="#CBD5E1" />
                <Text style={s.emptyTitle}>No pros match your filters</Text>
                <Text style={s.centerText}>
                  {vendors.length} {category.toLowerCase()} pro
                  {vendors.length === 1 ? "" : "s"} nearby, but none are
                  {verifiedOnly ? " verified" : ""}
                  {verifiedOnly && minRating > 0 ? " and" : ""}
                  {minRating > 0 ? ` rated ${minRating}+` : ""}.
                </Text>
                <TouchableOpacity style={s.actionBtn} onPress={clearFilters}>
                  <Text style={s.actionText}>Clear filters</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={s.center}>
                <Ionicons name="search-outline" size={52} color="#CBD5E1" />
                <Text style={s.emptyTitle}>No {category} pros found</Text>
                <Text style={s.centerText}>
                  Nobody within {radius} km yet.
                  {nextRadius ? " Try a bigger distance." : ""}
                </Text>
                {nextRadius && (
                  <TouchableOpacity
                    style={s.actionBtn}
                    onPress={() => setRadius(nextRadius)}
                  >
                    <Text style={s.actionText}>
                      Search within {nextRadius} km
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )
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
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  topRow: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  title: { color: "#fff", fontSize: 24, fontWeight: "800" },
  subtitle: { color: "#BFDBFE", marginTop: 2, fontSize: 14 },

  within: {
    color: "#BFDBFE",
    fontSize: 12,
    marginBottom: 8,
    fontWeight: "600",
  },
  radiusRow: { flexDirection: "row" },
  chip: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  chipActive: { backgroundColor: "#fff" },
  chipText: { color: "#fff", fontWeight: "600" },
  chipTextActive: { color: "#2563EB" },

  filterBar: { paddingTop: 14 },
  filterContent: { paddingHorizontal: 20, alignItems: "center" },
  fChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 13,
    marginRight: 8,
  },
  fChipActive: { backgroundColor: "#2563EB", borderColor: "#2563EB" },
  fText: { color: "#334155", fontWeight: "600", fontSize: 13, marginLeft: 5 },
  fTextActive: { color: "#fff" },
  sep: { width: 1, height: 22, backgroundColor: "#CBD5E1", marginRight: 8 },
  clear: { paddingHorizontal: 8, paddingVertical: 6 },
  clearText: { color: "#DC2626", fontWeight: "700", fontSize: 13 },

  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 36,
    paddingTop: 70,
  },
  centerText: {
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#334155",
    marginTop: 12,
  },
  actionBtn: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 22,
    marginTop: 18,
  },
  actionText: { color: "#fff", fontWeight: "700" },
});
