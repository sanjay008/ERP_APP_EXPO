import type { ReactNode } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import Svg, { Path } from "react-native-svg";
import { AppColors } from "../utils/theme";

type CurvedPanelProps = {
  height: number;
  curveHeight?: number;
  children: ReactNode;
  style?: object;
};

export default function CurvedPanel({
  height,
  curveHeight,
  children,
  style,
}: CurvedPanelProps) {
  const { width } = useWindowDimensions();
  const bump = curveHeight ?? width * 0.14;
  const totalHeight = height + bump;

  const path = `
    M 0 ${bump}
    Q ${width / 2} 0 ${width} ${bump}
    L ${width} ${totalHeight}
    L 0 ${totalHeight}
    Z
  `;

  return (
    <View style={[styles.wrapper, { height: totalHeight }, style]}>
      <Svg
        width={width}
        height={totalHeight}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      >
        <Path d={path} fill={AppColors.white} />
      </Svg>
      <View style={[styles.content, { paddingTop: bump + 24 }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    overflow: "visible",
  },
  content: {
    flex: 1,
    width: "100%",
  },
});
