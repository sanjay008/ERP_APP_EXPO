import AsyncStorage from "@react-native-async-storage/async-storage";
import { clearAllData, getData, storeData } from "./storeData";

export type AuthRedirect =
  | "/(app)/(tabs)/menu"
  | "/registration"
  | "/registration/company"
  | "/registration/profile"
  | "/onboarding";

type StoredUserData = {
  user?: { profile_image?: string | null; verify_token?: string };
  relaties?: {
    google_maps?: string | null;
    email_adres?: string | null;
  };
};

export function isTokenExpiredMessage(message?: unknown): boolean {
  if (typeof message !== "string") return false;
  return message.toLowerCase().includes("token expired");
}

export function isProfileIncomplete(data?: StoredUserData | null): boolean {
  if (!data?.user || !data?.relaties) {
    return false;
  }

  return (
    data.relaties.google_maps == null ||
    data.relaties.email_adres == null ||
    data.user.profile_image == null
  );
}

export async function getStoredUserData(): Promise<StoredUserData | null> {
  const userData = await getData("USERDATA");
  return userData?.data ?? null;
}

export async function hasUserSession(): Promise<boolean> {
  const data = await getStoredUserData();
  return Boolean(data?.user && data?.relaties);
}

export async function isLoggedIn(): Promise<boolean> {
  const data = await getStoredUserData();
  if (!data?.user || !data?.relaties) {
    return false;
  }

  if (isProfileIncomplete(data)) {
    return false;
  }

  const auth = await getData("AUTH");
  const login = await getData("LOGIN");
  return Boolean(auth || login);
}

/** Clear login session but keep onboarding prefs (matches old Home/Profile logout). */
export async function logoutAndPreservePreferences(): Promise<void> {
  const userLanguage = await AsyncStorage.getItem("userLanguage");

  await clearAllData();

  if (userLanguage !== null) {
    await AsyncStorage.setItem("userLanguage", userLanguage);
  }

  await storeData("SELECT", true);
}

/** Clear login session on token expiry; keeps SELECT so user returns to company login. */
export async function clearAuthSession(): Promise<void> {
  await logoutAndPreservePreferences();
}

/** Verify stored token with server; clears session when expired. */
export async function validateSessionWithServer(): Promise<boolean> {
  if (!(await isLoggedIn())) {
    return false;
  }

  try {
    const { default: apiClient } = await import("./client");
    const { apiConstants } = await import("./apiConstants");
    const response = await apiClient.post(apiConstants.permission);
    const body = response?.data;

    if (isTokenExpiredMessage(body?.message)) {
      await clearAuthSession();
      return false;
    }

    return body?.status === true;
  } catch {
    // Keep local session on network errors.
    return true;
  }
}

/** Decide where to send the user on cold start (after splash). */
export async function resolveInitialRoute(): Promise<AuthRedirect> {
  if (await isLoggedIn()) {
    const sessionValid = await validateSessionWithServer();
    if (sessionValid) {
      return "/(app)/(tabs)/menu";
    }
  }

  const data = await getStoredUserData();

  if (data?.user && data?.relaties && isProfileIncomplete(data)) {
    return "/registration/profile";
  }

  // Not logged in → always show welcome after splash.
  // Next step (lang/country or company) is chosen from the welcome screen.
  return "/onboarding";
}
