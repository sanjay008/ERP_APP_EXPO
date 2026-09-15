import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import AppDatePickerSheet from "../../Components/AppDatePickerSheet";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import LanguageChange from "../../Components/LanguageChange";
import ListScreenBody, { listEmptyFeedback } from "../../Components/ListScreenBody";
import { useApiErrorState } from "../../hooks/useApiErrorState";
import {
  fetchCalendarTimeline,
  formatIsoDate,
  getIsoWeekNumber,
  type CalendarBreakItem,
  type CalendarScheduleItem,
  type CalendarTimelineItem,
} from "../../services/calendarTimelineService";
import { navigateFromCalendarWorkDetail } from "../../utils/calendarNavigation";
import { getData } from "../../utils/storeData";
import { useScreenInsets } from "../../utils/screenInsets";
import { AppColors } from "../../utils/theme";
import { FONTS } from "../../utils/FONTS";
import { Images } from "../../utils/Images";
import { LIST_UI } from "../../utils/connectionTheme";

function ScheduleIconView({
  icon,
  color,
}: {
  icon?: { viewBox?: string; path?: string };
  color?: string;
}) {
  if (!icon?.path) return null;
  return (
    <Svg width={18} height={18} viewBox={icon.viewBox || "0 0 100 100"}>
      <Path d={icon.path} fill={color || AppColors.primary} strokeWidth={2} />
    </Svg>
  );
}

function ScheduleCard({ schedule }: { schedule: CalendarScheduleItem }) {
  const strike =
    schedule.schedule_status_text === "Absence" ||
    schedule.schedule_status_text === "move_schedule";

  return (
    <View
      style={[
        styles.scheduleCard,
        {
          backgroundColor:
            schedule.schedule_status_background_color || AppColors.gray,
        },
      ]}
    >
      <View style={styles.scheduleRow}>
        <ScheduleIconView
          icon={schedule.schedule_status_icon}
          color={schedule.schedule_status_text_color}
        />
        <Text
          style={[
            styles.scheduleText,
            {
              color: schedule.schedule_status_text_color || AppColors.black,
              textDecorationLine: strike ? "line-through" : "none",
            },
          ]}
        >
          {schedule.start_time?.slice(0, 5)} - {schedule.end_time?.slice(0, 5)} -{" "}
          {schedule.break_time?.slice(0, 5)} ({schedule.total_time?.replace(".", ":")}) -{" "}
          {schedule.class}
        </Text>
      </View>
    </View>
  );
}

function BreakRow({ item }: { item: CalendarBreakItem }) {
  const { t } = useTranslation();
  const standby =
    item.stand_by_relaties_data?.display_name != null
      ? item.stand_by_relaties_data.display_name
      : t("Geen Standby");

  return (
    <View style={styles.breakRow}>
      <ScheduleIconView icon={item.icon} color={AppColors.dicline} />
      <Text style={styles.breakText}>
        {item.start_time?.slice(0, 5) || "--"} - {item.end_time?.slice(0, 5) || "--"} (
        {item.total_break_time?.slice(0, 5) || "--"}) - {standby}
      </Text>
    </View>
  );
}

function CalendarDayCard({
  item,
  onWorkPress,
}: {
  item: CalendarTimelineItem;
  onWorkPress: (detail: NonNullable<CalendarScheduleItem["work_details"]>[number]) => void;
}) {
  const { t } = useTranslation();
  const calendarData = item.calendar_data;
  if (!calendarData?.success || !calendarData.data?.length) return null;

  const sortedSchedules = [...calendarData.data].sort((a, b) => {
    const timeA = new Date(`1970-01-01T${a.start_time || "00:00"}`);
    const timeB = new Date(`1970-01-01T${b.start_time || "00:00"}`);
    return timeA.getTime() - timeB.getTime();
  });

  const workDetails = sortedSchedules[0]?.work_details ?? [];

  return (
    <View style={styles.dayCard}>
      <Text style={styles.dayTitle}>
        {calendarData.data[0]?.day ? t(String(calendarData.data[0].day)) : ""}{" "}
        {item.display_date}
      </Text>

      {sortedSchedules.map((schedule, index) => (
        <ScheduleCard key={`${schedule.start_time}-${index}`} schedule={schedule} />
      ))}

      {calendarData.break_schedule?.data?.map((breakItem, index) => (
        <BreakRow key={`break-${index}`} item={breakItem} />
      ))}

      {workDetails.map((detail, index) => (
        <Pressable key={`work-${index}`} onPress={() => onWorkPress(detail)}>
          <Text style={styles.workDetail}>
            • {detail.display_title} #{detail.display_id}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function CalendarTimelineScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { top, scrollPadding } = useScreenInsets({ includeTabBar: true });
  const { apiError, clearApiError, captureApiError } = useApiErrorState();

  const [logo, setLogo] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [items, setItems] = useState<CalendarTimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isoDate = useMemo(() => formatIsoDate(selectedDate), [selectedDate]);
  const weekNumber = useMemo(() => getIsoWeekNumber(selectedDate), [selectedDate]);

  const loadData = useCallback(async () => {
    clearApiError();
    try {
      const data = await fetchCalendarTimeline(isoDate);
      setItems(data);
    } catch (error) {
      captureApiError(error);
      setItems([]);
    }
  }, [isoDate, clearApiError, captureApiError]);

  useEffect(() => {
    getData("COMPANYLOGO").then(setLogo);
    getData("USERDATA").then((stored) => {
      setDisplayName(stored?.data?.relaties?.display_name || "");
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const shiftSelectedDate = useCallback((days: number) => {
    setSelectedDate((current) => {
      const next = new Date(current);
      next.setDate(next.getDate() + days);
      return next;
    });
  }, []);

  const visibleItems = items.filter((item) => item.calendar_data?.success);

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={AppColors.white} />

      <View style={styles.headerWrap}>
        <View style={styles.header}>
          {logo ? (
            <ExpoImage source={{ uri: logo }} style={styles.logo} contentFit="contain" />
          ) : (
            <Image source={Images.Logo} style={styles.logo} resizeMode="contain" />
          )}
          <LanguageChange />
        </View>
      </View>

      <View style={styles.profileRow}>
        <Text style={styles.profileName}>{displayName}</Text>
        <Text style={styles.weekLabel}>
          {t("Week")} {weekNumber}
        </Text>
      </View>

      <View style={styles.dateRow}>
        <Pressable
          style={styles.dateNavBtn}
          onPress={() => shiftSelectedDate(-1)}
          accessibilityLabel={t("Previous day")}
        >
          <Ionicons name="chevron-back" size={20} color={AppColors.primary} />
        </Pressable>

        <Pressable style={styles.datePickerBtn} onPress={() => setPickerOpen(true)}>
          <Image source={Images.CalendarVector} style={styles.dateIcon} />
          <Text style={styles.dateText} numberOfLines={1}>
            {selectedDate.toLocaleDateString("en-GB", {
              weekday: "long",
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </Text>
        </Pressable>

        <Pressable
          style={styles.dateNavBtn}
          onPress={() => shiftSelectedDate(1)}
          accessibilityLabel={t("Next day")}
        >
          <Ionicons name="chevron-forward" size={20} color={AppColors.primary} />
        </Pressable>
      </View>

      <AppDatePickerSheet
        visible={pickerOpen}
        value={selectedDate}
        onConfirm={setSelectedDate}
        onClose={() => setPickerOpen(false)}
      />

      <ListScreenBody
        loading={loading}
        itemCount={visibleItems.length}
        apiError={apiError}
        onRetry={loadData}
      >
        <FlatList
          data={visibleItems}
          keyExtractor={(item, index) => `${item.display_date}-${index}`}
          renderItem={({ item }) => (
            <CalendarDayCard
              item={item}
              onWorkPress={(detail) => navigateFromCalendarWorkDetail(router, detail)}
            />
          )}
          contentContainerStyle={[styles.listContent, { paddingBottom: scrollPadding }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={AppColors.primary}
            />
          }
          ListEmptyComponent={listEmptyFeedback({
            loading,
            apiError,
            onRetry: loadData,
            emptyMessage: t("No data found"),
          })}
        />
      </ListScreenBody>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.white },
  headerWrap: {
    borderBottomWidth: 1,
    borderBottomColor: LIST_UI.cardBorder,
    backgroundColor: AppColors.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: LIST_UI.screenPadding,
    paddingVertical: LIST_UI.headerPaddingV,
  },
  logo: { width: 120, height: 40 },
  profileRow: {
    paddingHorizontal: LIST_UI.screenPadding,
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  profileName: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 16,
    color: AppColors.black,
  },
  weekLabel: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 14,
    color: AppColors.primary,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: LIST_UI.screenPadding,
    marginTop: 12,
    marginBottom: 8,
    gap: 8,
  },
  dateNavBtn: {
    width: 40,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: LIST_UI.cardBorder,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.white,
  },
  datePickerBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: LIST_UI.cardBorder,
    gap: 10,
    backgroundColor: AppColors.white,
  },
  dateIcon: { width: 20, height: 20, tintColor: AppColors.primary },
  dateText: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 14,
    color: AppColors.black,
  },
  listContent: {
    paddingHorizontal: LIST_UI.screenPadding,
    paddingTop: 8,
    flexGrow: 1,
  },
  dayCard: {
    borderWidth: 1,
    borderColor: AppColors.black,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    backgroundColor: AppColors.gray,
  },
  dayTitle: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 14,
    color: AppColors.black,
    marginBottom: 8,
  },
  scheduleCard: {
    marginTop: 8,
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#B0B0B0",
  },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  scheduleText: {
    flex: 1,
    fontFamily: FONTS.LexendRegular,
    fontSize: 13,
  },
  breakRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#B0B0B0",
    borderRadius: 5,
  },
  breakText: {
    flex: 1,
    fontFamily: FONTS.LexendRegular,
    fontSize: 13,
    color: AppColors.dicline,
  },
  workDetail: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 14,
    color: AppColors.black,
    marginTop: 8,
    textDecorationLine: "underline",
  },
});
