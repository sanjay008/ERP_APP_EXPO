import React, { useCallback, useMemo, useState } from "react";
import {
  Image,
  ImageSourcePropType,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import FallBackImage from "../../Components/FallBackImage";
import { getData } from "../../utils/storeData";
import { useScreenInsets } from "../../utils/screenInsets";
import { AppColors } from "../../utils/theme";
import { FONTS } from "../../utils/FONTS";
import { Images } from "../../utils/Images";
import { LIST_UI } from "../../utils/connectionTheme";
import { isOpenableAddress, openMapsAddress } from "../../utils/openMaps";

type DetailRow = {
  key: string;
  label: string;
  value: string;
  icon: ImageSourcePropType;
  iconBg: string;
  iconColor: string;
  section?: string;
  isMap?: boolean;
};

type StoredUserData = {
  data?: {
    user?: {
      role?: string;
      profile_image?: string;
      email?: string;
    };
    relaties?: {
      display_name?: string;
      email_adres?: string;
      email_adres_private?: string;
      country_code?: string;
      mobiel?: string;
      contact_telefoon_country_code?: string | number | null;
      telefoon?: string | null;
      google_maps?: string;
      birth_date?: string;
      birth_place?: string;
      country_data?: { id?: number | string; name?: string };
      iban?: string;
      marital_status?: string;
      bsn_nr?: string;
      document_nr?: string;
      facebook_url?: string;
      voertuig_kentekencheck?: string;
      website?: string;
      file_path?: string;
    };
  };
};

type ProfileDetailRow = DetailRow;

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

function buildDetailRows(
  data: StoredUserData | null,
  t: (key: string) => string
): ProfileDetailRow[] {
  const relaties = data?.data?.relaties;

  const whatsapp =
    relaties?.country_code && relaties?.mobiel
      ? `+${relaties.country_code} ${relaties.mobiel}`
      : "";

  const phone =
    relaties?.contact_telefoon_country_code != null &&
    relaties?.telefoon != null &&
    String(relaties.telefoon).trim() !== ""
      ? `+${relaties.contact_telefoon_country_code} ${relaties.telefoon}`
      : "";

  return [
    {
      key: "name",
      label: t("Naam"),
      value: relaties?.display_name || "-",
      icon: Images.userVector,
      iconBg: "#E8F0FD",
      iconColor: AppColors.primary,
      section: t("Personalia"),
    },
    {
      key: "email",
      label: t("E-mailadres"),
      value: relaties?.email_adres || "-",
      icon: Images.ConnectionMail,
      iconBg: "#FFF8E6",
      iconColor: "#F5A623",
    },
    {
      key: "privateEmail",
      label: t("Prive E-mailadres"),
      value: relaties?.email_adres_private || "-",
      icon: Images.ConnectionMail,
      iconBg: "#FFF8E6",
      iconColor: "#F5A623",
    },
    {
      key: "whatsapp",
      label: t("WhatsApp-nummer"),
      value: whatsapp || "-",
      icon: Images.ConnectionPhone,
      iconBg: "#E7F7E8",
      iconColor: "#06AC14",
    },
    {
      key: "phone",
      label: t("Telefoon"),
      value: phone || "-",
      icon: Images.ConnectionPhone,
      iconBg: "#E7F7E8",
      iconColor: "#06AC14",
    },
    {
      key: "address",
      label: t("Adres"),
      value: relaties?.google_maps || "-",
      icon: Images.ConnectionLocation,
      iconBg: "#E6FBFF",
      iconColor: "#00D0FF",
      isMap: isOpenableAddress(relaties?.google_maps),
    },
    {
      key: "birthDate",
      label: t("Geboortedatum"),
      value: relaties?.birth_date || "-",
      icon: Images.CalendarVector,
      iconBg: "#FFF0E6",
      iconColor: "#FF8A00",
    },
    {
      key: "birthPlace",
      label: t("Geboorteplaats"),
      value: relaties?.birth_place || "-",
      icon: Images.ConnectionLocation,
      iconBg: "#E6FBFF",
      iconColor: "#00D0FF",
    },
    {
      key: "nationality",
      label: t("Nationaliteit"),
      value: relaties?.country_data?.name || "-",
      icon: Images.userVector,
      iconBg: "#E8F0FD",
      iconColor: AppColors.primary,
    },
    {
      key: "iban",
      label: t("IBAN"),
      value: relaties?.iban || "-",
      icon: Images.BagVector,
      iconBg: "#E7F7E8",
      iconColor: "#06AC14",
      section: t("Financieel"),
    },
    {
      key: "marital",
      label: t("Burgerlijke staat"),
      value: relaties?.marital_status || "-",
      icon: Images.ConnectionStatus,
      iconBg: "#FFE6EF",
      iconColor: "#FF005E",
    },
    {
      key: "bsn",
      label: t("Burgerservicenummer (BSN) "),
      value: relaties?.bsn_nr || "-",
      icon: Images.NoteIcon,
      iconBg: "#F2E6FF",
      iconColor: "#7C00FF",
    },
    {
      key: "document",
      label: t("Document nr (ID/Paspoort)"),
      value: relaties?.document_nr || "-",
      icon: Images.NoteIcon,
      iconBg: "#F2E6FF",
      iconColor: "#7C00FF",
    },
    {
      key: "facebook",
      label: t("Facebook"),
      value: relaties?.facebook_url || "-",
      icon: Images.ConnectionFacebook,
      iconBg: "#E6EBFF",
      iconColor: "#0037FF",
    },
    {
      key: "linkedin",
      label: t("LinkedIn"),
      value: relaties?.voertuig_kentekencheck || "-",
      icon: Images.ConnectionLinkedin,
      iconBg: "#FFE6EF",
      iconColor: "#FF005E",
    },
  ];
}

export default function ProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { top, scrollPadding } = useScreenInsets();

  const [userData, setUserData] = useState<StoredUserData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadProfile = useCallback(async () => {
    const stored = await getData("USERDATA");
    setUserData(stored);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const rows = useMemo(() => buildDetailRows(userData, t), [userData, t]);

  const displayName = userData?.data?.relaties?.display_name || "-";
  const displayEmail =
    userData?.data?.relaties?.email_adres ||
    userData?.data?.user?.email ||
    "-";
  const profileImage =
    userData?.data?.user?.profile_image || userData?.data?.relaties?.file_path || null;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  }, [loadProfile]);

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={AppColors.white} />

      <View style={styles.header}>
        <Pressable
          style={styles.headerBtn}
          onPress={() => {
            if (router.canGoBack()) router.back();
          }}
        >
          <FallBackImage source={Images.BackIcon} style={styles.backIcon} resizeMode="contain" />
        </Pressable>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {t("My Profile")}
        </Text>

        <View style={styles.headerActions}>
          <Pressable
            style={styles.headerBtn}
            onPress={() => router.push("/(app)/profile/settings")}
          >
            <Ionicons name="settings-outline" size={18} color={AppColors.black} />
          </Pressable>
          <Pressable
            style={styles.headerBtn}
            onPress={() => router.push("/(app)/profile/edit")}
          >
            <Image source={Images.EditVector} style={styles.editIcon} resizeMode="contain" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[AppColors.primary]}
            tintColor={AppColors.primary}
          />
        }
      >
        <View style={styles.profileRow}>
          <FallBackImage
            source={profileImage ? { uri: profileImage } : Images.DefaultImage}
            style={styles.avatar}
            resizeMode="cover"
          />
          <View style={styles.profileText}>
            <Text style={styles.profileName} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.profileEmail} numberOfLines={1}>
              {displayEmail}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t("Personal Details")}</Text>

        <View style={styles.detailsList}>
          {rows.map((row, index) => (
            <View key={row.key}>
              {row.section ? (
                <Text style={[styles.groupTitle, index > 0 && styles.groupTitleSpaced]}>
                  {row.section}
                </Text>
              ) : null}
              <View style={[styles.row, index === rows.length - 1 && styles.rowLast]}>
                <DetailIcon
                  source={row.icon}
                  backgroundColor={row.iconBg}
                  tintColor={row.iconColor}
                />
                <Text style={styles.rowLabel}>{row.label}</Text>
                <View style={styles.rowValueWrap}>
                  {row.isMap ? (
                    <Pressable onPress={() => openMapsAddress(row.value)}>
                      <Text style={styles.rowLink} numberOfLines={3}>
                        {row.value}
                      </Text>
                    </Pressable>
                  ) : (
                    <Text style={styles.rowValue} numberOfLines={3}>
                      {row.value}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: LIST_UI.screenPadding,
    paddingVertical: LIST_UI.headerPaddingV,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  headerBtn: {
    width: LIST_UI.buttonSize,
    height: LIST_UI.buttonSize,
    borderRadius: LIST_UI.radiusButton,
    backgroundColor: LIST_UI.surface,
    borderWidth: 1,
    borderColor: LIST_UI.border,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  backIcon: {
    width: 18,
    height: 18,
  },
  editIcon: {
    width: 18,
    height: 18,
    tintColor: AppColors.black,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 17,
    color: AppColors.black,
    marginHorizontal: 8,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  content: {
    paddingHorizontal: LIST_UI.screenPadding,
    paddingTop: 20,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 28,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },
  profileText: {
    flex: 1,
    justifyContent: "center",
  },
  profileName: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 18,
    lineHeight: 24,
    color: AppColors.black,
    marginBottom: 4,
  },
  profileEmail: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 13,
    lineHeight: 18,
    color: AppColors.subtitle,
  },
  sectionTitle: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 16,
    lineHeight: 22,
    color: AppColors.black,
    marginBottom: 8,
  },
  groupTitle: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 14,
    lineHeight: 20,
    color: AppColors.black,
    marginTop: 4,
    marginBottom: 4,
  },
  groupTitleSpaced: {
    marginTop: 20,
  },
  detailsList: {
    backgroundColor: AppColors.white,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    borderStyle: "dashed",
    gap: 12,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  iconBox: {
    width: LIST_UI.detailIconSize,
    height: LIST_UI.detailIconSize,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  iconImage: {
    width: 20,
    height: 20,
  },
  rowLabel: {
    flex: 1,
    fontFamily: FONTS.LexendRegular,
    fontSize: 14,
    lineHeight: 20,
    color: AppColors.black,
  },
  rowValueWrap: {
    maxWidth: "46%",
    alignItems: "flex-end",
  },
  rowValue: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 13,
    lineHeight: 18,
    color: AppColors.subtitle,
    textAlign: "right",
  },
  rowLink: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 13,
    lineHeight: 18,
    color: AppColors.primary,
    textAlign: "right",
    textDecorationLine: "underline",
  },
});
