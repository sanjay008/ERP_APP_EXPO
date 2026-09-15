import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import React, { useContext, useEffect, useState, useMemo, useCallback } from 'react';
import BlueHeader from '../components/BlueHeader';
import { Images } from '../constants/images';
import { RegisterBackContext } from '../constants/GoBackContext';
import { getData } from '../utils/storeData';
import ApiService from '../utils/Apiservice';
import apiConstants from '../api/apiConstants';
import axios from 'axios';
import { t } from 'i18next';
import { FONTS } from '../constants/fontFamily';
import { Colors } from '../constants/color';
import FallbackImage from '../components/FallbackImage';
import { heightPercentageToDP } from 'react-native-responsive-screen';
import { FlashList } from '@shopify/flash-list';

export default function EventBookingList({ route }) {
  const { event_id, bgcolor } = route?.params || {};
  const { setToast } = useContext(RegisterBackContext);

  const [BookingList, setBookingList] = useState([]);
  const [Search, setSearch] = useState("");

  const [IsLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [CurrentPage, setCurrentPage] = useState(1);
  const [PerPageItems] = useState(25);
  const [LastPage, setLastPage] = useState(1);

  const GetBookingsList = async (reset = false) => {
    if (IsLoading || isLoadingMore) return;
    if (!reset && CurrentPage > LastPage) return;

    reset ? setIsLoading(true) : setIsLoadingMore(true);

    try {
      const data = await getData("USERDATA");
      const UserData = data?.data;

      const res = await ApiService(apiConstants.events_booking_list, {
        customData: {
          token: UserData?.user?.verify_token,
          event_id,
          page_no: reset ? 1 : CurrentPage,
          page_limit: PerPageItems,
        },
      });

      if (res?.status) {
        const newData = Array.isArray(res?.data) ? res.data : [];

        setBookingList(prev => {
          if (reset) return newData;


          const map = new Map();
          [...prev, ...newData].forEach(item => map.set(item.id, item));
          return Array.from(map.values());
        });

        const lastpage = res?.pagination?.last_page || res?.last_page || 1;
        setLastPage(lastpage);

        if ((reset ? 1 : CurrentPage) < lastpage) {
          setCurrentPage(prev => prev + 1);
        }
      } else {
        setToast({
          top: 45,
          text: res?.message || t("Something went wrong"),
          type: "error",
          visible: true,
        });
      }
    } catch (error) {
      setToast({
        top: 45,
        text: axios.isAxiosError(error)
          ? error?.response?.data?.message || error.message
          : error?.message || "Unexpected error",
        type: "error",
        visible: true,
      });
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };



  useEffect(() => {
    GetBookingsList(true);
  }, []);



  const loadMore = useCallback(() => {
    if(filteredData?.length === 0) return;
    if (!Search && !IsLoading && !isLoadingMore && CurrentPage <= LastPage) {
      GetBookingsList(false);
    }
  }, [Search, IsLoading, isLoadingMore, CurrentPage, LastPage]);



  const filteredData = useMemo(() => {
    const search = Search.toLowerCase().trim();
    if (!search) return BookingList;

    return BookingList.filter(item => {
      const event = item.event_data;
      const user = item.relaties_data;

      const fullName = [
        item?.first_name || user?.voornaam,
        item?.last_name || user?.achternaam,
      ].filter(Boolean).join(" ").toLowerCase();

      return (
        event?.name?.toLowerCase()?.includes(search) ||
        event?.location?.toLowerCase()?.includes(search) ||
        item?.unique_id?.toLowerCase()?.includes(search) ||
        fullName.includes(search) ||
        item?.payment_status?.toLowerCase()?.includes(search) ||
        `${item?.amount}`.includes(search)
      );
    });
  }, [Search, BookingList]);



  const InfoRow = ({ label, value }) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );

  const renderItem = ({ item }) => {
    const event = item.event_data;
    const user = item.relaties_data;

    const fullName = [
      item?.first_name || user?.voornaam,
      item?.last_name || user?.achternaam,
    ].filter(Boolean).join(" ");

    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.eventName}>{event?.name}</Text>
          <Text style={styles.eventDate}>{event?.date}</Text>
        </View>

        <View style={styles.body}>
          <View style={{ flex: 1 }}>
            <InfoRow label="Name" value={fullName} />
            <InfoRow label="Location" value={event?.location} />
            <InfoRow label="Ticket ID" value={item?.unique_id} />
            <InfoRow label="Payment" value={item?.payment_status?.toUpperCase()} />
            <InfoRow label="Amount" value={`₹ ${item?.amount}`} />
          </View>

          <FallbackImage
            source={item?.qr_url ? { uri: item.qr_url } : null}
            defaultSource={Images.defaultImage}
            style={styles.qr}
            resizeMode="contain"
          />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <BlueHeader
        title={t("Event Booking List")}
        Righticon={Images.refresh}
        SearchBarInput
        value={Search}
        onChangeText={setSearch}
        onPressRight={() => {
          setCurrentPage(1);
          GetBookingsList(true);
        }}
        bgcolor={bgcolor || "#006400"}
        filterButtonShow={false}
      />

      <FlatList
        data={filteredData}
        keyExtractor={item => item?.id?.toString()}
        renderItem={renderItem}
        onEndReached={() => loadMore()}
        onEndReachedThreshold={0.2}
        keyboardDismissMode='on-drag'
        keyboardShouldPersistTaps='handled'
        windowSize={10}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        removeClippedSubviews
        ListEmptyComponent={
          !IsLoading && (
            <View style={styles.emptyBox}>
              <Text style={styles.TextDark}>{t("No Booking List Found")}</Text>
            </View>
          )
        }

        ListFooterComponent={
          isLoadingMore ? (
            <View style={{ padding: 20 }}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  TextDark: {
    fontSize: 16,
    fontFamily: FONTS.LexendSemiBold,
    color: Colors.gray,
  },

  emptyBox: {
    width: '100%',
    height: heightPercentageToDP(60),
    justifyContent: 'center',
    alignItems: 'center',
  },

  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 16,
    padding: 16,
    elevation: 4,
  },

  header: {
    borderBottomWidth: 1,
    borderColor: '#eee',
    paddingBottom: 10,
    marginBottom: 10,
  },

  eventName: {
    fontSize: 18,
    fontFamily: FONTS.LexendSemiBold,
    color: Colors.black,
  },

  eventDate: {
    fontSize: 14,
    fontFamily: FONTS.LexendMedium,
    color: Colors.gray,
    marginTop: 4,
  },

  body: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  qr: {
    width: 90,
    height: 90,
    borderRadius: 8,
  },

  row: {
    marginBottom: 8,
  },

  label: {
    fontSize: 12,
    fontFamily: FONTS.LexendMedium,
    color: Colors.gray,
  },

  value: {
    fontSize: 16,
    fontFamily: FONTS.LexendSemiBold,
    color: Colors.black,
  },
});
