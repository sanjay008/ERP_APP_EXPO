import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
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
import FallBackImage from "../../Components/FallBackImage";
import { useApiErrorState } from "../../hooks/useApiErrorState";
import { fetchCustomers, type RelatieOption } from "../../services/taskService";
import { useScreenInsets } from "../../utils/screenInsets";
import { AppColors } from "../../utils/theme";
import { FONTS } from "../../utils/FONTS";
import { LIST_UI } from "../../utils/connectionTheme";
import { listScreenStyles } from "../../utils/listScreenStyles";
import { isOpenableAddress, openMapsAddress } from "../../utils/openMaps";

function DetailRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
}) {
  const display = value || "-";
  return (
    <>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        {onPress ? (
          <Pressable onPress={onPress} style={styles.valuePressable}>
            <Text style={styles.link}>{display}</Text>
          </Pressable>
        ) : (
          <Text style={styles.value}>{display}</Text>
        )}
      </View>
      <View style={styles.line} />
    </>
  );
}

export default function CustomerDetailsScreen() {
  const { t } = useTranslation();
  const { top, scrollPadding } = useScreenInsets();
  const params = useLocalSearchParams<{ id?: string; color?: string }>();
  const customerId = params.id ? Number(params.id) : NaN;

  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<RelatieOption | null>(null);
  const { apiError, clearApiError, captureApiError } = useApiErrorState();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      clearApiError();
      const response = await fetchCustomers();
      if (response?.status && Array.isArray(response.data)) {
        const match = response.data.find((item) => item.id === customerId) ?? null;
        setCustomer(match);
      } else {
        setCustomer(null);
      }
    } catch (error) {
      captureApiError(error);
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  }, [customerId, clearApiError, captureApiError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const whatsappNumber = useMemo(
    () => customer?.whatsapp_number?.trim(),
    [customer?.whatsapp_number]
  );

  const openWhatsApp = async () => {
    if (!whatsappNumber) {
      Alert.alert(t("Invalid Number"), t("The WhatsApp number is not valid."));
      return;
    }

    const whatsappUrl = `whatsapp://send?phone=${whatsappNumber}`;
    try {
      await Linking.openURL(whatsappUrl);
    } catch {
      Alert.alert(
        t("WhatsApp Not Available"),
        t("WhatsApp is not installed on your device. Would you like to install it?"),
        [
          { text: t("Cancel"), style: "cancel" },
          {
            text: t("Install"),
            onPress: () => {
              const storeUrl =
                Platform.OS === "ios"
                  ? "https://apps.apple.com/app/whatsapp-messenger/id310633997"
                  : "https://play.google.com/store/apps/details?id=com.whatsapp";
              Linking.openURL(storeUrl).catch(() => undefined);
            },
          },
        ]
      );
    }
  };

  return (
    <View style={[listScreenStyles.container, { paddingTop: top }]}>
      <ScreenHeader title={t("Customer")} />

      {loading ? (
        <ApiFeedback loading />
      ) : apiError ? (
        <ApiFeedback error={apiError} onRetry={loadData} />
      ) : !customer ? (
        <ApiFeedback emptyMessage={t("No data found")} />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.avatarWrap}>
            <FallBackImage
              source={
                customer.profile_image?.file_path
                  ? { uri: customer.profile_image.file_path }
                  : undefined
              }
              style={styles.avatar}
              resizeMode="cover"
            />
          </View>

          <View style={styles.detailsBox}>
            <DetailRow label={t("Name")} value={customer.display_name} />
            <DetailRow label={t("Telefoon")} value={customer.telefoon_country_code} />
            <DetailRow label={t("Mobile No.")} value={customer.mobiel} />
            <DetailRow label={t("Email Adres")} value={customer.email_adres} />

            <View style={styles.row}>
              <Text style={styles.label}>{t("Whatsapp No.")}</Text>
              {whatsappNumber ? (
                <Pressable onPress={openWhatsApp} style={styles.valuePressable}>
                  <Text style={styles.link}>{whatsappNumber}</Text>
                </Pressable>
              ) : (
                <Text style={styles.value}>-</Text>
              )}
            </View>
            <View style={styles.line} />

            <DetailRow
              label={t("Google maps")}
              value={customer.google_maps}
              onPress={
                isOpenableAddress(customer.google_maps)
                  ? () => openMapsAddress(customer.google_maps)
                  : undefined
              }
            />
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: LIST_UI.screenPadding,
    paddingTop: 16,
  },
  avatarWrap: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: LIST_UI.cardBorder,
  },
  detailsBox: {
    backgroundColor: AppColors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: LIST_UI.cardBorder,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  label: {
    flex: 1,
    fontFamily: FONTS.LexendMedium,
    fontSize: 13,
    color: AppColors.subtitle,
  },
  value: {
    flex: 1,
    textAlign: "right",
    fontFamily: FONTS.LexendRegular,
    fontSize: 13,
    color: AppColors.black,
  },
  valuePressable: {
    flex: 1,
  },
  link: {
    textAlign: "right",
    fontFamily: FONTS.LexendRegular,
    fontSize: 13,
    color: AppColors.primary,
    textDecorationLine: "underline",
  },
  line: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: LIST_UI.cardBorder,
  },
});
