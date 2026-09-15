import AsyncStorage from "@react-native-async-storage/async-storage";
import { CommonActions } from "@react-navigation/native";
import { navigationRef } from "../navigationRef/navigationRef";
import { isUserLoggedIn } from "./notificationHelper";
import {
  clearNativePendingNotificationData,
  getNativePendingNotificationData,
} from "./nativeNotification";

export const NOTIFICATION_DATA_KEY = "NOTIFICATION_DATA";

const RETRY_DELAYS = [0, 100, 300, 500, 800, 1200, 1800, 2500, 3500, 5000, 7000];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const sanitizeNotificationData = (data) => {
  if (!data || typeof data !== "object") {
    return {};
  }

  const clean = {};
  Object.keys(data).forEach((key) => {
    if (key === "storedAt") {
      return;
    }
    const value = data[key];
    if (value != null && value !== "") {
      clean[key] = String(value);
    }
  });
  return clean;
};

export const buildTicketPayload = (data) => {
  const clean = sanitizeNotificationData(data);
  const rawId = clean.id ?? clean.ticket_id;
  const ticketId = rawId ? String(rawId) : undefined;

  return {
    ...clean,
    id: ticketId,
    ticket_id: clean.ticket_id ? String(clean.ticket_id) : ticketId,
    color_code: clean.color_code || "#eba14d",
    fromNotification: "true",
  };
};

const hasTicketIdentifier = (data) => {
  const payload = buildTicketPayload(data);
  return Boolean(payload.id || payload.ticket_id);
};

const navigateToTicketDetails = (payload) => {
  if (!navigationRef.isReady()) {
    return false;
  }

  navigationRef.dispatch(
    CommonActions.reset({
      index: 1,
      routes: [
        { name: "BottamScreens1" },
        {
          name: "TicketDetails",
          params: {
            item: payload,
            notificationKey: Date.now(),
          },
        },
      ],
    })
  );

  return true;
};

export async function openTicketFromNotification(rawData) {
  if (!hasTicketIdentifier(rawData)) {
    return false;
  }

  const loggedIn = await isUserLoggedIn();
  if (!loggedIn) {
    return false;
  }

  const payload = buildTicketPayload(rawData);

  if (navigateToTicketDetails(payload)) {
    return true;
  }

  for (let attempt = 0; attempt < 30; attempt += 1) {
    await wait(200);
    if (navigateToTicketDetails(payload)) {
      return true;
    }
  }

  return false;
}

export async function storeNotificationData(data) {
  const clean = sanitizeNotificationData(data);
  if (!hasTicketIdentifier(clean)) {
    return;
  }

  await AsyncStorage.setItem(
    NOTIFICATION_DATA_KEY,
    JSON.stringify({
      ...clean,
      storedAt: Date.now(),
    })
  );
}

export async function getStoredNotificationData() {
  try {
    const nativeData = await getNativePendingNotificationData();
    if (nativeData && typeof nativeData === "object") {
      const cleanNative = sanitizeNotificationData(nativeData);
      if (Object.keys(cleanNative).length > 0) {
        return cleanNative;
      }
    }

    const storedData = await AsyncStorage.getItem(NOTIFICATION_DATA_KEY);
    if (!storedData) {
      return null;
    }
    return sanitizeNotificationData(JSON.parse(storedData));
  } catch (error) {
    console.log("getStoredNotificationData error:", error);
    return null;
  }
}

export async function clearStoredNotificationData() {
  try {
    await clearNativePendingNotificationData();
    await AsyncStorage.removeItem(NOTIFICATION_DATA_KEY);
  } catch (error) {
    console.log("clearStoredNotificationData error:", error);
  }
}

export async function retryStoredNotificationNavigation() {
  for (const delay of RETRY_DELAYS) {
    if (delay > 0) {
      await wait(delay);
    }

    const stored = await getStoredNotificationData();
    if (!stored) {
      continue;
    }

    const loggedIn = await isUserLoggedIn();
    if (!loggedIn) {
      return false;
    }

    const success = await openTicketFromNotification(stored);
    if (success) {
      await clearStoredNotificationData();
      return true;
    }
  }

  return false;
}

export async function handleNotificationPress(data) {
  const clean = sanitizeNotificationData(data);

  if (!hasTicketIdentifier(clean)) {
    return retryStoredNotificationNavigation();
  }

  await storeNotificationData(clean);

  const loggedIn = await isUserLoggedIn();
  if (!loggedIn) {
    return false;
  }

  const success = await openTicketFromNotification(clean);
  if (success) {
    await clearStoredNotificationData();
    return true;
  }

  return retryStoredNotificationNavigation();
}
