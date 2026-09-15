import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Modal, Vibration } from 'react-native'
import React, { useContext, useEffect, useRef, useState } from 'react'
import BlueHeader from '../components/BlueHeader';
import { t } from 'i18next';
import { Images } from '../constants/images';
import LottieView from 'lottie-react-native';
import { FONTS } from '../constants/fontFamily';
import { Colors } from '../constants/color';
import { getData } from '../utils/storeData';
import ApiService from '../utils/Apiservice';
import apiConstants from '../api/apiConstants';
import { RegisterBackContext } from '../constants/GoBackContext';
import axios from 'axios';
import Loader from '../components/loading';
export default function EventDetails({ navigation, route }) {
    const { bgcolor, itemData: parmasData } = route.params || {};
    const animationRef = useRef(null);

    const { setToast } = useContext(RegisterBackContext);
    const [IsLoading, setIsLoading] = useState(false);
    const [itemData, setItemData] = useState(parmasData?.data || null)
    console.log("PAramas data", parmasData);
    const ConfrimBooking = async () => {
        setIsLoading(true)
        try {
            const data = await getData("USERDATA");
            let UserData = data?.data;
            console.log("ConfirmBooking Request Data", {
                token: UserData?.user?.verify_token,
                event_id: parmasData?.sub_booking?.event_id,
                booking_id: parmasData?.sub_booking?.id
            });

            let res = await ApiService(apiConstants.event_booking_confirmation, {
                includeToken: true,
                customData: {
                    token: UserData?.user?.verify_token,
                    event_id: parmasData?.sub_booking?.event_id,
                    booking_id: parmasData?.sub_booking?.id
                },
            });
            console.log("ConfirmBooking Response Data:-", res);

            if (res?.status) {
                Vibration.vibrate([300, 100, 300])
                setToast({
                    top: 45,
                    text: res?.message,
                    type: "success",
                    visible: true,
                });
            } else {
                setToast({
                    top: 45,
                    text: res?.message,
                    type: "error",
                    visible: true,
                });
            }
        } catch (error) {
            console.log("Confiramtion Error-", error);
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
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (itemData == null) {
            setItemData(parmasData?.data)
        }

        if (Number(parmasData?.sub_booking?.scan_info ?? 0) == 0) {
            ConfrimBooking()
        }

    }, [])

    return (
        <View style={[styles.container, { backgroundColor: (!["paid", "free"].includes(itemData?.payment_status) || Number(parmasData?.sub_booking?.scan_info ?? 0) >= 1) ? Colors.BgRedColor : Colors.green }]}>
            <BlueHeader
                title={t("Event Details")}
                bgcolor={bgcolor ? bgcolor : "#006400"}
            />
            {
                ["paid", "free"].includes(itemData?.payment_status) && !Number(parmasData?.sub_booking?.scan_info ?? 0) >= 1
                    ?
                    <View>
                        <LottieView
                            ref={animationRef}
                            autoPlay
                            speed={2}
                            loop={false}
                            source={Images.EventAnimation}
                            style={styles.Animate}
                        />
                        <Text style={[styles.statusText, { color: Colors.white, fontSize: 14 }]}>

                            {t("Event status")} : {t("Approved")}
                        </Text>
                    </View>
                    :
                    <View style={{ paddingHorizontal: 15 }}>
                        <LottieView
                            ref={animationRef}
                            autoPlay
                            loop={false}
                            speed={2}
                            source={Images.Faild}
                            style={styles.Animate}
                        />
                        {

                            !["paid", "free"].includes(itemData?.payment_status) &&
                            <>
                                <Text style={[styles.statusText, { color: Colors.white, fontSize: 13 }]}>
                                    {t("Event status")} : {t("Not Allowed")}
                                </Text>
                                <Text style={[styles.statusText, { color: Colors.white, fontSize: 13 }]}>{parmasData?.error_message}</Text>
                            </>
                        }
                    </View>
            }
            <View style={styles.TopConatiner}>
                <Text style={[styles.Value, { color: Colors.white, textAlign: "center" }]}>
                    {itemData?.event_tickets?.title ?? parmasData?.firstEvent?.name ?? "N/A"}
                </Text>
                <Text style={[styles.Value, { color: Colors.white }]}>{parmasData?.sub_booking?.id}-{parmasData?.sub_booking?.unique_code}</Text>
            </View>
            <View style={styles.EventDetails}>
                {
                    Number(parmasData?.sub_booking?.scan_info ?? 0) >= 1 && (
                        <View style={styles.AleardyScannerButton}>
                            <Text
                                style={[
                                    styles.EventIdText,
                                    {
                                        color: Colors.white,
                                        fontSize: 12,
                                        fontFamily: FONTS.LexendMedium,
                                    },
                                ]}
                            >
                                {t("Already Scanned")}
                            </Text>
                        </View>
                    )
                }

                <View style={[styles.SimpleFlex, styles.GapTop]}>
                    <View style={styles.Icon}>
                        <Image
                            source={Images.projectname}
                            style={{ width: "70%", height: "70%" }}
                        />
                    </View>
                    <Text style={styles.TextStyle}>
                        {t("ORDER NR")} :{" "}
                        <Text style={styles.EventIdText}>#{itemData?.id}</Text>
                    </Text>

                </View>
                <View style={[styles.Flex, { marginTop: 15 }]}>
                    <View >
                        <Text style={styles.Lable}>{t("Relities")}</Text>
                        <Text style={styles.Value}>{itemData?.relaties?.display_name || ""}</Text>
                    </View>
                    <View >
                        <Text style={styles.Lable}>{t("Ticket")}#</Text>
                        <Text style={styles.Value}>{parmasData?.sub_booking?.ticket_nr ?? 1}</Text>
                    </View>
                </View>

            </View>
            {
                ["paid", "free"].includes(itemData?.payment_status) &&
                <TouchableOpacity style={styles.ConfirmButton} onPress={() => navigation.goBack()}>
                    {
                        IsLoading ?
                            <ActivityIndicator size={"small"} color={Colors.white} />
                            :
                            <Text style={[styles.TextStyle, { color: Colors.white }]}>{

                                t("Scan new Ticket")

                            }</Text>
                    }
                </TouchableOpacity>
            }
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    Gap: {
        gap: 10,
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    Animate: {
        width: 200,
        height: 200,
        alignSelf: 'center'
    },
    Flex: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    statusText: {
        fontSize: 15,
        fontFamily: FONTS.LexendMedium,
        color: Colors.black,
        textAlign: 'center',
        // marginTop: 10
    },
    EventDetails: {
        width: '90%',
        padding: 15,
        borderWidth: 0.5,
        borderColor: Colors.Boxgray,
        marginTop: 15,
        alignSelf: 'center',
        borderRadius: 7,
        backgroundColor: Colors.white,
        elevation: 3,
        overflow: "hidden"

    },
    SimpleFlex: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15
    },
    GapTop: {
        marginTop: 10
    },
    Icon: {
        width: 50,
        height: 50,
        borderRadius: 700,
        overflow: 'hidden',
        backgroundColor: Colors.white,
        elevation: 3,
        justifyContent: 'center',
        alignItems: 'center'

    },
    TextStyle: {
        fontSize: 14,
        fontFamily: FONTS.LexendSemiBold,
        color: Colors.textgray

    },
    EventIdText: {
        fontFamily: FONTS.LexendRegular,
        color: Colors.black,
        fontSize: 15
    },

    AleardyScannerButton: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        backgroundColor: Colors.orignalGreen,
        position: "absolute",
        right: -0,
        top: 0,
    },

    Lable: {
        fontSize: 14,
        fontFamily: FONTS.LexendSemiBold,
        color: Colors.textgray
    },
    Value: {
        fontSize: 14,
        fontFamily: FONTS.LexendRegular,
        color: Colors.black
    },
    TopConatiner: {
        alignSelf: 'center',
    },
    ConfirmButton: {
        width: '90%',
        height: 50,
        backgroundColor: Colors.primary,
        justifyContent: "center",
        alignItems: 'center',
        borderRadius: 7,
        alignSelf: 'center',
        marginTop: 25
    },
    Loader: {
        width: "50%",
        height: 100,
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 7,
        position: 'absolute',
        top: '45%',
        left: '25%',
        elevation: 3
    }
});