import React, { useContext, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, Vibration, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import ScreenHeader from "../../Components/ScreenHeader";
import { RegisterBackContext } from "../../constants/GoBackContext";
import {
  confirmEventBooking,
  type EventVerificationResult,
} from "../../services/eventService";
import { getData } from "../../utils/storeData";
import { getApiErrorMessage } from "../../utils/validation";
import { useScreenInsets } from "../../utils/screenInsets";
import { AppColors } from "../../utils/theme";
import { FONTS } from "../../utils/FONTS";
import { listScreenStyles } from "../../utils/listScreenStyles";

export default function EventBookingConfirmScreen() {
  const { t } = useTranslation();
  const { top, scrollPadding } = useScreenInsets();
  const params = useLocalSearchParams<{ id?: string; payload?: string }>();
  const { setToast } = useContext(RegisterBackContext);

  const verification = useMemo<EventVerificationResult | null>(() => {
    if (!params.payload) return null;
    try {
      return JSON.parse(String(params.payload)) as EventVerificationResult;
    } catch {
      return null;
    }
  }, [params.payload]);

  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const paymentStatus = verification?.data?.payment_status ?? "";
  const isAllowed = ["paid", "free"].includes(paymentStatus);
  const alreadyScanned = Number(verification?.sub_booking?.scan_info ?? 0) >= 1;

  useEffect(() => {
    const autoConfirm = async () => {
      if (!verification || alreadyScanned || !isAllowed) return;

      setConfirming(true);
      try {
        const userData = await getData("USERDATA");
        const token = userData?.data?.user?.verify_token;
        const eventId = verification.sub_booking?.event_id ?? params.id;
        const bookingId = verification.sub_booking?.id;

        if (!token || !eventId || !bookingId) return;

        const result = await confirmEventBooking({
          token,
          eventId,
          bookingId,
        });

        Vibration.vibrate([300, 100, 300]);
        setConfirmed(true);
        setToast({
          top: 45,
          text: result.message || t("Booking confirmed"),
          type: "success",
          visible: true,
        });
      } catch (error) {
        setToast({
          top: 45,
          text: getApiErrorMessage(error, t("Something went wrong")),
          type: "error",
          visible: true,
        });
      } finally {
        setConfirming(false);
      }
    };

    autoConfirm();
  }, [verification, alreadyScanned, isAllowed, params.id, setToast, t]);

  const bgColor = isAllowed && !alreadyScanned ? AppColors.green : AppColors.dicline;

  return (
    <View style={[listScreenStyles.container, { paddingTop: top, backgroundColor: bgColor }]}>
      <ScreenHeader title={t("Event Details")} />

      <View style={[styles.body, { paddingBottom: scrollPadding }]}>
        {confirming ? (
          <ActivityIndicator size="large" color={AppColors.white} />
        ) : (
          <Ionicons
            name={isAllowed && !alreadyScanned ? "checkmark-circle" : "close-circle"}
            size={96}
            color={AppColors.white}
          />
        )}

        <Text style={styles.statusText}>
          {t("Event status")}:{" "}
          {isAllowed && !alreadyScanned
            ? confirmed
              ? t("Approved")
              : t("Approved")
            : t("Not Allowed")}
        </Text>

        {alreadyScanned ? (
          <Text style={styles.subText}>{t("Already Scanned")}</Text>
        ) : null}

        {!isAllowed && verification?.error_message ? (
          <Text style={styles.subText}>{verification.error_message}</Text>
        ) : null}

        <Text style={styles.title}>
          {verification?.data?.event_tickets?.title ??
            verification?.firstEvent?.name ??
            "N/A"}
        </Text>
        <Text style={styles.code}>
          {verification?.sub_booking?.id}-{verification?.sub_booking?.unique_code}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  statusText: {
    marginTop: 16,
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 16,
    color: AppColors.white,
    textAlign: "center",
  },
  subText: {
    marginTop: 8,
    fontFamily: FONTS.LexendRegular,
    fontSize: 14,
    color: AppColors.white,
    textAlign: "center",
  },
  title: {
    marginTop: 24,
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 18,
    color: AppColors.white,
    textAlign: "center",
  },
  code: {
    marginTop: 8,
    fontFamily: FONTS.LexendMedium,
    fontSize: 15,
    color: AppColors.white,
  },
});
