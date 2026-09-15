import { Redirect } from "expo-router";
import { useAppData } from "../../../context/AppDataContext";
import CalendarTimelineScreen from "../../../screens/Calendar/CalendarTimelineScreen";

function hasReadPermission(value: unknown): boolean {
  return Number(value) === 1 || value === true || value === "1";
}

export default function ScheduleTab() {
  const { permissions } = useAppData();

  if (!hasReadPermission(permissions?.calendar_timeline?.read)) {
    return <Redirect href="/(app)/(tabs)/menu" />;
  }

  return <CalendarTimelineScreen />;
}
