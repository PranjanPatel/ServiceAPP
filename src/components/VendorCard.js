import React, { useState } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Linking,
  Alert,
  useWindowDimensions,
} from "react-native";
import { Text } from "../components/AppText";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFavorites } from "../context/FavoritesContext";

const thumb = (url, w = 800) =>
  url?.includes("/upload/")
    ? url.replace("/upload/", `/upload/w_${w},q_auto,f_auto/`)
    : url;

const getWhatsAppNumber = (phone) => {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith("0"))
    return `91${digits.slice(1)}`;
  return digits;
};

const RANK = [
  { label: "Top match", bg: "#FFF4D6", color: "#A16207", icon: "trophy" },
  { label: "#2 Match", bg: "#F1F5F9", color: "#475569", icon: "medal" },
  { label: "#3 Match", bg: "#FFEDD5", color: "#9A3412", icon: "medal" },
];

const Stars = ({ value }) => (
  <View style={s.stars}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Ionicons
        key={n}
        name={n <= Math.round(Number(value || 0)) ? "star" : "star-outline"}
        size={11}
        color="#F5A623"
      />
    ))}
  </View>
);

export default function VendorCard({
  item = {},
  index = 0,
  onPress = () => {},
}) {
  const { width } = useWindowDimensions();

  const cardWidth = width - 40;
  const imageWidth = Math.min(116, Math.max(100, cardWidth * 0.3));

  const [page, setPage] = useState(0);
  const { isFavorite, toggle } = useFavorites();
  const isLiked = isFavorite(item?._id);

  const vendor = item || {};
  const photos = Array.isArray(vendor.photos) ? vendor.photos : [];
  const hasReviews = Number(vendor.reviewCount || 0) > 0;

  const rank = index < 3 && hasReviews ? RANK[index] : null;

  const isFeatured =
    vendor.plan?.type === "featured" &&
    vendor.plan?.status === "active" &&
    (!vendor.plan?.expiresAt ||
      new Date(vendor.plan.expiresAt).getTime() > Date.now());

  const call = () => {
    if (vendor.phone) {
      Linking.openURL(`tel:${vendor.phone}`).catch(() =>
        Alert.alert("Error", "Unable to open phone dialer."),
      );
    }
  };

  const openWhatsApp = async () => {
    const number = getWhatsAppNumber(vendor.phone);

    if (!number) {
      Alert.alert("WhatsApp unavailable", "No phone number available.");
      return;
    }

    try {
      await Linking.openURL(`https://wa.me/${number}`);
    } catch {
      Alert.alert("Error", "Could not open WhatsApp.");
    }
  };

  return (
    <View style={[s.card, { width: cardWidth }]}>
      {/* LIKE BUTTON - TOP RIGHT OF CARD */}
      <TouchableOpacity
        style={s.likeButton}
        onPress={() => toggle(vendor._id)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={
          isLiked ? "Remove from favourites" : "Add to favourites"
        }
      >
        <Ionicons
          name={isLiked ? "heart" : "heart-outline"}
          size={20}
          color={isLiked ? "#EF4444" : "#334155"}
        />
      </TouchableOpacity>

      {/* MAIN CONTENT */}
      <View style={s.mainRow}>
        {/* LEFT IMAGE */}
        <View style={[s.imageContainer, { width: imageWidth }]}>
          {photos.length > 0 ? (
            <FlatList
              data={photos}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(p, i) => p._id || p.url || String(i)}
              onMomentumScrollEnd={(e) =>
                setPage(Math.round(e.nativeEvent.contentOffset.x / imageWidth))
              }
              renderItem={({ item: p }) => (
                <TouchableOpacity
                  activeOpacity={0.95}
                  onPress={onPress}
                  style={{ width: imageWidth }}
                >
                  <Image
                    source={{ uri: thumb(p.url) }}
                    style={[s.coverImage, { width: imageWidth }]}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              )}
            />
          ) : (
            <View style={[s.noCover, { width: imageWidth }]}>
              <Ionicons name="image-outline" size={30} color="#94A3B8" />
              <Text style={s.noCoverText}>No image</Text>
            </View>
          )}

          {/* RANK BADGE */}
          {!isFeatured && (rank || !hasReviews) && (
            <View
              style={[s.rankBadge, { backgroundColor: rank?.bg || "#DBEAFE" }]}
            >
              <Ionicons
                name={rank?.icon || "sparkles"}
                size={10}
                color={rank?.color || "#1D4ED8"}
              />
              <Text style={[s.rankText, { color: rank?.color || "#1D4ED8" }]}>
                {rank?.label || "New"}
              </Text>
            </View>
          )}

          {/* FEATURED BADGE */}
          {isFeatured && (
            <View style={s.featuredBadge}>
              <Ionicons name="star" size={10} color="#92400E" />
              <Text style={s.featuredText}>FEATURED</Text>
            </View>
          )}

          {/* IMAGE COUNTER */}
          {photos.length > 1 && (
            <View style={s.counter}>
              <Text style={s.counterText}>
                {page + 1}/{photos.length}
              </Text>
            </View>
          )}
        </View>

        {/* RIGHT DETAILS */}
        <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={s.body}>
          {/* NAME + BLUE TICK */}
          <View style={s.nameRow}>
            {vendor.verified && (
              <MaterialCommunityIcons
                name="check-decagram"
                size={17}
                color="#2563EB"
                style={s.tick}
                accessibilityLabel="Verified business"
              />
            )}
            <Text style={s.name} numberOfLines={2}>
              {vendor.businessName || "Business name"}
            </Text>
          </View>

          {/* DISTANCE */}
          {vendor.distanceKm != null && (
            <View style={s.distance}>
              <Ionicons name="location" size={12} color="#2563EB" />
              <Text style={s.distanceText}>
                {Number(vendor.distanceKm).toFixed(1)} km away
              </Text>
            </View>
          )}

          {/* RATING */}
          <View style={s.ratingRow}>
            {hasReviews ? (
              <>
                <Ionicons name="star" size={13} color="#F5A623" />
                <Text style={s.ratingNum}>
                  {Number(vendor.avgRating || 0).toFixed(1)}
                </Text>
                <Stars value={vendor.avgRating} />
                <Text style={s.reviewCount}>({vendor.reviewCount})</Text>
              </>
            ) : (
              <Text style={s.noReviews}>No reviews yet</Text>
            )}
          </View>

          {/* DESCRIPTION */}
          {!!vendor.description && (
            <Text style={s.description} numberOfLines={2}>
              {vendor.description}
            </Text>
          )}

          {/* ADDRESS */}
          {!!vendor.address && (
            <View style={s.addressRow}>
              <Ionicons name="navigate-outline" size={12} color="#94A3B8" />
              <Text style={s.address} numberOfLines={2}>
                {vendor.address}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* IMAGE DOTS */}
      {photos.length > 1 && (
        <View style={s.dots}>
          {photos.map((_, i) => (
            <View key={i} style={[s.dot, page === i && s.dotActive]} />
          ))}
        </View>
      )}

      {/* ACTIONS */}
      <View style={s.divider} />

      <View style={s.actions}>
        {!!vendor.phone && (
          <>
            <TouchableOpacity
              style={s.callButton}
              onPress={call}
              activeOpacity={0.8}
            >
              <Ionicons name="call-outline" size={16} color="#059669" />
              <Text style={s.callText}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.whatsappButton}
              onPress={openWhatsApp}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Contact ${vendor.businessName} on WhatsApp`}
            >
              <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={s.detailsButton}
          onPress={onPress}
          activeOpacity={0.85}
        >
          <Text style={s.detailsText}>View details</Text>
          <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    marginBottom: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: "#E8EDF5",
    elevation: 3,
    shadowColor: "#0F172A",
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },

  mainRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },

  imageContainer: {
    height: 148,
    borderRadius: 13,
    overflow: "hidden",
    backgroundColor: "#F1F5F9",
  },

  coverImage: {
    height: 148,
    borderRadius: 13,
    backgroundColor: "#F1F5F9",
  },

  noCover: {
    height: 148,
    backgroundColor: "#F1F5F9",
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },

  noCoverText: {
    fontSize: 10,
    color: "#94A3B8",
    marginTop: 5,
  },

  rankBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 7,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },

  rankText: {
    fontSize: 9,
    fontWeight: "800",
    marginLeft: 3,
  },

  featuredBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 6,
    paddingVertical: 5,
    borderRadius: 7,
    zIndex: 2,
  },

  featuredText: {
    color: "#92400E",
    fontSize: 8,
    fontWeight: "800",
    marginLeft: 3,
    letterSpacing: 0.3,
  },

  likeButton: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 10,
  },

  counter: {
    position: "absolute",
    bottom: 6,
    right: 6,
    backgroundColor: "rgba(15,23,42,0.75)",
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 12,
  },

  counterText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
  },

  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 2,
  },

  dot: {
    width: 5,
    height: 5,
    borderRadius: 4,
    marginHorizontal: 2,
    backgroundColor: "#CBD5E1",
  },

  dotActive: {
    width: 15,
    backgroundColor: "#2563EB",
  },

  body: {
    flex: 1,
    minWidth: 0,
    paddingLeft: 12,
    paddingVertical: 3,
    justifyContent: "center",
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingRight: 34, // keeps the name and tick clear of the heart button
  },

  name: {
    flexShrink: 1,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: "800",
    color: "#172033",
  },

  tick: {
    marginLeft: 4,
    marginTop: 6,
    marginRight: 4,
  },

  distance: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 7,
    marginTop: 6,
  },

  distanceText: {
    color: "#2563EB",
    fontSize: 10,
    fontWeight: "700",
    marginLeft: 3,
  },

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 7,
  },

  ratingNum: {
    color: "#334155",
    fontSize: 11,
    fontWeight: "800",
    marginLeft: 3,
    marginRight: 4,
  },

  stars: {
    flexDirection: "row",
    gap: 1,
  },

  reviewCount: {
    color: "#94A3B8",
    fontSize: 10,
    marginLeft: 4,
  },

  noReviews: {
    fontSize: 10,
    color: "#64748B",
  },

  description: {
    fontSize: 11,
    color: "#64748B",
    lineHeight: 15,
    marginTop: 7,
  },

  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 6,
  },

  address: {
    flex: 1,
    color: "#94A3B8",
    fontSize: 10,
    lineHeight: 14,
    marginLeft: 4,
  },

  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginTop: 10,
  },

  actions: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 9,
    gap: 8,
  },

  callButton: {
    height: 36,
    paddingHorizontal: 13,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#D1FAE5",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  callText: {
    color: "#059669",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 5,
  },

  whatsappButton: {
    height: 36,
    width: 72,
    backgroundColor: "#25D366",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  detailsButton: {
    flex: 1,
    height: 36,
    backgroundColor: "#2563EB",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  detailsText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
});
