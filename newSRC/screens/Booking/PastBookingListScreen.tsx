import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
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
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import LanguageChange from "../../Components/LanguageChange";
import ScreenHeader from "../../Components/ScreenHeader";
import SearchBox from "../../Components/SearchBox";
import BookingCard from "../../Components/BookingCard";
import ListScreenBody, { listEmptyFeedback } from "../../Components/ListScreenBody";
import { useApiErrorState } from "../../hooks/useApiErrorState";
import { useAppData } from "../../context/AppDataContext";
import {
  fetchDriverTripBookings,
  type BookingListMode,
  type DriverTripBooking,
} from "../../services/bookingService";
import { useScreenInsets } from "../../utils/screenInsets";
import { AppColors } from "../../utils/theme";
import { LIST_UI } from "../../utils/connectionTheme";
import { listScreenStyles } from "../../utils/listScreenStyles";
import { FONTS } from "../../utils/FONTS";
import { Images } from "../../utils/Images";
import { getData } from "../../utils/storeData";

function getTodayLabel() {
  const date = new Date();
  const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const year = date.getFullYear();
  return `${dayName} ${day} ${month} ${year}`;
}

type Props = {
  mode: BookingListMode;
  defaultTitle: string;
  /** When true, renders as bottom tab (no back button, tab bar padding). */
  isTab?: boolean;
};

export default function PastBookingListScreen({ mode, defaultTitle, isTab = false }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const { permissions, fetchPermissions } = useAppData();
  const { top, scrollPadding } = useScreenInsets({ includeTabBar: isTab });
  const params = useLocalSearchParams<{ color?: string; title?: string }>();

  const [logo, setLogo] = useState<string | null>(null);
  const [items, setItems] = useState<DriverTripBooking[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { apiError, clearApiError, captureApiError } = useApiErrorState();
  const todayLabel = useMemo(() => getTodayLabel(), []);

  const loadData = useCallback(
    async (pull = false) => {
      if (pull) setRefreshing(true);
      else setLoading(true);
      clearApiError();
      try {
        const data = await fetchDriverTripBookings(mode);
        setItems(data);
      } catch (error) {
        captureApiError(error);
        setItems([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [mode, clearApiError, captureApiError]
  );

  useEffect(() => {
    loadData();
    fetchPermissions();
    if (isTab) {
      getData("COMPANYLOGO").then(setLogo);
    }
  }, [loadData, isTab, fetchPermissions]);

  const canCreateBooking = String(permissions?.taxi_booking_view?.create) === "1";

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) =>
      (item.company_client_info?.display_name || "")
        .toLowerCase()
        .includes(query)
    );
  }, [items, search]);

  return (
    <View style={[listScreenStyles.container, { paddingTop: top }]}>
      {isTab ? (
        <>
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
        </>
      ) : (
        <ScreenHeader
          title={params.title || t(defaultTitle)}
          onBack={() => router.back()}
          refreshOnPress={() => loadData(true)}
        />
      )}

      <View style={styles.searchWrap}>
        <SearchBox
          value={search}
          onChangeText={setSearch}
          placeholder={t("Search")}
          onClear={() => setSearch("")}
        />
        {canCreateBooking ? (
          <Pressable
            style={styles.addBtn}
            onPress={() => router.push("/(app)/bookings/create")}
          >
            <Text style={styles.addBtnText}>+ {t("Add")}</Text>
          </Pressable>
        ) : null}
      </View>

      <ListScreenBody
        loading={loading}
        itemCount={filteredItems.length}
        apiError={apiError}
        onRetry={() => loadData()}
      >
        <FlatList
          data={filteredItems}
          keyExtractor={(item, index) => String(item.id ?? index)}
          renderItem={({ item }) => (
            <BookingCard
              item={item}
              isToday={item.from_date === todayLabel}
              onPress={() =>
                router.push({
                  pathname: "/(app)/bookings/[id]",
                  params: {
                    id: String(item.id),
                    mode,
                    color: params.color || "",
                  },
                })
              }
            />
          )}
          contentContainerStyle={{
            paddingBottom: scrollPadding,
            paddingHorizontal: LIST_UI.screenPadding,
            paddingTop: 8,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadData(true)}
              tintColor={AppColors.primary}
            />
          }
          ListEmptyComponent={listEmptyFeedback({
            loading,
            apiError,
            onRetry: () => loadData(),
            emptyMessage: t("No Data Found"),
          })}
        />
      </ListScreenBody>
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrap: {
    backgroundColor: AppColors.white,
    borderBottomWidth: 1,
    borderBottomColor: LIST_UI.cardBorder,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
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
  logo: { width: 120, height: 40 },
  searchWrap: {
    paddingHorizontal: LIST_UI.screenPadding,
    paddingVertical: 12,
    backgroundColor: AppColors.white,
    gap: 10,
  },
  addBtn: {
    alignSelf: "flex-start",
    backgroundColor: AppColors.primary,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addBtnText: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 13,
    color: AppColors.white,
  },
});
