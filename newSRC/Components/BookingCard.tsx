import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { DriverTripBooking } from "../services/bookingService";
import { AppColors } from "../utils/theme";
import { FONTS } from "../utils/FONTS";
import { LIST_UI } from "../utils/connectionTheme";

type Props = {
  item: DriverTripBooking;
  isToday?: boolean;
  onPress: () => void;
};

export default function BookingCard({ item, isToday, onPress }: Props) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      {item.company_client_info?.display_name ? (
        <Text style={styles.companyName}>{item.company_client_info.display_name}</Text>
      ) : null}
      <Text style={styles.personName}>
        {item.client_person_info?.display_name || "-"}
      </Text>
      <Text style={styles.address}>
        📍 {item.starting_selected_address || "-"}
        {"\n"}🏁 {item.destination_selected_address || "-"}
      </Text>
      {item.tour_name ? (
        <Text style={styles.tourName} numberOfLines={1}>
          - {item.tour_name}
        </Text>
      ) : null}

      <Text style={[styles.date, isToday ? styles.dateToday : styles.dateDefault]}>
        {item.from_date || "-"}
      </Text>

      <View style={styles.footerRow}>
        <Text style={styles.time}>
          {`${item.pickup_time || ""}${item.drop_time ? `-${item.drop_time}` : ""}`}
        </Text>
        {item.id != null ? (
          <View style={styles.idBadge}>
            <Text style={styles.idText}>{item.id}</Text>
          </View>
        ) : null}
      </View>

      {item.flight_schedule ? (
        <View style={styles.flightBox}>
          <Text style={styles.flightText}>✈️ {item.flight_schedule.departure || "-"}</Text>
          <Text style={styles.flightText}>🛬 {item.flight_schedule.arrival || "-"}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: LIST_UI.cardBorder,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    backgroundColor: AppColors.white,
  },
  companyName: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 17,
    color: AppColors.black,
  },
  personName: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 17,
    color: AppColors.black,
    marginTop: 2,
  },
  address: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 13,
    color: AppColors.subtitle,
    marginTop: 6,
    lineHeight: 20,
  },
  tourName: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 13,
    color: AppColors.subtitle,
    marginTop: 4,
  },
  date: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 16,
    marginTop: 8,
  },
  dateToday: { color: "#06AC14" },
  dateDefault: { color: AppColors.primary },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  time: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 14,
    color: AppColors.subtitle,
  },
  idBadge: {
    backgroundColor: AppColors.primary,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  idText: {
    color: AppColors.white,
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 12,
  },
  flightBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    gap: 4,
  },
  flightText: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 14,
    color: AppColors.black,
  },
});
