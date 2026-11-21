import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import ScreenHeader from "../../Components/ScreenHeader";
import SearchBox from "../../Components/SearchBox";
import FormModal from "../../Components/FormModal";
import ListScreenBody, { listEmptyFeedback } from "../../Components/ListScreenBody";
import { useApiErrorState } from "../../hooks/useApiErrorState";
import {
  fetchEventBookings,
  fetchEventGuests,
  getEventBookingPhone,
  getEventPersonName,
  getEventTicketCode,
  isEventBookingScanned,
  type EventBookingItem,
} from "../../services/eventService";
import { useScreenInsets } from "../../utils/screenInsets";
import { AppColors } from "../../utils/theme";
import { FONTS } from "../../utils/FONTS";
import { LIST_UI } from "../../utils/connectionTheme";
import { listScreenStyles } from "../../utils/listScreenStyles";
import { Images } from "../../utils/Images";

type Mode = "bookings" | "guests";

type Props = {
  mode: Mode;
};

const SCAN_ORANGE = "#F59E0B";
const SCAN_GREEN = "#06AC14";

function emptyToDash(value?: string | number | null) {
  if (value == null || value === "" || value === "null") return "-";
  return String(value);
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

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
  const [selected, setSelected] = useState<EventBookingItem | null>(null);
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
    return items.filter((item) => {
      const name = getEventPersonName(item).toLowerCase();
      const email = String(item.email || item.relaties_data?.email_adres || "").toLowerCase();
      return name.includes(query) || email.includes(query);
    });
  }, [items, search]);

  const selectedScanned = isEventBookingScanned(selected);
  const selectedSeat = selected?.booking_single?.[0]?.seat_data?.seat_number;

  const renderItem = ({ item }: { item: EventBookingItem }) => {
    const scanned = isEventBookingScanned(item);
    return (
      <Pressable style={styles.card} onPress={() => setSelected(item)}>
        <View style={styles.cardBody}>
          <Text style={styles.name} numberOfLines={1}>
            {getEventPersonName(item)}
          </Text>
          <Text style={styles.subText} numberOfLines={1}>
            {item.email || item.relaties_data?.email_adres || "-"}
          </Text>
        </View>
        <View
          style={[
            styles.scanIcon,
            { backgroundColor: scanned ? SCAN_GREEN : SCAN_ORANGE },
          ]}
        >
          <Ionicons
            name={scanned ? "checkmark" : "close"}
            size={18}
            color={AppColors.white}
          />
        </View>
      </Pressable>
    );
  };

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

      <FormModal
        visible={selected != null}
        onClose={() => setSelected(null)}
        scrollable
        protected={false}
        contentStyle={styles.detailCard}
      >
        {selected ? (
          <>
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle}>{t("Ticket details")}</Text>
              <Pressable onPress={() => setSelected(null)} hitSlop={8}>
                <Image source={Images.CloseIcon} style={styles.closeIcon} />
              </Pressable>
            </View>

            <View
              style={[
                styles.statusBanner,
                { backgroundColor: selectedScanned ? SCAN_GREEN : SCAN_ORANGE },
              ]}
            >
              <Ionicons
                name={selectedScanned ? "checkmark-circle" : "alert-circle"}
                size={18}
                color={AppColors.white}
              />
              <Text style={styles.statusBannerText}>
                {selectedScanned ? t("Scanned") : t("Not scanned")}
              </Text>
            </View>

            <DetailRow label={t("Name")} value={emptyToDash(getEventPersonName(selected))} />
            <DetailRow
              label={t("Email")}
              value={emptyToDash(selected.email || selected.relaties_data?.email_adres)}
            />
            <DetailRow label={t("Phone")} value={emptyToDash(getEventBookingPhone(selected))} />
            <DetailRow label={t("Booking ID")} value={emptyToDash(selected.id)} />
            <DetailRow label={t("Ticket Code")} value={emptyToDash(getEventTicketCode(selected))} />
            <DetailRow
              label={t("Ticket")}
              value={emptyToDash(selected.event_tickets?.title)}
            />
            <DetailRow label={t("Seat")} value={emptyToDash(selectedSeat)} />
            <DetailRow label={t("Quantity")} value={emptyToDash(selected.quantity)} />
            <DetailRow
              label={t("Payment status")}
              value={emptyToDash(selected.payment_status)}
            />
            <DetailRow
              label={t("Payment method")}
              value={emptyToDash(selected.payment_method)}
            />
            <DetailRow
              label={t("Total")}
              value={emptyToDash(selected.total_price || selected.amount)}
            />
            <DetailRow
              label={t("Event")}
              value={emptyToDash(selected.event_data?.name || params.eventName)}
            />

            <Pressable
              style={[
                styles.actionBtn,
                { backgroundColor: selectedScanned ? AppColors.primary : AppColors.dicline },
              ]}
              onPress={() => {
                // API + permission later
              }}
            >
              <Text style={styles.actionBtnText}>
                {selectedScanned ? t("Unclose ticket") : t("Close ticket")}
              </Text>
            </Pressable>
          </>
        ) : null}
      </FormModal>
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
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
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
  scanIcon: {
    width: 34,
    height: 34,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  detailCard: {
    maxHeight: "90%",
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  detailTitle: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 18,
    color: AppColors.black,
  },
  closeIcon: {
    width: 22,
    height: 22,
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
  },
  statusBannerText: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 13,
    color: AppColors.white,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: LIST_UI.cardBorder,
  },
  detailLabel: {
    flex: 1,
    fontFamily: FONTS.LexendMedium,
    fontSize: 13,
    color: AppColors.subtitle,
  },
  detailValue: {
    flex: 1.2,
    fontFamily: FONTS.LexendRegular,
    fontSize: 13,
    color: AppColors.black,
    textAlign: "right",
  },
  actionBtn: {
    marginTop: 18,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnText: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 14,
    color: AppColors.white,
  },
});
