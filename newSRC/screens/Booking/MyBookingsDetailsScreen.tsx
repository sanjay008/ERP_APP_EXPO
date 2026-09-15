import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import ScreenHeader from "../../Components/ScreenHeader";
import ApiFeedback from "../../Components/ApiFeedback";
import { useApiErrorState } from "../../hooks/useApiErrorState";
import {
  fetchMyBookingById,
  formatBookingDate,
  formatBookingTime,
  formatDateTime,
  getInitials,
  getPaymentStatusStyle,
  parseCartData,
  type GlamBookingItem,
} from "../../services/glamBookingService";
import { useScreenInsets } from "../../utils/screenInsets";
import { AppColors } from "../../utils/theme";
import { FONTS } from "../../utils/FONTS";
import { LIST_UI } from "../../utils/connectionTheme";
import { listScreenStyles } from "../../utils/listScreenStyles";

function InfoRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
}) {
  const content = (
    <Text style={[detailStyles.infoValue, onPress ? detailStyles.link : null]}>
      {value || "-"}
    </Text>
  );

  return (
    <View style={detailStyles.infoRowWrap}>
      <View style={detailStyles.infoRow}>
        <Text style={detailStyles.infoLabel}>{label}</Text>
        {onPress ? <Pressable onPress={onPress}>{content}</Pressable> : content}
      </View>
      <View style={detailStyles.divider} />
    </View>
  );
}

export default function MyBookingsDetailsScreen() {
  const { t } = useTranslation();
  const { top, scrollPadding } = useScreenInsets();
  const params = useLocalSearchParams<{ id?: string; color?: string }>();
  const bookingId = params.id ?? "";

  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<GlamBookingItem | null>(null);
  const { apiError, clearApiError, captureApiError } = useApiErrorState();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      clearApiError();
      const data = await fetchMyBookingById(bookingId);
      setItem(data);
    } catch (error) {
      captureApiError(error);
      setItem(null);
    } finally {
      setLoading(false);
    }
  }, [bookingId, clearApiError, captureApiError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const booking = item?.booking_details ?? {};
  const order = item?.order_details ?? {};
  const relaties = item?.relaties_details ?? {};
  const cartData = parseCartData(order.cart_data);
  const paymentStyle = getPaymentStatusStyle(order.payment_status || "");
  const fullName = `${order.first_name || ""} ${order.last_name || ""}`.trim() || "-";
  const phone =
    order.country_code && order.phone_number
      ? `+${order.country_code} ${order.phone_number}`
      : "";
  const relatiePhone =
    relaties.country_code && relaties.mobiel
      ? `+${relaties.country_code} ${relaties.mobiel}`
      : "-";
  const hasShipping =
    !!order.shipping_address && order.shipping_address !== order.full_address;

  const openLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(t("Error"), t("Something went wrong"));
    }
  };

  const openMaps = (address?: string) => {
    if (!address?.trim()) return;
    const encoded = encodeURIComponent(address.trim());
    const url =
      Platform.OS === "ios"
        ? `http://maps.apple.com/?q=${encoded}`
        : `geo:0,0?q=${encoded}`;
    openLink(url);
  };

  return (
    <View style={[listScreenStyles.container, { paddingTop: top }]}>
      <ScreenHeader title={t("Booking Details")} />

      {loading ? (
        <ApiFeedback loading />
      ) : apiError ? (
        <ApiFeedback error={apiError} onRetry={loadData} />
      ) : !item ? (
        <ApiFeedback emptyMessage={t("No Data Found")} />
      ) : (
        <ScrollView
          contentContainerStyle={[detailStyles.content, { paddingBottom: scrollPadding }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={detailStyles.card}>
            <View
              style={[
                detailStyles.header,
                { backgroundColor: params.color || AppColors.primary },
              ]}
            >
              <View style={detailStyles.avatarCircle}>
                <Text style={detailStyles.avatarText}>
                  {getInitials(relaties.display_name || "")}
                </Text>
              </View>
              <View style={detailStyles.headerInfo}>
                <Text style={detailStyles.headerName}>{relaties.display_name || "-"}</Text>
                <Text style={detailStyles.headerSub}>
                  {relaties.email_adres || "-"} · {relatiePhone}
                </Text>
              </View>
            </View>

            <View style={detailStyles.statsGrid}>
              <View style={detailStyles.statCard}>
                <Text style={detailStyles.statLabel}>{t("BookingDate")}</Text>
                <Text style={detailStyles.statPrimary}>{formatBookingDate(booking.date)}</Text>
              </View>
              <View style={detailStyles.statCard}>
                <Text style={detailStyles.statLabel}>{t("TimeSlot")}</Text>
                <Text style={detailStyles.statValue}>{formatBookingTime(booking.time_slot)}</Text>
              </View>
              <View style={detailStyles.statCard}>
                <Text style={detailStyles.statLabel}>{t("TotalAmount")}</Text>
                <Text style={detailStyles.statPrimary}>€{order.total_price || "0.00"}</Text>
              </View>
              <View style={detailStyles.statCard}>
                <Text style={detailStyles.statLabel}>{t("Payment")}</Text>
                <View style={[detailStyles.payBadge, { backgroundColor: paymentStyle.bg }]}>
                  <Text style={[detailStyles.payText, { color: paymentStyle.text }]}>
                    {order.payment_status || "-"}
                  </Text>
                </View>
              </View>
            </View>

            {cartData ? (
              <View style={detailStyles.section}>
                <Text style={detailStyles.sectionTitle}>{t("ServiceBooked")}</Text>
                <View style={detailStyles.serviceRow}>
                  {cartData.cart_img ? (
                    <Image source={{ uri: cartData.cart_img }} style={detailStyles.serviceImg} />
                  ) : (
                    <View style={detailStyles.serviceImgPlaceholder} />
                  )}
                  <View style={detailStyles.serviceInfo}>
                    <Text style={detailStyles.serviceName}>{cartData.product_name || "-"}</Text>
                    <Text style={detailStyles.serviceSub}>
                      {t("Qty")}: {cartData.qty || 1} {cartData.qty_type || "stuk"}
                    </Text>
                  </View>
                  <Text style={detailStyles.servicePrice}>
                    {cartData.currency || "€"}
                    {cartData.product_price}
                  </Text>
                </View>
              </View>
            ) : null}

            <View style={detailStyles.section}>
              <Text style={detailStyles.sectionTitle}>{t("CustomerDetails")}</Text>
              <InfoRow label={t("Name")} value={fullName} />
              <InfoRow
                label={t("Email")}
                value={order.email}
                onPress={order.email ? () => openLink(`mailto:${order.email}`) : undefined}
              />
              <InfoRow
                label={t("Phone")}
                value={phone || "-"}
                onPress={
                  phone
                    ? () => openLink(`whatsapp://send?phone=${phone.replace(/\D/g, "")}`)
                    : undefined
                }
              />
            </View>

            <View style={detailStyles.section}>
              <Text style={detailStyles.sectionTitle}>{t("Address")}</Text>
              <InfoRow
                label={t("BillingAddress")}
                value={order.full_address}
                onPress={() => openMaps(order.full_address)}
              />
              {hasShipping ? (
                <InfoRow
                  label={t("ShippingAddress")}
                  value={order.shipping_address}
                  onPress={() => openMaps(order.shipping_address)}
                />
              ) : null}
            </View>

            <View style={detailStyles.section}>
              <Text style={detailStyles.sectionTitle}>{t("OrderInfo")}</Text>
              <InfoRow label={t("BookingId")} value={`#${booking.id}`} />
              <InfoRow label={t("PaymentVia")} value={order.payment_type} />
              <InfoRow label={t("MollieId")} value={order.mollie_payment_id} />
              <InfoRow label={t("ShippingCost")} value={`€${order.shipping_cost || "0.00"}`} />
              <InfoRow label={t("CreatedAt")} value={formatDateTime(order.created_at)} />
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const detailStyles = StyleSheet.create({
  content: { paddingHorizontal: LIST_UI.screenPadding, paddingTop: 16 },
  card: {
    backgroundColor: AppColors.white,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: LIST_UI.cardBorder,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 14,
    color: AppColors.white,
  },
  headerInfo: { flex: 1 },
  headerName: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 15,
    color: AppColors.white,
  },
  headerSub: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 11,
    color: "rgba(255,255,255,0.75)",
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 12,
    gap: 8,
  },
  statCard: {
    width: "48%",
    backgroundColor: "#F7F9FB",
    borderRadius: 8,
    padding: 10,
  },
  statLabel: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 10,
    color: AppColors.subtitle,
  },
  statValue: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 13,
    color: AppColors.black,
    marginTop: 2,
  },
  statPrimary: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 13,
    color: AppColors.primary,
    marginTop: 2,
  },
  payBadge: {
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 4,
  },
  payText: { fontFamily: FONTS.LexendMedium, fontSize: 11 },
  section: { paddingHorizontal: 16, paddingBottom: 12 },
  sectionTitle: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 14,
    color: AppColors.black,
    marginBottom: 8,
  },
  serviceRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  serviceImg: { width: 56, height: 56, borderRadius: 8 },
  serviceImgPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  serviceInfo: { flex: 1 },
  serviceName: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 13,
    color: AppColors.black,
  },
  serviceSub: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 11,
    color: AppColors.subtitle,
    marginTop: 2,
  },
  servicePrice: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 13,
    color: AppColors.primary,
  },
  infoRowWrap: { marginBottom: 4 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 8,
  },
  infoLabel: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 12,
    color: AppColors.subtitle,
    flex: 1,
  },
  infoValue: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 12,
    color: AppColors.black,
    flex: 1,
    textAlign: "right",
  },
  link: { color: AppColors.primary, textDecorationLine: "underline" },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: LIST_UI.cardBorder,
  },
});
