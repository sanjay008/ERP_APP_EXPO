import { View, Text, StyleSheet, RefreshControl, Pressable, FlatList } from 'react-native'
import React, { useCallback, useContext, useMemo, useRef, useState } from 'react'
import { useFocusEffect, useRouter } from 'expo-router'
import ScreenHeader from '../../Components/ScreenHeader'
import ListScreenBody, { listEmptyFeedback } from '../../Components/ListScreenBody'
import ListScreenSearchBar from '../../Components/ListScreenSearchBar'
import { useApiErrorState } from '../../hooks/useApiErrorState'
import { useScreenInsets } from '../../utils/screenInsets'
import { Colors } from '../../utils/colors';
import TicketViewCard from '../../Components/TicketViewCard';
import TicketFilterBottomSheet, {
    type SortOrder,
    type StatusOption,
    type TicketFilterState,
} from '../../Components/TicketFilterBottomSheet';
import apiClient from '../../utils/client';
import { apiConstants } from '../../utils/apiConstants';
import { parseApiError } from '../../utils/apiError';
import { RegisterBackContext } from '../../constants/GoBackContext';
import { useTranslation } from 'react-i18next';
import FallBackImage from '../../Components/FallBackImage';
import { Images } from '../../utils/Images';
import { useAppData } from '../../context/AppDataContext';

interface TicketItem {
    id?: string | number;
    ticket_title?: string;
    project_name?: string;
    project_data?: { project_name?: string };
    ticket_status_data?: { id?: string | number; status_name?: string; color?: string };
    status_id?: string | number;
    status?: string | number;
    [key: string]: any;
}

const DEFAULT_FILTERS: TicketFilterState = {
    sortOrder: 'default',
    statusIds: [],
};

const getTicketStatusId = (item: TicketItem) =>
    item?.ticket_status_data?.id ?? item?.status_id ?? item?.status;

const sortTicketsById = (items: TicketItem[], sortOrder: SortOrder) => {
    if (sortOrder === 'default') {
        return items;
    }

    return [...items].sort((a, b) => {
        const aId = Number(a?.id) || 0;
        const bId = Number(b?.id) || 0;
        return sortOrder === 'asc' ? aId - bId : bId - aId;
    });
};

export default function AllTicket() {
    const { top, scrollPadding, fabBottom } = useScreenInsets();
    const [searchValue, setSearchValue] = useState<string>('');
    const { setToast } = useContext(RegisterBackContext)
    const { t } = useTranslation();
    const router = useRouter();
    const { permissions } = useAppData();
    const [AllTicketsData, setAllTicketsData] = useState<TicketItem[]>([]);
    const [statusOptions, setStatusOptions] = useState<StatusOption[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [pullToRefresh, setPullToRefresh] = useState<boolean>(false);
    const [filterSheetVisible, setFilterSheetVisible] = useState(false);
    const [appliedFilters, setAppliedFilters] = useState<TicketFilterState>(DEFAULT_FILTERS);

    const ticketsRequestRef = useRef<Promise<void> | null>(null);
    const hasLoadedOnceRef = useRef(false);
    const { apiError, clearApiError, captureApiError } = useApiErrorState();

    const canCreateTicket = String(permissions?.project_tickets_view?.create) === "1";

    const FetchAllTickets = useCallback(async (pull = false) => {
        // In-flight guard: focus effect re-runs must not fire a duplicate request.
        if (ticketsRequestRef.current) {
            return ticketsRequestRef.current;
        }

        const request = (async () => {
            try {
                if (pull) {
                    setPullToRefresh(true);
                } else if (!hasLoadedOnceRef.current) {
                    setIsLoading(true);
                }

                clearApiError();
                const response = await apiClient.post(apiConstants.get_tickets);

                if (response?.data?.status) {
                    hasLoadedOnceRef.current = true;
                    setAllTicketsData(response?.data?.data ?? []);
                } else {
                    const parsed = parseApiError(
                        { message: response?.data?.message || t("Ticket Fetch Failed") },
                        t("Ticket Fetch Failed")
                    );
                    captureApiError(new Error(parsed.message));
                    setToast({
                        top: 45,
                        text: parsed.message,
                        type: "error",
                        visible: true,
                    });
                }
            } catch (error) {
                captureApiError(error);
                setToast({
                    top: 45,
                    text: parseApiError(error, t("Ticket Fetch Failed")).message,
                    type: "error",
                    visible: true,
                });
            } finally {
                ticketsRequestRef.current = null;
                setIsLoading(false);
                setPullToRefresh(false);
            }
        })();

        ticketsRequestRef.current = request;
        return request;
    }, [setToast, t, clearApiError, captureApiError]);

    const fetchStatusList = useCallback(async () => {
        try {
            const response = await apiClient.post(apiConstants.getstatus, {
                slug: "ticket",
            });
            if (response?.data?.status) {
                setStatusOptions(response.data.data || []);
            }
        } catch (error) {
            console.log("fetchStatusList Error:-", error);
        }
    }, []);

    const FilterData = useMemo(() => {
        let result = [...AllTicketsData];

        if (searchValue.trim()) {
            const query = searchValue.toLowerCase();
            result = result.filter((item) => {
                const projectName =
                    item?.project_name ||
                    item?.project_data?.project_name ||
                    '';
                return (
                    item?.ticket_title?.toLowerCase().includes(query) ||
                    projectName.toLowerCase().includes(query) ||
                    item?.id?.toString().includes(searchValue)
                );
            });
        }

        if (appliedFilters.statusIds.length > 0) {
            result = result.filter((item) => {
                const statusId = getTicketStatusId(item);
                return appliedFilters.statusIds.some(
                    (id) => String(id) === String(statusId)
                );
            });
        }

        return sortTicketsById(result, appliedFilters.sortOrder);
    }, [searchValue, AllTicketsData, appliedFilters]);

    const hasActiveFilters = useMemo(
        () =>
            appliedFilters.sortOrder !== 'default' ||
            appliedFilters.statusIds.length > 0,
        [appliedFilters]
    );

    useFocusEffect(
        useCallback(() => {
            FetchAllTickets();
            fetchStatusList();
        }, [FetchAllTickets, fetchStatusList])
    );

    const handleTicketPress = useCallback((ticket: TicketItem) => {
        router.push({
            pathname: "/(app)/tickets/[id]",
            params: {
                id: String(ticket.id),
                item: JSON.stringify(ticket),
            },
        });
    }, [router]);

    const handleApplyFilters = useCallback((filters: TicketFilterState) => {
        setAppliedFilters(filters);
    }, []);

    const renderItem = useCallback(({ item }: { item: TicketItem }) => {
        return (
            <TicketViewCard
                ItemData={item}
                onPress={() => handleTicketPress(item)}
            />
        );
    }, [handleTicketPress]);

    const keyExtractor = useCallback(
        (item: TicketItem, index: number) => item?.id?.toString() ?? index.toString(),
        []
    );

    const ListEmptyComponent = useCallback(() => {
        return listEmptyFeedback({
            loading: isLoading,
            apiError,
            onRetry: () => FetchAllTickets(),
            emptyMessage: t("No Tickets Found"),
        });
    }, [t, isLoading, apiError, FetchAllTickets]);

    return (
        <View style={[styles.container, { paddingTop: top }]}>
            <ScreenHeader
                title={t("Tickets")}
                refreshOnPress={() => FetchAllTickets(true)}
                filterOnPress={() => setFilterSheetVisible(true)}
            />
            <ListScreenSearchBar
                value={searchValue}
                onChangeText={setSearchValue}
                placeholder={t("Search ticket, name, id")}
                onClear={() => setSearchValue('')}
            />
            <View style={styles.AppContent}>
                {hasActiveFilters ? (
                    <View style={styles.activeFilterChip}>
                        <Text style={styles.activeFilterText} numberOfLines={1}>
                            {[
                                appliedFilters.sortOrder === 'asc'
                                    ? t("ID Ascending")
                                    : appliedFilters.sortOrder === 'desc'
                                        ? t("ID Descending")
                                        : null,
                                appliedFilters.statusIds.length > 0
                                    ? `${appliedFilters.statusIds.length} ${t("Status")}`
                                    : null,
                            ]
                                .filter(Boolean)
                                .join(" • ")}
                        </Text>
                        <Pressable onPress={() => setAppliedFilters(DEFAULT_FILTERS)}>
                            <Text style={styles.clearFilterText}>{t("Reset")}</Text>
                        </Pressable>
                    </View>
                ) : null}

                <ListScreenBody
                    loading={isLoading}
                    itemCount={AllTicketsData.length}
                    apiError={apiError}
                    onRetry={() => FetchAllTickets()}
                >
                    <FlatList
                        data={FilterData}
                        keyExtractor={keyExtractor}
                        renderItem={renderItem}
                        refreshControl={
                            <RefreshControl
                                onRefresh={() => FetchAllTickets(true)}
                                refreshing={pullToRefresh}
                                colors={[Colors.primary, Colors.placeholder]}
                            />
                        }
                        ListEmptyComponent={ListEmptyComponent}
                        contentContainerStyle={[styles.contentContainer, { paddingBottom: scrollPadding }]}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    />
                </ListScreenBody>
            </View>
            {canCreateTicket && !filterSheetVisible ? (
                <Pressable
                    style={[styles.plusIconBtn, { bottom: fabBottom }]}
                    onPress={() => router.push("/(app)/tickets/create")}
                >
                    <FallBackImage
                        source={Images.plusIcon}
                        style={styles.plusIcon}
                    />
                </Pressable>
            ) : null}

            {filterSheetVisible ? (
                <TicketFilterBottomSheet
                    visible={filterSheetVisible}
                    statusOptions={statusOptions}
                    initialFilters={appliedFilters}
                    onClose={() => setFilterSheetVisible(false)}
                    onApply={handleApplyFilters}
                />
            ) : null}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
        position: 'relative',
    },
    plusIcon: {
        width: 30,
        height: 30,
    },
    plusIconBtn: {
        width: 50,
        height: 50,
        position: 'absolute',
        right: 20,
        borderRadius: 25,
        zIndex: 10,
        elevation: 8,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.primary,
    },
    contentContainer: {
        gap: 15,
    },
    searchBox: {
        marginBottom: 15,
    },
    activeFilterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.lightprimary1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.lightprimary,
    },
    activeFilterText: {
        flex: 1,
        fontSize: 13,
        color: Colors.black,
    },
    clearFilterText: {
        fontSize: 13,
        color: Colors.primary,
        marginLeft: 10,
    },
    AppContent: {
        flex: 1,
        paddingHorizontal: 15,
        paddingTop: 12,
    },
    emptyWrapper: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        color: Colors.placeholder,
        fontSize: 16,
    },
});
