import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Updates from "expo-updates";
import AuthButton from "../Auth/AuthButton";
import AuthInput from "../Auth/AuthInput";
import CountryPicker from "../Auth/CountryPicker";
import OtpInput from "../Auth/OtpInput";
import SwitchMethodButton from "../Auth/SwitchMethodButton";
import {
  fetchCountries,
  loginCompany,
  loginNew,
  loginWithPassword,
  persistAuthSession,
  persistCompanySession,
  resendOtp,
  verifyOtp,
  type CompanyData,
  type CountryItem,
} from "../../services/authService";
import { requestNotificationPermission } from "../../utils/notificationService";
import {
  applySessionSnapshot,
  captureSessionSnapshot,
  getActiveAccountId,
  getSavedAccounts,
  restoreSessionSnapshot,
  upsertCurrentAccountFromSession,
  type SavedAccount,
  type SessionSnapshot,
} from "../../utils/multiAccountSession";
import { mergeApiCountries } from "../../utils/countryListHelper";
import { getApiErrorMessage, isPhoneValid, isValidEmail } from "../../utils/validation";
import { storeData } from "../../utils/storeData";
import { useScreenInsets } from "../../utils/screenInsets";
import { AppColors } from "../../utils/theme";
import { FONTS } from "../../utils/FONTS";

type Step = "list" | "company" | "credentials" | "password" | "otp";
type AuthMethod = "whatsapp" | "email";

type Props = {
  visible: boolean;
  onClose: () => void;
};

async function reloadApp(router: ReturnType<typeof useRouter>) {
  try {
    if (Updates.isEnabled) {
      await Updates.reloadAsync();
      return;
    }
  } catch {
    // Fall through to in-app remount.
  }
  router.replace("/splash");
}

function AccountRow({
  account,
  active,
  onPress,
}: {
  account: SavedAccount;
  active: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const initial = (account.displayName || "?").trim().charAt(0).toUpperCase();

  return (
    <Pressable style={[styles.accountRow, active && styles.accountRowActive]} onPress={onPress}>
      {account.profileImage ? (
        <Image source={{ uri: account.profileImage }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarFallback}>
          <Text style={styles.avatarLetter}>{initial}</Text>
        </View>
      )}
      <View style={styles.accountMeta}>
        <View style={styles.nameRow}>
          <Text style={styles.accountName} numberOfLines={1}>
            {account.displayName}
          </Text>
          {active ? (
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>{t("Active")}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.accountSub} numberOfLines={1}>
          {account.companyLogin}
        </Text>
        {account.identifier ? (
          <Text style={styles.accountSub} numberOfLines={1}>
            {account.identifier}
          </Text>
        ) : null}
      </View>
      <View style={[styles.radio, active && styles.radioOn]}>
        {active ? <View style={styles.radioDot} /> : null}
      </View>
    </Pressable>
  );
}

export default function AccountSwitcherModal({ visible, onClose }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const { modalPadding } = useScreenInsets();

  const [step, setStep] = useState<Step>("list");
  const [accounts, setAccounts] = useState<SavedAccount[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const [snapshot, setSnapshot] = useState<SessionSnapshot | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [pendingCompany, setPendingCompany] = useState<CompanyData["default_company"]>();
  const [authMethod, setAuthMethod] = useState<AuthMethod>("whatsapp");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [countryCode, setCountryCode] = useState("31");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const [verifyToken, setVerifyToken] = useState("");
  const [otpType, setOtpType] = useState("mobile_login");
  const [countries, setCountries] = useState<CountryItem[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const keyboardY = useSharedValue(0);
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: keyboardY.value }],
  }));

  const mergedCountries = useMemo(() => mergeApiCountries(countries), [countries]);
  const companyLogo = pendingCompany?.company_logo?.trim() || "";
  const showCompanyLogo = step !== "list" && step !== "company" && Boolean(companyLogo);
  const keyboardOpen = keyboardHeight > 0;
  const screenHeight = Dimensions.get("screen").height;
  const windowAlreadyShrunk =
    Platform.OS === "android" && screenHeight - windowHeight > 80;
  const keyboardLift = windowAlreadyShrunk ? 0 : keyboardHeight;
  const sheetMaxHeight = Math.max(
    280,
    windowHeight - keyboardLift - Math.max(insets.top, 12) - 8
  );
  const headerChrome = 78;
  const logoChrome = showCompanyLogo ? 38 : 0;
  const footerChrome = 58 + (keyboardOpen ? 10 : modalPadding);
  const bodyMaxHeight = Math.max(120, sheetMaxHeight - headerChrome - logoChrome - footerChrome);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const show = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hide = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useEffect(() => {
    keyboardY.value = withTiming(-keyboardLift, { duration: 220 });
  }, [keyboardLift, keyboardY]);

  useEffect(() => {
    if (visible) return;
    setKeyboardHeight(0);
    keyboardY.value = 0;
  }, [keyboardY, visible]);

  const resetAddForm = useCallback(() => {
    setStep("list");
    setError("");
    setBusy(false);
    setPendingCompany(undefined);
    setEmail("");
    setWhatsapp("");
    setPassword("");
    setOtp("");
    setUserId(null);
    setVerifyToken("");
    setOtpType("mobile_login");
    setAuthMethod("whatsapp");
    setSecondsLeft(0);
  }, []);

  const loadAccounts = useCallback(async () => {
    await upsertCurrentAccountFromSession();
    const [list, current] = await Promise.all([getSavedAccounts(), getActiveAccountId()]);
    setAccounts(list);
    setActiveId(current);
  }, []);

  useEffect(() => {
    if (!visible) return;
    resetAddForm();
    captureSessionSnapshot().then((current) => {
      setSnapshot(current);
      setCompanyName(current.COMPANYLOGIN || "");
    });
    loadAccounts();
    fetchCountries()
      .then((response) => {
        if (response.status && Array.isArray(response.data)) {
          setCountries(response.data);
        }
      })
      .catch(() => undefined);
  }, [visible, loadAccounts, resetAddForm]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const restoreActive = async () => {
    if (snapshot) await restoreSessionSnapshot(snapshot);
  };

  const closeModal = async () => {
    Keyboard.dismiss();
    if (step !== "list") await restoreActive();
    resetAddForm();
    onClose();
  };

  const goBack = async () => {
    setError("");
    if (step === "company") {
      await restoreActive();
      resetAddForm();
      return;
    }
    if (step === "credentials") {
      setStep("company");
      return;
    }
    if (step === "password" || step === "otp") {
      setStep("credentials");
    }
  };

  const finishLogin = async (response: unknown) => {
    await persistCompanySession(companyName.trim(), pendingCompany);
    await storeData("COMPANYDATA", pendingCompany ?? null);
    await persistAuthSession(response);
    await upsertCurrentAccountFromSession();
    await reloadApp(router);
  };

  const submitCompany = async () => {
    if (!companyName.trim()) {
      setError(t("Enter company name"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await loginCompany(companyName);
      if (!response.status) {
        setError(t("Enter a valid company name"));
        return;
      }
      setPendingCompany(response.data?.default_company);
      if (response.data?.default_company?.country_codes) {
        setCountryCode(response.data.default_company.country_codes.replace(/[^\d]/g, "") || "31");
      }
      setStep("credentials");
    } catch (err) {
      setError(getApiErrorMessage(err, t("Something went wrong")));
    } finally {
      setBusy(false);
    }
  };

  const submitCredentials = async () => {
    if (authMethod === "email") {
      if (!isValidEmail(email)) {
        setError(t("Enter a valid email address"));
        return;
      }
    } else if (!isPhoneValid(countryCode, whatsapp)) {
      setError(t("Enter a valid phone number"));
      return;
    }

    setBusy(true);
    setError("");
    try {
      const response = await loginNew({
        companyLogin: companyName.trim(),
        email: authMethod === "email" ? email : "",
        whatsappNumber: authMethod === "whatsapp" ? whatsapp : "",
        countryCode,
      });
      if (!response.status || !response.data?.user) {
        setError(response.message || t("Something went wrong"));
        return;
      }

      const user = response.data.user;
      setUserId(user.id);
      setVerifyToken(user.verify_token ?? "");
      setOtpType(response.data.type ?? "mobile_login");
      if (user.email) setEmail(user.email);

      if (user.enable_2fa === 1) {
        setOtp("");
        setSecondsLeft(30);
        setStep("otp");
        return;
      }
      if (user.enable_2fa === 0) {
        setPassword("");
        setStep("password");
        return;
      }
      await finishLogin(response);
    } catch (err) {
      setError(getApiErrorMessage(err, t("Something went wrong")));
    } finally {
      setBusy(false);
    }
  };

  const submitPassword = async () => {
    if (!password.trim()) {
      setError(t("Enter password"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      const fcmToken = await requestNotificationPermission();
      const response = await loginWithPassword({
        companyLogin: companyName.trim(),
        email: email.trim(),
        password,
        fcmToken,
      });
      if (!response.status) {
        setError(response.message || t("Something went wrong"));
        return;
      }
      await finishLogin(response);
    } catch (err) {
      setError(getApiErrorMessage(err, t("Something went wrong")));
    } finally {
      setBusy(false);
    }
  };

  const submitOtp = async () => {
    if (!otp || otp.length < 6 || !userId || !verifyToken) {
      setError(t("Enter OTP"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      const fcmToken = await requestNotificationPermission();
      const response = await verifyOtp({
        companyLogin: companyName.trim(),
        userId,
        otp,
        verifyToken,
        otpType,
        fcmToken,
      });
      if (!response.status) {
        setError(response.message || t("Something went wrong"));
        return;
      }
      await finishLogin(response);
    } catch (err) {
      setError(getApiErrorMessage(err, t("Something went wrong")));
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (!userId || secondsLeft > 0) return;
    try {
      const response = await resendOtp({
        companyLogin: companyName.trim(),
        userId,
        otpType,
      });
      if (response.status) {
        if (response.data?.type) setOtpType(response.data.type);
        setSecondsLeft(30);
        setOtp("");
      }
    } catch {
      setError(t("Something went wrong"));
    }
  };

  const switchAccount = async (account: SavedAccount) => {
    if (account.id === activeId) {
      onClose();
      return;
    }
    setBusy(true);
    try {
      await upsertCurrentAccountFromSession();
      await applySessionSnapshot(account.session);
      await upsertCurrentAccountFromSession();
      await reloadApp(router);
    } catch (err) {
      setError(getApiErrorMessage(err, t("Something went wrong")));
      setBusy(false);
    }
  };

  const onFooterPress = () => {
    if (step === "list") {
      setError("");
      setStep("company");
      return;
    }
    if (step === "company") return submitCompany();
    if (step === "credentials") return submitCredentials();
    if (step === "password") return submitPassword();
    return submitOtp();
  };

  const footerLabel =
    step === "list"
      ? t("Add Account")
      : step === "otp" || step === "password"
        ? t("Verify")
        : t("Continue");

  const title =
    step === "list" ? t("Accounts") : step === "otp" ? t("Enter OTP") : t("Add Account");
  const eyebrow =
    step === "list" ? t("Switch") : step === "company" ? t("Company Name") : t("Registration");

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={() => undefined}
    >
      <View style={styles.overlay} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.sheet,
            {
              maxHeight: sheetMaxHeight,
              height: keyboardOpen ? sheetMaxHeight : undefined,
              paddingBottom: keyboardOpen ? 10 : modalPadding,
            },
            sheetStyle,
          ]}
        >
          <View style={styles.handle} />

          <View style={styles.header}>
            {step !== "list" ? (
              <Pressable style={styles.headerBtn} onPress={goBack} hitSlop={8}>
                <Ionicons name="chevron-back" size={20} color={AppColors.black} />
              </Pressable>
            ) : (
              <View style={styles.headerBtn} />
            )}
            <View style={styles.headerTitles}>
              <Text style={styles.eyebrow}>{eyebrow}</Text>
              <Text style={styles.title}>{title}</Text>
            </View>
            <Pressable style={styles.headerBtn} onPress={closeModal} hitSlop={8}>
              <Ionicons name="close" size={20} color={AppColors.black} />
            </Pressable>
          </View>

          {showCompanyLogo ? (
            <View style={styles.logoWrap}>
              <ExpoImage source={{ uri: companyLogo }} style={styles.companyLogo} contentFit="contain" />
            </View>
          ) : null}

          <KeyboardAwareScrollView
            style={[styles.body, { maxHeight: bodyMaxHeight }]}
            contentContainerStyle={styles.bodyContent}
            enableOnAndroid
            extraScrollHeight={12}
            enableAutomaticScroll={false}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {step === "list" ? (
              accounts.length ? (
                accounts.map((account) => (
                  <AccountRow
                    key={account.id}
                    account={account}
                    active={account.id === activeId}
                    onPress={() => switchAccount(account)}
                  />
                ))
              ) : (
                <Text style={styles.empty}>{t("No Data Found")}</Text>
              )
            ) : null}

            {step === "company" ? (
              <AuthInput
                label={t("Company Name")}
                required
                value={companyName}
                onChangeText={(value) => {
                  setCompanyName(value);
                  setError("");
                }}
                placeholder={t("Enter company name")}
                iconName="business-outline"
                error={error}
              />
            ) : null}

            {step === "credentials" ? (
              <>
                {authMethod === "whatsapp" ? (
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>
                      {t("WhatsApp Number")}
                      <Text style={styles.required}> *</Text>
                    </Text>
                    <CountryPicker
                      value={whatsapp}
                      setValue={(value) => {
                        setWhatsapp(value);
                        setError("");
                      }}
                      countryCode={countryCode}
                      countries={mergedCountries}
                      placeholder={t("Enter whatsapp number")}
                      onSelect={(country) => setCountryCode(country.countrycode)}
                    />
                  </View>
                ) : (
                  <AuthInput
                    label={t("Email Address")}
                    required
                    value={email}
                    onChangeText={(value) => {
                      setEmail(value);
                      setError("");
                    }}
                    placeholder={t("Enter email address")}
                    iconName="mail-outline"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    error={error}
                  />
                )}
                {authMethod === "whatsapp" && error ? (
                  <Text style={styles.inlineError}>{error}</Text>
                ) : null}
                <SwitchMethodButton
                  label={
                    authMethod === "whatsapp"
                      ? t("Switch to Email Address")
                      : t("Switch to WhatsApp Number")
                  }
                  iconName={authMethod === "whatsapp" ? "mail-outline" : "logo-whatsapp"}
                  onPress={() => {
                    setError("");
                    setAuthMethod((prev) => (prev === "whatsapp" ? "email" : "whatsapp"));
                  }}
                />
              </>
            ) : null}

            {step === "password" ? (
              <AuthInput
                label={t("Password")}
                required
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  setError("");
                }}
                placeholder={t("Enter password")}
                iconName="lock-closed-outline"
                secureTextEntry={!showPassword}
                error={error}
                rightIcon={
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={AppColors.subtitle}
                  />
                }
                onRightIconPress={() => setShowPassword((prev) => !prev)}
              />
            ) : null}

            {step === "otp" ? (
              <>
                <OtpInput value={otp} onChange={setOtp} error={error} />
                <Pressable onPress={secondsLeft === 0 ? resend : undefined} style={styles.resend}>
                  <Text style={styles.resendText}>
                    {secondsLeft > 0 ? `00:${String(secondsLeft).padStart(2, "0")} ` : ""}
                    {t("Resend")}
                  </Text>
                </Pressable>
              </>
            ) : null}
          </KeyboardAwareScrollView>

          <View style={styles.footer}>
            {busy ? (
              <View style={styles.busyWrap}>
                <ActivityIndicator color={AppColors.white} />
              </View>
            ) : (
              <AuthButton title={footerLabel} onPress={onFooterPress} />
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },
  sheet: {
    backgroundColor: AppColors.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 99,
    backgroundColor: "#E5E7EB",
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },
  headerTitles: {
    flex: 1,
    alignItems: "center",
  },
  eyebrow: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 11,
    color: AppColors.primary,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 20,
    color: AppColors.black,
  },
  logoWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  companyLogo: {
    width: 110,
    height: 28,
  },
  body: {
    flexGrow: 0,
    flexShrink: 1,
  },
  bodyContent: {
    paddingBottom: 4,
    flexGrow: 0,
  },
  empty: {
    textAlign: "center",
    color: AppColors.subtitle,
    fontFamily: FONTS.LexendRegular,
    paddingVertical: 28,
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    marginBottom: 8,
    gap: 10,
  },
  accountRowActive: {
    borderColor: AppColors.primary,
    backgroundColor: "#F3F7FF",
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#E8EFF5",
  },
  avatarFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#E8EFF5",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 16,
    color: AppColors.primary,
  },
  accountMeta: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  accountName: {
    flexShrink: 1,
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 15,
    color: AppColors.black,
  },
  accountSub: {
    marginTop: 2,
    fontFamily: FONTS.LexendRegular,
    fontSize: 12,
    color: AppColors.subtitle,
  },
  activeBadge: {
    backgroundColor: AppColors.primary,
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  activeBadgeText: {
    color: AppColors.white,
    fontFamily: FONTS.LexendMedium,
    fontSize: 10,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOn: {
    borderColor: AppColors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: AppColors.primary,
  },
  field: {
    marginBottom: 8,
  },
  fieldLabel: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 13,
    color: AppColors.black,
    marginBottom: 8,
  },
  required: {
    color: "#EF4444",
  },
  inlineError: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 12,
    color: "#EF4444",
    marginTop: 6,
  },
  resend: {
    alignSelf: "center",
    paddingVertical: 8,
  },
  resendText: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 13,
    color: AppColors.primary,
  },
  footer: {
    paddingTop: 6,
  },
  busyWrap: {
    minHeight: 52,
    borderRadius: 10,
    backgroundColor: AppColors.onboardingButton,
    alignItems: "center",
    justifyContent: "center",
  },
});
