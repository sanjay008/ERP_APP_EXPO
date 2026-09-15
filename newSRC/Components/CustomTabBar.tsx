import { type ReactNode } from "react";
import {
  Image,
  ImageSourcePropType,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { ANDROID_MIN_BOTTOM_INSET } from "../utils/screenInsets";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppData } from "../context/AppDataContext";
import { AppColors } from "../utils/theme";
import { FONTS } from "../utils/FONTS";
import { Images } from "../utils/Images";

type TabConfig = {
  name: string;
  label: string;
  icon: ImageSourcePropType;
  iconSize?: number;
};

type CustomTabBarProps = BottomTabBarProps;

const TAB_UI = {
  horizontalInset: 24,
  height: 87,
  radius: 100,
  iconCircle: 40,
  activeGlow: "rgba(78, 131, 231, 0.28)",
  glassBorder: "rgba(255, 255, 255, 0.75)",
  glassOverlay: Platform.OS === "android" ? "rgba(255, 255, 255, 0.92)" : "rgba(255, 255, 255, 0.45)",
} as const;

const TAB_CONFIG: Record<string, Omit<TabConfig, "label"> & { labelKey: string }> = {
  index: { name: "index", labelKey: "Home", icon: Images.TabHome },
  timeline: { name: "timeline", labelKey: "Schedule", icon: Images.TabCalendar },
  menu: { name: "menu", labelKey: "Menu", icon: Images.TabMenu },
  booking: { name: "booking", labelKey: "Booking", icon: Images.TabCar, iconSize: 24 },
};

const DEFAULT_ICON_DIMENSION = 22;

function hasReadPermission(value: unknown): boolean {
  return Number(value) === 1 || value === true || value === "1";
}

function canShowTab(routeName: string, permissions: any): boolean {
  if (routeName === "menu") return true;
  if (routeName === "index") return hasReadPermission(permissions?.home_timeline?.read);
  if (routeName === "timeline") return hasReadPermission(permissions?.calendar_timeline?.read);
  if (routeName === "booking") return hasReadPermission(permissions?.taxi_booking?.read);
  return true;
}

function TabIcon({
  source,
  size = DEFAULT_ICON_DIMENSION,
  focused = false,
}: {
  source: ImageSourcePropType;
  size?: number;
  focused?: boolean;
}) {
  return (
    <Image
      source={source}
      style={{
        width: size,
        height: size,
        tintColor: focused ? AppColors.primary : AppColors.black,
      }}
      resizeMode="contain"
    />
  );
}

function GlassTabShell({ children }: { children: ReactNode }) {
  const shellStyle = [styles.barShell, { backgroundColor: TAB_UI.glassOverlay }];

  if (Platform.OS === "ios") {
    const { BlurView } = require("expo-blur") as typeof import("expo-blur");
    return (
      <BlurView intensity={55} tint="systemThinMaterialLight" style={shellStyle}>
        {children}
      </BlurView>
    );
  }

  return <View style={shellStyle}>{children}</View>;
}

export default function CustomTabBar({
  state,
  descriptors,
  navigation,
}: CustomTabBarProps) {
  const { t } = useTranslation();
  const { permissions } = useAppData();
  const insets = useSafeAreaInsets();
  const bottomInset =
    Platform.OS === "android"
      ? Math.max(insets.bottom, ANDROID_MIN_BOTTOM_INSET)
      : Math.max(insets.bottom, 10);

  const visibleRoutes = state.routes.filter((route) => {
    const { options } = descriptors[route.key];
    if ((options as { href?: string | null }).href === null) return false;
    if (!canShowTab(route.name, permissions)) return false;
    return Boolean(TAB_CONFIG[route.name]);
  });

  const tabs = visibleRoutes.map((route) => {
    const index = state.routes.findIndex((item) => item.key === route.key);
    const { options } = descriptors[route.key];
    const config = TAB_CONFIG[route.name];
    const isFocused = state.index === index;
    const label =
      typeof options.tabBarLabel === "string"
        ? t(options.tabBarLabel)
        : t(config.labelKey);

    const onPress = () => {
      const event = navigation.emit({
        type: "tabPress",
        target: route.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    return (
      <Pressable
        key={route.key}
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        accessibilityLabel={options.tabBarAccessibilityLabel}
        onPress={onPress}
        style={styles.tab}
      >
        <View
          style={[
            styles.iconContainer,
            {
              width: TAB_UI.iconCircle,
              height: TAB_UI.iconCircle,
              borderRadius: TAB_UI.iconCircle / 2,
            },
          ]}
        >
          {isFocused ? (
            <View
              style={[styles.activeGlow, { borderRadius: TAB_UI.iconCircle / 2 }]}
            />
          ) : null}
          <TabIcon source={config.icon} size={config.iconSize} focused={isFocused} />
        </View>
        <Text style={[styles.label, isFocused && styles.labelFocused]}>{label}</Text>
      </Pressable>
    );
  });

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        { paddingBottom: bottomInset, paddingHorizontal: TAB_UI.horizontalInset },
      ]}
    >
      <View style={styles.shadowHost}>
        <GlassTabShell>
          <View style={styles.bar}>{tabs}</View>
        </GlassTabShell>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 8,
    backgroundColor: "transparent",
  },
  shadowHost: {
    borderRadius: TAB_UI.radius,
    backgroundColor: "transparent",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  barShell: {
    height: TAB_UI.height,
    borderRadius: TAB_UI.radius,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: TAB_UI.glassBorder,
  },
  bar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingTop: 12,
    paddingBottom: 10,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  activeGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: TAB_UI.activeGlow,
    transform: [{ scale: 1.1 }],
  },
  label: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 10,
    color: AppColors.black,
  },
  labelFocused: {
    fontFamily: FONTS.LexendSemiBold,
    color: AppColors.primary,
  },
});
