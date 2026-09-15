import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "../translation/i18n";
import {
  CountryItem,
  LanguageItem,
  fetchCountries,
  fetchLanguages,
  loginCompany,
  loginNew,
  loginWithPassword,
  needsProfileCompletion,
  persistAuthSession,
  persistCompanySession,
  registerNewUser,
  resendOtp,
  verifyOtp,
  verifySignupOtp,
} from "../services/authService";
import { getApiErrorMessage, isPhoneValid, isValidEmail } from "../utils/validation";
import { requestNotificationPermission } from "../utils/notificationService";
import { storeData } from "../utils/storeData";

export type AuthMethod = "whatsapp" | "email";
export type AuthFlowMode = "login" | "signup";

type AuthStore = {
  languages: LanguageItem[];
  countries: CountryItem[];
  selectedLanguage: LanguageItem | null;
  selectedCountryCode: string | null;
  companyName: string;
  companyLogo: string | null;
  phoneCountryCode: string;
  whatsappNumber: string;
  email: string;
  password: string;
  authMethod: AuthMethod;
  flowMode: AuthFlowMode;
  verifyToken: string;
  userId: number | null;
  otpType: string;
  otpContactLabel: string;
  isLoading: boolean;
  fieldErrors: Record<string, string>;
  toastMessage: string | null;

  setCompanyName: (value: string) => void;
  setWhatsappNumber: (value: string) => void;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setAuthMethod: (method: AuthMethod) => void;
  setFlowMode: (mode: AuthFlowMode) => void;
  setPhoneCountryCode: (code: string) => void;
  clearFieldError: (key: string) => void;
  clearToast: () => void;
  resetRegistrationFlow: () => void;

  loadLanguagesAndCountries: () => Promise<void>;
  selectLanguage: (language: LanguageItem) => Promise<void>;
  selectCountryCode: (countryCode: string) => void;
  saveLanguageCountry: () => Promise<boolean>;
  submitCompany: () => Promise<boolean>;
  submitCredentials: () => Promise<"otp" | "password" | "home" | false>;
  submitSignupWhatsapp: () => Promise<boolean>;
  submitOtp: (otp: string) => Promise<"profile" | "home" | "signup-profile" | false>;
  submitSignupOtp: (otp: string) => Promise<"signup-profile" | false>;
  resendOtpCode: () => Promise<boolean>;
  submitPassword: () => Promise<"profile" | "home" | false>;
};

const DEFAULT_LANGUAGE: LanguageItem = {
  language_name: "English",
  language_shortname: "en",
};

const getCountryCodeByPrefix = (list: CountryItem[], prefix: string) => {
  const match = list.find((item) => item.country_code?.includes(prefix));
  return match?.country_code ?? null;
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  languages: [],
  countries: [],
  selectedLanguage: DEFAULT_LANGUAGE,
  selectedCountryCode: null,
  companyName: "",
  companyLogo: null,
  phoneCountryCode: "31",
  whatsappNumber: "",
  email: "",
  password: "",
  authMethod: "whatsapp",
  flowMode: "login",
  verifyToken: "",
  userId: null,
  otpType: "mobile_login",
  otpContactLabel: "",
  isLoading: false,
  fieldErrors: {},
  toastMessage: null,

  setCompanyName: (value) =>
    set({ companyName: value, fieldErrors: { ...get().fieldErrors, companyName: "" } }),
  setWhatsappNumber: (value) =>
    set({ whatsappNumber: value, fieldErrors: { ...get().fieldErrors, whatsappNumber: "" } }),
  setEmail: (value) =>
    set({ email: value, fieldErrors: { ...get().fieldErrors, email: "" } }),
  setPassword: (value) =>
    set({ password: value, fieldErrors: { ...get().fieldErrors, password: "" } }),
  setAuthMethod: (method) => set({ authMethod: method }),
  setFlowMode: (mode) => set({ flowMode: mode }),
  setPhoneCountryCode: (code) => set({ phoneCountryCode: code.replace(/[^\d]/g, "") }),
  clearFieldError: (key) => {
    const next = { ...get().fieldErrors };
    delete next[key];
    set({ fieldErrors: next });
  },
  clearToast: () => set({ toastMessage: null }),
  resetRegistrationFlow: () =>
    set({
      companyName: "",
      companyLogo: null,
      whatsappNumber: "",
      email: "",
      password: "",
      authMethod: "whatsapp",
      flowMode: "login",
      verifyToken: "",
      userId: null,
      otpType: "mobile_login",
      otpContactLabel: "",
      fieldErrors: {},
      toastMessage: null,
    }),

  loadLanguagesAndCountries: async () => {
    set({ isLoading: true });
    try {
      const [languageRes, countryRes] = await Promise.all([
        fetchLanguages(),
        fetchCountries(),
      ]);

      const languages =
        languageRes.status && Array.isArray(languageRes.data) ? languageRes.data : [];
      const countries =
        countryRes.status && Array.isArray(countryRes.data) ? countryRes.data : [];

      const savedLanguage = await AsyncStorage.getItem("userLanguage");
      const savedCountry = await AsyncStorage.getItem("country_code");

      const selectedLanguage =
        languages.find((item) => item.language_shortname === savedLanguage) ??
        languages.find((item) => item.language_shortname === "en") ??
        languages[0] ??
        DEFAULT_LANGUAGE;

      const selectedCountryCode =
        savedCountry ??
        getCountryCodeByPrefix(countries, "+31") ??
        countries[0]?.country_code ??
        null;

      set({
        languages,
        countries,
        selectedLanguage,
        selectedCountryCode,
        phoneCountryCode: selectedCountryCode?.replace(/[^\d]/g, "") || "31",
      });
    } catch (error) {
      set({
        toastMessage: getApiErrorMessage(error, i18n.t("Something went wrong")),
      });
    } finally {
      set({ isLoading: false });
    }
  },

  selectLanguage: async (language) => {
    set({ selectedLanguage: language, fieldErrors: { ...get().fieldErrors, language: "" } });
    await AsyncStorage.setItem("userLanguage", language.language_shortname);
    if (i18n.isInitialized) {
      await i18n.changeLanguage(language.language_shortname);
    }

    const { countries } = get();
    if (language.language_shortname === "nl") {
      set({
        selectedCountryCode: getCountryCodeByPrefix(countries, "+31"),
        phoneCountryCode: "31",
      });
    } else if (language.language_shortname === "en") {
      set({
        selectedCountryCode: getCountryCodeByPrefix(countries, "+91"),
        phoneCountryCode: "91",
      });
    }
  },

  selectCountryCode: (countryCode) => {
    set({
      selectedCountryCode: countryCode,
      phoneCountryCode: countryCode.replace(/[^\d]/g, ""),
      fieldErrors: { ...get().fieldErrors, countryCode: "" },
    });
  },

  saveLanguageCountry: async () => {
    const { selectedLanguage, selectedCountryCode } = get();

    if (!selectedLanguage?.language_shortname) {
      set({ fieldErrors: { language: i18n.t("Please select language") } });
      return false;
    }

    if (!selectedCountryCode) {
      set({ fieldErrors: { countryCode: i18n.t("Please select country code") } });
      return false;
    }

    await storeData("SELECT", true);
    await storeData("country_code", selectedCountryCode);
    await AsyncStorage.setItem("userLanguage", selectedLanguage.language_shortname);
    return true;
  },

  submitCompany: async () => {
    const { companyName } = get();

    if (!companyName.trim()) {
      set({ fieldErrors: { companyName: i18n.t("Enter company name") } });
      return false;
    }

    set({ isLoading: true, toastMessage: null });
    try {
      const response = await loginCompany(companyName);

      if (!response.status) {
        set({
          fieldErrors: { companyName: i18n.t("Enter a valid company name") },
        });
        return false;
      }

      const companyData = response.data?.default_company;
      await persistCompanySession(companyName, companyData);

      set({
        companyLogo: companyData?.company_logo ?? null,
        phoneCountryCode: companyData?.country_codes?.replace(/[^\d]/g, "") || get().phoneCountryCode,
      });
      return true;
    } catch (error) {
      set({ toastMessage: getApiErrorMessage(error, i18n.t("Something went wrong")) });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  submitCredentials: async () => {
    const state = get();
    const companyLogin = state.companyName.trim();

    if (state.authMethod === "email") {
      if (!state.email.trim()) {
        set({ fieldErrors: { email: i18n.t("Enter email address") } });
        return false;
      }
      if (!isValidEmail(state.email)) {
        set({ fieldErrors: { email: i18n.t("Enter a valid email address") } });
        return false;
      }
      set({ whatsappNumber: "" });
    } else {
      if (!state.whatsappNumber.trim()) {
        set({ fieldErrors: { whatsappNumber: i18n.t("Enter whatsapp number") } });
        return false;
      }
      if (!isPhoneValid(state.phoneCountryCode, state.whatsappNumber)) {
        set({ fieldErrors: { whatsappNumber: i18n.t("Enter a valid phone number") } });
        return false;
      }
      set({ email: "" });
    }

    set({ isLoading: true, toastMessage: null });
    try {
      const response = await loginNew({
        companyLogin,
        email: state.authMethod === "email" ? state.email : "",
        whatsappNumber: state.authMethod === "whatsapp" ? state.whatsappNumber : "",
        countryCode: state.phoneCountryCode,
      });

      if (!response.status) {
        set({ toastMessage: response.message ?? i18n.t("Something went wrong") });
        return false;
      }

      const user = response.data?.user;
      if (!user) {
        set({ toastMessage: i18n.t("Something went wrong") });
        return false;
      }

      set({
        verifyToken: user.verify_token ?? "",
        userId: user.id,
        otpType: response.data?.type ?? "mobile_login",
        otpContactLabel:
          state.authMethod === "email"
            ? state.email.trim()
            : `+${state.phoneCountryCode} ${state.whatsappNumber.trim()}`,
        email: user.email ?? state.email,
      });

      if (user.enable_2fa === 1) {
        return "otp";
      }

      if (user.enable_2fa === 0) {
        return "password";
      }

      await persistAuthSession(response);
      return "home";
    } catch (error) {
      set({ toastMessage: getApiErrorMessage(error, i18n.t("Something went wrong")) });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  submitSignupWhatsapp: async () => {
    const { companyName, whatsappNumber, phoneCountryCode } = get();

    if (!whatsappNumber.trim()) {
      set({ fieldErrors: { whatsappNumber: i18n.t("Enter whatsapp number") } });
      return false;
    }
    if (!isPhoneValid(phoneCountryCode, whatsappNumber)) {
      set({ fieldErrors: { whatsappNumber: i18n.t("Enter a valid phone number") } });
      return false;
    }

    set({ isLoading: true, toastMessage: null, flowMode: "signup" });
    try {
      const response = await registerNewUser({
        companyLogin: companyName.trim(),
        whatsappNumber: whatsappNumber.trim(),
        countryCode: phoneCountryCode,
      });

      if (!response.status || !response.data) {
        set({ toastMessage: response.message ?? i18n.t("Something went wrong") });
        return false;
      }

      await storeData("USERDATA", response);

      set({
        verifyToken: response.data.verify_token ?? "",
        userId: response.data.id,
        otpType: "user_register_requests",
        otpContactLabel: `+${phoneCountryCode} ${whatsappNumber.trim()}`,
        authMethod: "whatsapp",
      });
      return true;
    } catch (error) {
      set({ toastMessage: getApiErrorMessage(error, i18n.t("Something went wrong")) });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  submitOtp: async (otp) => {
    const { companyName, userId, verifyToken, otpType } = get();

    if (!otp || otp.length < 6) {
      set({ fieldErrors: { otp: i18n.t("Enter OTP") } });
      return false;
    }

    if (!userId || !verifyToken) {
      set({ toastMessage: i18n.t("Something went wrong") });
      return false;
    }

    set({ isLoading: true, toastMessage: null });
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
        set({
          fieldErrors: { otp: response.message ?? i18n.t("Something went wrong") },
        });
        return false;
      }

      await persistAuthSession(response);
      return needsProfileCompletion(response as never) ? "profile" : "home";
    } catch (error) {
      set({ toastMessage: getApiErrorMessage(error, i18n.t("Something went wrong")) });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  submitSignupOtp: async (otp) => {
    const { companyName, userId, verifyToken } = get();

    if (!otp || otp.length < 6) {
      set({ fieldErrors: { otp: i18n.t("Enter OTP") } });
      return false;
    }

    if (!userId || !verifyToken) {
      set({ toastMessage: i18n.t("Something went wrong") });
      return false;
    }

    set({ isLoading: true, toastMessage: null });
    try {
      const response = await verifySignupOtp({
        companyLogin: companyName.trim(),
        userId,
        otp,
        verifyToken,
      });

      if (!response.status) {
        set({
          fieldErrors: { otp: response.message ?? i18n.t("Something went wrong") },
        });
        return false;
      }

      await storeData("LOGIN", true);
      return "signup-profile";
    } catch (error) {
      set({ toastMessage: getApiErrorMessage(error, i18n.t("Something went wrong")) });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  resendOtpCode: async () => {
    const { companyName, userId, otpType, flowMode } = get();
    if (!userId) return false;

    set({ isLoading: true, toastMessage: null });
    try {
      const response = await resendOtp({
        companyLogin: companyName.trim(),
        userId,
        otpType: flowMode === "signup" ? "user_register_requests" : otpType,
      });

      if (response.status) {
        if (response.data?.type) {
          set({ otpType: response.data.type });
        }
        set({ toastMessage: response.message ?? i18n.t("OTP resent successfully") });
        return true;
      }

      set({ toastMessage: response.message ?? i18n.t("Something went wrong") });
      return false;
    } catch (error) {
      set({ toastMessage: getApiErrorMessage(error, i18n.t("Something went wrong")) });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  submitPassword: async () => {
    const { companyName, email, password } = get();

    if (!password.trim()) {
      set({ fieldErrors: { password: i18n.t("Enter password") } });
      return false;
    }

    set({ isLoading: true, toastMessage: null });
    try {
      const fcmToken = await requestNotificationPermission();
      const response = await loginWithPassword({
        companyLogin: companyName.trim(),
        email: email.trim(),
        password,
        fcmToken,
      });

      if (!response.status) {
        set({
          fieldErrors: {
            password: response.message ?? i18n.t("Something went wrong"),
          },
        });
        return false;
      }

      await persistAuthSession(response);
      return needsProfileCompletion(response as never) ? "profile" : "home";
    } catch (error) {
      set({ toastMessage: getApiErrorMessage(error, i18n.t("Something went wrong")) });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },
}));
