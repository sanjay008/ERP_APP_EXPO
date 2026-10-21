import AsyncStorage from "@react-native-async-storage/async-storage";
import { getData, storeData } from "./storeData";

export const SAVED_ACCOUNTS_KEY = "SAVED_ACCOUNTS";
export const ACTIVE_ACCOUNT_ID_KEY = "ACTIVE_ACCOUNT_ID";

export const SESSION_STORAGE_KEYS = [
  "USERDATA",
  "AUTH",
  "LOGIN",
  "COMPANYLOGIN",
  "COMPANYDATA",
  "COMPANYLOGO",
  "GOOGLEMAPAPIKEY",
  "GOOGLE_API_KEY",
] as const;

export type SessionSnapshot = {
  USERDATA: unknown;
  AUTH: boolean;
  LOGIN?: boolean;
  COMPANYLOGIN: string;
  COMPANYDATA: unknown;
  COMPANYLOGO: string | null;
  google_maps_api_key: string | null;
  GOOGLE_API_KEY: string | null;
};

export type SavedAccount = {
  id: string;
  companyLogin: string;
  displayName: string;
  identifier: string;
  profileImage?: string | null;
  session: SessionSnapshot;
  updatedAt: number;
};

type UserPayload = {
  id?: string | number;
  email?: string;
  whatsapp_number?: string;
  country_code?: string;
  login_company?: string;
  profile_image?: string | null;
};

type RelatiePayload = {
  display_name?: string;
  voornaam?: string;
  achternaam?: string;
  email_adres?: string;
  mobiel?: string;
  country_code?: string;
  file_path?: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function readUserPayload(userData: unknown): { user?: UserPayload; relaties?: RelatiePayload } {
  const root = asRecord(userData);
  const data = asRecord(root?.data) ?? root;
  return {
    user: asRecord(data?.user) as UserPayload | undefined,
    relaties: asRecord(data?.relaties) as RelatiePayload | undefined,
  };
}

export function makeAccountId(companyLogin: string, userId: string | number) {
  return `${companyLogin.trim().toLowerCase()}::${userId}`;
}

export function getAccountMeta(userData: unknown, companyLogin: string) {
  const { user, relaties } = readUserPayload(userData);
  const nameFromRelatie = [relaties?.voornaam, relaties?.achternaam]
    .filter(Boolean)
    .join(" ")
    .trim();
  const identifier =
    user?.email ||
    relaties?.email_adres ||
    (user?.whatsapp_number
      ? `+${user.country_code || relaties?.country_code || ""} ${user.whatsapp_number}`.trim()
      : "") ||
    relaties?.mobiel ||
    "";

  return {
    userId: user?.id,
    companyLogin: companyLogin || user?.login_company || "",
    displayName: relaties?.display_name || nameFromRelatie || identifier || "Account",
    identifier,
    profileImage: user?.profile_image || relaties?.file_path || null,
  };
}

export async function captureSessionSnapshot(): Promise<SessionSnapshot> {
  const [
    USERDATA,
    AUTH,
    LOGIN,
    COMPANYLOGIN,
    COMPANYDATA,
    COMPANYLOGO,
    mapsKey,
    googleApiKey,
  ] = await Promise.all([
    getData("USERDATA"),
    getData("AUTH"),
    getData("LOGIN"),
    getData("COMPANYLOGIN"),
    getData("COMPANYDATA"),
    getData("COMPANYLOGO"),
    getData("GOOGLEMAPAPIKEY"),
    getData("GOOGLE_API_KEY"),
  ]);

  const logo = typeof COMPANYLOGO === "string" ? COMPANYLOGO : null;
  const maps = typeof mapsKey === "string" ? mapsKey : null;
  const extraKey = typeof googleApiKey === "string" ? googleApiKey : maps;

  return {
    USERDATA,
    AUTH: Boolean(AUTH),
    LOGIN: Boolean(LOGIN),
    COMPANYLOGIN: typeof COMPANYLOGIN === "string" ? COMPANYLOGIN : "",
    COMPANYDATA: COMPANYDATA ?? null,
    COMPANYLOGO: logo,
    google_maps_api_key: maps,
    GOOGLE_API_KEY: extraKey,
  };
}

export async function restoreSessionSnapshot(snapshot: SessionSnapshot) {
  await storeData("USERDATA", snapshot.USERDATA);
  await storeData("AUTH", snapshot.AUTH);
  await storeData("LOGIN", snapshot.LOGIN ?? snapshot.AUTH);
  await storeData("COMPANYLOGIN", snapshot.COMPANYLOGIN);
  await storeData("COMPANYDATA", snapshot.COMPANYDATA);
  await storeData("COMPANYLOGO", snapshot.COMPANYLOGO ?? "");
  await storeData("GOOGLEMAPAPIKEY", snapshot.google_maps_api_key ?? "");
  await storeData("GOOGLE_API_KEY", snapshot.GOOGLE_API_KEY ?? snapshot.google_maps_api_key ?? "");
}

export async function applySessionSnapshot(snapshot: SessionSnapshot) {
  await restoreSessionSnapshot({
    ...snapshot,
    AUTH: true,
    LOGIN: true,
  });
}

export async function getSavedAccounts(): Promise<SavedAccount[]> {
  try {
    const raw = await AsyncStorage.getItem(SAVED_ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function setSavedAccounts(accounts: SavedAccount[]) {
  await AsyncStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(accounts));
}

export async function getActiveAccountId(): Promise<string | null> {
  return AsyncStorage.getItem(ACTIVE_ACCOUNT_ID_KEY);
}

export async function setActiveAccountId(id: string) {
  await AsyncStorage.setItem(ACTIVE_ACCOUNT_ID_KEY, id);
}

export async function upsertSavedAccount(account: SavedAccount) {
  const accounts = await getSavedAccounts();
  const next = accounts.filter((item) => item.id !== account.id);
  next.unshift(account);
  await setSavedAccounts(next);
  await setActiveAccountId(account.id);
  return next;
}

export async function upsertCurrentAccountFromSession() {
  const snapshot = await captureSessionSnapshot();
  const meta = getAccountMeta(snapshot.USERDATA, snapshot.COMPANYLOGIN);
  if (meta.userId == null || !meta.companyLogin) return null;

  const account: SavedAccount = {
    id: makeAccountId(meta.companyLogin, meta.userId),
    companyLogin: meta.companyLogin,
    displayName: meta.displayName,
    identifier: meta.identifier,
    profileImage: meta.profileImage,
    session: snapshot,
    updatedAt: Date.now(),
  };

  await upsertSavedAccount(account);
  return account;
}

export async function readLogoutPreserveBundle() {
  const [userLanguage, savedAccounts, activeAccountId] = await Promise.all([
    AsyncStorage.getItem("userLanguage"),
    AsyncStorage.getItem(SAVED_ACCOUNTS_KEY),
    AsyncStorage.getItem(ACTIVE_ACCOUNT_ID_KEY),
  ]);
  return { userLanguage, savedAccounts, activeAccountId };
}

export async function writeLogoutPreserveBundle(bundle: {
  userLanguage: string | null;
  savedAccounts: string | null;
  activeAccountId: string | null;
}) {
  if (bundle.userLanguage !== null) {
    await AsyncStorage.setItem("userLanguage", bundle.userLanguage);
  }
  if (bundle.savedAccounts !== null) {
    await AsyncStorage.setItem(SAVED_ACCOUNTS_KEY, bundle.savedAccounts);
  }
  if (bundle.activeAccountId !== null) {
    await AsyncStorage.setItem(ACTIVE_ACCOUNT_ID_KEY, bundle.activeAccountId);
  }
}
