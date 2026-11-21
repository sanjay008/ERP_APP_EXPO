import { useEffect } from "react";
import { Image, StatusBar, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Images } from "../../utils/Images";
import { AppColors } from "../../utils/theme";
import { resolveInitialRoute } from "../../utils/authSession";
import { applyOtaUpdateOnSplash } from "../../utils/otaUpdate";

const SPLASH_DURATION_MS = 1600;

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const navigate = async () => {
      // Apply OTA here before session routing so login is never reset mid-session.
      await applyOtaUpdateOnSplash();
      if (!mounted) return;

      const route = await resolveInitialRoute();
      if (!mounted) return;

      setTimeout(() => {
        if (mounted) {
          router.replace(route);
        }
      }, SPLASH_DURATION_MS);
    };

    void navigate();

    return () => {
      mounted = false;
    };
  }, [router]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={AppColors.white} />
      <Image source={Images.Logo} style={styles.logo} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.white,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  logo: {
    width: "88%",
    maxWidth: 280,
    height: 56,
  },
});
