import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { PermissionsAndroid, Platform } from "react-native";
import { getData } from "./storeData";

export const NOTIFICATION_DATA_KEY = "NOTIFICATION_DATA";

const RETRY_DELAYS = [0, 200, 500, 1000, 2000, 3500, 5000];

let notificationHandlerConfigured = false;

export function ensureNotificationHandler() {
  if (notificationHandlerConfigured) return;
  notificationHandlerConfigured = true;

  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (error) {
    console.log("Notification handler setup skipped:", error);
  }
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function sanitizeNotificationData(data: unknown): Record<string, string> {
  if (!data || typeof data !== "object") return {};

  const clean: Record<string, string> = {};
  Object.entries(data as Record<string, unknown>).forEach(([key, value]) => {
    if (key === "storedAt" || value == null || value === "") return;
    clean[key] = String(value);
  });
  return clean;
}

export function buildTicketPayload(data: Record<string, string>) {
  const rawId = data.id ?? data.ticket_id;
  const ticketId = rawId ? String(rawId) : undefined;

  return {
    ...data,
    id: ticketId,
    ticket_id: data.ticket_id ? String(data.ticket_id) : ticketId,
    color_code: data.color_code || "#eba14d",
    fromNotification: "true",
  };
}

function hasTicketIdentifier(data: Record<string, string>) {
  const payload = buildTicketPayload(data);
  return Boolean(payload.id || payload.ticket_id);
}

export async function isUserLoggedIn() {
  const auth = await getData("AUTH");
  const login = await getData("LOGIN");
  return auth === true || login === true;
}

export const FCM_TOKEN_KEY = "FCM_TOKEN";

async function ensureAndroidNotificationChannel() {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync("default", {
    name: "Default",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#0066CC",
    sound: "default",
  });

  if (Platform.Version >= 33) {
    await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  }
}

/**
 * Requests permission and returns the native push token (FCM on Android, APNs on iOS).
 * Backend field is still named `fcm_token`.
 */
export async function requestNotificationPermission(): Promise<string> {
  try {
    ensureNotificationHandler();
    await ensureAndroidNotificationChannel();

    if (!Device.isDevice) return "";

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== "granted") {
      const requested = await Notifications.requestPermissionsAsync();
      status = requested.status;
    }
    if (status !== "granted") return "";

    const token = await Notifications.getDevicePushTokenAsync();
    const tokenData =
      typeof token.data === "string" ? token.data : token.data != null ? String(token.data) : "";

    if (tokenData) {
      await AsyncStorage.setItem(FCM_TOKEN_KEY, tokenData);
    }

    console.log("Push token ready:", token.type, tokenData ? `${tokenData.slice(0, 12)}…` : "(empty)");
    return tokenData;
  } catch (error) {
    console.log("Notification permission error:", error);
    return "";
  }
}

export function navigateToTicketDetails(payload: ReturnType<typeof buildTicketPayload>) {
  const ticketId = payload.id ?? payload.ticket_id;
  if (!ticketId) return false;

  router.push({
    pathname: "/(app)/tickets/[id]",
    params: {
      id: ticketId,
      color_code: payload.color_code,
      fromNotification: payload.fromNotification,
      notificationKey: String(Date.now()),
    },
  });
  return true;
}

export async function openTicketFromNotification(rawData: unknown) {
  const clean = sanitizeNotificationData(rawData);
  if (!hasTicketIdentifier(clean)) return false;

  const loggedIn = await isUserLoggedIn();
  if (!loggedIn) return false;

  const payload = buildTicketPayload(clean);
  navigateToTicketDetails(payload);
  return true;
}

export async function storeNotificationData(data: Record<string, string>) {
  if (!hasTicketIdentifier(data)) return;
  await AsyncStorage.setItem(
    NOTIFICATION_DATA_KEY,
    JSON.stringify({ ...data, storedAt: Date.now() })
  );
}

export async function getStoredNotificationData() {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATION_DATA_KEY);
    if (!stored) return null;
    return sanitizeNotificationData(JSON.parse(stored));
  } catch {
    return null;
  }
}

export async function clearStoredNotificationData() {
  await AsyncStorage.removeItem(NOTIFICATION_DATA_KEY);
}

export async function retryStoredNotificationNavigation() {
  for (const delay of RETRY_DELAYS) {
    if (delay > 0) await wait(delay);

    const stored = await getStoredNotificationData();
    if (!stored) continue;

    const loggedIn = await isUserLoggedIn();
    if (!loggedIn) return false;

    const success = await openTicketFromNotification(stored);
    if (success) {
      await clearStoredNotificationData();
      return true;
    }
  }
  return false;
}

export async function handleNotificationPress(data: unknown) {
  const clean = sanitizeNotificationData(data);
  if (!hasTicketIdentifier(clean)) {
    return retryStoredNotificationNavigation();
  }

  await storeNotificationData(clean);

  const loggedIn = await isUserLoggedIn();
  if (!loggedIn) return false;

  const success = await openTicketFromNotification(clean);
  if (success) {
    await clearStoredNotificationData();
    return true;
  }

  return retryStoredNotificationNavigation();
}
