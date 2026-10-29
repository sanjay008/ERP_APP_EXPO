import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
  Image,
  ImageSourcePropType,
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
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
  barPaddingH: 8,
  iconCircle: 40,
  activeGlow: "rgba(78, 131, 231, 0.28)",
  glassBorder: "rgba(255, 255, 255, 0.75)",
  glassOverlay: Platform.OS === "android" ? "rgba(255, 255, 255, 0.92)" : "rgba(255, 255, 255, 0.45)",
  indicatorTop: 12,
  animDuration: 220,
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
  const bottomInset = Math.max(insets.bottom, 8);
  const [barWidth, setBarWidth] = useState(0);
  const indicatorX = useSharedValue(0);
  const hasPositioned = useSharedValue(0);

  const visibleRoutes = useMemo(
    () =>
      state.routes.filter((route) => {
        const { options } = descriptors[route.key];
        if ((options as { href?: string | null }).href === null) return false;
        if (!canShowTab(route.name, permissions)) return false;
        return Boolean(TAB_CONFIG[route.name]);
      }),
    [descriptors, permissions, state.routes]
  );

  const focusedVisibleIndex = useMemo(() => {
    const focusedRoute = state.routes[state.index];
    const idx = visibleRoutes.findIndex((route) => route.key === focusedRoute?.key);
    return idx >= 0 ? idx : 0;
  }, [state.index, state.routes, visibleRoutes]);

  const tabCount = visibleRoutes.length;
  const tabWidth =
    tabCount > 0 && barWidth > 0
      ? (barWidth - TAB_UI.barPaddingH * 2) / tabCount
      : 0;

  useEffect(() => {
    if (tabWidth <= 0) return;
    const nextX =
      TAB_UI.barPaddingH + tabWidth * focusedVisibleIndex + (tabWidth - TAB_UI.iconCircle) / 2;
    if (hasPositioned.value === 0) {
      indicatorX.value = nextX;
      hasPositioned.value = 1;
      return;
    }
    indicatorX.value = withTiming(nextX, { duration: TAB_UI.animDuration });
  }, [focusedVisibleIndex, hasPositioned, indicatorX, tabWidth]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  const onBarLayout = (event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    if (width > 0 && width !== barWidth) setBarWidth(width);
  };

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
          <View style={styles.bar} onLayout={onBarLayout}>
            {tabWidth > 0 ? (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.activeIndicator,
                  {
                    width: TAB_UI.iconCircle,
                    height: TAB_UI.iconCircle,
                    borderRadius: TAB_UI.iconCircle / 2,
                    top: TAB_UI.indicatorTop,
                  },
                  indicatorStyle,
                ]}
              />
            ) : null}
            {tabs}
          </View>
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
    paddingHorizontal: TAB_UI.barPaddingH,
  },
  activeIndicator: {
    position: "absolute",
    left: 0,
    backgroundColor: TAB_UI.activeGlow,
    zIndex: 0,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingTop: 12,
    paddingBottom: 10,
    zIndex: 1,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
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
