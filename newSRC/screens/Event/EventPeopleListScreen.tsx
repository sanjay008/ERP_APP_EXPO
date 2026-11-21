import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
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
import { RegisterBackContext } from "../../constants/GoBackContext";
import { useAppData } from "../../context/AppDataContext";
import { useApiErrorState } from "../../hooks/useApiErrorState";
import {
  confirmEventBooking,
  fetchEventBookings,
  fetchEventGuests,
  flattenEventGuestTickets,
  formatEventDate,
  getEventBookingDate,
  getEventBookingPhone,
  getEventPersonName,
  getEventTicketCode,
  getEventTicketSeat,
  isEventBookingScanned,
  type EventBookingItem,
  type EventGuestTicketRow,
} from "../../services/eventService";
import { hasPermission } from "../../utils/permissionFlags";
import { getData } from "../../utils/storeData";
import { getApiErrorMessage } from "../../utils/validation";
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
  const { permissions } = useAppData();
  const { setToast } = useContext(RegisterBackContext);
  const params = useLocalSearchParams<{ id?: string; eventName?: string; color?: string }>();
  const eventId = params.id ?? "";
  const canUpdateTicketScan = hasPermission(permissions, "event_ticket_scan_mobile", "update");

  const [items, setItems] = useState<EventBookingItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [selected, setSelected] = useState<EventGuestTicketRow | null>(null);
  const [scanSubmitting, setScanSubmitting] = useState(false);
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

  const ticketRows = useMemo(() => flattenEventGuestTickets(items), [items]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return ticketRows;
    return ticketRows.filter((row) => {
      const name = getEventPersonName(row.booking).toLowerCase();
      const email = String(
        row.booking.email || row.booking.relaties_data?.email_adres || ""
      ).toLowerCase();
      const code = getEventTicketCode(row.booking, row.single).toLowerCase();
      return name.includes(query) || email.includes(query) || code.includes(query);
    });
  }, [ticketRows, search]);

  const selectedScanned = isEventBookingScanned(selected?.booking, selected?.single);
  const selectedDate = selected
    ? formatEventDate(getEventBookingDate(selected.booking)) ||
      emptyToDash(getEventBookingDate(selected.booking))
    : "-";

  const applyLocalScanInfo = useCallback((row: EventGuestTicketRow, nextScanInfo: number) => {
    const singleId = row.single?.id;
    setItems((prev) =>
      prev.map((booking) => {
        if (String(booking.id) !== String(row.booking.id)) return booking;
        const singles = Array.isArray(booking.booking_single) ? booking.booking_single : [];
        if (!singles.length) {
          return { ...booking, scan_info: nextScanInfo };
        }
        return {
          ...booking,
          booking_single: singles.map((single) => {
            if (singleId != null && String(single.id) === String(singleId)) {
              return { ...single, scan_info: nextScanInfo };
            }
            if (singleId == null && singles[0] === single) {
              return { ...single, scan_info: nextScanInfo };
            }
            return single;
          }),
        };
      })
    );
    setSelected((prev) => {
      if (!prev || prev.key !== row.key) return prev;
      return {
        ...prev,
        single: prev.single ? { ...prev.single, scan_info: nextScanInfo } : prev.single,
        booking: {
          ...prev.booking,
          scan_info: nextScanInfo,
          booking_single: prev.booking.booking_single?.map((single) =>
            prev.single?.id != null && String(single.id) === String(prev.single.id)
              ? { ...single, scan_info: nextScanInfo }
              : single
          ),
        },
      };
    });
  }, []);

  const handleToggleScan = useCallback(async () => {
    if (!selected || !canUpdateTicketScan || scanSubmitting) return;

    const bookingId = selected.single?.id;
    if (bookingId == null || bookingId === "") {
      setToast({
        top: 45,
        text: t("Something went wrong"),
        type: "error",
        visible: true,
      });
      return;
    }

    const closing = !selectedScanned;
    setScanSubmitting(true);
    try {
      const userData = await getData("USERDATA");
      const token = userData?.data?.user?.verify_token;
      if (!token) {
        throw new Error(t("Something went wrong"));
      }

      const resolvedEventId =
        eventId || selected.booking.event_id || selected.booking.event_data?.id || "";

      await confirmEventBooking({
        token,
        eventId: resolvedEventId,
        bookingId,
      });

      // Close → scan_info 1; Unclose → scan_info 0 (local UI after API success).
      applyLocalScanInfo(selected, closing ? 1 : 0);
      setToast({
        top: 45,
        text: closing ? t("Close ticket") : t("Unclose ticket"),
        type: "success",
        visible: true,
      });
    } catch (error) {
      setToast({
        top: 45,
        text: getApiErrorMessage(error, t("Something went wrong")),
        type: "error",
        visible: true,
      });
    } finally {
      setScanSubmitting(false);
    }
  }, [
    applyLocalScanInfo,
    canUpdateTicketScan,
    eventId,
    scanSubmitting,
    selected,
    selectedScanned,
    setToast,
    t,
  ]);

  const renderItem = ({ item }: { item: EventGuestTicketRow }) => {
    const scanned = isEventBookingScanned(item.booking, item.single);
    return (
      <Pressable style={styles.card} onPress={() => setSelected(item)}>
        <View style={styles.cardBody}>
          <Text style={styles.name} numberOfLines={1}>
            {getEventPersonName(item.booking)}
          </Text>
          <Text style={styles.subText} numberOfLines={1}>
            {item.booking.email || item.booking.relaties_data?.email_adres || "-"}
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
        itemCount={filteredRows.length}
        apiError={apiError}
        onRetry={() => loadData(true)}
      >
        <FlatList
          data={filteredRows}
          keyExtractor={(item) => item.key}
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

            <DetailRow
              label={t("Name")}
              value={emptyToDash(getEventPersonName(selected.booking))}
            />
            <DetailRow
              label={t("Email")}
              value={emptyToDash(
                selected.booking.email || selected.booking.relaties_data?.email_adres
              )}
            />
            <DetailRow
              label={t("Phone")}
              value={emptyToDash(getEventBookingPhone(selected.booking))}
            />
            <DetailRow
              label={t("Ticket Code")}
              value={emptyToDash(getEventTicketCode(selected.booking, selected.single))}
            />
            <DetailRow
              label={t("Seat")}
              value={emptyToDash(getEventTicketSeat(selected.booking, selected.single))}
            />
            <DetailRow
              label={t("Scanned")}
              value={selectedScanned ? t("Scanned") : t("Not scanned")}
            />
            <DetailRow label={t("Date")} value={emptyToDash(selectedDate)} />

            {canUpdateTicketScan ? (
              <Pressable
                style={[
                  styles.actionBtn,
                  {
                    backgroundColor: selectedScanned
                      ? AppColors.primary
                      : AppColors.dicline,
                  },
                  scanSubmitting ? styles.actionBtnDisabled : null,
                ]}
                onPress={() => {
                  void handleToggleScan();
                }}
                disabled={scanSubmitting}
              >
                {scanSubmitting ? (
                  <ActivityIndicator color={AppColors.white} />
                ) : (
                  <Text style={styles.actionBtnText}>
                    {selectedScanned ? t("Unclose ticket") : t("Close ticket")}
                  </Text>
                )}
              </Pressable>
            ) : null}
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
    minHeight: 48,
  },
  actionBtnDisabled: {
    opacity: 0.7,
  },
  actionBtnText: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 14,
    color: AppColors.white,
  },
});
