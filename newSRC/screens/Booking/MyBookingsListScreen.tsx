import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, RefreshControl, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import ScreenHeader from "../../Components/ScreenHeader";
import SearchBox from "../../Components/SearchBox";
import GlamBookingCard from "../../Components/GlamBookingCard";
import ListScreenBody, { listEmptyFeedback } from "../../Components/ListScreenBody";
import { useApiErrorState } from "../../hooks/useApiErrorState";
import { fetchMyBookings, type GlamBookingItem } from "../../services/glamBookingService";
import { useScreenInsets } from "../../utils/screenInsets";
import { AppColors } from "../../utils/theme";
import { LIST_UI } from "../../utils/connectionTheme";
import { listScreenStyles } from "../../utils/listScreenStyles";

export default function MyBookingsListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { top, scrollPadding } = useScreenInsets();
  const params = useLocalSearchParams<{ color?: string; title?: string }>();

  const [items, setItems] = useState<GlamBookingItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { apiError, clearApiError, captureApiError } = useApiErrorState();

  const loadData = useCallback(
    async (pull = false) => {
      if (pull) setRefreshing(true);
      else setLoading(true);
      clearApiError();
      try {
        const data = await fetchMyBookings();
        setItems(data);
      } catch (error) {
        captureApiError(error);
        setItems([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [clearApiError, captureApiError]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) => {
      const order = item.order_details ?? {};
      const relaties = item.relaties_details ?? {};
      const haystack = [
        relaties.display_name,
        order.first_name,
        order.last_name,
        order.email,
        order.payment_status,
        item.booking_details?.date,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [items, search]);

  return (
    <View style={[listScreenStyles.container, { paddingTop: top }]}>
      <ScreenHeader
        title={params.title || t("My Booking")}
        onBack={() => router.back()}
        refreshOnPress={() => loadData(true)}
      />

      <View style={listScreenStyles.searchWrap}>
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
        onRetry={() => loadData()}
      >
        <FlatList
          data={filteredItems}
          keyExtractor={(item, index) => String(item.booking_details?.id ?? item.id ?? index)}
          renderItem={({ item }) => (
            <GlamBookingCard
              item={item}
              accentColor={params.color || AppColors.primary}
              onPress={() =>
                router.push({
                  pathname: "/(app)/my-bookings/[id]",
                  params: {
                    id: String(item.booking_details?.id ?? item.id),
                    color: params.color || "",
                  },
                })
              }
            />
          )}
          contentContainerStyle={{
            paddingBottom: scrollPadding,
            paddingHorizontal: LIST_UI.screenPadding,
            paddingTop: 12,
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
            emptyMessage: t("No Comments Yet"),
          })}
        />
      </ListScreenBody>
    </View>
  );
}
