import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PLANS } from "../../plans";

export default function PlansScreen({ route, navigation }) {
  const vendor = route.params?.vendor;
  const current = vendor?.plan || { type: "free", status: "active" };
  const [selected, setSelected] = useState(
    current.type === "free" ? "basic" : current.type,
  );

  const sel = PLANS.find((p) => p.key === selected);
  const isCurrentActive =
    current.type === selected && current.status === "active";
  const canPay = sel.price > 0;

  return (
    <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <Text style={s.title}>Choose a plan</Text>
        <Text style={s.sub}>
          Paid plans last 30 days and rank you higher in customer searches.
        </Text>

        {PLANS.map((p) => {
          const active = selected === p.key;
          const isCurrent =
            current.type === p.key && current.status === "active";
          return (
            <TouchableOpacity
              key={p.key}
              activeOpacity={0.85}
              onPress={() => setSelected(p.key)}
              style={[
                s.card,
                active && { borderColor: p.color, backgroundColor: p.bg },
              ]}
            >
              <View style={s.top}>
                <Ionicons
                  name={active ? "radio-button-on" : "radio-button-off"}
                  size={22}
                  color={active ? p.color : "#CBD5E1"}
                />
                <Text style={s.name}>{p.name}</Text>
                {isCurrent && (
                  <View style={s.cur}>
                    <Text style={s.curText}>Current</Text>
                  </View>
                )}
                <Text style={[s.price, { color: p.color }]}>
                  {p.price === 0 ? "Free" : `₹${p.price}`}
                  {p.price > 0 && <Text style={s.per}>/mo</Text>}
                </Text>
              </View>
              {p.features.map((f) => (
                <View key={f} style={s.feat}>
                  <Ionicons name="checkmark-circle" size={16} color={p.color} />
                  <Text style={s.featText}>{f}</Text>
                </View>
              ))}
            </TouchableOpacity>
          );
        })}

        {current.type !== "free" &&
          current.expiresAt &&
          current.status === "active" && (
            <Text style={s.note}>
              Your {current.type} plan is active until{" "}
              {new Date(current.expiresAt).toLocaleDateString()}. Paying again
              for the same plan extends it by 30 days.
            </Text>
          )}
      </ScrollView>

      <View style={s.bar}>
        <TouchableOpacity
          style={[s.payBtn, !canPay && { backgroundColor: "#CBD5E1" }]}
          disabled={!canPay}
          activeOpacity={0.85}
          onPress={() => navigation.navigate("Payment", { plan: selected })}
        >
          <Ionicons name="lock-closed" size={18} color="#fff" />
          <Text style={s.payText}>
            {!canPay
              ? "Free plan needs no payment"
              : isCurrentActive
                ? `Renew for ₹${sel.price}`
                : `Pay ₹${sel.price} securely`}
          </Text>
        </TouchableOpacity>
        <Text style={s.secure}>Payments are processed by Razorpay</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 24, fontWeight: "800", color: "#0F172A" },
  sub: { color: "#64748B", marginTop: 4, marginBottom: 8 },
  card: {
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
  },
  top: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  name: { fontSize: 16, fontWeight: "800", color: "#0F172A", marginLeft: 10 },
  cur: {
    backgroundColor: "#DCFCE7",
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 8,
    marginLeft: 8,
  },
  curText: { color: "#166534", fontSize: 10, fontWeight: "800" },
  price: { marginLeft: "auto", fontSize: 18, fontWeight: "800" },
  per: { fontSize: 12, fontWeight: "600", color: "#94A3B8" },
  feat: { flexDirection: "row", alignItems: "center", marginTop: 5 },
  featText: { color: "#475569", fontSize: 13, marginLeft: 8, flex: 1 },
  note: {
    color: "#92400E",
    backgroundColor: "#FFFBEB",
    borderRadius: 10,
    padding: 10,
    fontSize: 12,
    marginTop: 14,
  },
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    padding: 16,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  payBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563EB",
    borderRadius: 14,
    paddingVertical: 15,
  },
  payText: { color: "#fff", fontWeight: "700", fontSize: 16, marginLeft: 8 },
  secure: { color: "#94A3B8", fontSize: 12, textAlign: "center", marginTop: 8 },
});
