import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import {
  handleNotificationPress,
  retryStoredNotificationNavigation,
  ensureNotificationHandler,
} from "../utils/notificationService";

export function useNotificationBootstrap(enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    ensureNotificationHandler();

    let mounted = true;

    const bootstrap = async () => {
      try {
        const initial = await Notifications.getLastNotificationResponseAsync();
        if (mounted && initial?.notification.request.content.data) {
          await handleNotificationPress(initial.notification.request.content.data);
        } else if (mounted) {
          await retryStoredNotificationNavigation();
        }
      } catch (error) {
        console.log("Notification bootstrap skipped:", error);
      }
    };

    bootstrap();

    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        handleNotificationPress(response.notification.request.content.data);
      }
    );

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, [enabled]);
}
