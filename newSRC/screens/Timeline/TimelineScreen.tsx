import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  BackHandler,
  FlatList,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Line } from "react-native-svg";
import { useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import LanguageChange from "../../Components/LanguageChange";
import ListScreenBody, { listEmptyFeedback } from "../../Components/ListScreenBody";
import TimelineTravelCheckInOutModal from "../../Components/TimelineTravelCheckInOutModal";
import ProjectCheckInOutModal from "../../Components/ProjectCheckInOutModal";
import { useApiErrorState } from "../../hooks/useApiErrorState";
import {
  fetchTimelineCheckInOut,
  getEndpointAddress,
  getEndpointTitle,
  getEndpointType,
  getTimelineItemDate,
  type TimelineItem,
} from "../../services/timelineService";
import {
  fetchProjectCheckInOutState,
  getTodayFormats,
} from "../../services/checkInOutService";
import { getData } from "../../utils/storeData";
import { useScreenInsets } from "../../utils/screenInsets";
import { AppColors } from "../../utils/theme";
import { FONTS } from "../../utils/FONTS";
import { Images } from "../../utils/Images";
import { LIST_UI } from "../../utils/connectionTheme";
import { useAppData } from "../../context/AppDataContext";

function DashedVerticalLine({ height }: { height: number }) {
  if (height <= 0) return null;

  return (
    <View style={[styles.dashedLineWrap, { height }]}>
      <Svg width={2} height={height}>
        <Line
          x1={1}
          y1={0}
          x2={1}
          y2={height}
          stroke="#D1D5DB"
          strokeWidth={2}
          strokeDasharray="4 4"
        />
      </Svg>
    </View>
  );
}

function TimelineIcon({ isCheckIn }: { isCheckIn: boolean }) {
  return (
    <View
      style={[
        styles.timelineIcon,
        { backgroundColor: isCheckIn ? AppColors.litegreen : AppColors.diclinelite },
      ]}
    >
      <Ionicons
        name={isCheckIn ? "log-in-outline" : "log-out-outline"}
        size={14}
        color={isCheckIn ? AppColors.green : AppColors.dicline}
      />
    </View>
  );
}

function TimelineEventCard({
  item,
  isCheckIn,
  showConnector,
}: {
  item: TimelineItem;
  isCheckIn: boolean;
  showConnector: boolean;
}) {
  const { t } = useTranslation();

  const time = (isCheckIn ? item.check_in_time : item.check_out_time)?.slice(0, 5) ?? "--:--";
  const breakTime = item.break_time?.slice(0, 5) ?? "00:00";
  const closeDay = item.stop_time ? t("Yes") : t("No");
  const typeLabel = getEndpointType(item, isCheckIn);
  const title = getEndpointTitle(item, isCheckIn);
  const address = getEndpointAddress(item, isCheckIn);
  const showTitle = Boolean(title && title !== typeLabel);

  return (
    <View style={styles.eventRow}>
      <View style={styles.railColumn}>
        <TimelineIcon isCheckIn={isCheckIn} />
        {showConnector ? <DashedVerticalLine height={12} /> : null}
      </View>

      <View
        style={[
          styles.eventCard,
          isCheckIn ? styles.checkInCard : styles.checkOutCard,
        ]}
      >
        <View style={styles.eventCardHeader}>
          <Text style={[styles.eventLabel, isCheckIn ? styles.checkInLabel : styles.checkOutLabel]}>
            {isCheckIn ? t("Check In") : t("Check Out")}
          </Text>
          <View style={styles.timeCol}>
            <Text style={styles.eventTime}>{time}</Text>
            {typeLabel ? <Text style={styles.typeUnderTime}>{typeLabel}</Text> : null}
          </View>
        </View>

        {showTitle ? <Text style={styles.eventTitle}>{title}</Text> : null}

        {!isCheckIn ? (
          <Text style={styles.eventMeta}>
            {t("Breake")}: {breakTime} • {t("Close day")}: {closeDay}
          </Text>
        ) : null}

        {address ? <Text style={styles.eventAddress}>{address}</Text> : null}
      </View>
    </View>
  );
}

export default function TimelineScreen() {
  const { t } = useTranslation();
  const { top, scrollPadding, fabBottom } = useScreenInsets({ includeTabBar: true });
  const { apiError, clearApiError, captureApiError } = useApiErrorState();
  const { permissions } = useAppData();

  const [logo, setLogo] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [employeeModalVisible, setEmployeeModalVisible] = useState(false);
  const [projectModalMode, setProjectModalMode] = useState<"check-in" | "check-out" | null>(null);
  const [checkInOutStatus, setCheckInOutStatus] = useState<"check_in" | "check_out">("check_in");
  const [checkInOutStatusProject, setCheckInOutStatusProject] = useState(0);

  const canEmployeeCheckIn = true;
  const canProjectCheckIn = String(permissions?.project_check_in_out?.read) === "1";

  const refreshCheckInOutStatus = useCallback(async () => {
    const { displayDate, apiDate } = getTodayFormats();
    try {
      const { fetchCicoSession } = await import("../../services/timelineCicoService");
      const [cico, projectState] = await Promise.all([
        fetchCicoSession(apiDate),
        fetchProjectCheckInOutState(displayDate),
      ]);
      setCheckInOutStatus(cico.cicoStatus === "check_out" ? "check_out" : "check_in");
      setCheckInOutStatusProject(Number(projectState.checkData?.check_in_out ?? 0));
    } catch {
      // Keep last known status if refresh fails.
    }
  }, []);

  const loadCompanyInfo = useCallback(async () => {
    const companyLogo = await getData("COMPANYLOGO");
    const companyLogin = await getData("COMPANYLOGIN");
    setLogo(companyLogo);
    setCompanyName(companyLogin);
  }, []);

  const loadTimeline = useCallback(async () => {
    setLoading(true);
    try {
      clearApiError();
      const response = await fetchTimelineCheckInOut();
      if (response?.status && Array.isArray(response.data)) {
        setItems(response.data);
      } else {
        setItems([]);
      }
    } catch (error) {
      captureApiError(error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [captureApiError, clearApiError]);

  useEffect(() => {
    loadCompanyInfo();
  }, [loadCompanyInfo]);

  useFocusEffect(
    useCallback(() => {
      loadTimeline();
      refreshCheckInOutStatus();

      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        Alert.alert(t("Hold on!"), t("Are you sure you want to exit?"), [
          { text: t("Cancel"), style: "cancel" },
          { text: t("YES"), onPress: () => BackHandler.exitApp() },
        ]);
        return true;
      });
      return () => subscription.remove();
    }, [t, loadTimeline, refreshCheckInOutStatus])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadTimeline(), refreshCheckInOutStatus()]);
    setRefreshing(false);
  }, [loadTimeline, refreshCheckInOutStatus]);

  const handleCheckInComplete = useCallback(async () => {
    await Promise.all([loadTimeline(), refreshCheckInOutStatus()]);
  }, [loadTimeline, refreshCheckInOutStatus]);

  const renderItem = ({ item, index }: { item: TimelineItem; index: number }) => {
    const isCheckIn = item.cico_status === "Check-in";
    const date = getTimelineItemDate(item);
    const dateWithDay = isCheckIn
      ? item.check_in_date_with_day
      : item.check_out_date_with_day;

    const previousItem = index > 0 ? items[index - 1] : null;
    const previousDate = previousItem
      ? getTimelineItemDate(previousItem)
      : null;
    const showDateHeader = index === 0 || previousDate !== date;

    const nextItem = index < items.length - 1 ? items[index + 1] : null;
    const nextDate = nextItem ? getTimelineItemDate(nextItem) : null;
    const showConnector = nextDate === date;

    return (
      <View style={styles.listBlock}>
        {showDateHeader ? (
          <Text style={styles.dateHeader}>
            {dateWithDay ? t(String(dateWithDay)) : ""}
            {dateWithDay && date ? ", " : ""}
            {date ? t(String(date)) : ""}
          </Text>
        ) : null}

        <TimelineEventCard
          item={item}
          isCheckIn={isCheckIn}
          showConnector={showConnector}
        />
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={AppColors.white} />

      <View style={styles.headerWrap}>
        <View style={styles.header}>
          {logo ? (
            <ExpoImage
              source={{ uri: logo }}
              style={[
                styles.logo,
                companyName === "playground" && styles.logoPlayground,
              ]}
              contentFit="contain"
            />
          ) : (
            <Image source={Images.Logo} style={styles.logo} resizeMode="contain" />
          )}
          <LanguageChange />
        </View>
      </View>

      <ListScreenBody
        loading={loading}
        itemCount={items.length}
        apiError={apiError}
        onRetry={loadTimeline}
      >
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item, index) =>
            item.id != null ? String(item.id) + index : `timeline-${index}`
          }
          showsVerticalScrollIndicator={false}
          style={styles.list}
          contentContainerStyle={[
            styles.listContent,
            {
              paddingBottom:
                scrollPadding + (canEmployeeCheckIn || canProjectCheckIn ? 72 : 0),
            },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[AppColors.primary]}
              tintColor={AppColors.primary}
            />
          }
          ListEmptyComponent={listEmptyFeedback({
            loading,
            apiError,
            onRetry: loadTimeline,
            emptyMessage: t("No data found"),
          })}
        />
      </ListScreenBody>

      {canEmployeeCheckIn || canProjectCheckIn ? (
        <View style={[styles.fabStack, { bottom: fabBottom }]}>
          {canProjectCheckIn ? (
            <Pressable
              style={[
                styles.fabBtn,
                checkInOutStatusProject === 1 ? styles.checkOutBtn : styles.projectBtn,
              ]}
              onPress={() =>
                setProjectModalMode(checkInOutStatusProject === 1 ? "check-out" : "check-in")
              }
            >
              <Text style={styles.actionBtnText}>
                {checkInOutStatusProject === 1
                  ? t("Project Check Out")
                  : t("Project Check In")}
              </Text>
            </Pressable>
          ) : null}
          {canEmployeeCheckIn ? (
            <Pressable
              style={[
                styles.fabBtn,
                checkInOutStatus === "check_out" ? styles.checkOutBtn : styles.checkInBtn,
              ]}
              onPress={() => setEmployeeModalVisible(true)}
            >
              <Text style={styles.actionBtnText}>
                {checkInOutStatus === "check_out" ? t("Check Out") : t("Check In")}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <TimelineTravelCheckInOutModal
        visible={employeeModalVisible}
        onClose={() => setEmployeeModalVisible(false)}
        onComplete={handleCheckInComplete}
      />

      <ProjectCheckInOutModal
        visible={projectModalMode !== null}
        mode={projectModalMode ?? "check-in"}
        onClose={() => setProjectModalMode(null)}
        onComplete={handleCheckInComplete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.white,
  },
  headerWrap: {
    backgroundColor: AppColors.white,
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: LIST_UI.cardBorder,
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 4,
      },
    }),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: LIST_UI.screenPadding,
    paddingVertical: LIST_UI.headerPaddingV,
  },
  logo: {
    width: 120,
    height: 40,
  },
  logoPlayground: {
    marginLeft: 0,
  },
  fabStack: {
    position: "absolute",
    right: 16,
    alignItems: "flex-end",
    gap: 10,
  },
  fabBtn: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  checkInBtn: {
    backgroundColor: AppColors.primary,
  },
  checkOutBtn: {
    backgroundColor: AppColors.dicline,
  },
  projectBtn: {
    backgroundColor: "#0F766E",
  },
  actionBtnText: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 13,
    color: AppColors.white,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: LIST_UI.screenPadding,
    paddingTop: 8,
    flexGrow: 1,
  },
  listBlock: {
    marginBottom: 4,
  },
  dateHeader: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 15,
    color: AppColors.black,
    marginBottom: 10,
    marginTop: 8,
  },
  eventRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  railColumn: {
    width: 28,
    alignItems: "center",
    marginRight: 10,
    paddingTop: 14,
  },
  timelineIcon: {
    width: 24,
    height: 24,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  dashedLineWrap: {
    marginTop: 4,
    alignItems: "center",
  },
  eventCard: {
    flex: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  checkInCard: {
    backgroundColor: AppColors.litegreen,
  },
  checkOutCard: {
    backgroundColor: AppColors.diclinelite,
  },
  eventCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  eventLabel: {
    flex: 1,
    marginRight: 8,
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 14,
  },
  checkInLabel: {
    color: AppColors.green,
  },
  checkOutLabel: {
    color: AppColors.dicline,
  },
  eventTime: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 14,
    color: AppColors.black,
    textAlign: "right",
  },
  timeCol: {
    alignItems: "flex-end",
  },
  typeUnderTime: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 12,
    color: AppColors.black,
    marginTop: 2,
    textAlign: "right",
  },
  eventMeta: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 13,
    color: AppColors.black,
    marginBottom: 4,
  },
  eventTitle: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 13,
    color: AppColors.black,
    marginBottom: 2,
  },
  eventAddress: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 13,
    color: AppColors.black,
    lineHeight: 18,
  },
});
