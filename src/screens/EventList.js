import { View, Text, TouchableOpacity, StyleSheet, RefreshControl, Image, Alert, Pressable, ActivityIndicator, useWindowDimensions, FlatList } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import BlueHeader from '../components/BlueHeader'
import { t } from 'i18next'
import { Images } from '../constants/images'
import { getData } from '../utils/storeData'
import apiConstants from '../api/apiConstants'
import { RegisterBackContext } from '../constants/GoBackContext'
import axios from 'axios'
import { heightPercentageToDP, widthPercentageToDP } from 'react-native-responsive-screen'
import { FONTS } from '../constants/fontFamily'
import { Colors } from '../constants/color'
import ApiService from '../utils/Apiservice'
import FallbackImage from '../components/FallbackImage'
import RenderHTML from 'react-native-render-html'
import CheckBox from 'react-native-check-box'
import { FlashList } from "@shopify/flash-list";
export default function EventList({ navigation, route }) {
    const { bgcolor } = route.params || {};
    const [CurrentPage, setCurrentPage] = useState(1);
    const [PerPageItems, setPerPageItems] = useState(25);
    const [AllEventList, setAllEventList] = useState([]);
    const [IsLoading, setIsLoading] = useState(false);
    const { setToast } = useContext(RegisterBackContext);
    const [checked, setChecked] = useState(false);
    const [Search, setSearch] = useState("");
    const [LastPage, setLastPage] = useState(0);
    const [FooterLoading, setFooterLoading] = useState(false);
    const { width } = useWindowDimensions();
    const [AllPermission, setPermissions] = useState(null);
    const FetchEventAllList = async (pastEvents = checked, reset = false) => {
        if (IsLoading || FooterLoading) return;

        if (!reset && LastPage !== 0 && CurrentPage > LastPage) return;

        if (reset) {
            setAllEventList([]);
            setCurrentPage(1);
            setLastPage(0);
        }

        if (CurrentPage === 1 || reset) {
            setIsLoading(true);
        } else {
            setFooterLoading(true);
        }

        try {
            const data = await getData("USERDATA");
            const UserData = data?.data;
            const res = await ApiService(apiConstants.get_event_list, {
                includeToken: true,
                customData: {
                    user_id: UserData?.user?.id,
                    past_events: pastEvents ? 1 : 0,
                    page_id: reset ? 1 : CurrentPage,
                    page_limit: PerPageItems,
                    relaties_id:UserData?.relaties?.id,
                    role:UserData?.user?.role
                },
            });

            if (res?.status) {
                console.log(res);

                const newData = Array.isArray(res?.data) ? res.data : [];

                const lastPage =
                    res?.pagination?.last_page ??
                    res?.paginationlast_page ??
                    res?.pagination?.lastPage ??
                    1;

                setLastPage(lastPage);

                setAllEventList((prev) => {
                    const base = reset ? [] : prev || [];
                    const merged = [...base, ...newData];
                    const map = new Map();

                    for (const item of merged) {
                        if (item?.id != null && !map.has(item.id)) {
                            map.set(item.id, item);
                        }
                    }

                    return Array.from(map.values());
                });

                setCurrentPage((prev) => prev + 1);
            } else {
                setToast({
                    top: 45,
                    text: res?.message || t("Something went wrong"),
                    type: "error",
                    visible: true,
                });
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                setToast({
                    text:
                        error?.response?.data?.message ||
                        error?.message ||
                        t("Something went wrong"),
                    type: "error",
                    visible: true,
                });
            }
        } finally {
            setIsLoading(false);
            setFooterLoading(false);
        }
    };

    const getDropboxDirectLink = (url) => {
        if (!url) return "";
        let directUrl = url.replace("www.dropbox.com", "dl.dropboxusercontent.com");
        directUrl = directUrl.replace("?dl=0", "").replace("?dl=1", "");

        return directUrl;
    };
    const fetchPermission = async () => {
        try {
            const getdata = await getData("USERDATA");
            console.log("Permi userdata", getdata);

            if (
                !getdata ||
                !getdata?.data ||
                !getdata?.data?.user ||
                !getdata?.data?.relaties
            ) {
                console.log("Missing required user data:", getdata);
                return;
            }

            const response = await ApiService(apiConstants.permission, {
                includeToken: true,
                customData: {
                    relaties_id: getdata?.data?.relaties?.id,
                    user_id: getdata?.data?.user?.id,
                    role: getdata?.data?.user?.role,
                },
            });
            if (response?.data) {
                setPermissions(response.data);
                console.log("response.data Permission ==>", response.data);
            } else {
                console.log("Unexpected response format or error:", response);
            }
        } catch (error) {
            console.log("Error fetching permission:", error);
        }
    };
    useEffect(() => {
        if (AllEventList?.length === 0 && !IsLoading) {
            FetchEventAllList(checked, true);
        }
        if (AllPermission == null) {
            fetchPermission()
        }
    }, [])
    function stripHtmlTags(input) {
        if (!input) return "";
        let text = input.replace(/<\/?[^>]+(>|$)/g, "");
        text = text.replace(/&nbsp;/g, " ")
            .replace(/&amp;/g, "&")
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">");
        return text.trim();
    }
    function formatDatewithday(inputDate) {
        try {
            if (!inputDate) return "";

            let date = new Date(inputDate);

            if (isNaN(date.getTime())) {
                const parts = inputDate.split(/[-\/\s,]+/);
                if (parts.length === 3) {
                    if (parts[0].length === 4) {
                        date = new Date(`${parts[0]}-${parts[1]}-${parts[2]}`);
                    } else if (parts[2].length === 4) {
                        date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                    }
                }
            }

            if (isNaN(date.getTime())) return inputDate;

            const dayName = date.toLocaleDateString("nl-NL", { weekday: "long" });

            const day = date.getDate().toString().padStart(2, "0");
            const month = date
                .toLocaleDateString("en-GB", { month: "short" })
                .toUpperCase();
            const year = date.getFullYear();

            return `${day} ${month} ${year} (${dayName.charAt(0).toUpperCase() + dayName.slice(1)})`;
        } catch (error) {
            console.warn("Date parsing error:", error);
            return inputDate;
        }
    }

    const filteredData = useMemo(() => {
        const searchData = Search?.toLowerCase().trim();
        if (searchData?.length) {
            return AllEventList?.filter(el =>
                el?.name?.toLowerCase().trim().includes(searchData)
            ) ?? [];
        }
        console.log(AllEventList);
        return AllEventList ?? [];

    }, [Search, AllEventList]);
    return (
        <View style={{ flexGrow: 1 }}>
            <BlueHeader
                title={t("Event List")}
                Righticon={Images.refresh}
                SearchBarInput={true}
                value={Search}
                onChangeText={setSearch}
                onPressRight={() => FetchEventAllList(checked, true)}
                bgcolor={bgcolor ? bgcolor : "#006400"}
                filterButtonShow={false}
            />

            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10, gap: 10 }}>
                <CheckBox
                    isChecked={checked}
                    onClick={() => {
                        const newChecked = !checked;
                        setChecked(newChecked);
                        FetchEventAllList(newChecked, true);
                        setCurrentPage(0)
                    }}
                    checkedCheckBoxColor={Colors.primary}
                    uncheckedCheckBoxColor={Colors.Boxgray}
                />
                <Text style={styles.Text}>{t("Past Events")}</Text>
            </View>

            <FlatList
                data={filteredData || []}
                style={{ flexGrow: 1, paddingTop: 15 }}
                showsVerticalScrollIndicator={false}
                scrollEnabled={filteredData?.length > 0}
                contentContainerStyle={styles.ContentStyle}
                keyExtractor={(item, index) => index?.toString()}
                refreshControl={
                    <RefreshControl
                        colors={[Colors.primary, Colors.black]}
                        refreshing={IsLoading}
                        onRefresh={() => FetchEventAllList(checked, true)}
                    />
                }
                ListEmptyComponent={() =>
                    !IsLoading &&
                    (
                        <View style={[styles.EmptyContainer,]}>
                            <Text style={styles.EmptyText}>{t("No Events Found")}</Text>
                        </View>
                    )
                }
                renderItem={({ item, index }) => (
                    <Pressable
                        style={styles.EventContainer}
                        disabled={checked}
                        onPress={() => {
                            const canRead = Number(AllPermission?.ticket_scan?.read) === 1;
                            if (canRead) {
                                navigation.navigate("ScannerDetails", { item, bgcolor });
                            }
                        }}
                    >
                        <View style={{ flexDirection: 'row',gap:8 }}>

                            <View style={styles.ImageContainer}>
                                <FallbackImage
                                    source={
                                        item?.images?.[0]?.event_dropbox_shared_link
                                            ? { uri: getDropboxDirectLink(item.images[0].event_dropbox_shared_link) }
                                            : null
                                    }
                                    fallback={Images.defaultImage}
                                    style={styles.Image}
                                />

                            </View>

                            <View style={styles.ContainerDescription}>
                                <Text style={styles.Date1}>{formatDatewithday(item?.date)}</Text>
                                <Text style={styles.NewsTitle}>{item?.name}</Text>
                                <Text numberOfLines={2} style={styles.Description}>{stripHtmlTags(item?.description || "")}</Text>

                                <TouchableOpacity
                                    style={styles.Button}
                                    onPress={() =>
                                        navigation.navigate("EventBookingList", { event_id: item?.id, bgcolor })
                                    }
                                >

                                    <Text style={[styles.Text, { color: Colors.white, fontSize: 12 }]}>
                                        {t("Booking List")}
                                    </Text>

                                </TouchableOpacity>

                                <View style={[styles.SimpleFlex,]}>
                                    <Image source={Images.locationdot} style={{ width: 20, height: 20 }} tintColor={Colors.black} />
                                    <Text style={[styles.Text, { width: "85%" }]}>{item?.location}</Text>
                                </View>

                            </View>

                        </View>
                        <TouchableOpacity
                            style={[styles.Button, { width: "100%", justifyContent: 'center', alignItems: 'center', marginTop: 10, paddingVertical: 10 }]}
                            onPress={() =>
                                navigation.navigate("EventGuestList", { event_id: item?.id, bgcolor })
                            }
                        >

                            <Text style={[styles.Text, { color: Colors.white, fontSize: 12 }]}>
                                {t("Guest List")}
                            </Text>

                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.Button, { width: "100%", justifyContent: 'center', alignItems: 'center', paddingVertical: 10 }]}
                            onPress={() => {
                                const canRead = Number(AllPermission?.ticket_scan?.read) === 1;
                                if (canRead) {
                                    navigation.navigate("ScannerDetails", { item, bgcolor });
                                }
                            }}
                        >

                            <Text style={[styles.Text, { color: Colors.white, fontSize: 12 }]}>
                                {t("Scanner")}
                            </Text>

                        </TouchableOpacity>
                    </Pressable>
                )}
                onEndReached={() => {
                    if (LastPage === 0) return;
                    if (CurrentPage > LastPage) return;
                    if (!filteredData?.length) return;
                    if (IsLoading || FooterLoading) return;

                    FetchEventAllList(checked, false);
                }}
                onEndReachedThreshold={0.4}

                ListFooterComponent={FooterLoading && <View style={{ width: width - 20, justifyContent: 'center', alignItems: 'center', marginTop: 20 }}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    EventContainer: {

        gap: 15,
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: 10,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
        borderWidth: 0.2,
        borderColor: Colors.darktext,
        alignItems: 'flex-start',
        flexGrow: 0,
        marginHorizontal: 10,
        marginVertical: 5,
    },
    Text: {
        fontSize: 14,
        fontFamily: FONTS.LexendRegular,
        color: Colors.black,

    },

    ImageContainer: {
        width: '35%',
        aspectRatio: 1,
    },

    Image: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },

    ContainerDescription: {
        width: '60%',
        justifyContent: 'flex-start',
        flex: 1,
        // borderWidth:1
    },
    EmptyContainer: {
        width: "100%",
        height: heightPercentageToDP(50),
        justifyContent: 'center',
        alignItems: 'center'
    },
    EmptyText: {
        fontSize: 14,
        fontFamily: FONTS.LexendSemiBold,
        color: Colors.textgray
    },

    Date1: {
        fontFamily: FONTS.LexendSemiBold,
        color: Colors.white,
        fontSize: 12,
        backgroundColor: Colors.primary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginBottom: 5,
    },

    NewsTitle: {
        fontSize: 16,
        fontFamily: FONTS.LexendSemiBold,
        color: Colors.black,
        marginBottom: 5,
    },

    Description: {
        fontSize: 13,
        fontFamily: FONTS.LexendSemiBold,
        color: Colors.textgray,
        lineHeight: 18,
        marginBottom: 8,
        flexShrink: 1,
    },
    ContentStyle: {
        paddingBottom: 300
    },

    SimpleFlex: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 10
    },

    Button: {
        borderRadius: 6,
        alignSelf: 'flex-start',
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 3,
        // borderWidth: 1,
        // height: 25,
        paddingVertical: 5,
        paddingHorizontal: 10,
        backgroundColor: Colors.primary,

    },

    ButtonGradient: {
        //   paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 6,
        alignItems: 'center',
        //   height:20
        width: '100%',
        height: '100%',
    },
});