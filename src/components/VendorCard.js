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

// Cloudinary: serve a smaller, auto-optimised version
const thumb = (url, w = 800) =>
  url.includes("/upload/")
    ? url.replace("/upload/", `/upload/w_${w},q_auto,f_auto/`)
    : url;

// WhatsApp number formatter
const getWhatsAppNumber = (phone) => {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) {
    return `91${digits.slice(1)}`;
  }
  return digits;
};

const RANK = [
  { label: "Top match", bg: "#FDE68A", color: "#92400E", icon: "trophy" },
  { label: "#2", bg: "#E2E8F0", color: "#334155", icon: "medal" },
  { label: "#3", bg: "#FFEDD5", color: "#9A3412", icon: "medal" },
];

const Stars = ({ value }) => (
  <View style={{ flexDirection: "row" }}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Ionicons
        key={n}
        name={n <= Math.round(value) ? "star" : "star-outline"}
        size={14}
        color={n <= Math.round(value) ? "#F59E0B" : "#CBD5E1"}
        style={{ marginRight: 1 }}
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
  const imagePadding = 12;
  const imageWidth = cardWidth - imagePadding * 2;

  const [page, setPage] = useState(0);

  const vendor = item || {};
  const photos = Array.isArray(vendor.photos) ? vendor.photos : [];
  const hasReviews = Number(vendor.reviewCount || 0) > 0;
  const rank = index < 3 && hasReviews ? RANK[index] : null;

  const call = () => {
    if (vendor.phone) {
      Linking.openURL(`tel:${vendor.phone}`);
    }
  };

  const openWhatsApp = async () => {
    const whatsappNumber = getWhatsAppNumber(vendor.phone);

    if (!whatsappNumber) {
      Alert.alert(
        "WhatsApp unavailable",
        "This vendor has not added a phone number.",
      );
      return;
    }

    try {
      await Linking.openURL(`https://wa.me/${whatsappNumber}`);
    } catch (e) {
      Alert.alert(
        "Could not open WhatsApp",
        "Please make sure WhatsApp is installed or try again.",
      );
    }
  };
  const isFeatured =
    vendor.plan?.type === "featured" &&
    vendor.plan?.status === "active" &&
    (!vendor.plan?.expiresAt ||
      new Date(vendor.plan.expiresAt).getTime() > Date.now());
  return (
    <View style={s.card}>
      {/* Photo carousel */}
      <View style={s.imageContainer}>
        {photos.length > 0 ? (
          <FlatList
            data={photos}
            keyExtractor={(p, i) => p._id || p.url || String(i)}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) =>
              setPage(Math.round(e.nativeEvent.contentOffset.x / imageWidth))
            }
            scrollEventThrottle={16}
            renderItem={({ item: p }) => (
              <TouchableOpacity
                activeOpacity={0.95}
                onPress={onPress}
                style={{ width: imageWidth }}
              >
                <Image
                  source={{ uri: thumb(p.url) }}
                  style={s.coverImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            )}
          />
        ) : (
          <View style={[s.noCover, { width: imageWidth }]}>
            <Ionicons name="image-outline" size={40} color="#CBD5E1" />
          </View>
        )}

        {rank && (
          <View style={[s.badge, { backgroundColor: rank.bg }]}>
            <Ionicons name={rank.icon} size={12} color={rank.color} />
            <Text style={[s.badgeText, { color: rank.color }]}>
              {rank.label}
            </Text>
          </View>
        )}

        {!hasReviews && (
          <View style={[s.badge, { backgroundColor: "#DBEAFE" }]}>
            <Ionicons name="sparkles" size={12} color="#1D4ED8" />
            <Text style={[s.badgeText, { color: "#1D4ED8" }]}>New</Text>
          </View>
        )}

        {photos.length > 1 && (
          <>
            <View style={s.counter}>
              <Ionicons name="images" size={12} color="#fff" />
              <Text style={s.counterText}>
                {page + 1}/{photos.length}
              </Text>
            </View>

            <View style={s.dots}>
              {photos.map((_, i) => (
                <View key={i} style={[s.dot, i === page && s.dotActive]} />
              ))}
            </View>
          </>
        )}
      </View>

      {/* Details */}
      <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={s.body}>
        <View style={s.titleRow}>
          <Text style={s.name} numberOfLines={1}>
            {vendor.businessName}
          </Text>

          <View style={s.distChip}>
            <Ionicons name="location" size={12} color="#2563EB" />
            <Text style={s.distText}>
              {Number(vendor.distanceKm || 0).toFixed(1)} km
            </Text>
          </View>
        </View>

        {isFeatured && (
          <View style={s.featuredBadge}>
            <Ionicons name="star" size={12} color="#92400E" />
            <Text style={s.featuredText}>FEATURED</Text>
          </View>
        )}

        <View style={s.ratingRow}>
          {hasReviews ? (
            <>
              <Text style={s.ratingNum}>
                {Number(vendor.avgRating || 0).toFixed(1)}
              </Text>
              <Stars value={vendor.avgRating || 0} />
              <Text style={s.reviewCount}>
                ({vendor.reviewCount} review
                {vendor.reviewCount > 1 ? "s" : ""})
              </Text>
            </>
          ) : (
            <Text style={s.reviewCount}>
              No reviews yet. Be the first to review
            </Text>
          )}
        </View>

        {!!vendor.description && (
          <Text style={s.desc} numberOfLines={2}>
            {vendor.description}
          </Text>
        )}

        {!!vendor.address && (
          <View style={s.addrRow}>
            <Ionicons name="navigate-outline" size={14} color="#94A3B8" />
            <Text style={s.addr} numberOfLines={1}>
              {vendor.address}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Actions */}
      <View style={s.actions}>
        {!!vendor.phone && (
          <>
            <TouchableOpacity
              style={s.callBtn}
              onPress={call}
              activeOpacity={0.8}
            >
              <Ionicons name="call" size={16} color="#059669" />
              <Text style={s.callText}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.whatsappBtn}
              onPress={openWhatsApp}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Contact ${vendor.businessName} on WhatsApp`}
            >
              <Ionicons name="logo-whatsapp" size={21} color="#FFFFFF" />
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={s.detailBtn}
          onPress={onPress}
          activeOpacity={0.8}
        >
          <Text style={s.detailText}>View details</Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginBottom: 18,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },

  // Image spacing
  imageContainer: {
    padding: 12,
  },

  coverImage: {
    width: "100%",
    height: 190,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
  },

  noCover: {
    height: 190,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
  },

  badge: {
    position: "absolute",
    top: 20,
    left: 20,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },

  badgeText: {
    fontWeight: "800",
    fontSize: 11,
    marginLeft: 5,
  },

  counter: {
    position: "absolute",
    top: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 9,
  },

  counterText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 5,
  },

  dots: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.55)",
    marginHorizontal: 3,
  },

  dotActive: {
    backgroundColor: "#fff",
    width: 16,
  },

  body: {
    paddingHorizontal: 16,
    paddingTop: 4,
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
    color: "#0F172A",
    marginRight: 10,
  },

  distChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 9,
  },

  distText: {
    color: "#1D4ED8",
    fontWeight: "700",
    fontSize: 12,
    marginLeft: 4,
  },

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  ratingNum: {
    fontWeight: "800",
    color: "#92400E",
    marginRight: 6,
    fontSize: 15,
  },

  reviewCount: {
    color: "#94A3B8",
    fontSize: 13,
    marginLeft: 6,
  },

  desc: {
    color: "#64748B",
    marginTop: 10,
    lineHeight: 20,
  },

  addrRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },

  addr: {
    flex: 1,
    color: "#94A3B8",
    fontSize: 12,
    marginLeft: 5,
  },

  actions: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: 14,
  },

  callBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ECFDF5",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginRight: 10,
  },

  callText: {
    color: "#059669",
    fontWeight: "700",
    marginLeft: 6,
  },

  whatsappBtn: {
    width: 46,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#25D366",
    borderRadius: 12,
    marginRight: 10,
  },

  detailBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 12,
  },

  detailText: {
    color: "#fff",
    fontWeight: "700",
    marginRight: 6,
  },
  featuredBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#FEF3C7",
    borderColor: "#FDE68A",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 9,
    paddingVertical: 5,
    marginTop: 7,
  },

  featuredText: {
    color: "#92400E",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
    marginLeft: 4,
  },
});
