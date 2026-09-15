import {
  Image,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useScreenInsets } from "../../utils/screenInsets";
import CurvedPanel from "../../Components/CurvedPanel";
import { Images } from "../../utils/Images";
import { AppColors } from "../../utils/theme";
import { FONTS } from "../../utils/FONTS";
import { RFValue } from "react-native-responsive-fontsize";
import { useAuthStore } from "../../store/authStore";

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const resetRegistrationFlow = useAuthStore((state) => state.resetRegistrationFlow);
  const { footerPadding } = useScreenInsets();
  const { width, height } = useWindowDimensions();

  const panelHeight = height * 0.4;
  const curveHeight = width * 0.16;
  const imageHeight = height - panelHeight + curveHeight * 0.5;

  const handleRegistration = () => {
    resetRegistrationFlow();
    router.replace("/registration");
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <Image
        source={Images.SplashBackground}
        style={[styles.backgroundImage, { height: imageHeight }]}
        resizeMode="cover"
      />

      <View style={[styles.panelWrapper, { paddingBottom: footerPadding }]}>
        <CurvedPanel height={panelHeight} curveHeight={curveHeight}>
          <View style={styles.panelContent}>
            <View style={styles.textBlock}>
              <Text style={styles.welcomeText}>{t("Welcome to")}</Text>
              <Text style={styles.brandText}>ERPPORTAAL.NL</Text>
              <Text style={styles.subtitle}>{t("Easy check-in & check-out")}</Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.primaryButtonPressed,
              ]}
              onPress={handleRegistration}
            >
              <Text style={styles.primaryButtonText}>{t("Registration")}</Text>
            </Pressable>
          </View>
        </CurvedPanel>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.white,
  },
  backgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
  },
  panelWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 2,
  },
  panelContent: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 8,
  },
  textBlock: {
    alignItems: "center",
    width: "100%",
    gap: 6,
  },
  welcomeText: {
    fontFamily: FONTS.LexendRegular,
    fontSize: RFValue(15),
    color: AppColors.black,
    textAlign: "center",
  },
  brandText: {
    fontFamily: FONTS.LexendBold,
    fontSize: RFValue(24),
    color: AppColors.black,
    textAlign: "center",
    letterSpacing: 0.3,
    marginTop: 2,
  },
  subtitle: {
    fontFamily: FONTS.LexendRegular,
    fontSize: RFValue(13),
    color: AppColors.subtitle,
    textAlign: "center",
    marginTop: 8,
  },
  primaryButton: {
    width: "100%",
    backgroundColor: AppColors.onboardingButton,
    borderRadius: 10,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonPressed: {
    opacity: 0.92,
  },
  primaryButtonText: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: RFValue(15),
    color: AppColors.white,
  },
});
