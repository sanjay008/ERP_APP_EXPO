import { Redirect } from "expo-router";
import { useAppData } from "../../../context/AppDataContext";
import PastBookingListScreen from "../../../screens/Booking/PastBookingListScreen";

function hasReadPermission(value: unknown): boolean {
  return Number(value) === 1 || value === true || value === "1";
}

export default function BookingTab() {
  const { permissions } = useAppData();

  if (!hasReadPermission(permissions?.taxi_booking?.read)) {
    return <Redirect href="/(app)/(tabs)/menu" />;
  }

  return <PastBookingListScreen mode="planning" defaultTitle="Booking" isTab />;
}
