import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Linking,
  Image,
  Modal,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../api";
import { useAuth } from "../../context/AuthContext";

const thumb = (url, w = 1000) =>
  url.includes("/upload/")
    ? url.replace("/upload/", `/upload/w_${w},q_auto,f_auto/`)
    : url;

const LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

const Stars = ({ value, onChange, size = 16, gap = 1 }) => (
  <View style={{ flexDirection: "row" }}>
    {[1, 2, 3, 4, 5].map((n) => (
      <TouchableOpacity
        key={n}
        disabled={!onChange}
        onPress={() => onChange?.(n)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={n <= value ? "star" : "star-outline"}
          size={size}
          color={n <= value ? "#F59E0B" : "#CBD5E1"}
          style={{ marginRight: gap }}
        />
      </TouchableOpacity>
    ))}
  </View>
);

export default function VendorDetailScreen({ route, navigation }) {
  const { id, distanceKm } = route.params;
  const { width } = useWindowDimensions();
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [editingId, setEditingId] = useState(null); // id of the review being edited
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState(0);
  const [viewer, setViewer] = useState(null);
  const [successVisible, setSuccessVisible] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await api(`/vendors/${id}`));
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const startEdit = (r) => {
    setEditingId(r._id);
    setRating(r.rating);
    setComment(r.comment || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setRating(0);
    setComment("");
  };

  const submitReview = async () => {
    if (!rating) {
      return Alert.alert("Select a star rating");
    }

    try {
      setBusy(true);

      const body = JSON.stringify({
        vendorId: id,
        rating,
        comment: comment.trim(),
      });

      console.log("Editing review ID:", editingId);
      console.log("Submitting review body:", body);

      if (editingId) {
        const response = await api(`/reviews/${editingId}`, {
          method: "PUT",
          body,
        });

        console.log("Update response:", response);

        setSuccessVisible(true);
      } else {
        const response = await api("/reviews", {
          method: "POST",
          body,
        });

        console.log("Create response:", response);

        setSuccessVisible(true);
      }

      cancelEdit();
      await load();
    } catch (e) {
      console.log("Review submission error:", e);
      console.log("Error message:", e.message);

      Alert.alert("Could not save review", e.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  if (!data || !data.vendor) {
    return (
      <View style={s.loading}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  const vendor = data.vendor;
  // always an array, so .find / .filter / .map never crash
  const reviews = Array.isArray(data.reviews) ? data.reviews : [];
  const photos = vendor.photos || [];
  const hasReviews = vendor.reviewCount > 0;
  const [lng, lat] = vendor.location?.coordinates || [];

  // has the logged-in user already reviewed this vendor?
  const myReview = reviews.find(
    (r) => String(r.user?._id) === String(user?.id),
  );

  // show the user's own review first
  const sortedReviews = myReview
    ? [myReview, ...reviews.filter((r) => r._id !== myReview._id)]
    : reviews;

  // how many reviews per star (5 -> 1)
  const counts = [5, 4, 3, 2, 1].map(
    (n) => reviews.filter((r) => r.rating === n).length,
  );

  const openMaps = () => {
    if (lat == null) return;
    Linking.openURL(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
    );
  };

  const openWhatsApp = () => {
    if (!vendor.phone) return;

    // WhatsApp requires the country code. Assume India (+91) for 10-digit numbers.
    let phone = String(vendor.phone).replace(/\D/g, "");
    if (phone.length === 10) phone = `91${phone}`;
    else if (phone.startsWith("0")) phone = phone.slice(1);

    Linking.openURL(`https://wa.me/${phone}`);
  };

  // star rating + comment + buttons (used for new review and for editing)
  const renderForm = (isEdit) => (
    <View>
      <View style={{ alignItems: "center" }}>
        <Stars value={rating} onChange={setRating} size={38} gap={6} />
        <Text style={[s.rateLabel, !rating && { color: "#94A3B8" }]}>
          {rating ? LABELS[rating] : "Tap a star to rate"}
        </Text>
      </View>
      <TextInput
        style={s.input}
        placeholder="Share your experience (optional)"
        placeholderTextColor="#94A3B8"
        multiline
        value={comment}
        onChangeText={setComment}
      />
      <View style={s.formActions}>
        {isEdit && (
          <TouchableOpacity
            style={s.cancelBtn}
            onPress={cancelEdit}
            disabled={busy}
            activeOpacity={0.85}
          >
            <Text style={s.cancelText}>Cancel</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[s.submit, { flex: 1 }, busy && { opacity: 0.7 }]}
          onPress={submitReview}
          disabled={busy}
          activeOpacity={0.85}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={s.submitText}>
                {isEdit ? "Save changes" : "Submit review"}
              </Text>
              <Ionicons
                name={isEdit ? "checkmark" : "send"}
                size={16}
                color="#fff"
              />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#efeff0" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Photo carousel */}
        <View>
          {photos.length > 0 ? (
            <FlatList
              data={photos}
              keyExtractor={(p) => p._id || p.url}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              onScroll={(e) =>
                setPage(Math.round(e.nativeEvent.contentOffset.x / width))
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.95}
                  onPress={() => setViewer(item.url)}
                >
                  <View
                    style={{ width, height: 290, backgroundColor: "#CBD5E1" }}
                  >
                    <Image
                      source={{ uri: thumb(item.url) }}
                      style={{ width, height: 290 }}
                      resizeMode="cover"
                    />
                    <View style={s.shade} pointerEvents="none" />
                  </View>
                </TouchableOpacity>
              )}
            />
          ) : (
            <View style={[s.noPhoto, { width }]}>
              <Ionicons name="image-outline" size={56} color="#94A3B8" />
            </View>
          )}

          <TouchableOpacity
            style={s.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={10}
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>

          {photos.length > 1 && (
            <>
              <View style={s.counter}>
                <Ionicons name="images" size={12} color="#fff" />
                <Text style={s.counterText}>
                  {page + 1}/{photos.length}
                </Text>
              </View>
              <View style={s.dots} pointerEvents="none">
                <View style={s.dotsPill}>
                  {photos.map((_, i) => (
                    <View key={i} style={[s.dot, i === page && s.dotActive]} />
                  ))}
                </View>
              </View>
            </>
          )}
        </View>

        {/* Main card */}
        <View style={s.card}>
          <View style={s.catChip}>
            <Text style={s.catText}>{vendor.category.replace(/-/g, " ")}</Text>
          </View>
          <Text style={s.name}>{vendor.businessName}</Text>

          <View style={s.metaRow}>
            <View
              style={[
                s.pill,
                { backgroundColor: hasReviews ? "#FFFBEB" : "#F1F5F9" },
              ]}
            >
              <Ionicons
                name="star"
                size={14}
                color={hasReviews ? "#F59E0B" : "#94A3B8"}
              />
              <Text
                style={[
                  s.pillText,
                  { color: hasReviews ? "#92400E" : "#64748B" },
                ]}
              >
                {hasReviews
                  ? `${vendor.avgRating.toFixed(1)} (${vendor.reviewCount})`
                  : "New"}
              </Text>
            </View>
            {distanceKm != null && (
              <View style={[s.pill, { backgroundColor: "#EFF6FF" }]}>
                <Ionicons name="location" size={14} color="#2563EB" />
                <Text style={[s.pillText, { color: "#1D4ED8" }]}>
                  {Number(distanceKm).toFixed(1)} km away
                </Text>
              </View>
            )}
          </View>

          <View style={s.actions}>
            {!!vendor.phone && (
              <>
                <TouchableOpacity
                  style={s.callBtn}
                  activeOpacity={0.85}
                  onPress={() => Linking.openURL(`tel:${vendor.phone}`)}
                >
                  <Ionicons name="call" size={17} color="#fff" />
                  <Text style={s.callText}>Call</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.whatsappBtn}
                  activeOpacity={0.85}
                  onPress={openWhatsApp}
                >
                  <Ionicons name="logo-whatsapp" size={19} color="#fff" />
                  <Text style={s.callText}>WhatsApp</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity
              style={s.dirBtn}
              activeOpacity={0.85}
              onPress={openMaps}
            >
              <Ionicons name="navigate" size={17} color="#2563EB" />
              <Text style={s.dirText}>Directions</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* About */}
        <View style={s.block}>
          <Text style={s.sectionTitle}>About</Text>
          <View style={s.box}>
            {!!vendor.description ? (
              <Text style={s.desc}>{vendor.description}</Text>
            ) : (
              <Text style={s.muted}>No description added yet.</Text>
            )}
            {!!vendor.address && (
              <View style={s.infoRow}>
                <View style={s.infoIcon}>
                  <Ionicons name="location-outline" size={18} color="#2563EB" />
                </View>
                <Text style={s.infoText}>{vendor.address}</Text>
              </View>
            )}
            {!!vendor.phone && (
              <View style={s.infoRow}>
                <View style={s.infoIcon}>
                  <Ionicons name="call-outline" size={18} color="#2563EB" />
                </View>
                <Text style={s.infoText}>{vendor.phone}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Rating summary */}
        {hasReviews && reviews.length > 0 && (
          <View style={s.block}>
            <Text style={s.sectionTitle}>Ratings</Text>
            <View
              style={[s.box, { flexDirection: "row", alignItems: "center" }]}
            >
              <View style={s.bigRating}>
                <Text style={s.bigNum}>{vendor.avgRating.toFixed(1)}</Text>
                <Stars value={Math.round(vendor.avgRating)} size={14} />
                <Text style={s.bigCount}>
                  {vendor.reviewCount} review{vendor.reviewCount > 1 ? "s" : ""}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                {[5, 4, 3, 2, 1].map((n, i) => (
                  <View key={n} style={s.barRow}>
                    <Text style={s.barLabel}>{n}</Text>
                    <View style={s.barTrack}>
                      <View
                        style={[
                          s.barFill,
                          { width: `${(counts[i] / reviews.length) * 100}%` },
                        ]}
                      />
                    </View>
                    <Text style={s.barCount}>{counts[i]}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Write a review (only if the user has not reviewed yet) */}
        {!myReview && (
          <View style={s.block}>
            <Text style={s.sectionTitle}>Rate this pro</Text>
            <View style={s.box}>{renderForm(false)}</View>
          </View>
        )}

        {/* Reviews */}
        <View style={s.block}>
          <Text style={s.sectionTitle}>Reviews ({reviews.length})</Text>
          {reviews.length === 0 ? (
            <View
              style={[s.box, { alignItems: "center", paddingVertical: 28 }]}
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={36}
                color="#CBD5E1"
              />
              <Text style={[s.muted, { marginTop: 8 }]}>
                No reviews yet. Be the first!
              </Text>
            </View>
          ) : (
            sortedReviews.map((r) => {
              const mine = r._id === myReview?._id;

              // the user's own review turns into the edit form
              if (mine && editingId === r._id) {
                return (
                  <View
                    key={r._id}
                    style={[s.box, s.editBox, { marginBottom: 12 }]}
                  >
                    <Text style={s.editTitle}>Edit your review</Text>
                    {renderForm(true)}
                  </View>
                );
              }

              const nm = r.user?.name || "User";
              return (
                <View key={r._id} style={[s.box, { marginBottom: 12 }]}>
                  <View style={s.reviewTop}>
                    <View style={s.avatar}>
                      <Text style={s.avatarText}>
                        {nm
                          .split(" ")
                          .map((p) => p[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <Text style={s.reviewName}>{nm}</Text>
                        {mine && (
                          <View style={s.youBadge}>
                            <Text style={s.youText}>Your review</Text>
                          </View>
                        )}
                      </View>
                      <Stars value={r.rating} size={13} />
                    </View>
                    <Text style={s.date}>
                      {new Date(r.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  {!!r.comment && <Text style={s.reviewText}>{r.comment}</Text>}

                  {mine && (
                    <TouchableOpacity
                      style={s.editBtn}
                      onPress={() => startEdit(r)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="create-outline"
                        size={16}
                        color="#2563EB"
                      />
                      <Text style={s.editBtnText}>Edit review</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Full-screen photo */}
      <Modal
        visible={!!viewer}
        transparent
        animationType="fade"
        onRequestClose={() => setViewer(null)}
      >
        <TouchableOpacity
          style={s.modalBg}
          activeOpacity={1}
          onPress={() => setViewer(null)}
        >
          {viewer && (
            <Image
              source={{ uri: viewer }}
              style={s.fullImg}
              resizeMode="contain"
            />
          )}
          <View style={s.closeBtn}>
            <Ionicons name="close" size={24} color="#fff" />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Review Updated Success Modal - Option 6 */}
      <Modal
        visible={successVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setSuccessVisible(false)}
      >
        <View style={s.successOverlay}>
          <View style={s.successModal}>
            <TouchableOpacity
              style={s.successClose}
              onPress={() => setSuccessVisible(false)}
              accessibilityRole="button"
              accessibilityLabel="Close confirmation"
            >
              <Ionicons name="close" size={22} color="#94A3B8" />
            </TouchableOpacity>

            <View style={s.successIconContainer}>
              <Ionicons name="checkmark" size={38} color="#1D4ED8" />
            </View>

            <Ionicons
              name="sparkles"
              size={20}
              color="#FBBF24"
              style={s.successStarLeft}
            />
            <Ionicons
              name="sparkles"
              size={20}
              color="#FBBF24"
              style={s.successStarRight}
            />

            <Text style={s.successTitle}>
              {editingId
                ? "Your review has been updated!"
                : "Your review has been submitted!"}
            </Text>

            <Text style={s.successSubtitle}>
              Thank you for sharing your experience.
            </Text>

            <TouchableOpacity
              style={s.successButton}
              activeOpacity={0.85}
              onPress={() => setSuccessVisible(false)}
              accessibilityRole="button"
            >
              <Text style={s.successButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#efeff0",
  },

  noPhoto: {
    height: 290,
    backgroundColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  shade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 90,
    backgroundColor: "rgba(15,23,42,0.22)",
  },
  backBtn: {
    position: "absolute",
    top: 52,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  counter: {
    position: "absolute",
    top: 58,
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
    bottom: 44,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  dotsPill: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 12,
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.55)",
    marginHorizontal: 3,
  },
  dotActive: { backgroundColor: "#fff", width: 16 },

  card: {
    backgroundColor: "#fff",
    marginTop: -28,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    elevation: 10,
    shadowColor: "#0F172A",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
  },
  catChip: {
    alignSelf: "flex-start",
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  catText: {
    color: "#2563EB",
    fontWeight: "700",
    fontSize: 12,
    textTransform: "capitalize",
  },
  name: { fontSize: 26, fontWeight: "800", color: "#0F172A" },
  metaRow: { flexDirection: "row", marginTop: 12 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 11,
    marginRight: 8,
  },
  pillText: { fontSize: 13, fontWeight: "700", marginLeft: 5 },

  actions: { flexDirection: "row", marginTop: 20 },
  callBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#16A34A",
    borderRadius: 14,
    paddingVertical: 14,
    marginRight: 8,
  },
  whatsappBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#25D366",
    borderRadius: 14,
    paddingVertical: 14,
    marginRight: 8,
  },
  callText: { color: "#fff", fontWeight: "700", fontSize: 13, marginLeft: 5 },
  dirBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
    borderRadius: 14,
    paddingVertical: 14,
  },
  dirText: { color: "#2563EB", fontWeight: "700", fontSize: 15, marginLeft: 8 },

  block: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 12,
  },
  box: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  desc: { color: "#334155", fontSize: 15, lineHeight: 23 },
  muted: { color: "#94A3B8" },
  infoRow: { flexDirection: "row", alignItems: "center", marginTop: 14 },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  infoText: { flex: 1, color: "#334155", fontSize: 14 },

  bigRating: {
    alignItems: "center",
    paddingRight: 18,
    marginRight: 18,
    borderRightWidth: 1,
    borderRightColor: "#F1F5F9",
  },
  bigNum: { fontSize: 40, fontWeight: "800", color: "#0F172A" },
  bigCount: { color: "#94A3B8", fontSize: 12, marginTop: 4 },
  barRow: { flexDirection: "row", alignItems: "center", marginVertical: 3 },
  barLabel: { width: 12, color: "#64748B", fontSize: 12, fontWeight: "600" },
  barTrack: {
    flex: 1,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#F1F5F9",
    marginHorizontal: 8,
    overflow: "hidden",
  },
  barFill: { height: "100%", backgroundColor: "#F59E0B", borderRadius: 4 },
  barCount: { width: 18, textAlign: "right", color: "#94A3B8", fontSize: 12 },

  rateLabel: {
    marginTop: 8,
    fontWeight: "700",
    color: "#D97706",
    fontSize: 15,
  },
  input: {
    backgroundColor: "#efeff0",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
    minHeight: 90,
    textAlignVertical: "top",
    fontSize: 15,
    color: "#0F172A",
  },
  formActions: { flexDirection: "row", marginTop: 14 },
  submit: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563EB",
    borderRadius: 14,
    paddingVertical: 14,
  },
  submitText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
    marginRight: 8,
  },
  cancelBtn: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginRight: 10,
  },
  cancelText: { color: "#475569", fontWeight: "700", fontSize: 15 },

  editBox: { borderWidth: 1.5, borderColor: "#BFDBFE" },
  editTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 14,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#EFF6FF",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 14,
  },
  editBtnText: {
    color: "#2563EB",
    fontWeight: "700",
    fontSize: 13,
    marginLeft: 6,
  },

  reviewTop: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: { color: "#2563EB", fontWeight: "800" },
  reviewName: { fontWeight: "700", color: "#0F172A", marginBottom: 3 },
  youBadge: {
    backgroundColor: "#DBEAFE",
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 8,
    marginLeft: 8,
    marginBottom: 3,
  },
  youText: { color: "#1D4ED8", fontSize: 11, fontWeight: "700" },
  date: { color: "#94A3B8", fontSize: 12 },
  reviewText: { color: "#475569", marginTop: 12, lineHeight: 21 },

  // Soft & Friendly review-update confirmation modal
  successOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 25,
  },
  successModal: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    paddingHorizontal: 25,
    paddingTop: 38,
    paddingBottom: 25,
    alignItems: "center",
    elevation: 15,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  successClose: {
    position: "absolute",
    top: 16,
    right: 16,
    padding: 5,
  },
  successIconContainer: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  successStarLeft: {
    position: "absolute",
    top: 47,
    left: "20%",
  },
  successStarRight: {
    position: "absolute",
    top: 47,
    right: "20%",
  },
  successTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 12,
  },
  successSubtitle: {
    fontSize: 16,
    color: "#334155",
    textAlign: "center",
    marginBottom: 28,
  },
  successButton: {
    width: "100%",
    backgroundColor: "#BFDBFE",
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  successButtonText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1D4ED8",
  },

  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
  },
  fullImg: { width: "100%", height: "80%" },
  closeBtn: {
    position: "absolute",
    top: 56,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
});
