import { NativeModules, Platform } from "react-native";

const { NotificationBridge } = NativeModules;

export async function getNativePendingNotificationData() {
  if (Platform.OS !== "android" || !NotificationBridge?.getPendingNotificationData) {
    return null;
  }

  try {
    return await NotificationBridge.getPendingNotificationData();
  } catch (error) {
    console.log("getNativePendingNotificationData error:", error);
    return null;
  }
}

export async function clearNativePendingNotificationData() {
  if (Platform.OS !== "android" || !NotificationBridge?.clearPendingNotificationData) {
    return false;
  }

  try {
    await NotificationBridge.clearPendingNotificationData();
    return true;
  } catch (error) {
    console.log("clearNativePendingNotificationData error:", error);
    return false;
  }
}

export async function bringAppToForeground() {
  if (Platform.OS !== "android" || !NotificationBridge?.bringAppToForeground) {
    return false;
  }

  try {
    await NotificationBridge.bringAppToForeground();
    return true;
  } catch (error) {
    console.log("bringAppToForeground error:", error);
    return false;
  }
}
