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
  getEndpointIdLabel,
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

function TimelineEventCard({
  item,
  isCheckIn,
}: {
  item: TimelineItem;
  isCheckIn: boolean;
}) {
  const { t } = useTranslation();

  const time = (isCheckIn ? item.check_in_time : item.check_out_time)?.slice(0, 5) ?? "--:--";
  const breakTime = item.break_time?.slice(0, 5) ?? "00:00";
  const closeDay = item.stop_time ? t("Yes") : t("No");
  const typeLabel = getEndpointType(item, isCheckIn);
  const typeId = getEndpointIdLabel(item, isCheckIn);
  const title = getEndpointTitle(item, isCheckIn);
  const address = getEndpointAddress(item, isCheckIn);

  return (
    <View style={styles.eventRow}>
      <View
        style={[
          styles.typeBox,
          { backgroundColor: item.cico_bg_color || AppColors.lightprimary1 },
        ]}
      >
        {typeLabel ? (
          <Text style={styles.typeLabel} numberOfLines={1}>
            {typeLabel}
          </Text>
        ) : null}
        {typeId ? <Text style={styles.typeId}>{typeId}</Text> : null}
        <Text style={styles.eventTime}>{time}</Text>
      </View>
      <View style={styles.typeDivider} />
      <View style={styles.eventCard}>
        {title ? <Text style={styles.eventTitle}>{title}</Text> : null}
        {!isCheckIn ? (
          <>
            <Text style={styles.eventMeta}>
              {t("Breake")}: {breakTime}
            </Text>
            <Text style={styles.eventMeta}>
              {t("Close day")}: {closeDay}
            </Text>
          </>
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

    return (
      <View style={styles.listBlock}>
        {showDateHeader ? (
          <View style={styles.dateHeaderBox}>
            <Text style={styles.dateHeader}>
              {dateWithDay ? t(String(dateWithDay)) : ""}
              {dateWithDay && date ? ", " : ""}
              {date ? t(String(date)) : ""}
            </Text>
          </View>
        ) : null}

        <TimelineEventCard item={item} isCheckIn={isCheckIn} />
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
  dateHeaderBox: {
    marginVertical: 10,
    backgroundColor: AppColors.lightprimary,
    borderRadius: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingVertical: 10,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  dateHeader: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 13,
    color: AppColors.black,
    textAlign: "center",
  },
  eventRow: {
    flexDirection: "row",
    alignItems: "stretch",
    paddingVertical: 10,
  },
  typeBox: {
    width: "25%",
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  typeLabel: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 14,
    color: AppColors.black,
    textAlign: "center",
  },
  typeId: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 14,
    color: AppColors.black,
    textAlign: "center",
  },
  typeDivider: {
    width: 2,
    backgroundColor: AppColors.lightprimary,
    marginHorizontal: 5,
  },
  eventCard: {
    width: "69%",
    justifyContent: "center",
  },
  eventTime: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 14,
    color: AppColors.black,
    textAlign: "center",
  },
  eventMeta: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 14,
    color: AppColors.black,
  },
  eventTitle: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 14,
    color: AppColors.black,
  },
  eventAddress: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 14,
    color: AppColors.black,
  },
});
