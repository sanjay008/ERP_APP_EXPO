import { useEffect, useState } from "react";
import { Image, StyleSheet, View, useWindowDimensions } from "react-native";
import { RFValue } from "react-native-responsive-fontsize";
import { useAuthStore } from "../../store/authStore";
import { getData } from "../../utils/storeData";
import { Images } from "../../utils/Images";
import { AppColors } from "../../utils/theme";

type AuthHeaderLogoProps = {
  variant?: "default" | "company";
};

export default function AuthHeaderLogo({ variant = "company" }: AuthHeaderLogoProps) {
  const { width } = useWindowDimensions();
  const companyName = useAuthStore((state) => state.companyName);
  const storeCompanyLogo = useAuthStore((state) => state.companyLogo);
  const [storedLogo, setStoredLogo] = useState<string | null>(null);

  useEffect(() => {
    if (variant !== "company") return;

    getData("COMPANYLOGO").then((logo) => {
      setStoredLogo(typeof logo === "string" && logo.trim() ? logo : null);
    });
  }, [storeCompanyLogo, variant]);

  const hasCompanySession = Boolean(companyName.trim() || storeCompanyLogo);
  const companyLogo =
    variant === "company" && hasCompanySession
      ? storeCompanyLogo?.trim() || storedLogo
      : null;

  if (companyLogo) {
    return (
      <Image
        source={{ uri: companyLogo }}
        resizeMode="contain"
        style={[styles.companyLogo, { width: width * 0.62, height: RFValue(52) }]}
      />
    );
  }

  return (
    <View style={styles.logoWrap}>
      <Image source={Images.Logo} style={styles.defaultLogo} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  logoWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  defaultLogo: {
    width: 196,
    height: 32,
  },
  companyLogo: {
    maxHeight: RFValue(56),
  },
});
