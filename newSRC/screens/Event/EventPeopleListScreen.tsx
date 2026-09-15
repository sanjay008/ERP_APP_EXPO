import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import ScreenHeader from "../../Components/ScreenHeader";
import SearchBox from "../../Components/SearchBox";
import ListScreenBody, { listEmptyFeedback } from "../../Components/ListScreenBody";
import { useApiErrorState } from "../../hooks/useApiErrorState";
import {
  fetchEventBookings,
  fetchEventGuests,
  getEventPersonName,
  type EventBookingItem,
} from "../../services/eventService";
import { useScreenInsets } from "../../utils/screenInsets";
import { AppColors } from "../../utils/theme";
import { FONTS } from "../../utils/FONTS";
import { LIST_UI } from "../../utils/connectionTheme";
import { listScreenStyles } from "../../utils/listScreenStyles";

type Mode = "bookings" | "guests";

type Props = {
  mode: Mode;
};

export default function EventPeopleListScreen({ mode }: Props) {
  const { t } = useTranslation();
  const { top, scrollPadding } = useScreenInsets();
  const params = useLocalSearchParams<{ id?: string; eventName?: string; color?: string }>();
  const eventId = params.id ?? "";

  const [items, setItems] = useState<EventBookingItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const { apiError, clearApiError, captureApiError } = useApiErrorState();

  const fetchPage = mode === "bookings" ? fetchEventBookings : fetchEventGuests;
  const title =
    mode === "bookings"
      ? params.eventName || t("Booking List")
      : params.eventName || t("Guest List");

  const loadData = useCallback(
    async (reset = false) => {
      const nextPage = reset ? 1 : page;
      if (reset) setLoading(true);
      else setLoadingMore(true);
      clearApiError();

      try {
        const result = await fetchPage({
          eventId,
          page: nextPage,
          pageLimit: 25,
        });

        setLastPage(result.lastPage);
        setItems((prev) => {
          if (reset) return result.items;
          const map = new Map<string | number, EventBookingItem>();
          [...prev, ...result.items].forEach((item) => {
            if (item.id != null) map.set(item.id, item);
          });
          return Array.from(map.values());
        });
        setPage(nextPage + 1);
      } catch (error) {
        if (reset) {
          captureApiError(error);
          setItems([]);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [eventId, page, fetchPage, clearApiError, captureApiError]
  );

  useEffect(() => {
    setPage(1);
    setLastPage(1);
    setItems([]);
    loadData(true);
  }, [eventId, mode]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) => getEventPersonName(item).toLowerCase().includes(query));
  }, [items, search]);

  const renderItem = ({ item }: { item: EventBookingItem }) => (
    <View style={styles.card}>
      <Text style={styles.name}>{getEventPersonName(item)}</Text>
      <Text style={styles.subText}>{item.email || item.relaties_data?.email_adres || "-"}</Text>
      {item.phone ? <Text style={styles.subText}>{item.phone}</Text> : null}
    </View>
  );

  return (
    <View style={[listScreenStyles.container, { paddingTop: top }]}>
      <ScreenHeader title={title} refreshOnPress={() => loadData(true)} />

      <View style={styles.searchWrap}>
        <SearchBox
          value={search}
          onChangeText={setSearch}
          placeholder={t("Search")}
          onClear={() => setSearch("")}
        />
      </View>

      <ListScreenBody
        loading={loading}
        itemCount={filteredItems.length}
        apiError={apiError}
        onRetry={() => loadData(true)}
      >
        <FlatList
          data={filteredItems}
          keyExtractor={(item, index) => String(item.id ?? index)}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingBottom: scrollPadding,
            paddingHorizontal: LIST_UI.screenPadding,
            paddingTop: 8,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                setPage(1);
                loadData(true);
              }}
              tintColor={AppColors.primary}
            />
          }
          onEndReached={() => {
            if (!loadingMore && !loading && page <= lastPage && !search.trim()) {
              loadData(false);
            }
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator style={{ marginVertical: 16 }} color={AppColors.primary} />
            ) : null
          }
          ListEmptyComponent={listEmptyFeedback({
            loading,
            apiError,
            onRetry: () => loadData(true),
            emptyMessage: t("No Data Found"),
          })}
        />
      </ListScreenBody>
    </View>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    paddingHorizontal: LIST_UI.screenPadding,
    paddingVertical: 12,
    backgroundColor: AppColors.white,
  },
  card: {
    borderWidth: 1,
    borderColor: LIST_UI.cardBorder,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    backgroundColor: AppColors.white,
  },
  name: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 14,
    color: AppColors.black,
  },
  subText: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 12,
    color: AppColors.subtitle,
    marginTop: 4,
  },
});
