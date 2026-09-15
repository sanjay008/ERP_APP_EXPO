import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import CustomTabBar from "../../../Components/CustomTabBar";
import { useAppData } from "../../../context/AppDataContext";
import { useTabPermissions } from "../../../hooks/useTabPermissions";
import { getData } from "../../../utils/storeData";
import { AppColors } from "../../../utils/theme";

export default function TabsLayout() {
  const { t } = useTranslation();
  const { permissions, fetchPermissions } = useAppData();
  const [loading, setLoading] = useState(true);

  useTabPermissions();

  const loadPermissions = useCallback(async () => {
    setLoading(true);
    try {
      const userData = await getData("USERDATA");
      if (userData?.data?.user) {
        await fetchPermissions();
      }
    } catch (error) {
      console.log("Error loading permissions:", error);
    } finally {
      setLoading(false);
    }
  }, [fetchPermissions]);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  const showHome = permissions?.home_timeline?.read == 1;
  const showSchedule = permissions?.calendar_timeline?.read == 1;
  const showBooking = permissions?.taxi_booking?.read == 1;

  const initialRouteName = "menu";

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: AppColors.white }}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </View>
    );
  }

  return (
    <Tabs
      initialRouteName={initialRouteName}
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        lazy: true,
        sceneStyle: {
          backgroundColor: "transparent",
        },
        tabBarStyle: {
          position: "absolute",
          backgroundColor: "transparent",
          borderTopWidth: 0,
          elevation: 0,
          height: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("Home"),
          href: showHome ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="timeline"
        options={{
          title: t("Schedule"),
          href: showSchedule ? undefined : null,
        }}
      />
      <Tabs.Screen name="menu" options={{ title: t("Menu") }} />
      <Tabs.Screen
        name="booking"
        options={{
          title: t("Booking"),
          href: showBooking ? undefined : null,
        }}
      />
    </Tabs>
  );
}
