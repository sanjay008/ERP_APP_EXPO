import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import ScreenHeader from "../../Components/ScreenHeader";
import SearchBox from "../../Components/SearchBox";
import FallBackImage from "../../Components/FallBackImage";
import ListScreenBody, { listEmptyFeedback } from "../../Components/ListScreenBody";
import { useApiErrorState } from "../../hooks/useApiErrorState";
import {
  fetchEvents,
  formatEventDate,
  getDropboxDirectLink,
  stripHtmlTags,
  type EventListItem,
} from "../../services/eventService";
import { useScreenInsets } from "../../utils/screenInsets";
import { AppColors } from "../../utils/theme";
import { FONTS } from "../../utils/FONTS";
import { LIST_UI } from "../../utils/connectionTheme";
import { listScreenStyles } from "../../utils/listScreenStyles";
import { Images } from "../../utils/Images";

export default function EventListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { top, scrollPadding } = useScreenInsets();
  const params = useLocalSearchParams<{ color?: string; title?: string }>();

  const [items, setItems] = useState<EventListItem[]>([]);
  const [search, setSearch] = useState("");
  const [pastEvents, setPastEvents] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const { apiError, clearApiError, captureApiError } = useApiErrorState();

  const loadData = useCallback(
    async (options?: { reset?: boolean; past?: boolean }) => {
      const reset = options?.reset ?? false;
      const usePast = options?.past ?? pastEvents;
      const nextPage = reset ? 1 : page;

      if (reset) {
        setLoading(true);
      } else if (nextPage > 1) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      clearApiError();
      try {
        const result = await fetchEvents({
          pastEvents: usePast,
          page: nextPage,
          pageLimit: 25,
        });

        setLastPage(result.lastPage);
        setItems((prev) => {
          if (reset) return result.items;
          const map = new Map<string | number, EventListItem>();
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
    [pastEvents, page, clearApiError, captureApiError]
  );

  useEffect(() => {
    loadData({ reset: true });
  }, []);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) => (item.name || "").toLowerCase().includes(query));
  }, [items, search]);

  const togglePastEvents = (value: boolean) => {
    setPastEvents(value);
    setPage(1);
    setLastPage(1);
    loadData({ reset: true, past: value });
  };

  const renderItem = ({ item }: { item: EventListItem }) => (
    <View style={styles.eventCard}>
      <View style={styles.eventRow}>
        <FallBackImage
          source={
            item.images?.[0]?.event_dropbox_shared_link
              ? { uri: getDropboxDirectLink(item.images[0].event_dropbox_shared_link) }
              : undefined
          }
          style={styles.eventImage}
          resizeMode="cover"
        />
        <View style={styles.eventBody}>
          <Text style={styles.eventDate}>{formatEventDate(item.date)}</Text>
          <Text style={styles.eventName}>{t(item.name)}</Text>
          <Text style={styles.eventDescription} numberOfLines={2}>
            {stripHtmlTags(item.description)}
          </Text>
          <Pressable
            style={styles.actionBtn}
            onPress={() =>
              router.push({
                pathname: "/(app)/events/[id]/bookings",
                params: {
                  id: String(item.id),
                  eventName: item.name || "",
                  color: params.color || "",
                },
              })
            }
          >
            <Text style={styles.actionBtnText}>{t("Booking List")}</Text>
          </Pressable>
          {item.location ? (
            <View style={styles.locationRow}>
              <FallBackImage
                source={Images.ConnectionLocation}
                style={styles.locationIcon}
                resizeMode="contain"
              />
              <Text style={styles.locationText}>{item.location}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <Pressable
        style={styles.fullBtn}
        onPress={() =>
          router.push({
            pathname: "/(app)/events/[id]/guests",
            params: {
              id: String(item.id),
              eventName: item.name || "",
              color: params.color || "",
            },
          })
        }
      >
        <Text style={styles.actionBtnText}>{t("Guest List")}</Text>
      </Pressable>

      <Pressable
        style={[styles.fullBtn, styles.scannerBtn]}
        onPress={() =>
          router.push({
            pathname: "/(app)/events/[id]/scanner",
            params: {
              id: String(item.id),
              color: params.color || "",
            },
          })
        }
      >
        <Text style={styles.actionBtnText}>{t("Scanner")}</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={[listScreenStyles.container, { paddingTop: top }]}>
      <ScreenHeader
        title={params.title || t("Event List")}
        onBack={() => router.back()}
        refreshOnPress={() => {
          setRefreshing(true);
          setPage(1);
          loadData({ reset: true });
        }}
      />

      <View style={styles.searchWrap}>
        <SearchBox
          value={search}
          onChangeText={setSearch}
          placeholder={t("Search")}
          onClear={() => setSearch("")}
        />
      </View>

      <View style={styles.filterRow}>
        <Switch value={pastEvents} onValueChange={togglePastEvents} />
        <Text style={styles.filterLabel}>{t("Past Events")}</Text>
      </View>

      <ListScreenBody
        loading={loading}
        itemCount={filteredItems.length}
        apiError={apiError}
        onRetry={() => loadData({ reset: true })}
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
                loadData({ reset: true });
              }}
              tintColor={AppColors.primary}
            />
          }
          onEndReached={() => {
            if (!loadingMore && !loading && page <= lastPage && !search.trim()) {
              loadData({ reset: false });
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
            onRetry: () => loadData({ reset: true }),
            emptyMessage: t("No Events Found"),
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
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: LIST_UI.screenPadding,
    paddingBottom: 8,
    backgroundColor: AppColors.white,
  },
  filterLabel: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 14,
    color: AppColors.black,
  },
  eventCard: {
    borderWidth: 1,
    borderColor: LIST_UI.cardBorder,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    backgroundColor: AppColors.white,
  },
  eventRow: { flexDirection: "row", gap: 10 },
  eventImage: {
    width: 90,
    height: 90,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: LIST_UI.cardBorder,
  },
  eventBody: { flex: 1, gap: 4 },
  eventDate: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 12,
    color: AppColors.primary,
  },
  eventName: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 15,
    color: AppColors.black,
  },
  eventDescription: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 12,
    color: AppColors.subtitle,
  },
  actionBtn: {
    alignSelf: "flex-start",
    backgroundColor: AppColors.primary,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 4,
  },
  fullBtn: {
    marginTop: 10,
    backgroundColor: AppColors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  scannerBtn: {
    marginTop: 8,
  },
  actionBtnText: {
    color: AppColors.white,
    fontFamily: FONTS.LexendMedium,
    fontSize: 12,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  locationIcon: { width: 16, height: 16 },
  locationText: {
    flex: 1,
    fontFamily: FONTS.LexendRegular,
    fontSize: 12,
    color: AppColors.black,
  },
});
