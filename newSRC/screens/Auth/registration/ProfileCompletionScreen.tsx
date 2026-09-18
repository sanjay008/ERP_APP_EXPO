import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import AuthLayout from "../../../Components/Auth/AuthLayout";
import AuthButton from "../../../Components/Auth/AuthButton";
import AuthInput from "../../../Components/Auth/AuthInput";
import AuthSelect from "../../../Components/Auth/AuthSelect";
import SelectionSheet from "../../../Components/Auth/SelectionSheet";
import AuthBirthDatePicker from "../../../Components/Auth/AuthBirthDatePicker";
import { GooglePlacesField } from "../../../Components/GooglePlacesInput";
import { BackLink } from "../../../Components/Auth/SwitchMethodButton";
import {
  loadProfileSession,
  updateProfile,
  type ProfileImageAsset,
} from "../../../services/profileService";
import { pickProfileImage } from "../../../utils/profileImagePicker";
import { getApiErrorMessage, isValidEmail } from "../../../utils/validation";
import { useScreenInsets } from "../../../utils/screenInsets";
import { AppColors } from "../../../utils/theme";
import { authTypography } from "../../../utils/authTypography";
import { FONTS } from "../../../utils/FONTS";
import { Images } from "../../../utils/Images";
import { RFValue } from "react-native-responsive-fontsize";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ProfileStep = 1 | 2 | 3;

type FieldErrors = Record<string, string>;

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

export default function ProfileCompletionScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { modalPadding } = useScreenInsets();

  const [step, setStep] = useState<ProfileStep>(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [userId, setUserId] = useState<number | null>(null);
  const [verifyToken, setVerifyToken] = useState("");
  const [companyLogin, setCompanyLogin] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [countryCode, setCountryCode] = useState("");

  const [salutation, setSalutation] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [profileImage, setProfileImage] = useState<ProfileImageAsset | null>(null);

  const [salutationSheetOpen, setSalutationSheetOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [imageSheetOpen, setImageSheetOpen] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date(1990, 0, 1));

  const salutationOptions = useMemo(
    () => [
      { label: t("fam"), value: t("fam") },
      { label: t("dhr"), value: t("dhr") },
      { label: t("mevr"), value: t("mevr") },
    ],
    [t]
  );

  const clearError = (key: string) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const loadSession = useCallback(async () => {
    setInitialLoading(true);
    try {
      const { session, companyLogin: company } = await loadProfileSession();
      const user = session?.user;
      const relaties = session?.relaties;

      if (!user?.id || !user?.verify_token) {
        router.replace("/registration/company");
        return;
      }

      setUserId(user.id);
      setVerifyToken(user.verify_token);
      setCompanyLogin(company);
      setWhatsappNumber(user.whatsapp_number ?? "");
      setCountryCode(String(user.country_code ?? ""));

      if (relaties) {
        setSalutation(relaties.aanhef ?? "");
        setFirstName(relaties.voornaam ?? "");
        setMiddleName(relaties.voorvoegsel ?? "");
        setLastName(relaties.achternaam ?? "");
        setBirthPlace(relaties.birth_place ?? "");
        setBirthDate(relaties.birth_date ?? "");
        setAddress(relaties.google_maps ?? "");
      }

      const userEmail = user.email ?? "";
      setEmail(userEmail.includes("@dummy.com") ? "" : userEmail);

      if (user.profile_image) {
        setProfileImage({
          uri: user.profile_image,
          type: "image/jpeg",
          name: "profile.jpg",
        });
      }
    } catch (error) {
      setToastMessage(getApiErrorMessage(error, t("Something went wrong")));
    } finally {
      setInitialLoading(false);
    }
  }, [router, t]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const validateStep1 = () => {
    const errors: FieldErrors = {};
    if (!salutation.trim()) errors.salutation = t("Please select salutation");
    if (!firstName.trim()) errors.firstName = t("Enter first name");
    if (!lastName.trim()) errors.lastName = t("Enter last name");
    if (!birthPlace.trim()) errors.birthPlace = t("Enter birth place");
    if (!birthDate.trim()) errors.birthDate = t("Select birth date");
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors: FieldErrors = {};
    if (!email.trim()) errors.email = t("Enter email address");
    else if (!isValidEmail(email)) errors.email = t("Enter a valid email address");
    if (!address.trim()) errors.address = t("Enter address");
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep3 = () => {
    const errors: FieldErrors = {};
    if (!profileImage?.uri) errors.profileImage = t("Select profile photo");
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    if (step === 2 && validateStep2()) setStep(3);
  };

  const handleBack = async () => {
    if (step === 3) {
      setStep(2);
      return;
    }
    if (step === 2) {
      setStep(1);
      return;
    }

    await AsyncStorage.clear();
    router.replace("/registration/company");
  };

  const pickImage = async (source: "camera" | "gallery") => {
    setImageSheetOpen(false);

    const result = await pickProfileImage(source);

    if (result.ok) {
      setProfileImage(result.asset);
      clearError("profileImage");
      return;
    }

    if (result.reason === "permission") {
      setToastMessage(t("Permission required to access photos"));
      return;
    }

    if (result.reason === "unavailable") {
      setToastMessage(
        t("Rebuild the app after installing image picker. Run: npx expo run:android")
      );
      return;
    }

    if (result.reason === "error") {
      setToastMessage(t("Something went wrong"));
    }
  };

  const onDateChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") setDatePickerOpen(false);
    if (!selected) return;
    setPickerDate(selected);
    setBirthDate(formatDate(selected));
    clearError("birthDate");
  };

  const handleSubmit = async () => {
    if (!validateStep3() || !userId || !verifyToken || !companyLogin) return;

    setLoading(true);
    setToastMessage(null);

    try {
      const response = await updateProfile({
        userId,
        verifyToken,
        companyLogin,
        salutation,
        firstName: firstName.trim(),
        middleName: middleName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        address: address.trim(),
        birthPlace: birthPlace.trim(),
        birthDate,
        whatsappNumber,
        countryCode,
        profileImage,
      });

      if (response?.status) {
        router.replace("/(app)/(tabs)/menu");
        return;
      }

      setToastMessage(response?.message ?? t("Something went wrong"));
    } catch (error) {
      setToastMessage(getApiErrorMessage(error, t("Something went wrong")));
    } finally {
      setLoading(false);
    }
  };

  const stepTitle =
    step === 1
      ? t("Personal Details")
      : step === 2
        ? t("Contact Details")
        : t("Complete Profile");

  const stepSubtitle =
    step === 1
      ? t("Enter your personal information")
      : step === 2
        ? t("Enter your email and address")
        : t("Please complete your profile to continue");

  return (
    <AuthLayout
      title={stepTitle}
      subtitle={stepSubtitle}
      loading={loading || initialLoading}
      toastMessage={toastMessage}
      backLink={<BackLink label={t("Back")} onPress={handleBack} />}
      footer={
        <AuthButton
          title={step === 3 ? t("Verify & Proceed") : t("Continue")}
          onPress={step === 3 ? handleSubmit : handleNext}
        />
      }
    >
      {step === 1 ? (
        <>
          <AuthSelect
            label={t("Salutation")}
            value={salutation}
            placeholder={t("Select salutation")}
            error={fieldErrors.salutation}
            onPress={() => setSalutationSheetOpen(true)}
          />
          <AuthInput
            label={t("First Name")}
            required
            value={firstName}
            onChangeText={(value) => {
              setFirstName(value);
              clearError("firstName");
            }}
            placeholder={t("Enter first name")}
            iconName="person-outline"
            error={fieldErrors.firstName}
          />
          <AuthInput
            label={t("Middle Name")}
            value={middleName}
            onChangeText={setMiddleName}
            placeholder={t("Enter middle name")}
            iconName="person-outline"
          />
          <AuthInput
            label={t("Last Name")}
            required
            value={lastName}
            onChangeText={(value) => {
              setLastName(value);
              clearError("lastName");
            }}
            placeholder={t("Enter last name")}
            iconName="person-outline"
            error={fieldErrors.lastName}
          />
          <AuthInput
            label={t("Birth Place")}
            required
            value={birthPlace}
            onChangeText={(value) => {
              setBirthPlace(value);
              clearError("birthPlace");
            }}
            placeholder={t("Enter birth place")}
            iconName="location-outline"
            error={fieldErrors.birthPlace}
          />
          <View style={styles.field}>
            <Text style={authTypography.label}>
              {t("Birth Date")}
              <Text style={authTypography.required}> *</Text>
            </Text>
            <Pressable
              style={[styles.dateField, fieldErrors.birthDate ? styles.fieldError : null]}
              onPress={() => {
                setPickerDate(parseDate(birthDate));
                setDatePickerOpen(true);
              }}
            >
              <Ionicons name="calendar-outline" size={18} color={AppColors.subtitle} />
              <Text style={[authTypography.input, styles.dateText, !birthDate && authTypography.placeholder]}>
                {birthDate || t("Select birth date")}
              </Text>
            </Pressable>
            {fieldErrors.birthDate ? (
              <Text style={[authTypography.error, styles.errorSpacing]}>{fieldErrors.birthDate}</Text>
            ) : null}
          </View>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <AuthInput
            label={t("Email Address")}
            required
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              clearError("email");
            }}
            placeholder={t("Enter email address")}
            iconName="mail-outline"
            keyboardType="email-address"
            autoCapitalize="none"
            error={fieldErrors.email}
          />
          <GooglePlacesField
            label={t("Your Address")}
            required
            value={address}
            onChangeText={(value) => {
              setAddress(value);
              clearError("address");
            }}
            placeholder={t("Enter address")}
            error={fieldErrors.address}
          />
        </>
      ) : null}

      {step === 3 ? (
        <>
          <Pressable style={styles.photoWrap} onPress={() => setImageSheetOpen(true)}>
            {profileImage?.uri ? (
              <Image source={{ uri: profileImage.uri }} style={styles.photo} />
            ) : (
              <Image source={Images.DefaultImage} style={styles.photo} />
            )}
            <View style={styles.cameraBadge}>
              <Image source={Images.camera} style={styles.cameraIcon} />
            </View>
          </Pressable>
          <Text style={[authTypography.label, styles.photoHint]}>{t("Tap to upload profile photo")}</Text>
          {fieldErrors.profileImage ? (
            <Text style={[authTypography.errorCenter, styles.errorCenter]}>{fieldErrors.profileImage}</Text>
          ) : null}
        </>
      ) : null}

      <SelectionSheet
        visible={salutationSheetOpen}
        title={t("Select salutation")}
        options={salutationOptions}
        onClose={() => setSalutationSheetOpen(false)}
        onSelect={(option) => {
          setSalutation(option.label);
          clearError("salutation");
        }}
      />

      <Modal
        visible={imageSheetOpen}
        transparent
        animationType="slide"
        statusBarTranslucent
        navigationBarTranslucent
      >
        <Pressable style={styles.sheetOverlay} onPress={() => setImageSheetOpen(false)}>
          <Pressable style={[styles.sheet, { paddingBottom: modalPadding }]}>
            <Text style={styles.sheetTitle}>{t("Choose image")}</Text>
            <Pressable style={styles.sheetOption} onPress={() => pickImage("camera")}>
              <Ionicons name="camera-outline" size={20} color={AppColors.primary} />
              <Text style={styles.sheetOptionText}>{t("Camera")}</Text>
            </Pressable>
            <Pressable style={styles.sheetOption} onPress={() => pickImage("gallery")}>
              <Ionicons name="images-outline" size={20} color={AppColors.primary} />
              <Text style={styles.sheetOptionText}>{t("Gallery")}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <AuthBirthDatePicker
        visible={datePickerOpen}
        value={pickerDate}
        confirmText={t("Continue")}
        onChange={onDateChange}
        onClose={() => setDatePickerOpen(false)}
      />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: 18,
  },
  dateField: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: "#D8DEE6",
    borderRadius: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: AppColors.white,
  },
  fieldError: {
    borderColor: "#EF4444",
  },
  dateText: {
    flex: 1,
  },
  errorSpacing: {
    marginTop: 6,
  },
  errorCenter: {
    marginTop: 8,
  },
  photoWrap: {
    alignSelf: "center",
    marginBottom: 12,
    marginTop: 8,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#EEF2F7",
  },
  cameraBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  cameraIcon: {
    width: 18,
    height: 18,
    tintColor: AppColors.white,
  },
  photoHint: {
    textAlign: "center",
    color: AppColors.subtitle,
    marginBottom: 8,
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: AppColors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 12,
  },
  sheetTitle: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: RFValue(15),
    color: AppColors.black,
    marginBottom: 4,
  },
  sheetOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  sheetOptionText: {
    fontFamily: FONTS.LexendMedium,
    fontSize: RFValue(14),
    color: AppColors.black,
  },
});
