import React from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import FallBackImage from "../../Components/FallBackImage";
import { useScreenInsets } from "../../utils/screenInsets";
import { AppColors } from "../../utils/theme";
import { Images } from "../../utils/Images";
import { LIST_UI } from "../../utils/connectionTheme";

export default function AboutAppScreen() {
  const router = useRouter();
  const { top, bottom } = useScreenInsets();
  const appVersion = Constants.expoConfig?.version ?? "1.0.0";

  return (
    <View style={[styles.container, { paddingTop: top, paddingBottom: bottom }]}>
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <FallBackImage source={Images.BackIcon} style={styles.backIcon} />
      </Pressable>

      <WebView
        source={{ uri: `https://app.erpportaal.nl/about_app_info/${appVersion}` }}
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.white,
  },
  backBtn: {
    marginTop: Platform.OS === "ios" ? 8 : 16,
    marginHorizontal: LIST_UI.screenPadding,
    width: 35,
    height: 35,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: LIST_UI.cardBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    width: 18,
    height: 18,
  },
  webview: {
    flex: 1,
    marginTop: 12,
  },
});
