import { setAudioModeAsync, useAudioPlayer } from "expo-audio";
import { useLocalSearchParams } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, StatusBar, StyleSheet, Text, Vibration, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Path } from "react-native-svg";
import ScreenHeader from "../../Components/ScreenHeader";
import { RegisterBackContext } from "../../constants/GoBackContext";
import { consumePendingEventVerification } from "../../services/eventScanSession";
import {
  confirmEventBooking,
  type EventVerificationResult,
} from "../../services/eventService";
import { FONTS } from "../../utils/FONTS";
import { listScreenStyles } from "../../utils/listScreenStyles";
import { useScreenInsets } from "../../utils/screenInsets";
import { getData } from "../../utils/storeData";
import { AppColors } from "../../utils/theme";
import { getApiErrorMessage } from "../../utils/validation";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

const SIZE = 96;
const STROKE = 6;
const RING_R = 42;
const RING_LEN = 2 * Math.PI * RING_R;
const CHECK_PATH = "M32 52 L46 66 L72 38";
const CHECK_LEN = 58;
const CROSS_A = "M38 38 L62 62";
const CROSS_B = "M62 38 L38 62";
const CROSS_LEN = 34;
const EASE = Easing.out(Easing.cubic);

function StatusResultMark({ success }: { success: boolean }) {
  const ring = useSharedValue(0);
  const markA = useSharedValue(0);
  const markB = useSharedValue(0);

  useEffect(() => {
    // Total finish ~0.9–1.1s — stroke draw only, no scale/spring
    ring.value = withTiming(1, { duration: 420, easing: EASE });

    if (success) {
      markA.value = withDelay(280, withTiming(1, { duration: 420, easing: EASE }));
    } else {
      markA.value = withDelay(220, withTiming(1, { duration: 280, easing: EASE }));
      markB.value = withDelay(380, withTiming(1, { duration: 280, easing: EASE }));
    }
  }, [success, ring, markA, markB]);

  const ringProps = useAnimatedProps(() => ({
    strokeDashoffset: RING_LEN * (1 - ring.value),
  }));

  const checkProps = useAnimatedProps(() => ({
    strokeDashoffset: CHECK_LEN * (1 - markA.value),
  }));

  const crossAProps = useAnimatedProps(() => ({
    strokeDashoffset: CROSS_LEN * (1 - markA.value),
  }));

  const crossBProps = useAnimatedProps(() => ({
    strokeDashoffset: CROSS_LEN * (1 - markB.value),
  }));

  return (
    <View style={styles.markWrap}>
      <Svg width={SIZE} height={SIZE} viewBox="0 0 100 100">
        <Circle
          cx={50}
          cy={50}
          r={RING_R}
          stroke="rgba(255,255,255,0.28)"
          strokeWidth={STROKE}
          fill="none"
        />
        <AnimatedCircle
          cx={50}
          cy={50}
          r={RING_R}
          stroke={AppColors.white}
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={RING_LEN}
          animatedProps={ringProps}
          rotation={-90}
          origin="50, 50"
        />
        {success ? (
          <AnimatedPath
            d={CHECK_PATH}
            stroke={AppColors.white}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            strokeDasharray={CHECK_LEN}
            animatedProps={checkProps}
          />
        ) : (
          <>
            <AnimatedPath
              d={CROSS_A}
              stroke={AppColors.white}
              strokeWidth={STROKE}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={CROSS_LEN}
              animatedProps={crossAProps}
            />
            <AnimatedPath
              d={CROSS_B}
              stroke={AppColors.white}
              strokeWidth={STROKE}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={CROSS_LEN}
              animatedProps={crossBProps}
            />
          </>
        )}
      </Svg>
    </View>
  );
}

function parsePayloadParam(raw?: string | string[]): EventVerificationResult | null {
  if (!raw) return null;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return null;
  try {
    return JSON.parse(String(value)) as EventVerificationResult;
  } catch {
    return null;
  }
}

export default function EventBookingConfirmScreen() {
  const { t } = useTranslation();
  const { top, scrollPadding } = useScreenInsets();
  const params = useLocalSearchParams<{ id?: string; payload?: string }>();
  const { setToast } = useContext(RegisterBackContext);

  const [verification] = useState<EventVerificationResult | null>(() => {
    return consumePendingEventVerification() || parsePayloadParam(params.payload);
  });

  const paymentStatus = verification?.data?.payment_status ?? "";
  const isAllowed = ["paid", "free"].includes(paymentStatus);
  const alreadyScanned = Number(verification?.sub_booking?.scan_info ?? 0) >= 1;
  const isSuccess = isAllowed && !alreadyScanned;

  const [confirming, setConfirming] = useState(() => isSuccess);
  const successSound = useAudioPlayer(require("../../assets/sounds/ScannerSound.mp3"));
  const errorSound = useAudioPlayer(require("../../assets/sounds/ErrorSound.mp3"));

  useEffect(() => {
    void setAudioModeAsync({ playsInSilentMode: true });
  }, []);

  useEffect(() => {
    if (isSuccess) return;
    void errorSound.seekTo(0);
    errorSound.play();
  }, [errorSound, isSuccess]);

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

        await confirmEventBooking({
          token,
          eventId,
          bookingId,
        });

        Vibration.vibrate([300, 100, 300]);
        void successSound.seekTo(0);
        successSound.play();
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

    void autoConfirm();
  }, [verification, alreadyScanned, isAllowed, params.id, setToast, successSound, t]);

  const bgColor = isSuccess ? AppColors.green : AppColors.dicline;

  return (
    <View style={[listScreenStyles.container, styles.screen, { paddingTop: top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={AppColors.white} />
      <ScreenHeader title={t("Event Details")} />

      <View style={[styles.body, { backgroundColor: bgColor, paddingBottom: scrollPadding }]}>
        {confirming ? (
          <ActivityIndicator size="large" color={AppColors.white} />
        ) : (
          <StatusResultMark key={isSuccess ? "ok" : "no"} success={isSuccess} />
        )}

        <Text style={styles.statusText}>
          {t("Event status")}: {isSuccess ? t("Approved") : t("Not Allowed")}
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
  screen: {
    backgroundColor: AppColors.white,
  },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  markWrap: {
    width: SIZE,
    height: SIZE,
    alignItems: "center",
    justifyContent: "center",
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
    textAlign: "center",
  },
});
