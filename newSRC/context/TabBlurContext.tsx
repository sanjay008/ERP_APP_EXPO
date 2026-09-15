import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Platform, StyleSheet, View } from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import CustomTabBar from "../Components/CustomTabBar";

type TabBlurContextValue = {
  publishTabBarProps: (props: BottomTabBarProps) => void;
};

const TabBlurContext = createContext<TabBlurContextValue | null>(null);

function TabContentShell({ children }: { children: ReactNode }) {
  const shellStyle = { flex: 1 as const, backgroundColor: "transparent" as const };

  if (Platform.OS === "ios") {
    const { BlurTargetView } = require("expo-blur") as typeof import("expo-blur");
    return (
      <BlurTargetView style={shellStyle} collapsable={false}>
        {children}
      </BlurTargetView>
    );
  }

  return (
    <View style={shellStyle} collapsable={false}>
      {children}
    </View>
  );
}

export function TabBlurProvider({ children }: { children: ReactNode }) {
  const portalRef = useRef<((props: BottomTabBarProps) => void) | null>(null);

  const publishTabBarProps = useCallback((props: BottomTabBarProps) => {
    portalRef.current?.(props);
  }, []);

  const content = (
    <>
      {children}
      <View pointerEvents="box-none" style={StyleSheet.absoluteFill} collapsable={false}>
        <TabBarPortalHost portalRef={portalRef} />
      </View>
    </>
  );

  return (
    <TabBlurContext.Provider value={{ publishTabBarProps }}>
      <View style={{ flex: 1, backgroundColor: "transparent" }} collapsable={false}>
        <TabContentShell>{content}</TabContentShell>
      </View>
    </TabBlurContext.Provider>
  );
}

function TabBarPortalHost({
  portalRef,
}: {
  portalRef: React.RefObject<((props: BottomTabBarProps) => void) | null>;
}) {
  const ctx = useContext(TabBlurContext);
  const [tabBarProps, setTabBarProps] = useState<BottomTabBarProps | null>(null);

  useLayoutEffect(() => {
    portalRef.current = setTabBarProps;
    return () => {
      portalRef.current = null;
    };
  }, [portalRef]);

  if (!ctx || !tabBarProps) return null;

  return <CustomTabBar {...tabBarProps} />;
}

function getTabBarUpdateKey(props: BottomTabBarProps) {
  return props.state.routes
    .map((route) => {
      const options = props.descriptors[route.key]?.options as { href?: string | null };
      const hidden = options?.href === null ? "0" : "1";
      return `${route.name}:${hidden}:${props.state.index === props.state.routes.indexOf(route) ? "1" : "0"}`;
    })
    .join("|");
}

/** Forwards tab navigation state to the portal host (tab bar stays outside blur shell). */
export function TabBarCapture(props: BottomTabBarProps) {
  const ctx = useContext(TabBlurContext);
  const propsRef = useRef(props);
  propsRef.current = props;
  const updateKey = getTabBarUpdateKey(props);

  useLayoutEffect(() => {
    ctx?.publishTabBarProps(propsRef.current);
  }, [ctx, updateKey]);

  return null;
}
