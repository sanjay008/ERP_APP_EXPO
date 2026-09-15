import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";
import AuthHeaderLogo from "./AuthHeaderLogo";

type AuthHeaderPatternProps = {
  logoVariant?: "default" | "company";
};

const FLOATING_SQUARES = [
  { left: "6%", top: 18, size: 34, opacity: 0.14 },
  { left: "22%", top: 8, size: 22, opacity: 0.1 },
  { left: "48%", top: 14, size: 28, opacity: 0.12 },
  { left: "68%", top: 6, size: 20, opacity: 0.1 },
  { left: "82%", top: 22, size: 30, opacity: 0.13 },
  { left: "14%", top: 52, size: 18, opacity: 0.08 },
  { left: "58%", top: 48, size: 24, opacity: 0.1 },
  { left: "88%", top: 44, size: 16, opacity: 0.08 },
] as const;

export default function AuthHeaderPattern({ logoVariant = "company" }: AuthHeaderPatternProps) {
  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={["#4E83E7", "#5A8DEE", "#4A78D8"]}
        style={StyleSheet.absoluteFill}
      />

      {FLOATING_SQUARES.map((square, index) => (
        <View
          key={index}
          style={[
            styles.square,
            {
              left: square.left,
              top: square.top,
              width: square.size,
              height: square.size,
              opacity: square.opacity,
            },
          ]}
        />
      ))}

      <AuthHeaderLogo variant={logoVariant} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: 176,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  square: {
    position: "absolute",
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
  },
});
