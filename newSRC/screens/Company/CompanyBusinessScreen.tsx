import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  ImageSourcePropType,
  KeyboardAvoidingView,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import ScreenHeader from "../../Components/ScreenHeader";
import ApiFeedback from "../../Components/ApiFeedback";
import AuthInput from "../../Components/Auth/AuthInput";
import AuthButton from "../../Components/Auth/AuthButton";
import FallBackImage from "../../Components/FallBackImage";
import { GooglePlacesField } from "../../Components/GooglePlacesInput";
import SelectionSheet from "../../Components/Auth/SelectionSheet";
import {
  fetchBusinessCompanyById,
  fetchServiceList,
  updateBusinessCompany,
  type BusinessCompanyItem,
  type ServiceTag,
} from "../../services/companyService";
import { useApiErrorState } from "../../hooks/useApiErrorState";
import { getKeyboardAvoidBehavior, useScreenInsets } from "../../utils/screenInsets";
import { AppColors } from "../../utils/theme";
import { FONTS } from "../../utils/FONTS";
import { Images } from "../../utils/Images";
import { LIST_UI } from "../../utils/connectionTheme";

type ImageAsset = { uri: string; type?: string; name?: string };

type DetailRow = {
  key: string;
  label: string;
  value: string;
  icon: ImageSourcePropType;
  iconBg: string;
  iconColor: string;
  link?: string;
  section?: string;
};

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

function SectionHeader({
  title,
  icon,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIconBox}>
        <Ionicons name={icon} size={16} color={AppColors.primary} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

export default function CompanyBusinessScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { top, scrollPadding } = useScreenInsets();
  const params = useLocalSearchParams<{ id?: string; color?: string }>();
  const companyId = params.id ?? "";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [company, setCompany] = useState<BusinessCompanyItem | null>(null);
  const [serviceList, setServiceList] = useState<ServiceTag[]>([]);
  const [tagSheetOpen, setTagSheetOpen] = useState(false);
  const { apiError, clearApiError, captureApiError } = useApiErrorState();

  const [title, setTitle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [companyProfile, setCompanyProfile] = useState("");
  const [business, setBusiness] = useState("");
  const [website, setWebsite] = useState("");
  const [facebook, setFacebook] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [instagram, setInstagram] = useState("");
  const [youtube, setYoutube] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappCountryCode, setWhatsappCountryCode] = useState("31");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneCountryCode, setPhoneCountryCode] = useState("31");
  const [googleMaps, setGoogleMaps] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [country, setCountry] = useState("");
  const [kvk, setKvk] = useState("");
  const [btw, setBtw] = useState("");
  const [businessTags, setBusinessTags] = useState<string[]>([]);
  const [logo, setLogo] = useState<ImageAsset | null>(null);
  const [existingLogoUri, setExistingLogoUri] = useState<string | null>(null);
  const [gallery, setGallery] = useState<ImageAsset[]>([]);

  const hydrateForm = (item: BusinessCompanyItem) => {
    const details = item.ecommerce_businesses?.[0];
    setTitle(details?.title || item.display_name || "");
    setDisplayName(item.display_name || "");
    setCompanyProfile(details?.ec_company_profile || "");
    setBusiness(details?.ec_business || "");
    setWebsite(details?.website || "");
    setFacebook(details?.facebook || "");
    setLinkedin(details?.linkedin || "");
    setInstagram(details?.instagram || "");
    setYoutube(details?.youtube || "");
    setTiktok(details?.tiktok || "");
    setWhatsappNumber(details?.whatsapp_number || "");
    setWhatsappCountryCode(details?.country_code_wh || "31");
    setEmail(item.email_adres || "");
    setPhone(item.telefoon || "");
    setPhoneCountryCode(item.telefoon_country_code || "31");
    setGoogleMaps(item.google_maps || "");
    setCity(item.city || "");
    setRegion(item.region || "");
    setCountry(item.country || "");
    setKvk(item.kvk_nr || "");
    setBtw(item.btw_nr || "");
    setExistingLogoUri(details?.business_dropbox_shared_link || null);
    setLogo(null);
    setBusinessTags(
      details?.business_tag
        ? String(details.business_tag)
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : []
    );
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      clearApiError();
      const [item, services] = await Promise.all([
        fetchBusinessCompanyById(companyId),
        fetchServiceList().catch(() => []),
      ]);
      setCompany(item);
      setServiceList(services);
      if (item) hydrateForm(item);
    } catch (error) {
      captureApiError(error);
      setCompany(null);
    } finally {
      setLoading(false);
    }
  }, [companyId, clearApiError, captureApiError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const tagLabel = useMemo(() => {
    if (!businessTags.length) return undefined;
    return serviceList
      .filter((item) => businessTags.includes(String(item.id)))
      .map((item) => item.service_name)
      .join(", ");
  }, [businessTags, serviceList]);

  const phoneDisplay =
    phoneCountryCode && phone ? `+${phoneCountryCode} ${phone}` : phone || "-";
  const whatsappDisplay =
    whatsappCountryCode && whatsappNumber
      ? `+${whatsappCountryCode} ${whatsappNumber}`
      : whatsappNumber || "-";

  const detailRows = useMemo<DetailRow[]>(() => {
    return [
      {
        key: "title",
        label: t("Title"),
        value: title || "-",
        icon: Images.ConnectionLabel,
        iconBg: "#F2E6FF",
        iconColor: "#7C00FF",
        section: t("Vendor Information"),
      },
      {
        key: "profile",
        label: t("Company Profile"),
        value: companyProfile || "-",
        icon: Images.NoteIcon,
        iconBg: "#E8F0FD",
        iconColor: AppColors.primary,
      },
      {
        key: "business",
        label: t("Business"),
        value: business || "-",
        icon: Images.BagVector,
        iconBg: "#FFF8E6",
        iconColor: "#F5A623",
      },
      {
        key: "address",
        label: t("Address"),
        value: googleMaps || "-",
        icon: Images.ConnectionLocation,
        iconBg: "#E6FBFF",
        iconColor: "#00D0FF",
        section: t("Contact"),
      },
      {
        key: "city",
        label: t("City"),
        value: [city, region, country].filter(Boolean).join(", ") || "-",
        icon: Images.ConnectionLocation,
        iconBg: "#E6FBFF",
        iconColor: "#00D0FF",
      },
      {
        key: "email",
        label: t("Email"),
        value: email || "-",
        icon: Images.ConnectionMail,
        iconBg: "#FFF8E6",
        iconColor: "#F5A623",
      },
      {
        key: "phone",
        label: t("Phone"),
        value: phoneDisplay,
        icon: Images.ConnectionPhone,
        iconBg: "#E7F7E8",
        iconColor: "#06AC14",
      },
      {
        key: "whatsapp",
        label: t("Whatsapp No."),
        value: whatsappDisplay,
        icon: Images.ConnectionPhone,
        iconBg: "#E7F7E8",
        iconColor: "#25D366",
      },
      {
        key: "kvk",
        label: t("KVK"),
        value: kvk || "-",
        icon: Images.NoteIcon,
        iconBg: "#F3F4F6",
        iconColor: "#6B7280",
        section: t("Company details"),
      },
      {
        key: "btw",
        label: t("BTW"),
        value: btw || "-",
        icon: Images.BagVector,
        iconBg: "#E7F7E8",
        iconColor: "#06AC14",
      },
      {
        key: "website",
        label: t("Website"),
        value: website || "-",
        link: website || undefined,
        icon: Images.ConnectionWebsite,
        iconBg: "#F2E6FF",
        iconColor: "#7C00FF",
        section: t("Social"),
      },
      {
        key: "facebook",
        label: t("Facebook"),
        value: facebook || "-",
        link: facebook || undefined,
        icon: Images.ConnectionFacebook,
        iconBg: "#E6EBFF",
        iconColor: "#0037FF",
      },
      {
        key: "linkedin",
        label: t("LinkedIn"),
        value: linkedin || "-",
        link: linkedin || undefined,
        icon: Images.ConnectionLinkedin,
        iconBg: "#FFE6EF",
        iconColor: "#FF005E",
      },
      {
        key: "instagram",
        label: t("Instagram"),
        value: instagram || "-",
        link: instagram || undefined,
        icon: Images.ConnectionWebsite,
        iconBg: "#FFE8F3",
        iconColor: "#E1306C",
      },
      {
        key: "youtube",
        label: t("YouTube"),
        value: youtube || "-",
        link: youtube || undefined,
        icon: Images.ConnectionWebsite,
        iconBg: "#FFE6E6",
        iconColor: "#FF0000",
      },
      {
        key: "tiktok",
        label: t("TikTok"),
        value: tiktok || "-",
        link: tiktok || undefined,
        icon: Images.ConnectionWebsite,
        iconBg: "#F3F4F6",
        iconColor: "#111827",
      },
      {
        key: "tags",
        label: t("Business tags"),
        value: tagLabel || "-",
        icon: Images.ConnectionLabel,
        iconBg: "#F2E6FF",
        iconColor: "#7C00FF",
      },
    ];
  }, [
    t,
    title,
    companyProfile,
    business,
    googleMaps,
    city,
    region,
    country,
    email,
    phoneDisplay,
    whatsappDisplay,
    kvk,
    btw,
    website,
    facebook,
    linkedin,
    instagram,
    youtube,
    tiktok,
    tagLabel,
  ]);

  const logoUri = logo?.uri || existingLogoUri;

  const pickLogo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setLogo({
      uri: asset.uri,
      type: asset.mimeType || "image/jpeg",
      name: asset.fileName || "logo.jpg",
    });
  };

  const pickGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.length) return;
    setGallery((prev) => [
      ...prev,
      ...result.assets.map((asset, index) => ({
        uri: asset.uri,
        type: asset.mimeType || "image/jpeg",
        name: asset.fileName || `gallery_${index}.jpg`,
      })),
    ]);
  };

  const toggleTag = (tagId: string) => {
    setBusinessTags((prev) =>
      prev.includes(tagId) ? prev.filter((item) => item !== tagId) : [...prev, tagId]
    );
  };

  const openLink = async (url?: string) => {
    if (!url || url === "-") return;
    const normalized = url.startsWith("http") ? url : `https://${url}`;
    try {
      await Linking.openURL(normalized);
    } catch {
      // ignore
    }
  };

  const handleSave = async () => {
    if (!company) return;
    try {
      setSubmitting(true);
      const payload: Record<string, unknown> = {
        title,
        ec_company_profile: companyProfile,
        ec_business: business,
        website,
        facebook,
        linkedin,
        instagram,
        youtube,
        tiktok,
        enable_title: "1",
        display_name: displayName,
        google_maps: googleMaps,
        contact_telefoon: phone,
        contact_telefoon_country_code: phoneCountryCode,
        email_adres: email,
        kvk_nr: kvk,
        btw_nr: btw,
        country,
        region,
        city,
        whatsapp_number: whatsappNumber,
        country_code_wh: whatsappCountryCode,
        company_relaties_id: company.id ?? companyId,
        company_id: company.company || "",
        business_tag: businessTags,
      };

      if (!payload.company_relaties_id) {
        Alert.alert(t("Error"), t("Something went wrong"));
        return;
      }

      if (logo?.uri) payload.business_company_logo = logo;
      gallery.slice(0, 4).forEach((img, idx) => {
        payload[`ec_image_${idx + 1}`] = img;
      });

      await updateBusinessCompany(payload);
      Alert.alert(t("Success"), t("Vendor updated successfully"));
      setEditMode(false);
      loadData();
    } catch (error: unknown) {
      Alert.alert(t("Error"), error instanceof Error ? error.message : t("Something went wrong"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <ScreenHeader title={t("Vendor Detail")} onBack={() => router.back()} />

      {loading ? (
        <ApiFeedback loading />
      ) : apiError ? (
        <ApiFeedback error={apiError} onRetry={loadData} />
      ) : !company ? (
        <ApiFeedback emptyMessage={t("No Companies Found")} />
      ) : (
        <KeyboardAvoidingView style={styles.flex} behavior={getKeyboardAvoidBehavior()}>
          <ScrollView
            contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.profileCard}>
              <Pressable
                style={styles.logoWrap}
                onPress={editMode ? pickLogo : undefined}
                disabled={!editMode}
              >
                <FallBackImage
                  source={logoUri ? { uri: logoUri } : Images.DefaultImage}
                  style={styles.logoImage}
                  resizeMode="cover"
                />
                {editMode ? (
                  <View style={styles.logoEditBadge}>
                    <Ionicons name="camera" size={14} color={AppColors.white} />
                  </View>
                ) : null}
              </Pressable>

              <View style={styles.profileText}>
                <Text style={styles.profileName} numberOfLines={2}>
                  {displayName || title || t("No Name")}
                </Text>
                {city ? (
                  <View style={styles.profileMetaRow}>
                    <Ionicons name="location-outline" size={14} color={AppColors.subtitle} />
                    <Text style={styles.profileMeta} numberOfLines={1}>
                      {city}
                    </Text>
                  </View>
                ) : null}
                {email ? (
                  <View style={styles.profileMetaRow}>
                    <Ionicons name="mail-outline" size={14} color={AppColors.subtitle} />
                    <Text style={styles.profileMeta} numberOfLines={1}>
                      {email}
                    </Text>
                  </View>
                ) : null}
              </View>

              <Pressable
                style={[styles.editBtn, editMode && styles.cancelBtn]}
                onPress={() => setEditMode((prev) => !prev)}
              >
                <Ionicons
                  name={editMode ? "close" : "create-outline"}
                  size={16}
                  color={AppColors.white}
                />
                <Text style={styles.editBtnText}>{editMode ? t("Cancel") : t("Edit")}</Text>
              </Pressable>
            </View>

            {!editMode ? (
              <View style={styles.detailsList}>
                {detailRows.map((row, index) => (
                  <View key={row.key}>
                    {row.section ? (
                      <Text style={[styles.groupTitle, index > 0 && styles.groupTitleSpaced]}>
                        {row.section}
                      </Text>
                    ) : null}
                    <View
                      style={[styles.row, index === detailRows.length - 1 && styles.rowLast]}
                    >
                      <DetailIcon
                        source={row.icon}
                        backgroundColor={row.iconBg}
                        tintColor={row.iconColor}
                      />
                      <Text style={styles.rowLabel}>{row.label}</Text>
                      <View style={styles.rowValueWrap}>
                        {row.link ? (
                          <Pressable onPress={() => openLink(row.link)}>
                            <Text style={styles.rowValue} numberOfLines={3}>
                              {row.value}
                            </Text>
                          </Pressable>
                        ) : (
                          <Text style={styles.rowValue} numberOfLines={4}>
                            {row.value}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.formWrap}>
                <SectionHeader title={t("Vendor Information")} icon="business-outline" />
                <AuthInput
                  label={t("Title")}
                  value={title}
                  onChangeText={setTitle}
                  iconName="pricetag-outline"
                />
                <AuthInput
                  label={t("Display Name")}
                  value={displayName}
                  onChangeText={setDisplayName}
                  iconName="storefront-outline"
                />
                <AuthInput
                  label={t("Company Profile")}
                  value={companyProfile}
                  onChangeText={setCompanyProfile}
                  iconName="document-text-outline"
                  multiline
                  style={{ minHeight: 90, textAlignVertical: "top" }}
                />
                <AuthInput
                  label={t("Business")}
                  value={business}
                  onChangeText={setBusiness}
                  iconName="briefcase-outline"
                  multiline
                  style={{ minHeight: 90, textAlignVertical: "top" }}
                />

                <SectionHeader title={t("Contact")} icon="call-outline" />
                <GooglePlacesField
                  label={t("Address")}
                  value={googleMaps}
                  onChangeText={setGoogleMaps}
                  placeholder={t("Enter address")}
                  containerStyle={{ marginBottom: 0 }}
                />
                <AuthInput
                  label={t("City")}
                  value={city}
                  onChangeText={setCity}
                  iconName="location-outline"
                />
                <AuthInput
                  label={t("Region")}
                  value={region}
                  onChangeText={setRegion}
                  iconName="map-outline"
                />
                <AuthInput
                  label={t("Country")}
                  value={country}
                  onChangeText={setCountry}
                  iconName="globe-outline"
                />
                <AuthInput
                  label={t("Email")}
                  value={email}
                  onChangeText={setEmail}
                  iconName="mail-outline"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <AuthInput
                  label={t("Phone")}
                  value={phone}
                  onChangeText={setPhone}
                  iconName="call-outline"
                  keyboardType="phone-pad"
                />
                <AuthInput
                  label={t("Country code")}
                  value={phoneCountryCode}
                  onChangeText={setPhoneCountryCode}
                  iconName="flag-outline"
                  keyboardType="phone-pad"
                />
                <AuthInput
                  label={t("Whatsapp No.")}
                  value={whatsappNumber}
                  onChangeText={(value) => setWhatsappNumber(value.replace(/[^0-9]/g, ""))}
                  iconName="logo-whatsapp"
                  keyboardType="phone-pad"
                />
                <AuthInput
                  label={t("WhatsApp country code")}
                  value={whatsappCountryCode}
                  onChangeText={setWhatsappCountryCode}
                  iconName="flag-outline"
                  keyboardType="phone-pad"
                />

                <SectionHeader title={t("Company details")} icon="card-outline" />
                <AuthInput label={t("KVK")} value={kvk} onChangeText={setKvk} iconName="id-card-outline" />
                <AuthInput label={t("BTW")} value={btw} onChangeText={setBtw} iconName="receipt-outline" />

                <SectionHeader title={t("Social")} icon="share-social-outline" />
                <AuthInput
                  label={t("Website")}
                  value={website}
                  onChangeText={setWebsite}
                  iconName="globe-outline"
                  autoCapitalize="none"
                />
                <AuthInput
                  label={t("Facebook")}
                  value={facebook}
                  onChangeText={setFacebook}
                  iconName="logo-facebook"
                  autoCapitalize="none"
                />
                <AuthInput
                  label={t("LinkedIn")}
                  value={linkedin}
                  onChangeText={setLinkedin}
                  iconName="logo-linkedin"
                  autoCapitalize="none"
                />
                <AuthInput
                  label={t("Instagram")}
                  value={instagram}
                  onChangeText={setInstagram}
                  iconName="logo-instagram"
                  autoCapitalize="none"
                />
                <AuthInput
                  label={t("YouTube")}
                  value={youtube}
                  onChangeText={setYoutube}
                  iconName="logo-youtube"
                  autoCapitalize="none"
                />
                <AuthInput
                  label={t("TikTok")}
                  value={tiktok}
                  onChangeText={setTiktok}
                  iconName="logo-tiktok"
                  autoCapitalize="none"
                />

                <Pressable style={styles.tagSelect} onPress={() => setTagSheetOpen(true)}>
                  <View style={styles.tagSelectHeader}>
                    <Ionicons name="pricetags-outline" size={18} color={AppColors.primary} />
                    <Text style={styles.tagLabel}>{t("Business tags")}</Text>
                  </View>
                  <Text style={styles.tagValue}>{tagLabel || t("Select")}</Text>
                </Pressable>

                <Pressable style={styles.galleryBtn} onPress={pickGallery}>
                  <Ionicons name="images-outline" size={18} color={AppColors.primary} />
                  <Text style={styles.galleryBtnText}>{t("Add gallery images")}</Text>
                </Pressable>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.galleryRow}
                >
                  {gallery.map((image, index) => (
                    <Image
                      key={`${image.uri}-${index}`}
                      source={{ uri: image.uri }}
                      style={styles.galleryImage}
                    />
                  ))}
                </ScrollView>

                <AuthButton
                  title={submitting ? t("Loading...") : t("Save")}
                  onPress={handleSave}
                  disabled={submitting}
                />
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      <SelectionSheet
        visible={tagSheetOpen}
        title={t("Business tags")}
        options={serviceList.map((item) => ({
          label: `${businessTags.includes(String(item.id)) ? "✓ " : ""}${item.service_name || "-"}`,
          value: String(item.id),
        }))}
        closeOnSelect={false}
        onClose={() => setTagSheetOpen(false)}
        onSelect={(option) => toggleTag(option.value)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.white },
  flex: { flex: 1 },
  content: {
    paddingHorizontal: LIST_UI.screenPadding,
    paddingTop: 16,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
  },
  logoImage: { width: "100%", height: "100%" },
  logoEditBadge: {
    position: "absolute",
    right: 4,
    bottom: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: AppColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  profileText: { flex: 1 },
  profileName: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 17,
    lineHeight: 22,
    color: AppColors.black,
    marginBottom: 4,
  },
  profileMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  profileMeta: {
    flex: 1,
    fontFamily: FONTS.LexendRegular,
    fontSize: 12,
    color: AppColors.subtitle,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: AppColors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cancelBtn: { backgroundColor: "#EF4444" },
  editBtnText: {
    color: AppColors.white,
    fontFamily: FONTS.LexendMedium,
    fontSize: 13,
  },
  detailsList: { backgroundColor: AppColors.white },
  groupTitle: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 14,
    lineHeight: 20,
    color: AppColors.black,
    marginTop: 4,
    marginBottom: 4,
  },
  groupTitleSpaced: { marginTop: 18 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    borderStyle: "dashed",
    gap: 12,
  },
  rowLast: { borderBottomWidth: 0 },
  iconBox: {
    width: LIST_UI.detailIconSize,
    height: LIST_UI.detailIconSize,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  iconImage: { width: 20, height: 20 },
  rowLabel: {
    flex: 1,
    fontFamily: FONTS.LexendRegular,
    fontSize: 14,
    lineHeight: 20,
    color: AppColors.black,
  },
  rowValueWrap: { maxWidth: "46%", alignItems: "flex-end" },
  rowValue: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 13,
    lineHeight: 18,
    color: AppColors.subtitle,
    textAlign: "right",
  },
  formWrap: { gap: 4 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    marginBottom: 8,
  },
  sectionIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#E8F0FD",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 15,
    color: AppColors.black,
  },
  tagSelect: {
    borderWidth: 1,
    borderColor: "#D8DEE6",
    borderRadius: 10,
    padding: 12,
    backgroundColor: AppColors.white,
    marginTop: 8,
  },
  tagSelectHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  tagLabel: { fontFamily: FONTS.LexendMedium, fontSize: 12, color: AppColors.black },
  tagValue: { fontFamily: FONTS.LexendRegular, fontSize: 14, color: AppColors.subtitle },
  galleryBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: AppColors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  galleryBtnText: { fontFamily: FONTS.LexendMedium, fontSize: 13, color: AppColors.primary },
  galleryRow: { gap: 10, marginTop: 10, marginBottom: 8 },
  galleryImage: { width: 88, height: 88, borderRadius: 8, backgroundColor: "#EEF2F7" },
});
