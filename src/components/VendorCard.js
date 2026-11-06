import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Linking,
  Alert,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
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
        size={13}
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

  // Assumes parent list has 20px horizontal padding
  const cardWidth = width - 40;
  const imageWidth = cardWidth - 20;

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
    <View style={s.card}>
      {/* IMAGE */}
      <View style={s.imageContainer}>
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
            <Ionicons name="image-outline" size={42} color="#CBD5E1" />
            <Text style={s.noCoverText}>No images available</Text>
          </View>
        )}

        {!isFeatured && (rank || !hasReviews) && (
          <View
            style={[s.rankBadge, { backgroundColor: rank?.bg || "#DBEAFE" }]}
          >
            <Ionicons
              name={rank?.icon || "sparkles"}
              size={13}
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
            <Ionicons name="star" size={12} color="#92400E" />
            <Text style={s.featuredText}>FEATURED</Text>
          </View>
        )}

        {/* LIKE BUTTON */}
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
            size={23}
            color={isLiked ? "#EF4444" : "#334155"}
          />
        </TouchableOpacity>

        {/* IMAGE COUNTER */}
        {photos.length > 1 && (
          <>
            <View style={s.counter}>
              <Ionicons name="images-outline" size={12} color="#fff" />
              <Text style={s.counterText}>
                {page + 1}/{photos.length}
              </Text>
            </View>

            <View style={s.dots}>
              {photos.map((_, i) => (
                <View key={i} style={[s.dot, page === i && s.dotActive]} />
              ))}
            </View>
          </>
        )}
      </View>

      {/* DETAILS */}
      <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={s.body}>
        <View style={s.titleRow}>
          <Text style={s.name} numberOfLines={1}>
            {vendor.businessName || "Business name"}
          </Text>

          {vendor.distanceKm != null && (
            <View style={s.distance}>
              <Ionicons name="location" size={13} color="#2563EB" />
              <Text style={s.distanceText}>
                {Number(vendor.distanceKm).toFixed(1)} km
              </Text>
            </View>
          )}
        </View>

        {/* RATING */}
        <View style={s.ratingRow}>
          {hasReviews ? (
            <>
              <View style={s.ratingValue}>
                <Ionicons name="star" size={14} color="#F5A623" />
                <Text style={s.ratingNum}>
                  {Number(vendor.avgRating || 0).toFixed(1)}
                </Text>
              </View>

              <Stars value={vendor.avgRating} />

              <Text style={s.reviewCount}>({vendor.reviewCount} reviews)</Text>
            </>
          ) : (
            <Text style={s.noReviews}>
              No reviews yet · Be the first to review
            </Text>
          )}
        </View>

        {!!vendor.description && (
          <Text style={s.description} numberOfLines={2}>
            {vendor.description}
          </Text>
        )}

        {!!vendor.address && (
          <View style={s.addressRow}>
            <Ionicons name="navigate-outline" size={15} color="#94A3B8" />
            <Text style={s.address} numberOfLines={1}>
              {vendor.address}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* DIVIDER */}
      <View style={s.divider} />

      {/* ACTIONS */}
      <View style={s.actions}>
        {!!vendor.phone && (
          <>
            <TouchableOpacity
              style={s.callButton}
              onPress={call}
              activeOpacity={0.8}
            >
              <Ionicons name="call-outline" size={17} color="#059669" />
              <Text style={s.callText}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.whatsappButton}
              onPress={openWhatsApp}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Contact ${vendor.businessName} on WhatsApp`}
            >
              <Ionicons name="logo-whatsapp" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={s.detailsButton}
          onPress={onPress}
          activeOpacity={0.85}
        >
          <Text style={s.detailsText}>View details</Text>
          <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginBottom: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#EEF1F5",
    elevation: 3,
    shadowColor: "#0F172A",
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },

  imageContainer: {
    padding: 10,
  },

  coverImage: {
    height: 205,
    borderRadius: 15,
    backgroundColor: "#F1F5F9",
  },

  noCover: {
    height: 205,
    backgroundColor: "#F8FAFC",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },

  noCoverText: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 8,
  },

  rankBadge: {
    position: "absolute",
    top: 20,
    left: 20,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  rankText: {
    fontSize: 11,
    fontWeight: "800",
    marginLeft: 5,
  },

  featuredBadge: {
    position: "absolute",
    top: 20,
    left: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    zIndex: 2,
  },

  featuredText: {
    color: "#92400E",
    fontSize: 10,
    fontWeight: "800",
    marginLeft: 4,
    letterSpacing: 0.5,
  },

  counter: {
    position: "absolute",
    top: 65,
    right: 20,
    backgroundColor: "rgba(15,23,42,0.7)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 20,
  },

  counterText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    marginLeft: 5,
  },

  dots: {
    position: "absolute",
    bottom: 18,
    right: 20,
    flexDirection: "row",
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 4,
    marginHorizontal: 3,
    backgroundColor: "rgba(255,255,255,0.65)",
  },

  dotActive: {
    width: 18,
    backgroundColor: "#FFFFFF",
  },

  body: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 15,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  name: {
    flex: 1,
    fontSize: 19,
    fontWeight: "800",
    color: "#172033",
    marginRight: 8,
  },

  distance: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
  },

  distanceText: {
    color: "#2563EB",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 4,
  },

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },

  ratingValue: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 6,
  },

  ratingNum: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "800",
    marginLeft: 3,
  },

  stars: {
    flexDirection: "row",
    gap: 1,
  },

  reviewCount: {
    color: "#94A3B8",
    fontSize: 12,
    marginLeft: 7,
  },

  noReviews: {
    fontSize: 12,
    color: "#64748B",
  },

  description: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 20,
    marginTop: 11,
  },

  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },

  address: {
    flex: 1,
    color: "#64748B",
    fontSize: 12,
    marginLeft: 6,
  },

  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginHorizontal: 16,
  },

  actions: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 9,
  },

  callButton: {
    height: 44,
    paddingHorizontal: 15,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#D1FAE5",
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  callText: {
    color: "#059669",
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 6,
  },

  whatsappButton: {
    height: 44,
    width: 44,
    backgroundColor: "#25D366",
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  detailsButton: {
    flex: 1,
    height: 44,
    backgroundColor: "#2563EB",
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  detailsText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  likeButton: {
    position: "absolute",
    top: 20,
    right: 20,
    width: 38,
    height: 38,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 5,
  },
});
