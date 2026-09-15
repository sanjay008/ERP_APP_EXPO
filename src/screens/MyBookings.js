import { View, Text, StyleSheet, RefreshControl, InteractionManager, Image, FlatList } from 'react-native'
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import BlueHeader from '../components/BlueHeader'
import { RegisterBackContext } from '../constants/GoBackContext';
import axios from 'axios';
import ApiService from '../utils/Apiservice';
import apiConstants from '../api/apiConstants';
import { FlashList } from '@shopify/flash-list';
import { Colors } from '../constants/color';
import { useTranslation } from 'react-i18next';
import { getData } from '../utils/storeData';
import BookingItem from '../components/BookingItem';
import { Images } from '../constants/images';
import { RFValue } from 'react-native-responsive-fontsize';
import { FONTS } from '../constants/fontFamily';



export default function MyBookings({ navigation, route }) {
    const { bgcolor, itemData: parmasData } = route?.params || {};
    const [AllBookingData, setAllBookingData] = useState([]);
    const { setToast } = useContext(RegisterBackContext);
    const { t } = useTranslation();
    const [IsLoading, setIsLoading] = useState(false);
    const [PullToRefresh, setPullToRefresh] = useState(false);

    const GetBookingsData = async (pull = false) => {
        if (pull) {
            setPullToRefresh(true);
        } else if (AllBookingData?.length === 0) {
            setIsLoading(true);
        }
        try {
            const getdata = await getData("USERDATA");
            if (!getdata) {
                setToast({
                    top: 45,
                    text: t("User Not Found"),
                    type: "error",
                    visible: true,
                });
                return
            }

            let ReqData = {
                user_id: getdata?.data?.user?.id,
                relaties_id: getdata?.data?.relaties?.id,
            }

            let res = await ApiService(apiConstants.getBookingDetails, {
                includeToken: true,
                customData: ReqData,
            });

            if (res?.status) {
                setAllBookingData(res?.data || []);
            } else {
                setToast({
                    top: 45,
                    text: res?.message,
                    type: "error",
                    visible: true,
                });
            }
        } catch (error) {
            console.log("GetBookingsData Error:- ", error);
            if (axios.isAxiosError(error)) {
                setToast({
                    text:
                        error?.response?.data?.message ||
                        error?.message ||
                        t("Something Wrong"),
                    type: "error",
                    visible: true,
                });
            }
        }
        finally {
            setPullToRefresh(false);
            setIsLoading(false);
        }
    }

    const renderItem = useCallback(({ item, index }) => {
        return (
            <BookingItem bgcolor={bgcolor} item={item} onPress={() => navigation.navigate('MyBookingsDetails', { item: item , bgcolor:bgcolor || "#006400"})}/>
        )
    }, [])

    const ListEmptyComponent = useMemo(() => (
        <View style={styles.subcontainer}>
            <Image
                source={Images.NoComment}
                style={styles.icon}
                resizeMode="contain"
            />
            <Text style={styles.text}>{t("No Comments Yet")}</Text>
        </View>
    ), [])

    const handleRefresh = useCallback(() => {
        GetBookingsData(true);
    }, []);


    useEffect(() => {
        const task = InteractionManager.runAfterInteractions(() => {
            if (AllBookingData?.length === 0) {
                GetBookingsData();
            }
        });

        return () => task.cancel();
    }, []);
    return (
        <View style={styles.container}>
            <BlueHeader
                title={t("My Booking")}
                bgcolor={bgcolor ? bgcolor : "#006400"}
            />

            <FlatList
                data={AllBookingData}
                keyExtractor={(item, index) => String(item?.id ?? index)}
                renderItem={renderItem}
                style={{paddingTop:15}}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={PullToRefresh}
                        onRefresh={handleRefresh}
                        colors={[Colors.primary, bgcolor || "#006400"]}
                        progressViewOffset={10}
                    />
                }
                contentContainerStyle={{
                    paddingBottom: 20,
                    flexGrow: 1,
                }}
                ListEmptyComponent={ListEmptyComponent}
                removeClippedSubviews={true}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={10}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    subcontainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 30,
    },
    icon: {
        width: RFValue(40),
        height: RFValue(40),
        tintColor: Colors.placeholderText,
        marginBottom: 10,
    },
    text: {
        fontSize: RFValue(14),
        fontFamily: FONTS.LexendMedium,
        color: Colors.placeholderText,
    },
});