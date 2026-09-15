import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import {
  formatBookingDate,
  formatBookingTime,
  getInitials,
  getPaymentStatusStyle,
  parseCartData,
  type GlamBookingItem,
} from "../services/glamBookingService";
import { AppColors } from "../utils/theme";
import { FONTS } from "../utils/FONTS";

type Props = {
  item: GlamBookingItem;
  accentColor?: string;
  onPress: () => void;
};

export default function GlamBookingCard({ item, accentColor, onPress }: Props) {
  const { t } = useTranslation();
  const booking = item.booking_details ?? {};
  const order = item.order_details ?? {};
  const relaties = item.relaties_details ?? {};
  const cartData = parseCartData(order.cart_data);
  const paymentStyle = getPaymentStatusStyle(order.payment_status || "");
  const statusLabel = order.payment_status
    ? order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)
    : "-";

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={[styles.header, { backgroundColor: accentColor || AppColors.primary }]}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{getInitials(relaties.display_name || "")}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>
            {relaties.display_name || "-"}
          </Text>
          <Text style={styles.headerEmail} numberOfLines={1}>
            {relaties.email_adres || "-"}
          </Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{relaties.soort_relatie || t("Staff")}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{t("BookingDate")}</Text>
            <Text style={styles.statValuePrimary}>{formatBookingDate(booking.date)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{t("TimeSlot")}</Text>
            <Text style={styles.statValue}>{formatBookingTime(booking.time_slot)}</Text>
          </View>
        </View>

        <View style={styles.serviceRow}>
          <View style={styles.serviceInfo}>
            <Text style={styles.statLabel}>{t("ServiceBooked")}</Text>
            <Text style={styles.serviceName} numberOfLines={1}>
              {cartData?.product_name || "-"}
            </Text>
          </View>
          <View style={styles.rightGroup}>
            <View style={[styles.payBadge, { backgroundColor: paymentStyle.bg }]}>
              <View style={[styles.payDot, { backgroundColor: paymentStyle.text }]} />
              <Text style={[styles.payText, { color: paymentStyle.text }]}>{statusLabel}</Text>
            </View>
            <Text style={styles.amount}>€{order.total_price || "0.00"}</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerIds} numberOfLines={1}>
          {t("Booking Id")} #{booking.id}
        </Text>
        <Text style={styles.viewDetails}>{t("ViewDetails")} →</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.white,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  header: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 13,
    fontFamily: FONTS.LexendSemiBold,
    color: AppColors.white,
  },
  headerInfo: { flex: 1, minWidth: 0 },
  headerName: {
    fontSize: 14,
    fontFamily: FONTS.LexendSemiBold,
    color: AppColors.white,
  },
  headerEmail: {
    fontSize: 11,
    fontFamily: FONTS.LexendRegular,
    color: "rgba(255,255,255,0.75)",
    marginTop: 1,
  },
  badge: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: FONTS.LexendMedium,
    color: AppColors.white,
    textTransform: "capitalize",
  },
  body: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 10, gap: 8 },
  statsRow: { flexDirection: "row", gap: 8 },
  statCard: {
    flex: 1,
    backgroundColor: "#F7F9FB",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: FONTS.LexendRegular,
    color: AppColors.subtitle,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 13,
    fontFamily: FONTS.LexendSemiBold,
    color: AppColors.black,
  },
  statValuePrimary: {
    fontSize: 13,
    fontFamily: FONTS.LexendSemiBold,
    color: AppColors.primary,
  },
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E7EB",
    paddingTop: 8,
    gap: 8,
  },
  serviceInfo: { flex: 1, minWidth: 0 },
  serviceName: {
    fontSize: 12,
    fontFamily: FONTS.LexendSemiBold,
    color: AppColors.black,
  },
  rightGroup: { flexDirection: "row", alignItems: "center", gap: 8 },
  payBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  payDot: { width: 5, height: 5, borderRadius: 3 },
  payText: { fontSize: 11, fontFamily: FONTS.LexendMedium },
  amount: {
    fontSize: 15,
    fontFamily: FONTS.LexendSemiBold,
    color: AppColors.primary,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E7EB",
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footerIds: {
    fontSize: 11,
    fontFamily: FONTS.LexendRegular,
    color: AppColors.subtitle,
    flex: 1,
  },
  viewDetails: {
    fontSize: 11,
    fontFamily: FONTS.LexendMedium,
    color: AppColors.primary,
  },
});
