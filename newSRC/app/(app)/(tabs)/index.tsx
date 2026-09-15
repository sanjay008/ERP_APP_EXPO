import { Redirect } from "expo-router";
import { useAppData } from "../../../context/AppDataContext";
import TimelineScreen from "../../../screens/Timeline/TimelineScreen";

function hasReadPermission(value: unknown): boolean {
  return Number(value) === 1 || value === true || value === "1";
}

export default function HomeTab() {
  const { permissions } = useAppData();

  // Without home timeline permission, never stay on Check In screen
  if (!hasReadPermission(permissions?.home_timeline?.read)) {
    return <Redirect href="/(app)/(tabs)/menu" />;
  }

  return <TimelineScreen />;
}
