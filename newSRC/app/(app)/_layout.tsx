import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Redirect, Stack } from "expo-router";
import { AppDataProvider, useAppData } from "../../context/AppDataContext";
import { RegisterBackProvider } from "../../constants/GoBackContext";
import AppToast from "../../Components/AppToast";
import { useNotificationBootstrap } from "../../hooks/useNotificationBootstrap";
import { resolveInitialRoute, type AuthRedirect } from "../../utils/authSession";
import { AppColors } from "../../utils/theme";

function AppStack() {
  const { fetchPermissions } = useAppData();
  const [checking, setChecking] = useState(true);
  const [redirectTo, setRedirectTo] = useState<AuthRedirect | null>(null);
  const [authenticated, setAuthenticated] = useState(false);

  useNotificationBootstrap(authenticated);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      const route = await resolveInitialRoute();
      if (!mounted) return;

      if (route === "/(app)/(tabs)/menu") {
        await fetchPermissions();
        if (!mounted) return;
        setAuthenticated(true);
        setRedirectTo(null);
      } else {
        setAuthenticated(false);
        setRedirectTo(route);
      }

      setChecking(false);
    };

    bootstrap();

    return () => {
      mounted = false;
    };
  }, [fetchPermissions]);

  if (checking) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: AppColors.white,
        }}
      >
        <ActivityIndicator size="large" color={AppColors.primary} />
      </View>
    );
  }

  if (redirectTo) {
    return <Redirect href={redirectTo} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="tickets/index" options={{ headerShown: false }} />
      <Stack.Screen name="tickets/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="tickets/create" options={{ headerShown: false }} />
      <Stack.Screen name="connections/index" options={{ headerShown: false }} />
      <Stack.Screen name="connections/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="projects/index" options={{ headerShown: false }} />
      <Stack.Screen name="projects/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="tasks/index" options={{ headerShown: false }} />
      <Stack.Screen name="tasks/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="tasks/create" options={{ headerShown: false }} />
      <Stack.Screen name="work-orders/index" options={{ headerShown: false }} />
      <Stack.Screen name="work-orders/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="tenant-contracts/index" options={{ headerShown: false }} />
      <Stack.Screen name="tenant-contracts/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="employees/index" options={{ headerShown: false }} />
      <Stack.Screen name="employees/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="check-in-out/index" options={{ headerShown: false }} />
      <Stack.Screen name="check-in-out/project" options={{ headerShown: false }} />
      <Stack.Screen name="employee-time/index" options={{ headerShown: false }} />
      <Stack.Screen name="child-time/index" options={{ headerShown: false }} />
      <Stack.Screen name="project-time/index" options={{ headerShown: false }} />
      <Stack.Screen name="project-time/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="home-tasks/create" options={{ headerShown: false }} />
      <Stack.Screen name="home-tasks/multiple-user" options={{ headerShown: false }} />
      <Stack.Screen name="customers/index" options={{ headerShown: false }} />
      <Stack.Screen name="customers/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="bookings/index" options={{ headerShown: false }} />
      <Stack.Screen name="bookings/past/index" options={{ headerShown: false }} />
      <Stack.Screen name="bookings/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="bookings/create" options={{ headerShown: false }} />
      <Stack.Screen name="my-company/index" options={{ headerShown: false }} />
      <Stack.Screen name="my-company/create" options={{ headerShown: false }} />
      <Stack.Screen name="my-company/business/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="products/index" options={{ headerShown: false }} />
      <Stack.Screen name="events/index" options={{ headerShown: false }} />
      <Stack.Screen name="events/[id]/bookings" options={{ headerShown: false }} />
      <Stack.Screen name="events/[id]/guests" options={{ headerShown: false }} />
      <Stack.Screen name="my-bookings/index" options={{ headerShown: false }} />
      <Stack.Screen name="my-bookings/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="absence-requests/[contractId]" options={{ headerShown: false }} />
      <Stack.Screen name="absence-requests/leave/[leaveId]" options={{ headerShown: false }} />
      <Stack.Screen name="child-contracts/index" options={{ headerShown: false }} />
      <Stack.Screen name="child-contracts/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="profile/index" options={{ headerShown: false }} />
      <Stack.Screen name="profile/edit" options={{ headerShown: false }} />
      <Stack.Screen name="profile/settings" options={{ headerShown: false }} />
      <Stack.Screen name="profile/change-password" options={{ headerShown: false }} />
      <Stack.Screen name="profile/change-language" options={{ headerShown: false }} />
      <Stack.Screen name="profile/change-timezone" options={{ headerShown: false }} />
      <Stack.Screen name="profile/password-settings" options={{ headerShown: false }} />
      <Stack.Screen name="documents/index" options={{ headerShown: false }} />
      <Stack.Screen name="documents/upload" options={{ headerShown: false }} />
      <Stack.Screen name="announcements/index" options={{ headerShown: false }} />
      <Stack.Screen name="announcements/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="payslips/index" options={{ headerShown: false }} />
      <Stack.Screen name="payslips/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="performance-reviews/index" options={{ headerShown: false }} />
      <Stack.Screen name="performance-reviews/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="pay-job/index" options={{ headerShown: false }} />
      <Stack.Screen name="pay-order/index" options={{ headerShown: false }} />
      <Stack.Screen name="pay-order/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="about/index" options={{ headerShown: false }} />
      <Stack.Screen name="events/[id]/scanner" options={{ headerShown: false }} />
      <Stack.Screen name="events/[id]/confirm" options={{ headerShown: false }} />
      <Stack.Screen name="products/create" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function AppLayout() {
  return (
    <AppDataProvider>
      <RegisterBackProvider>
        <AppStack />
        <AppToast />
      </RegisterBackProvider>
    </AppDataProvider>
  );
}
