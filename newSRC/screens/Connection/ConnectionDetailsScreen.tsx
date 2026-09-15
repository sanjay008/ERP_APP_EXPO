import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Image,
  ImageSourcePropType,
  Linking,
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
import { useScreenInsets } from "../../utils/screenInsets";
import {
  fetchConnectionDetails,
  type ConnectionDetail,
} from "../../services/connectionService";
import { AppColors } from "../../utils/theme";
import { FONTS } from "../../utils/FONTS";
import { Images } from "../../utils/Images";
import { CONNECTION_UI } from "../../utils/connectionTheme";
import { listScreenStyles } from "../../utils/listScreenStyles";
import { isOpenableAddress, openMapsAddress } from "../../utils/openMaps";

type DetailRow = {
  key: string;
  label: string;
  value?: string;
  icon: ImageSourcePropType;
  iconBg: string;
  iconColor: string;
  link?: string;
  isMap?: boolean;
  statusName?: string;
  statusColor?: string;
  labels?: string[];
};

function buildDetailRows(data: ConnectionDetail, t: (key: string) => string): DetailRow[] {
  const type = data.bedrijf_particulier;
  const rows: DetailRow[] = [];

  rows.push({
    key: "status",
    label: t("Status"),
    statusName: data.leadstatus?.status_name || "-",
    statusColor: data.leadstatus?.color_code || "#00D0FF",
    icon: Images.ConnectionStatus,
    iconBg: "#FFE6EF",
    iconColor: "#FF005E",
  });

  rows.push({
    key: "labels",
    label: t("Label"),
    labels: data.labels?.length
      ? data.labels.map((l) => l.label_name || l.name || "").filter(Boolean)
      : [],
    icon: Images.ConnectionLabel,
    iconBg: "#F2E6FF",
    iconColor: "#7C00FF",
  });

  if ([1, 2].includes(type || 0)) {
    rows.push({
      key: "phone",
      label: t("Phone Number"),
      value: data.contact_telefoon || "-",
      icon: Images.ConnectionPhone,
      iconBg: "#E7F7E8",
      iconColor: "#06AC14",
    });

    rows.push({
      key: "email",
      label: t("Email Address"),
      value: data.email_adres || "-",
      icon: Images.ConnectionMail,
      iconBg: "#FFFDEC",
      iconColor: "#FFEB3B",
    });

    rows.push({
      key: "facebook",
      label: t("Facebook"),
      value: data.facebook_url || "https://www.facebook.com",
      link: data.facebook_url || "https://www.facebook.com",
      icon: Images.ConnectionFacebook,
      iconBg: "#E6EBFF",
      iconColor: "#0037FF",
    });

    rows.push({
      key: "linkedin",
      label: t("LinkedIn"),
      value: data.linkedin_url || "https://www.linkedin.com",
      link: data.linkedin_url || "https://www.linkedin.com",
      icon: Images.ConnectionLinkedin,
      iconBg: "#FFE6EF",
      iconColor: "#FF005E",
    });
  }

  if ([1, 2, 3].includes(type || 0)) {
    rows.push({
      key: "address",
      label: t("Address"),
      value: data.google_maps || "-",
      link: isOpenableAddress(data.google_maps) ? data.google_maps : undefined,
      isMap: true,
      icon: Images.ConnectionLocation,
      iconBg: "#E6FBFF",
      iconColor: "#00D0FF",
    });
  }

  if ([1, 2].includes(type || 0)) {
    rows.push({
      key: "website",
      label: t("Website"),
      value: data.website || "https://app.erpportaal.nl",
      link: data.website || "https://app.erpportaal.nl",
      icon: Images.ConnectionWebsite,
      iconBg: "#F2E6FF",
      iconColor: "#7C00FF",
    });
  }

  return rows;
}

function DetailIcon({
  source,
  backgroundColor,
  tintColor,
}: {
  source: ImageSourcePropType;
  backgroundColor: string;
  tintColor: string;
}) {
  return (
    <View style={[styles.iconBox, { backgroundColor }]}>
      <Image source={source} style={styles.iconImage} tintColor={tintColor} resizeMode="contain" />
    </View>
  );
}

function DetailValue({
  row,
  onLinkPress,
}: {
  row: DetailRow;
  onLinkPress: (url?: string, isMap?: boolean) => void;
}) {
  const { t } = useTranslation();

  if (row.statusName) {
    return (
      <View
        style={[
          styles.statusBadge,
          { backgroundColor: row.statusColor || AppColors.primary },
        ]}
      >
        <Text style={styles.statusText}>{t(row.statusName)}</Text>
      </View>
    );
  }

  if (row.labels !== undefined) {
    if (!row.labels.length) {
      return <Text style={styles.rowValue}>---</Text>;
    }
    return (
      <View style={styles.labelWrap}>
        {row.labels.map((label) => (
          <View key={label} style={styles.labelChip}>
            <Text style={styles.labelText}>{t(label)}</Text>
          </View>
        ))}
      </View>
    );
  }

  if (row.link) {
    return (
      <Pressable onPress={() => onLinkPress(row.link, row.isMap)}>
        <Text style={styles.linkValue} numberOfLines={3}>
          {row.value}
        </Text>
      </Pressable>
    );
  }

  return (
    <Text style={styles.rowValue} numberOfLines={3}>
      {row.value || "-"}
    </Text>
  );
}

export default function ConnectionDetailsScreen() {
  const { t } = useTranslation();
  const { top, scrollPadding } = useScreenInsets();
  const params = useLocalSearchParams<{ id: string; color?: string }>();

  const [data, setData] = useState<ConnectionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const { apiError, clearApiError, captureApiError } = useApiErrorState();

  const loadDetails = useCallback(async () => {
    if (!params.id) return;
    try {
      setLoading(true);
      clearApiError();
      const response = await fetchConnectionDetails(params.id);
      if (response?.status && response.data?.relaties) {
        setData(response.data.relaties);
      }
    } catch (error) {
      captureApiError(error);
    } finally {
      setLoading(false);
    }
  }, [params.id, clearApiError, captureApiError]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const rows = useMemo(
    () => (data ? buildDetailRows(data, t) : []),
    [data, t]
  );

  const openLink = async (url?: string, isMap?: boolean) => {
    if (!url) return;
    if (isMap) {
      await openMapsAddress(url);
      return;
    }
    try {
      await Linking.openURL(url);
    } catch {
      // ignore
    }
  };

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <ScreenHeader title={t("Connections Details")} />

      {loading && !data ? (
        <ApiFeedback loading />
      ) : apiError && !data ? (
        <ApiFeedback error={apiError} onRetry={loadDetails} />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.profileRow}>
            <FallBackImage
              source={data?.file_path ? { uri: data.file_path } : undefined}
              style={styles.profileImage}
              resizeMode="cover"
            />
            <View style={styles.profileText}>
              <Text style={styles.profileName}>{data?.display_name || "-"}</Text>
              <Text style={styles.profileRole}>{data?.soort_relatie || "-"}</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            {rows.map((row, index) => (
              <View
                key={row.key}
                style={[styles.row, index === rows.length - 1 && styles.rowLast]}
              >
                <DetailIcon
                  source={row.icon}
                  backgroundColor={row.iconBg}
                  tintColor={row.iconColor}
                />
                <Text style={styles.rowLabel}>{row.label}</Text>
                <View style={styles.rowValueWrap}>
                  <DetailValue row={row} onLinkPress={openLink} />
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CONNECTION_UI.pageBackground,
  },
  content: {
    paddingHorizontal: CONNECTION_UI.screenPadding,
    paddingTop: CONNECTION_UI.listTop,
    backgroundColor: AppColors.white,
    flexGrow: 1,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F3F4F6",
  },
  profileText: {
    flex: 1,
  },
  profileName: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 18,
    lineHeight: 24,
    color: AppColors.black,
    marginBottom: 4,
  },
  profileRole: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 14,
    lineHeight: 20,
    color: AppColors.primary,
  },
  infoCard: {
    backgroundColor: AppColors.white,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: CONNECTION_UI.border,
    borderStyle: "dashed",
    gap: 12,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  iconBox: {
    width: CONNECTION_UI.detailIconSize,
    height: CONNECTION_UI.detailIconSize,
    borderRadius: CONNECTION_UI.radiusDetailIcon,
    alignItems: "center",
    justifyContent: "center",
  },
  iconImage: {
    width: 20,
    height: 20,
  },
  rowLabel: {
    flex: 1,
    fontFamily: FONTS.LexendMedium,
    fontSize: 14,
    lineHeight: 20,
    color: AppColors.black,
  },
  rowValueWrap: {
    maxWidth: "44%",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  rowValue: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 13,
    lineHeight: 18,
    color: AppColors.subtitle,
    textAlign: "right",
  },
  linkValue: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 13,
    lineHeight: 18,
    color: AppColors.subtitle,
    textAlign: "right",
  },
  statusBadge: listScreenStyles.statusBadge,
  statusText: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 12,
    lineHeight: 16,
    color: AppColors.white,
  },
  labelWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    justifyContent: "flex-end",
  },
  labelChip: {
    backgroundColor: "#E8F0FD",
    borderRadius: CONNECTION_UI.radiusButton,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  labelText: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 11,
    color: AppColors.primary,
  },
  loaderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
