import React, { useMemo } from "react";
import { StyleSheet, useWindowDimensions, View, ViewStyle } from "react-native";
import RenderHTML, { type MixedStyleDeclaration } from "react-native-render-html";
import { Colors } from "../utils/colors";
import { FONTS } from "../utils/FONTS";

export type HtmlVariant = "description" | "note";

type Props = {
  html?: string | null;
  containerStyle?: ViewStyle;
  contentWidth?: number;
  variant?: HtmlVariant;
};

const SYSTEM_FONTS = [...new Set(Object.values(FONTS))];

const VARIANT_THEME: Record<
  HtmlVariant,
  {
    fontSize: number;
    lineHeight: number;
    color: string;
    fontRegular: string;
    fontMedium: string;
    fontSemiBold: string;
    fontBold: string;
  }
> = {
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.black,
    fontRegular: FONTS.OutfitRegular,
    fontMedium: FONTS.OutfitMedium,
    fontSemiBold: FONTS.OutfitSemiBold,
    fontBold: FONTS.OutfitBold,
  },
  note: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.black,
    fontRegular: FONTS.OutfitRegular,
    fontMedium: FONTS.OutfitMedium,
    fontSemiBold: FONTS.OutfitSemiBold,
    fontBold: FONTS.OutfitBold,
  },
};

const wrapPlainTextAsHtml = (value?: string | null) => {
  if (!value || !value.trim()) {
    return "<p>-</p>";
  }
  if (!/<[a-z][\s\S]*>/i.test(value)) {
    return `<p>${value}</p>`;
  }
  return value;
};

const buildTagsStyles = (variant: HtmlVariant): Record<string, MixedStyleDeclaration> => {
  const theme = VARIANT_THEME[variant];

  return {
    body: {
      color: theme.color,
      fontFamily: theme.fontRegular,
      fontSize: theme.fontSize,
      lineHeight: theme.lineHeight,
      margin: 0,
      padding: 0,
    },
    div: {
      color: theme.color,
      fontFamily: theme.fontRegular,
      fontSize: theme.fontSize,
      lineHeight: theme.lineHeight,
      margin: 0,
      padding: 0,
    },
    span: {
      color: theme.color,
      fontFamily: theme.fontRegular,
      fontSize: theme.fontSize,
      lineHeight: theme.lineHeight,
    },
    p: {
      marginTop: 0,
      marginBottom: variant === "note" ? 4 : 8,
      color: theme.color,
      fontFamily: theme.fontMedium,
      fontSize: theme.fontSize,
      lineHeight: theme.lineHeight,
    },
    h1: {
      color: theme.color,
      fontFamily: theme.fontBold,
      fontSize: variant === "note" ? 18 : 20,
      lineHeight: variant === "note" ? 24 : 28,
      marginBottom: 8,
    },
    h2: {
      color: theme.color,
      fontFamily: theme.fontSemiBold,
      fontSize: variant === "note" ? 16 : 18,
      lineHeight: variant === "note" ? 22 : 26,
      marginBottom: 8,
    },
    h3: {
      color: theme.color,
      fontFamily: theme.fontSemiBold,
      fontSize: variant === "note" ? 15 : 16,
      lineHeight: variant === "note" ? 21 : 24,
      marginBottom: 6,
    },
    strong: {
      fontFamily: theme.fontBold,
      color: theme.color,
    },
    b: {
      fontFamily: theme.fontBold,
      color: theme.color,
    },
    em: {
      fontStyle: "italic",
      color: theme.color,
    },
    i: {
      fontStyle: "italic",
      color: theme.color,
    },
    u: {
      textDecorationLine: "underline",
      color: theme.color,
    },
    li: {
      color: theme.color,
      fontFamily: theme.fontRegular,
      fontSize: theme.fontSize,
      lineHeight: theme.lineHeight,
    },
    ul: {
      marginBottom: variant === "note" ? 4 : 8,
    },
    ol: {
      marginBottom: variant === "note" ? 4 : 8,
    },
    a: {
      color: Colors.primary,
      textDecorationLine: "underline",
      fontFamily: theme.fontMedium,
    },
  };
};

function HtmlContent({
  html,
  containerStyle,
  contentWidth,
  variant = "description",
}: Props) {
  const { width } = useWindowDimensions();
  const resolvedWidth = contentWidth ?? width - 30;
  const theme = VARIANT_THEME[variant];

  const source = useMemo(
    () => ({ html: wrapPlainTextAsHtml(html) }),
    [html]
  );

  const tagsStyles = useMemo(() => buildTagsStyles(variant), [variant]);

  const baseStyle = useMemo(
    () => ({
      color: theme.color,
      fontFamily: theme.fontRegular,
      fontSize: theme.fontSize,
      lineHeight: theme.lineHeight,
    }),
    [theme]
  );

  return (
    <View style={[styles.container, containerStyle]}>
      <RenderHTML
        contentWidth={resolvedWidth}
        source={source}
        tagsStyles={tagsStyles}
        baseStyle={baseStyle}
        systemFonts={SYSTEM_FONTS}
        defaultTextProps={{
          selectable: true,
          style: {
            color: theme.color,
            fontFamily: theme.fontRegular,
            fontSize: theme.fontSize,
            lineHeight: theme.lineHeight,
          },
        }}
      />
    </View>
  );
}

export default React.memo(HtmlContent);

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
});
