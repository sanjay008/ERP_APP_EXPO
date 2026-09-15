import { useEffect } from "react";
import { DeviceEventEmitter, Platform } from "react-native";
import { handleNotificationPress } from "../utils/notificationNavigation";

export default function useForegroundNotification() {
  useEffect(() => {
    const nativeOpenSubscription =
      Platform.OS === "android"
        ? DeviceEventEmitter.addListener("NotificationOpened", (data) => {
            handleNotificationPress(data).catch((error) => {
              console.log("Native notification open error:", error);
            });
          })
        : null;

    return () => {
      nativeOpenSubscription?.remove();
    };
  }, []);
}
