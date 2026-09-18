import React, { useCallback, useContext, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  Vibration,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { RegisterBackContext } from "../../constants/GoBackContext";
import { verifyEventBooking } from "../../services/eventService";
import { getApiErrorMessage } from "../../utils/validation";
import { useScreenInsets } from "../../utils/screenInsets";
import { AppColors } from "../../utils/theme";
import { FONTS } from "../../utils/FONTS";

export default function EventScannerScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { top, bottom } = useScreenInsets();
  const params = useLocalSearchParams<{ id?: string; color?: string }>();
  const eventId = params.id ?? "";
  const { setToast } = useContext(RegisterBackContext);

  const [permission, requestPermission] = useCameraPermissions();
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const scanningRef = useRef(false);

  const handleBarcode = useCallback(
    async (result: { data?: string }) => {
      if (scanningRef.current || !result.data) return;
      scanningRef.current = true;
      Vibration.vibrate(300);

      try {
        const parsed = JSON.parse(result.data) as { code_id?: string | number; qr_id?: string | number };
        const uniqueId = parsed.code_id ?? parsed.qr_id;

        if (!uniqueId) {
          setToast({
            top: 45,
            text: t("Invalid QR Code"),
            type: "error",
            visible: true,
          });
          scanningRef.current = false;
          return;
        }

        setLoading(true);
        const verification = await verifyEventBooking({ eventId, uniqueId });

        router.replace({
          pathname: "/(app)/events/[id]/confirm",
          params: {
            id: eventId,
            color: params.color || "",
            payload: JSON.stringify(verification),
          },
        });
      } catch (error) {
        setToast({
          top: 45,
          text: getApiErrorMessage(error, t("Something went wrong")),
          type: "error",
          visible: true,
        });
        scanningRef.current = false;
      } finally {
        setLoading(false);
      }
    },
    [eventId, params.color, router, setToast, t]
  );

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.centered, styles.permissionWrap]}>
        <Text style={styles.permissionText}>{t("Camera permission is required")}</Text>
        <Pressable style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>{t("Grant permission")}</Text>
        </Pressable>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>{t("Go back")}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: top + 8 }]}>
        <Pressable style={styles.iconBtn} onPress={() => setFlashEnabled((prev) => !prev)}>
          <Ionicons
            name={flashEnabled ? "flash" : "flash-outline"}
            size={22}
            color={AppColors.white}
          />
        </Pressable>
        <Pressable style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={AppColors.white} />
        </Pressable>
      </View>

      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={flashEnabled}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={handleBarcode}
      />

      <View style={[styles.overlay, { paddingBottom: bottom }]}>
        <View style={styles.scanFrame} />
        <Text style={styles.hint}>{t("Scan event QR code")}</Text>
      </View>

      <Modal visible={loading} transparent animationType="fade">
        <View style={styles.loaderBackdrop}>
          <ActivityIndicator size="large" color={AppColors.primary} />
          <Text style={styles.loaderText}>{t("Wait")}...</Text>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.black },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.white,
  },
  permissionWrap: { paddingHorizontal: 24 },
  permissionText: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 16,
    color: AppColors.black,
    textAlign: "center",
    marginBottom: 16,
  },
  permissionBtn: {
    backgroundColor: AppColors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  permissionBtnText: {
    fontFamily: FONTS.LexendMedium,
    color: AppColors.white,
  },
  backLink: {
    fontFamily: FONTS.LexendMedium,
    color: AppColors.primary,
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  scanFrame: {
    width: 240,
    height: 240,
    borderWidth: 2,
    borderColor: AppColors.white,
    borderRadius: 12,
    backgroundColor: "transparent",
  },
  hint: {
    marginTop: 20,
    fontFamily: FONTS.LexendMedium,
    fontSize: 15,
    color: AppColors.white,
  },
  loaderBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  loaderText: {
    marginTop: 12,
    fontFamily: FONTS.LexendRegular,
    color: AppColors.white,
  },
});
