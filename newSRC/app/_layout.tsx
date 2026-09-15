import { useEffect } from "react";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import * as ExpoSplashScreen from "expo-splash-screen";
import { I18nextProvider } from "react-i18next";
import { SafeAreaProvider } from "react-native-safe-area-context";
import NoInternetOverlay from "../Components/NoInternetOverlay";
import OtaAutoReload from "../Components/OtaAutoReload";
import { NetworkProvider } from "../context/NetworkContext";
import i18n from "../translation/i18n";

if (typeof window !== "undefined") {
  void ExpoSplashScreen.preventAutoHideAsync();
}

export const unstable_settings = {
  initialRouteName: "index",
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    "Lexend-Black": require("../assets/fonts/Lexend-Black.ttf"),
    "Lexend-Bold": require("../assets/fonts/Lexend-Bold.ttf"),
    "Lexend-SemiBold": require("../assets/fonts/Lexend-SemiBold.ttf"),
    "Lexend-Medium": require("../assets/fonts/Lexend-Medium.ttf"),
    "Lexend-Regular": require("../assets/fonts/Lexend-Regular.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      ExpoSplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return <OtaAutoReload />;
  }

  return (
    <I18nextProvider i18n={i18n}>
      <OtaAutoReload />
      <SafeAreaProvider>
        <NetworkProvider>
          <NoInternetOverlay />
          <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="splash" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="registration" />
            <Stack.Screen name="home" />
            <Stack.Screen name="(app)" />
          </Stack>
        </NetworkProvider>
      </SafeAreaProvider>
    </I18nextProvider>
  );
}
