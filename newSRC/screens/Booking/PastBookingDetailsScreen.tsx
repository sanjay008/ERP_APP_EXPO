import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import BookingCommentModal, {
  type BookingCommentMode,
} from "../../Components/BookingCommentModal";
import TaxiBookingPaymentModal from "../../Components/TaxiBookingPaymentModal";
import ConfirmBottomSheet from "../../Components/ConfirmBottomSheet";
import ScreenHeader from "../../Components/ScreenHeader";
import ApiFeedback from "../../Components/ApiFeedback";
import FallBackImage from "../../Components/FallBackImage";
import { RegisterBackContext } from "../../constants/GoBackContext";
import { useAppData } from "../../context/AppDataContext";
import { useApiErrorState } from "../../hooks/useApiErrorState";
import {
  addTripComment,
  completeTrip,
  fetchDriverTripBookingDetail,
  isAssignedDriver,
  isBookingToday,
  saveTaxiBookingPayment,
  updateBookingClientRelatie,
  normalizePaymentMethods,
  type BookingComment,
  type BookingCurrency,
  type BookingListMode,
  type DriverTripBooking,
  type TaxiPaymentDetail,
} from "../../services/bookingService";
import { getData } from "../../utils/storeData";
import { getApiErrorMessage } from "../../utils/validation";
import { useScreenInsets } from "../../utils/screenInsets";
import { AppColors } from "../../utils/theme";
import { FONTS } from "../../utils/FONTS";
import { Images } from "../../utils/Images";
import { LIST_UI } from "../../utils/connectionTheme";
import { listScreenStyles } from "../../utils/listScreenStyles";

function DetailRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
}) {
  const content = (
    <Text style={[styles.value, onPress ? styles.link : null]}>{value || "-"}</Text>
  );

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      {onPress ? <Pressable onPress={onPress}>{content}</Pressable> : content}
    </View>
  );
}

function openMaps(address?: string) {
  if (!address?.trim()) return;
  const encoded = encodeURIComponent(address.trim());
  const url =
    Platform.OS === "ios"
      ? `http://maps.apple.com/?q=${encoded}`
      : `geo:0,0?q=${encoded}`;
  Linking.openURL(url).catch(() => {
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encoded}`);
  });
}

function stripHtml(input?: string) {
  if (!input) return "";
  return input.replace(/<[^>]+>/g, "").trim();
}

function CommentCard({ item }: { item: BookingComment }) {
  const isPrivate = item.comment_type === "Private_BookTaxi";

  return (
    <View
      style={[
        styles.commentCard,
        isPrivate ? styles.commentCardPrivate : styles.commentCardPublic,
      ]}
    >
      <FallBackImage
        source={item.relatie?.file_path ? { uri: item.relatie.file_path } : undefined}
        fallbackImage={Images.DefaultImage}
        style={styles.commentAvatar}
        resizeMode="cover"
      />
      <View style={styles.commentBody}>
        <Text style={styles.commentUser}>{item.user?.username || "-"}</Text>
        <Text style={styles.commentDate}>{item.created_at || ""}</Text>
        <Text style={styles.commentText}>{stripHtml(item.comment)}</Text>
      </View>
    </View>
  );
}

function PaymentCard({ item }: { item: TaxiPaymentDetail }) {
  const { t } = useTranslation();

  return (
    <View style={styles.paymentCard}>
      <Text style={styles.paymentAmount}>
        {item.currency || ""} {item.amount ?? "-"}
      </Text>
      <Text style={styles.paymentMeta}>
        {t("Payment Method")}: {item.payment_method || "-"}
      </Text>
      {item.created_at ? (
        <Text style={styles.paymentMeta}>{item.created_at}</Text>
      ) : null}
    </View>
  );
}

export default function PastBookingDetailsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { top, scrollPadding } = useScreenInsets();
  const params = useLocalSearchParams<{ id?: string; mode?: string }>();
  const { permissions, fetchPermissions } = useAppData();
  const { setToast } = useContext(RegisterBackContext);

  const bookingId = params.id ?? "";
  const mode = (params.mode === "planning" ? "planning" : "past") as BookingListMode;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [booking, setBooking] = useState<DriverTripBooking | null>(null);
  const [currencies, setCurrencies] = useState<BookingCurrency[]>([]);
  const [currentRelatiesId, setCurrentRelatiesId] = useState<string | number | null>(null);

  const [paymentVisible, setPaymentVisible] = useState(false);
  const [commentVisible, setCommentVisible] = useState(false);
  const [commentMode, setCommentMode] = useState<BookingCommentMode>("public");
  const [confirmType, setConfirmType] = useState<"cancel" | "complete" | null>(null);

  const { apiError, clearApiError, captureApiError } = useApiErrorState();

  const loadData = useCallback(async () => {
    try {
      clearApiError();
      const [detail, userData] = await Promise.all([
        fetchDriverTripBookingDetail(bookingId, mode),
        getData("USERDATA"),
      ]);
      setBooking(detail.booking);
      setCurrencies(detail.currencies);
      setCurrentRelatiesId(userData?.data?.relaties?.id ?? null);
    } catch (error) {
      captureApiError(error);
      setBooking(null);
    }
  }, [bookingId, mode, clearApiError, captureApiError]);

  useEffect(() => {
    setLoading(true);
    fetchPermissions();
    loadData().finally(() => setLoading(false));
  }, [loadData, fetchPermissions]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const statusCode = Number(booking?.status ?? 0);
  const isToday = isBookingToday(booking?.from_date);
  const isDriver = booking ? isAssignedDriver(booking, currentRelatiesId ?? undefined) : false;
  const hasRemainingPayment = Number(booking?.remaining_payment ?? 0) !== 0;

  const canPay = hasRemainingPayment && isDriver;
  const canComplete =
    isToday &&
    statusCode === 130 &&
    isDriver &&
    String(permissions?.complete_booking_taxi_trip?.read) === "1";
  const canCancel =
    isToday &&
    (statusCode === 130 || statusCode === 138) &&
    String(permissions?.cancel_booking_taxi_trip?.read) === "1";
  const canPrivateComment =
    String(permissions?.private_notes?.create) === "1" &&
    statusCode !== 131 &&
    statusCode !== 134;

  const paymentMethods = useMemo(() => {
    const fromApi = normalizePaymentMethods(
      booking?.payment_method_first,
      booking?.payment_method_second,
      booking?.payment_method_third,
      booking?.payment_method_four
    );
    if (fromApi.length > 0) return fromApi;
    return booking?.payment_method ? [booking.payment_method] : [];
  }, [booking]);

  const openComment = (nextMode: BookingCommentMode) => {
    setCommentMode(nextMode);
    setCommentVisible(true);
  };

  const handleCompletePress = () => {
    if (booking?.payment_method === "Cash to the driver") {
      openComment("complete-cash");
      return;
    }
    setConfirmType("complete");
  };

  const handleCancelPress = () => {
    setConfirmType("cancel");
  };

  const handleConfirmAction = async () => {
    if (confirmType === "cancel") {
      setConfirmType(null);
      openComment("cancel");
      return;
    }

    if (confirmType !== "complete") return;

    setConfirmType(null);
    setActionLoading(true);
    try {
      await completeTrip({ bookTaxiId: bookingId, complete: 1 });
      await loadData();
      setToast({
        top: 45,
        text: t("Booking completed"),
        type: "success",
        visible: true,
      });
    } catch (error) {
      Alert.alert(getApiErrorMessage(error, t("Something went wrong")));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCommentSubmit = async (payload: { primary: string; secondary?: string }) => {
    if (!booking?.id) return;

    if (commentMode === "private" && !payload.primary) {
      Alert.alert(t("Enter Private Comment"));
      return;
    }

    if (commentMode === "complete-cash") {
      if (!payload.primary) {
        Alert.alert(t("Please Enter Ammount!"));
        return;
      }
      if (!payload.secondary) {
        Alert.alert(t("Please Enter Comments!"));
        return;
      }
    } else if (!payload.primary) {
      Alert.alert(t("Please Enter Comments!"));
      return;
    }

    setActionLoading(true);
    try {
      if (commentMode === "complete-cash") {
        await completeTrip({ bookTaxiId: booking.id, complete: 1 });
        const amountText = `${booking.currency_symbol?.symbol || ""}${payload.primary}`;
        await addTripComment({
          bookTaxiId: booking.id,
          comment: `${t("Paid")} ${amountText}\n${payload.secondary}`,
        });
      } else if (commentMode === "cancel") {
        await completeTrip({ bookTaxiId: booking.id, complete: 0 });
        await addTripComment({
          bookTaxiId: booking.id,
          comment: payload.primary,
        });
      } else if (commentMode === "private") {
        await addTripComment({
          bookTaxiId: booking.id,
          privateComment: payload.primary,
        });
      } else {
        await addTripComment({
          bookTaxiId: booking.id,
          comment: payload.primary,
        });
      }

      setCommentVisible(false);

      if (commentMode === "cancel") {
        setToast({
          top: 45,
          text: t("Booking cancelled"),
          type: "success",
          visible: true,
        });
        if (router.canGoBack()) {
          router.back();
        }
        return;
      }

      await loadData();
      setToast({
        top: 45,
        text:
          commentMode === "complete-cash"
            ? t("Booking completed")
            : t("Comment added"),
        type: "success",
        visible: true,
      });
    } catch (error) {
      Alert.alert(getApiErrorMessage(error, t("Something went wrong")));
    } finally {
      setActionLoading(false);
    }
  };

  const handlePaymentClientUpdate = async (client: {
    id?: string | number;
    display_name: string;
    mobiel: string;
    email_adres: string;
    google_maps: string;
    country_code: string;
  }) => {
    setActionLoading(true);
    try {
      await updateBookingClientRelatie({
        selectedRelatiesId: client.id || booking?.company_client_info?.id || booking?.client_person_info?.id,
        displayName: client.display_name,
        email: client.email_adres,
        googleMaps: client.google_maps,
        countryCode: client.country_code,
        phone: client.mobiel,
      });
    } catch (error) {
      Alert.alert(getApiErrorMessage(error, t("Something went wrong")));
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  const handlePaymentSubmit = async (payload: {
    amount: number;
    currencyCode: string;
    paymentMethod: string;
  }) => {
    if (!booking?.id) return;

    setActionLoading(true);
    try {
      const response = await saveTaxiBookingPayment({
        bookingId: booking.id,
        amount: payload.amount,
        currencyCode: payload.currencyCode,
        paymentMethod: payload.paymentMethod,
      });
      setPaymentVisible(false);
      await loadData();
      setToast({
        top: 45,
        text: response.message || t("Payment saved"),
        type: "success",
        visible: true,
      });
    } catch (error) {
      Alert.alert(getApiErrorMessage(error, t("Something went wrong")));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <View style={[listScreenStyles.container, { paddingTop: top }]}>
      <ScreenHeader title={t("Booking Details")} />

      {loading ? (
        <ApiFeedback loading />
      ) : apiError ? (
        <ApiFeedback error={apiError} onRetry={loadData} />
      ) : !booking ? (
        <ApiFeedback emptyMessage={t("No Data Found")} />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={AppColors.primary}
            />
          }
        >
          <View style={styles.headerCard}>
            <View>
              <Text style={styles.orderLabel}>{t("Order")}</Text>
              <Text style={styles.bookingId}>#{booking.id}</Text>
            </View>
            <View style={styles.headerActions}>
              {booking.status_name ? (
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: booking.status_color || AppColors.primary },
                  ]}
                >
                  <Text style={styles.statusText}>{t(booking.status_name)}</Text>
                </View>
              ) : null}
              {canPay ? (
                <Pressable style={styles.payBtn} onPress={() => setPaymentVisible(true)}>
                  <Text style={styles.payBtnText}>{t("Pay Now")}</Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          <View style={styles.section}>
            <DetailRow
              label={t("Company")}
              value={booking.company_client_info?.display_name}
            />
            <DetailRow
              label={t("Client")}
              value={booking.client_person_info?.display_name}
            />
            <DetailRow label={t("Date")} value={booking.from_date} />
            <DetailRow
              label={t("Time")}
              value={`${booking.pickup_time || ""}${booking.drop_time ? ` - ${booking.drop_time}` : ""}`}
            />
            <DetailRow
              label={t("Pickup")}
              value={booking.starting_selected_address}
              onPress={() => openMaps(booking.starting_selected_address)}
            />
            <DetailRow
              label={t("Destination")}
              value={booking.destination_selected_address}
              onPress={() => openMaps(booking.destination_selected_address)}
            />
            {booking.extra_stop_details && booking.extra_stop_details.length > 0
              ? booking.extra_stop_details.map((stop, index) => (
                  <DetailRow
                    key={`stop-${index}`}
                    label={`${t("Extra Stop")} ${index + 1}`}
                    value={stop.extra_stop_address}
                    onPress={() => openMaps(stop.extra_stop_address)}
                  />
                ))
              : null}
            {booking.payment_method ? (
              <DetailRow label={t("Payment Method")} value={t(booking.payment_method)} />
            ) : null}
            {booking.remaining_payment != null ? (
              <DetailRow
                label={t("Outstading")}
                value={`${booking.currency_symbol?.symbol || ""} ${booking.remaining_payment}`}
              />
            ) : null}
            {booking.tour_name ? <DetailRow label={t("Tour")} value={booking.tour_name} /> : null}
            {booking.total_person != null ? (
              <DetailRow label={t("Persons")} value={String(booking.total_person)} />
            ) : null}
            {booking.total_suitcase_and_trolly != null ? (
              <DetailRow
                label={t("Luggage")}
                value={String(booking.total_suitcase_and_trolly)}
              />
            ) : null}
            {booking.driver_display_names?.length ? (
              <DetailRow
                label={t("Driver")}
                value={booking.driver_display_names
                  .map((driver) =>
                    typeof driver === "string" ? driver : driver.display_name || ""
                  )
                  .filter(Boolean)
                  .join(", ")}
              />
            ) : null}
          </View>

          {booking.relaties_vehicle_name?.display_name ? (
            <View style={styles.vehicleCard}>
              <Text style={styles.vehicleText}>
                {booking.relaties_vehicle_name.display_name} (
                {booking.relaties_vehicle_name.voertuig_kenteken}) (
                {booking.relaties_vehicle_name.vehicle_color})
              </Text>
              {booking.relaties_vehicle_name.leads_status_data?.status_name ? (
                <View
                  style={[
                    styles.vehicleStatus,
                    {
                      backgroundColor:
                        booking.relaties_vehicle_name.leads_status_data.color ||
                        AppColors.green,
                    },
                  ]}
                >
                  <Text style={styles.vehicleStatusText}>
                    {t(booking.relaties_vehicle_name.leads_status_data.status_name)}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {booking.texi_booking_comment ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t("Comment")}</Text>
              <Text style={styles.commentNote}>{booking.texi_booking_comment}</Text>
            </View>
          ) : null}

          {booking.flight_schedule ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t("Flight Schedule")}</Text>
              <DetailRow label={t("Departure")} value={booking.flight_schedule.departure} />
              <DetailRow label={t("Arrival")} value={booking.flight_schedule.arrival} />
            </View>
          ) : null}

          <View style={styles.actionRow}>
            {canCancel ? (
              <Pressable
                style={[styles.actionBtn, styles.cancelActionBtn]}
                onPress={handleCancelPress}
                disabled={actionLoading}
              >
                <Text style={styles.actionBtnText}>{t("Annuleren")}</Text>
              </Pressable>
            ) : null}
            {canComplete ? (
              <Pressable
                style={[styles.actionBtn, styles.completeActionBtn]}
                onPress={handleCompletePress}
                disabled={actionLoading}
              >
                <Text style={styles.actionBtnText}>{t("Complete")}</Text>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.actionRow}>
            <Pressable
              style={[styles.actionBtn, styles.noteActionBtn, !canPrivateComment && styles.fullWidthBtn]}
              onPress={() => openComment("public")}
              disabled={actionLoading}
            >
              <Text style={styles.actionBtnTextDark}>{t("Opmerking")}</Text>
            </Pressable>
            {canPrivateComment ? (
              <Pressable
                style={[styles.actionBtn, styles.noteActionBtn]}
                onPress={() => openComment("private")}
                disabled={actionLoading}
              >
                <Text style={styles.actionBtnTextDark}>{t("Private Comment")}</Text>
              </Pressable>
            ) : null}
          </View>

          {booking.Taxi_payment_details && booking.Taxi_payment_details.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t("Payments")}</Text>
              {booking.Taxi_payment_details.map((payment, index) => (
                <PaymentCard key={String(payment.id ?? index)} item={payment} />
              ))}
            </View>
          ) : null}

          {booking.comments && booking.comments.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t("Opmerkingen")}</Text>
              {booking.comments.map((comment, index) => (
                <CommentCard key={String(comment.id ?? index)} item={comment} />
              ))}
            </View>
          ) : null}
        </ScrollView>
      )}

      <TaxiBookingPaymentModal
        visible={paymentVisible}
        loading={actionLoading}
        remainingPayment={booking?.remaining_payment}
        defaultCurrency={{
          code: booking?.currency || booking?.currency_symbol?.code,
          symbol: booking?.currency_symbol?.symbol,
        }}
        currencies={currencies}
        paymentMethods={paymentMethods}
        client={booking?.company_client_info || booking?.client_person_info}
        onClose={() => setPaymentVisible(false)}
        onUpdateClient={handlePaymentClientUpdate}
        onSubmit={handlePaymentSubmit}
      />

      <BookingCommentModal
        visible={commentVisible}
        mode={commentMode}
        loading={actionLoading}
        currencySymbol={booking?.currency_symbol?.symbol || ""}
        onClose={() => setCommentVisible(false)}
        onSubmit={handleCommentSubmit}
      />

      <ConfirmBottomSheet
        visible={confirmType != null}
        title={
          confirmType === "cancel" ? t("Cancel Booking ?") : t("Complate Booking ?")
        }
        message={
          confirmType === "cancel"
            ? t("Are you sure you want to cancel this booking?")
            : t("Are you sure you want to complete this booking?")
        }
        confirmText={t("Ok")}
        cancelText={t("Annuleren")}
        loading={actionLoading}
        onClose={() => setConfirmType(null)}
        onConfirm={handleConfirmAction}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: LIST_UI.screenPadding,
    paddingTop: 16,
    gap: 16,
  },
  headerCard: {
    backgroundColor: AppColors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: LIST_UI.cardBorder,
    padding: 16,
    gap: 12,
  },
  orderLabel: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 14,
    color: AppColors.black,
  },
  bookingId: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 18,
    color: AppColors.black,
    marginTop: 4,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flex: 1,
  },
  statusText: {
    color: AppColors.white,
    fontFamily: FONTS.LexendMedium,
    fontSize: 12,
    textAlign: "center",
  },
  payBtn: {
    backgroundColor: AppColors.primary,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  payBtnText: {
    color: AppColors.white,
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 12,
  },
  section: {
    backgroundColor: AppColors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: LIST_UI.cardBorder,
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 15,
    color: AppColors.black,
  },
  row: {
    gap: 4,
  },
  label: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 12,
    color: AppColors.subtitle,
  },
  value: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 14,
    color: AppColors.black,
  },
  link: {
    color: AppColors.primary,
    textDecorationLine: "underline",
  },
  vehicleCard: {
    backgroundColor: "#FFF8E1",
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  vehicleText: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 13,
    color: AppColors.black,
    textAlign: "center",
  },
  vehicleStatus: {
    alignSelf: "center",
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  vehicleStatusText: {
    color: AppColors.white,
    fontFamily: FONTS.LexendMedium,
    fontSize: 12,
  },
  commentNote: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 13,
    color: AppColors.subtitle,
    fontStyle: "italic",
    backgroundColor: "#F5F5F5",
    padding: 10,
    borderRadius: 8,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  fullWidthBtn: {
    flex: 1,
  },
  cancelActionBtn: {
    backgroundColor: AppColors.dicline,
  },
  completeActionBtn: {
    backgroundColor: "#00AA1C",
  },
  noteActionBtn: {
    backgroundColor: AppColors.primary,
  },
  actionBtnText: {
    color: AppColors.white,
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 14,
  },
  actionBtnTextDark: {
    color: AppColors.white,
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 14,
  },
  paymentCard: {
    backgroundColor: "#F7F9FB",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  paymentAmount: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 15,
    color: AppColors.black,
  },
  paymentMeta: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 13,
    color: AppColors.subtitle,
    marginTop: 4,
  },
  commentCard: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  commentCardPublic: {
    backgroundColor: "#EEF4FF",
  },
  commentCardPrivate: {
    backgroundColor: "#FFF0F0",
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  commentBody: {
    flex: 1,
  },
  commentUser: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 14,
    color: AppColors.black,
  },
  commentDate: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 12,
    color: AppColors.subtitle,
    marginTop: 2,
  },
  commentText: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 13,
    color: AppColors.black,
    marginTop: 6,
  },
});
