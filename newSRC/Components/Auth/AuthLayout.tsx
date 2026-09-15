import type { ReactNode } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getKeyboardAvoidBehavior, useScreenInsets } from "../../utils/screenInsets";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import AuthHeaderPattern from "./AuthHeaderPattern";
import { AppColors } from "../../utils/theme";
import { authTypography } from "../../utils/authTypography";
import { FONTS } from "../../utils/FONTS";
import { RFValue } from "react-native-responsive-fontsize";

type AuthLayoutProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  backLink?: ReactNode;
  loading?: boolean;
  toastMessage?: string | null;
  headerLogo?: "default" | "company";
};

export default function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  backLink,
  loading = false,
  toastMessage,
  headerLogo = "company",
}: AuthLayoutProps) {
  const { top, footerPadding } = useScreenInsets();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={AppColors.primary} />
      <AuthHeaderPattern logoVariant={headerLogo} />

      <View style={[styles.card, { paddingBottom: footerPadding }]}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={getKeyboardAvoidBehavior()}
        >
          <KeyboardAwareScrollView
            enableOnAndroid
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <Text style={[authTypography.title, !subtitle && styles.titleOnly]}>{title}</Text>
            {subtitle ? (
              <Text style={[authTypography.subtitle, !backLink && styles.subtitleSpacing]}>
                {subtitle}
              </Text>
            ) : null}
            {backLink}
            {children}
            {footer ? <View style={styles.actions}>{footer}</View> : null}
          </KeyboardAwareScrollView>
        </KeyboardAvoidingView>
      </View>

      {toastMessage ? (
        <View style={[styles.toast, { top: top + 8 }]}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color={AppColors.white} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.primary,
  },
  flex: {
    flex: 1,
  },
  card: {
    flex: 1,
    backgroundColor: AppColors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -22,
    paddingTop: 28,
    paddingHorizontal: 24,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: -4 },
        shadowRadius: 12,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  scrollContent: {
    paddingBottom: 24,
  },
  titleOnly: {
    marginBottom: 12,
  },
  subtitleSpacing: {
    marginBottom: 24,
  },
  actions: {
    marginTop: 20,
    gap: 4,
  },
  toast: {
    position: "absolute",
    left: 16,
    right: 16,
    backgroundColor: "#FEE2E2",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    zIndex: 20,
  },
  toastText: {
    color: "#B91C1C",
    fontFamily: FONTS.LexendMedium,
    fontSize: RFValue(12),
    textAlign: "center",
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 30,
  },
});
