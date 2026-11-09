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
  Modal,
  PanResponder,
  Animated,
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

  // Applied filters
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [minRating, setMinRating] = useState(0);

  // Temporary filter-sheet selections
  const [filterVisible, setFilterVisible] = useState(false);
  const [draftRadius, setDraftRadius] = useState(10);
  const [draftVerified, setDraftVerified] = useState(false);
  const [draftRating, setDraftRating] = useState(0);
  const panY = useState(new Animated.Value(0))[0];

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,

    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 3,

    onPanResponderMove: (_, gesture) => {
      panY.setValue(Math.max(0, gesture.dy));
    },

    onPanResponderRelease: (_, gesture) => {
      if (gesture.dy > 80 || gesture.vy > 0.7) {
        Animated.timing(panY, {
          toValue: 600,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          panY.setValue(0);
          setFilterVisible(false);
        });
      } else {
        Animated.spring(panY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 4,
        }).start();
      }
    },

    onPanResponderTerminate: () => {
      Animated.spring(panY, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    },
  });

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

  // Search again when the applied distance changes
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

  // Keep the server ranking order while applying local filters
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
  const activeFilterCount =
    (verifiedOnly ? 1 : 0) + (minRating > 0 ? 1 : 0) + (radius !== 10 ? 1 : 0);

  const openFilters = () => {
    setDraftRadius(radius);
    setDraftVerified(verifiedOnly);
    setDraftRating(minRating);
    setFilterVisible(true);
  };

  const applyFilters = () => {
    setRadius(draftRadius);
    setVerifiedOnly(draftVerified);
    setMinRating(draftRating);
    setFilterVisible(false);
  };

  const clearFilters = () => {
    setDraftRadius(10);
    setDraftVerified(false);
    setDraftRating(0);
  };

  const clearAppliedFilters = () => {
    setRadius(10);
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

  const renderOption = (label, selected, onPress, icon) => (
    <TouchableOpacity
      key={label}
      style={[s.optionChip, selected && s.optionChipActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={15}
          color={selected ? "#FFFFFF" : "#475569"}
          style={{ marginRight: 7 }}
        />
      ) : null}
      <Text style={[s.optionText, selected && s.optionTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" />

      <View style={s.header}>
        <View style={s.topRow}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={10}
          >
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={s.title} numberOfLines={1}>
              {category}
            </Text>
            <Text style={s.subtitle}>{subtitle}</Text>
          </View>

          {!error && (
            <TouchableOpacity style={s.headerFilterBtn} onPress={openFilters}>
              <Ionicons name="options-outline" size={19} color="#2563EB" />
              <Text style={s.headerFilterText}>Filter</Text>
              {activeFilterCount > 0 && (
                <View style={s.countBadge}>
                  <Text style={s.countBadgeText}>{activeFilterCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>

        <View style={s.locationSummary}>
          <Ionicons name="location-outline" size={16} color="#DBEAFE" />
          <Text style={s.locationSummaryText}>
            Showing professionals near you
          </Text>
          <Text style={s.distanceSummary}>{radius} km</Text>
        </View>
      </View>

      {!error && (
        <View style={s.activeFiltersRow}>
          <Text style={s.resultsLabel}>
            {loading ? "Finding professionals" : `${filtered.length} results`}
          </Text>
          <View style={s.activeTags}>
            {verifiedOnly && (
              <View style={s.activeTag}>
                <Ionicons name="shield-checkmark" size={12} color="#2563EB" />
                <Text style={s.activeTagText}>Verified</Text>
              </View>
            )}
            {minRating > 0 && (
              <View style={s.activeTag}>
                <Ionicons name="star" size={12} color="#2563EB" />
                <Text style={s.activeTagText}>{minRating}+ rating</Text>
              </View>
            )}
            {filtersOn && (
              <TouchableOpacity onPress={clearAppliedFilters}>
                <Text style={s.clearInline}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

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
              index={vendors.indexOf(item)}
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
                <TouchableOpacity
                  style={s.actionBtn}
                  onPress={clearAppliedFilters}
                >
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

      <Modal
        visible={filterVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterVisible(false)}
      >
        <View style={s.modalRoot}>
          <TouchableOpacity
            style={s.modalBackdrop}
            activeOpacity={1}
            onPress={() => setFilterVisible(false)}
          />

          <Animated.View
            style={[
              s.sheet,
              {
                transform: [{ translateY: panY }],
              },
            ]}
          >
            <View style={s.dragHandleArea} {...panResponder.panHandlers}>
              <View style={s.dragHandle} />
            </View>

            {/* Header */}
            <View style={s.sheetHeader}>
              <View>
                <Text style={s.sheetTitle}>Filters</Text>
                <Text style={s.sheetSubtitle}>
                  Customize your search results
                </Text>
              </View>

              <TouchableOpacity
                style={s.closeBtn}
                onPress={() => setFilterVisible(false)}
              >
                <Ionicons name="close" size={22} color="#334155" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={s.sheetContent}
            >
              {/* Distance */}
              <View style={s.filterCard}>
                <View style={s.sectionHeader}>
                  <View style={s.sectionIcon}>
                    <Ionicons name="location" size={19} color="#2563EB" />
                  </View>
                  <View>
                    <Text style={s.sectionTitle}>Distance</Text>
                    <Text style={s.sectionSubtitle}>
                      Select your preferred search radius
                    </Text>
                  </View>
                </View>

                <View style={s.optionsRow}>
                  {RADII.map((r) =>
                    renderOption(`${r} km`, draftRadius === r, () =>
                      setDraftRadius(r),
                    ),
                  )}
                </View>
              </View>

              {/* Verified providers */}
              <View style={s.filterCard}>
                <TouchableOpacity
                  style={[
                    s.verifiedOption,
                    draftVerified && s.verifiedOptionActive,
                  ]}
                  onPress={() => setDraftVerified((v) => !v)}
                  activeOpacity={0.8}
                >
                  <View style={s.verifiedIcon}>
                    <Ionicons
                      name="shield-checkmark"
                      size={21}
                      color="#2563EB"
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={s.verifiedTitle}>
                      Verified professionals only
                    </Text>
                    <Text style={s.verifiedSubtitle}>
                      Show providers with verified profiles
                    </Text>
                  </View>

                  <Ionicons
                    name={draftVerified ? "checkbox" : "square-outline"}
                    size={23}
                    color={draftVerified ? "#2563EB" : "#94A3B8"}
                  />
                </TouchableOpacity>
              </View>

              {/* Rating */}
              <View style={s.filterCard}>
                <View style={s.sectionHeader}>
                  <View style={s.sectionIcon}>
                    <Ionicons name="star" size={19} color="#F59E0B" />
                  </View>
                  <View>
                    <Text style={s.sectionTitle}>Minimum rating</Text>
                    <Text style={s.sectionSubtitle}>
                      Find highly rated professionals
                    </Text>
                  </View>
                </View>

                <View style={s.ratingOptions}>
                  {RATINGS.map((r) =>
                    renderOption(
                      r.label,
                      draftRating === r.value,
                      () => setDraftRating(r.value),
                      r.value > 0 ? "star" : null,
                    ),
                  )}
                </View>
              </View>
            </ScrollView>

            {/* Bottom actions */}
            <View style={s.sheetFooter}>
              <TouchableOpacity style={s.resetBtn} onPress={clearFilters}>
                <Ionicons name="refresh-outline" size={19} color="#475569" />
                <Text style={s.resetText}>Reset</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={s.applyBtn}
                onPress={applyFilters}
                activeOpacity={0.85}
              >
                <Text style={s.applyText}>Apply filters</Text>
                <Ionicons name="arrow-forward" size={19} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    backgroundColor: "#2563EB",
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 19,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  topRow: { flexDirection: "row", alignItems: "center" },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  title: { color: "#FFFFFF", fontSize: 23, fontWeight: "800" },
  subtitle: { color: "#DBEAFE", marginTop: 3, fontSize: 13 },
  headerFilterBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginLeft: 10,
  },
  headerFilterText: { color: "#2563EB", fontWeight: "700", marginLeft: 6 },
  countBadge: {
    backgroundColor: "#DBEAFE",
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },
  countBadgeText: { color: "#1D4ED8", fontSize: 11, fontWeight: "800" },
  locationSummary: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
  },
  locationSummaryText: {
    color: "#DBEAFE",
    fontSize: 12,
    flex: 1,
    marginLeft: 6,
  },
  distanceSummary: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    backgroundColor: "rgba(255,255,255,0.17)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  activeFiltersRow: {
    minHeight: 54,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  resultsLabel: { color: "#334155", fontSize: 13, fontWeight: "700" },
  activeTags: { flexDirection: "row", alignItems: "center" },
  activeTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    marginLeft: 6,
  },
  activeTagText: {
    color: "#1D4ED8",
    fontSize: 11,
    fontWeight: "700",
    marginLeft: 4,
  },
  clearInline: {
    color: "#2563EB",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 10,
  },
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
  actionText: { color: "#FFFFFF", fontWeight: "700" },

  modalRoot: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,23,42,0.55)",
  },
  sheet: {
    backgroundColor: "#F1F5F9",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: "85%",
    paddingTop: 10,
    paddingBottom: 25,
    overflow: "hidden",
  },
  dragHandle: {
    width: 48,
    height: 5,
    borderRadius: 10,
    backgroundColor: "#CBD5E1",
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  sheetTitleWrap: { flexDirection: "row", alignItems: "center" },
  sheetTitle: {
    fontSize: 23,
    fontWeight: "800",
    color: "#0F172A",
  },
  sheetSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  sheetContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 12,
  },
  filterCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 17,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 17,
  },
  sectionTitleWrap: { flexDirection: "row", alignItems: "center" },
  sectionIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1E293B",
  },

  sectionSubtitle: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 4,
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },
  ratingOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1.2,
    borderColor: "#E2E8F0",
    borderRadius: 13,
    paddingHorizontal: 15,
    paddingVertical: 12,
    minWidth: 75,
  },

  optionChipActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },

  optionText: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "700",
  },

  optionTextActive: {
    color: "#FFFFFF",
  },

  verifiedOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1.2,
    borderColor: "#E2E8F0",
    borderRadius: 15,
    padding: 13,
  },

  verifiedOptionActive: {
    backgroundColor: "#EFF6FF",
    borderColor: "#93C5FD",
  },
  verifiedIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  verifiedTitle: {
    color: "#1E293B",
    fontSize: 13,
    fontWeight: "700",
  },

  verifiedSubtitle: { color: "#94A3B8", fontSize: 11, marginTop: 3 },
  verifiedSubtitle: {
    color: "#94A3B8",
    fontSize: 11,
    marginTop: 4,
  },
  sheetFooter: {
    flexDirection: "row",
    paddingHorizontal: 18,
    paddingTop: 15,
    paddingBottom: 5,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },

  resetBtn: {
    flex: 0.85,
    borderWidth: 1.3,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    minHeight: 53,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  resetText: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 7,
  },
  applyBtn: {
    flex: 1.5,
    backgroundColor: "#2563EB",
    borderRadius: 15,
    minHeight: 53,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },

  applyText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  dragHandleArea: {
    width: "100%",
    height: 35,
    alignItems: "center",
    justifyContent: "center",
  },

  dragHandle: {
    width: 48,
    height: 5,
    borderRadius: 10,
    backgroundColor: "#94A3B8",
  },
});
