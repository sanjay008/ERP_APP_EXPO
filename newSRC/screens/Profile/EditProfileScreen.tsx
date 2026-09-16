import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import AuthButton from "../../Components/Auth/AuthButton";
import AuthInput from "../../Components/Auth/AuthInput";
import FormSelectField from "../../Components/FormSelectField";
import SelectionBottomSheet, { type SheetOption } from "../../Components/SelectionBottomSheet";
import { GooglePlacesField } from "../../Components/GooglePlacesInput";
import ScreenHeader from "../../Components/ScreenHeader";
import FallBackImage from "../../Components/FallBackImage";
import { RegisterBackContext } from "../../constants/GoBackContext";
import {
  loadProfileSession,
  updateProfileDetails,
  type ProfileImageAsset,
} from "../../services/profileService";
import ApiService from "../../utils/Apiservice";
import apiConstants from "../../utils/apiConstants";
import { getData } from "../../utils/storeData";
import { pickProfileImage } from "../../utils/profileImagePicker";
import { getApiErrorMessage, isValidEmail } from "../../utils/validation";
import { useScreenInsets } from "../../utils/screenInsets";
import { AppColors } from "../../utils/theme";
import { FONTS } from "../../utils/FONTS";
import { Images } from "../../utils/Images";
import { LIST_UI } from "../../utils/connectionTheme";
import { listScreenStyles } from "../../utils/listScreenStyles";

const formatDate = (value: Date) => {
  const day = String(value.getDate()).padStart(2, "0");
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const year = value.getFullYear();
  return `${day}-${month}-${year}`;
};

const parseDate = (value: string) => {
  if (!value) return new Date(1990, 0, 1);
  const [day, month, year] = value.split("-").map(Number);
  if (!day || !month || !year) return new Date(1990, 0, 1);
  return new Date(year, month - 1, day);
};

type CountryOption = { id: string | number; name: string };
type MaritalOption = { id: string | number; name: string };

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { top, scrollPadding } = useScreenInsets();
  const { setToast } = useContext(RegisterBackContext);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [userId, setUserId] = useState<number | string>("");
  const [verifyToken, setVerifyToken] = useState("");
  const [existingImageUri, setExistingImageUri] = useState<string | null>(null);

  const [salutation, setSalutation] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [privateEmail, setPrivateEmail] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [countryCode, setCountryCode] = useState("31");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneCountryCode, setPhoneCountryCode] = useState("31");
  const [address, setAddress] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [nationalityId, setNationalityId] = useState<string | number>("");
  const [nationalityName, setNationalityName] = useState("");
  const [iban, setIban] = useState("");
  const [maritalStatusId, setMaritalStatusId] = useState<string | number>("");
  const [maritalStatusName, setMaritalStatusName] = useState("");
  const [bsn, setBsn] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [profileImage, setProfileImage] = useState<ProfileImageAsset | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [maritalOptions, setMaritalOptions] = useState<MaritalOption[]>([]);
  const [activeSheet, setActiveSheet] = useState<"salutation" | "nationality" | "marital" | null>(
    null
  );

  const salutationOptions = useMemo<SheetOption[]>(
    () => [
      { id: "fam", label: t("fam") },
      { id: "dhr", label: t("dhr") },
      { id: "mevr", label: t("mevr") },
    ],
    [t]
  );

  const nationalitySheetOptions = useMemo<SheetOption[]>(
    () => countries.map((item) => ({ id: item.id, label: item.name, raw: item })),
    [countries]
  );

  const maritalSheetOptions = useMemo<SheetOption[]>(
    () => maritalOptions.map((item) => ({ id: item.id, label: item.name, raw: item })),
    [maritalOptions]
  );

  const loadLookups = useCallback(async () => {
    try {
      const userdata = await getData("USERDATA");
      const token = userdata?.data?.user?.verify_token;
      const relatiesId = userdata?.data?.relaties?.id;
      const role = userdata?.data?.user?.role;
      const uid = userdata?.data?.user?.id;

      const [countryRes, maritalRes] = await Promise.all([
        ApiService<CountryOption[]>(apiConstants.get_country_list, {
          customData: {
            token,
            relaties_id: relatiesId,
            role,
          },
        }),
        ApiService<MaritalOption[]>(apiConstants.maritalstatus, {
          includeToken: true,
          customData: {
            relaties_id: relatiesId,
            role,
            user_id: uid,
          },
        }),
      ]);

      if (countryRes?.status && Array.isArray(countryRes.data)) {
        setCountries(countryRes.data);
      }
      if (maritalRes?.status && Array.isArray(maritalRes.data)) {
        setMaritalOptions(maritalRes.data);
      }
    } catch {
      // Keep form usable without lookup lists.
    }
  }, []);

  const loadProfile = useCallback(async () => {
    setInitialLoading(true);
    try {
      const { session } = await loadProfileSession();
      const user = session?.user;
      const relaties = session?.relaties;

      setUserId(user?.id ?? "");
      setVerifyToken(user?.verify_token ?? "");
      setExistingImageUri(user?.profile_image || relaties?.file_path || null);
      setSalutation(relaties?.aanhef || "");
      setFirstName(relaties?.voornaam || "");
      setMiddleName(relaties?.voorvoegsel || "");
      setLastName(relaties?.achternaam || "");
      setEmail(relaties?.email_adres || "");
      setPrivateEmail(relaties?.email_adres_private || "");
      setWhatsappNumber(relaties?.mobiel || "");
      setCountryCode(String(relaties?.country_code || "31"));
      setPhoneNumber(relaties?.telefoon || "");
      setPhoneCountryCode(String(relaties?.contact_telefoon_country_code || "31"));
      setAddress(relaties?.google_maps || "");
      setBirthPlace(relaties?.birth_place || "");
      setBirthDate(relaties?.birth_date || "");
      setNationalityId(relaties?.country_data?.id || "");
      setNationalityName(relaties?.country_data?.name || "");
      setIban(relaties?.iban || "");
      setMaritalStatusId(relaties?.marital_status_id || "");
      setMaritalStatusName(relaties?.marital_status || "");
      setBsn(relaties?.bsn_nr || "");
      setDocumentNumber(relaties?.document_nr || "");
      setFacebookUrl(relaties?.facebook_url || "");
      setLinkedinUrl(relaties?.voertuig_kentekencheck || "");
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
    loadLookups();
  }, [loadProfile, loadLookups]);

  const pickImage = async () => {
    const result = await pickProfileImage("gallery");
    if (result.ok) setProfileImage(result.asset);
  };

  const handleSave = async () => {
    if (!email.trim() || !isValidEmail(email)) {
      setToast({ top: 45, text: t("Please enter a valid email"), type: "error", visible: true });
      return;
    }

    setLoading(true);
    try {
      const response = await updateProfileDetails({
        token: verifyToken,
        userId,
        salutation,
        firstName,
        middleName,
        lastName,
        email,
        privateEmail,
        whatsappNumber,
        countryCode,
        phoneNumber,
        phoneCountryCode,
        address,
        birthDate,
        birthPlace,
        nationalityId,
        iban,
        maritalStatusId,
        bsn,
        documentNumber,
        facebookUrl,
        linkedinUrl,
        profileImage,
      });

      if (response?.status) {
        setToast({ top: 45, text: t("Profile updated successfully"), type: "success", visible: true });
        router.back();
      } else {
        setToast({
          top: 45,
          text: response?.message || t("Update failed"),
          type: "error",
          visible: true,
        });
      }
    } catch (error) {
      setToast({
        top: 45,
        text: getApiErrorMessage(error, t("Something went wrong")),
        type: "error",
        visible: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const sheetOptions =
    activeSheet === "salutation"
      ? salutationOptions
      : activeSheet === "nationality"
        ? nationalitySheetOptions
        : activeSheet === "marital"
          ? maritalSheetOptions
          : [];

  const sheetSelectedIds =
    activeSheet === "salutation"
      ? salutation
        ? [salutationOptions.find((o) => o.label === salutation)?.id ?? salutation]
        : []
      : activeSheet === "nationality"
        ? nationalityId
          ? [nationalityId]
          : []
        : activeSheet === "marital"
          ? maritalStatusId
            ? [maritalStatusId]
            : []
          : [];

  if (initialLoading) {
    return (
      <View style={[listScreenStyles.container, styles.centered, { paddingTop: top }]}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </View>
    );
  }

  return (
    <View style={[listScreenStyles.container, { paddingTop: top }]}>
      <ScreenHeader title={t("Edit Profile")} onBack={() => router.back()} />

      <KeyboardAwareScrollView
        contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable style={styles.avatarWrap} onPress={pickImage}>
          <FallBackImage
            source={
              profileImage?.uri
                ? { uri: profileImage.uri }
                : existingImageUri
                  ? { uri: existingImageUri }
                  : Images.DefaultImage
            }
            style={styles.avatar}
            resizeMode="cover"
          />
          <Text style={styles.changePhoto}>{t("Change photo")}</Text>
        </Pressable>

        <FormSelectField
          label={t("Aanhef")}
          placeholder={t("Select")}
          value={salutation}
          onPress={() => setActiveSheet("salutation")}
        />

        <AuthInput label={t("Voornaam")} value={firstName} onChangeText={setFirstName} />
        <AuthInput label={t("Voorvoegsel")} value={middleName} onChangeText={setMiddleName} />
        <AuthInput label={t("Achternaam")} value={lastName} onChangeText={setLastName} />
        <AuthInput
          label={t("E-mailadres")}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <AuthInput
          label={t("Prive E-mailadres")}
          value={privateEmail}
          onChangeText={setPrivateEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <AuthInput
          label={t("WhatsApp-nummer")}
          value={whatsappNumber}
          onChangeText={setWhatsappNumber}
          keyboardType="phone-pad"
        />
        <AuthInput
          label={t("Country code")}
          value={countryCode}
          onChangeText={setCountryCode}
          keyboardType="phone-pad"
        />
        <AuthInput
          label={t("Telefoon")}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
        />
        <AuthInput
          label={t("Phone country code")}
          value={phoneCountryCode}
          onChangeText={setPhoneCountryCode}
          keyboardType="phone-pad"
        />
        <GooglePlacesField
          label={t("Adres")}
          value={address}
          onChangeText={setAddress}
          placeholder={t("Enter address")}
          containerStyle={{ marginBottom: 0 }}
        />
        <AuthInput label={t("Geboorteplaats")} value={birthPlace} onChangeText={setBirthPlace} />

        <Pressable style={styles.dateField} onPress={() => setDatePickerOpen(true)}>
          <Text style={styles.dateLabel}>{t("Geboortedatum")}</Text>
          <Text style={styles.dateValue}>{birthDate || t("Select date")}</Text>
        </Pressable>

        {datePickerOpen ? (
          <DateTimePicker
            value={parseDate(birthDate)}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event: DateTimePickerEvent, date?: Date) => {
              if (Platform.OS === "android") setDatePickerOpen(false);
              if (event.type === "dismissed" || !date) return;
              setBirthDate(formatDate(date));
            }}
          />
        ) : null}

        <FormSelectField
          label={t("Nationaliteit")}
          placeholder={t("Kies Nationaliteit")}
          value={nationalityName}
          onPress={() => setActiveSheet("nationality")}
        />

        <AuthInput label={t("IBAN")} value={iban} onChangeText={setIban} />

        <FormSelectField
          label={t("Burgerlijke staat")}
          placeholder={t("Select")}
          value={maritalStatusName}
          onPress={() => setActiveSheet("marital")}
        />

        <AuthInput label={t("Burgerservicenummer (BSN) ")} value={bsn} onChangeText={setBsn} />
        <AuthInput
          label={t("Document nr (ID/Paspoort)")}
          value={documentNumber}
          onChangeText={setDocumentNumber}
        />
        <AuthInput label={t("Facebook")} value={facebookUrl} onChangeText={setFacebookUrl} />
        <AuthInput label={t("LinkedIn")} value={linkedinUrl} onChangeText={setLinkedinUrl} />

        <AuthButton title={t("Save")} onPress={handleSave} disabled={loading} />
      </KeyboardAwareScrollView>

      <SelectionBottomSheet
        visible={activeSheet != null}
        title={
          activeSheet === "salutation"
            ? t("Aanhef")
            : activeSheet === "nationality"
              ? t("Nationaliteit")
              : t("Burgerlijke staat")
        }
        searchPlaceholder={t("Search")}
        confirmText={t("Confirm")}
        options={sheetOptions}
        selectedIds={sheetSelectedIds}
        onClose={() => setActiveSheet(null)}
        onConfirm={(selected) => {
          const item = selected[0];
          if (!item) {
            setActiveSheet(null);
            return;
          }
          if (activeSheet === "salutation") {
            setSalutation(item.label);
          } else if (activeSheet === "nationality") {
            setNationalityId(item.id);
            setNationalityName(item.label);
          } else if (activeSheet === "marital") {
            setMaritalStatusId(item.id);
            setMaritalStatusName(item.label);
          }
          setActiveSheet(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: LIST_UI.screenPadding,
    paddingTop: 16,
    gap: 12,
  },
  avatarWrap: {
    alignItems: "center",
    marginBottom: 8,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: LIST_UI.cardBorder,
  },
  changePhoto: {
    marginTop: 8,
    fontFamily: FONTS.LexendMedium,
    fontSize: 14,
    color: AppColors.primary,
  },
  dateField: {
    borderWidth: 1,
    borderColor: LIST_UI.cardBorder,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: AppColors.white,
  },
  dateLabel: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 13,
    color: AppColors.subtitle,
    marginBottom: 4,
  },
  dateValue: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 15,
    color: AppColors.black,
  },
});
