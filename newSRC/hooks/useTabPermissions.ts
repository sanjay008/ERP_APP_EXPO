import { useEffect } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";

export function useTabPermissions() {
  useEffect(() => {
    const requestPermissions = async () => {
      if (Platform.OS === "android") {
        try {
          await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
          );
          await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
        } catch (error) {
          console.log("Tab permission error:", error);
        }
        return;
      }

      try {
        await ImagePicker.requestCameraPermissionsAsync();
      } catch (error) {
        console.log("iOS camera permission error:", error);
      }
    };

    requestPermissions();
  }, []);
}
