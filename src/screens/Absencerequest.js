import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  // SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import Header from "../components/header";
import { Images } from "../constants/images";
import { Colors } from "../constants/color";
import { FONTS } from "../constants/fontFamily";
import { RFValue } from "react-native-responsive-fontsize";
import Modal from "react-native-modal";
import { useTranslation } from "react-i18next";
import { getData } from "../utils/storeData";
import apiConstants from "../api/apiConstants";
import Loader from "../components/loading";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  heightPercentageToDP,
  heightPercentageToDP as hp,
  widthPercentageToDP,
} from "react-native-responsive-screen";
import ApiService from "../utils/Apiservice";
import { useFocusEffect } from "@react-navigation/native";
import BlueHeader from "../components/BlueHeader";
import Footer from "../components/Footer";
import Filtersortmodal from "../components/Filtersortmodal";
import SelectDropdown from "react-native-select-dropdown";
import DatePicker from "react-native-date-picker";
import { Calendar } from "react-native-calendars";
import Input from "../components/input";
import * as RNLocalize from "react-native-localize";
import { LocaleConfig } from "react-native-calendars";

// Configure Dutch locale



const Absencerequest = ({ navigation, route }) => {
  const { bgcolor, id, employee_name, relaties_id } = route.params;
  const { t } = useTranslation();
  const { height } = Dimensions.get("window");
  const [modalOptionsVisible, setModalOptionsVisible] = useState(false);
  const [show, setShow] = useState(false);
  const [absenceleave, setAbsenceLeave] = useState({});
  const [aditionalleave, setAditionalLeave] = useState({});
  const [getabsenceleaves, setgetabsenceleaves] = useState({});
  const [getswitchdates, setgetswitchdates] = useState({});
  const [loading, setLoading] = useState(false);
  const [modaldata, setModalData] = useState("");
  const [absencedetails, setAbsenceDetails] = useState([]);
  const [expandedItem, setExpandedItem] = useState(null);
  const [deletedata, setDeleteData] = useState([]);
  const [Editdata, setEditData] = useState([]);
  const [expandedItemId, setExpandedItemId] = useState(null); // Track currently expanded item
  const [expandedItemId1, setExpandedItemId1] = useState(null); // Track currently expanded item
  const [expandedItemId2, setExpandedItemId2] = useState(null); // Track currently expanded item
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [filteredTasklist, setFilteredTasklist] = useState([]);
  const [filterModalvisible, setFilterModalVisible] = useState(false);
  const [sortmodalVisible, setSortModalVisible] = useState(false);
  const [sortOrder, setSortOrder] = useState("desc");
  const [statusdata, setStatusData] = useState([]);
  const [selectedStatusIds, setSelectedStatusIds] = useState([]);
  const [leavemodalopen, setLeavemodalopen] = useState(false);
  const [selectedDates, setSelectedDates] = useState({});
  const [calenderdate, setCalenderDate] = useState([]);
  // console.log('adjsoxd-=-=-/////////' , selectedDates[calenderdate],calenderdate);
  const [opencalender, setOpenCalender] = useState(false);
  // const [calenderdate, setCalenderDate] = useState([]);
  const [dis, setDisc] = useState(null);
  const [diserror, setDisError] = useState("");
  const [employedata, setEmployeedata] = useState(null);
  const [logindata, setlogindata] = useState([]);
  const [timezone, setTimezone] = useState(RNLocalize.getTimeZone()); // Fetch the current timezone
  const [types, setTypes] = useState([]);
  const [selectedItem, setSelectedItem] = useState({});
  const [selectedItemstatus, setSelectedItemstatus] = useState({});
  const [selectedItemtype, setSelectedItemtype] = useState({});
  const [dateset, setDateset] = useState([]);
  const [approveddata, setApproveddata] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [cname, setCname] = useState("");
  const [defaultdate, setDefaultdate] = useState(false);
  const [selectedrelatiesId, setSelectedrelatiesId] = useState("");
  const [absenceEmployeeId, setAbsenceEmployeId] = useState("");
  const [absenceModalopen, setAbsencemodalopen] = useState(false);
  const [absencedate, setAbsenceDate] = useState(null);
  const [absenceEmployee, setAbsenceemployee] = useState({});
  const [Hours, setHours] = useState(null);
  const [Absencedis, setAbsenceDisc] = useState(null);
  const [Abdiserror, setADisError] = useState("");
  const [permission, setPermission] = useState(null);
  LocaleConfig.locales["nl"] = {
    monthNames: [
      "januari",
      "februari",
      "maart",
      "april",
      "mei",
      "juni",
      "juli",
      "augustus",
      "september",
      "oktober",
      "november",
      "december",
    ],
    monthNamesShort: [
      "jan.",
      "feb.",
      "mrt.",
      "apr.",
      "mei",
      "jun.",
      "jul.",
      "aug.",
      "sep.",
      "okt.",
      "nov.",
      "dec.",
    ],
    dayNames: [
      "zondag",
      "maandag",
      "dinsdag",
      "woensdag",
      "donderdag",
      "vrijdag",
      "zaterdag",
    ],
    dayNamesShort: ["zo", "ma", "di", "wo", "do", "vr", "za"],
    today: "Vandaag",
  };
  LocaleConfig.defaultLocale = "nl";
  useEffect(() => {
    fetchPermission();
  }, []);



  const fetchPermission = async () => {
    try {
      const getdata = await getData("USERDATA");
      if (
        !getdata ||
        !getdata.data ||
        !getdata.data.user ||
        !getdata.data.relaties
      ) {
        console.log("Missing required user data:", getdata);
        return;
      }

      const response = await ApiService(apiConstants.permission, {
        includeToken: true,
        customData: {
          relaties_id: getdata.data.relaties.id,
          user_id: getdata.data.user.id,
          role: getdata.data.user.role,
        },
      });

      if (response?.status && response?.data) {
        setPermission(response?.data);
        // Alert.alert("Success")
        // console.log("response.data Permission==>", response.data.home_timeline?.read);

      }
    } catch (error) {
      console.log("Error fetching permission:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const getdata = async () => {
      const logindataget = await getData("USERDATA");
      if (logindataget?.data?.user?.timezone) {
        setTimezone(logindataget.data.user.timezone);
      }
    };
    getdata();
  }, []);

  const formatDateToTimezone = (dateString, timezone) => {
    if (!dateString) return "";

    const date = new Date(dateString);

    const formattedDate = new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      year: "numeric",
      month: "short", // 'short' for abbreviated month name (e.g., Nov)
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false, // Use 24-hour format for time
    }).format(date);

    // The result should be in the format: "23 Nov 2024 18:20"
    return formattedDate.replace(",", ""); // Remove any commas if present
  };

  const toggleItem1 = (itemId) => {
    setExpandedItemId((prevId) => (prevId === itemId ? null : itemId)); // Toggle expansion for the selected item
  };

  const toggleItem2 = (itemId) => {
    setExpandedItemId1((prevId) => (prevId === itemId ? null : itemId)); // Toggle expansion for the selected item
  };

  const toggleItem3 = (itemId) => {
    setExpandedItemId2((prevId) => (prevId === itemId ? null : itemId)); // Toggle expansion for the selected item
  };

  const MODALDATA = [
    {
      id: 1,
      item_title: "Leave Request",
      item_image:
        "https://app.erpportaal.nl/public/media/app_images/connections.png",
      link_to: "leave_request",
    },
    {
      id: 2,
      item_title: "Absence Leave",
      item_image:
        "https://app.erpportaal.nl/public/media/app_images/workorder.png",
      link_to: "additional_leave",
    },
    {
      id: 1,
      item_title: "Switch Date",
      item_image:
        "https://app.erpportaal.nl/public/media/app_images/workorder.png",
      link_to: "switch_date",
    },
    {
      id: 1,
      item_title: "Additional Leave",
      item_image:
        "https://app.erpportaal.nl/public/media/app_images/workorder.png",
      link_to: "additional_days",
    },
  ];

  useFocusEffect(
    useCallback(() => {
      // Call Absenceleave API when Absencerequest screen is focused
      Absenceleave();
      Aditionalleave();
      getabsenceleavesData();
      getswitchdatesdata();
      setExpandedItem(null);
    }, [Absenceleave])
  );

  const Absenceleave = async () => {
    // setLoading(true);
    if (!refreshing) {
      setLoading(false);
      setRefreshing(true);
      setTimeout(() => {
        setRefreshing(false);
      }, 1000);
    } else {
      setLoading(true);
      setRefreshing(false);
    }
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.Absencerequest, {
        includeToken: true,
        customData: {
          relaties_id: relaties_id,
          role: getdata.data.user.role,
          user_id: getdata.data.user.id,
          contract_id: id,
        },
      });
      if (data.status) {
        setLoading(false);
        setAbsenceLeave(data.data);
        fetchPermission()
        // console.log(
        //   data.data,
        //   "ikdjcodishcoisdhjdiosjciosdkzjciosd==========="
        // );
      } else {
        setLoading(false);
        console.log("erroror", data);
      }
    } catch (err) {
      console.log("Error fetching connections:", err);
    }
  };

  const Aditionalleave = async () => {
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.getadditionalleave, {
        includeToken: true,
        customData: {
          relaties_id: getdata.data.relaties.id,
          role: getdata.data.user.role,
          user_id: getdata.data.user.id,
          contract_id: id,
        },
      });
      console.log(
        getdata.data.relaties.id,
        getdata.data.user.role,
        getdata.data.user.id
      );
      if (data.status) {
        setAditionalLeave(data.data);
      } else {
        console.log("False");
      }
    } catch (err) {
      console.log("Error fetching connections:", err);
    }
  };

  const getabsenceleavesData = async () => {
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.getabsenceleaves, {
        includeToken: true,
        customData: {
          relaties_id: getdata.data.relaties.id,
          role: getdata.data.user.role,
          user_id: getdata.data.user.id,
          contract_id: id,
        },
      });
      // console.log(
      //   getdata.data.relaties.id,
      //   getdata.data.user.role,
      //   data.data,
      //   getdata.data.user.id
      // );
      if (data.status) {
        setgetabsenceleaves(data.data);
      } else {
        console.log("False");
      }
    } catch (err) {
      console.log("Error fetching connections:", err);
    }
  };

  const getswitchdatesdata = async () => {
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.getswitchdates, {
        includeToken: true,
        customData: {
          relaties_id: getdata.data.relaties.id,
          role: getdata.data.user.role,
          user_id: getdata.data.user.id,
          contract_id: id,
        },
      });
      // console.log(
      //   getdata.data.relaties.id,
      //   getdata.data.user.role,
      //   data.data,
      //   getdata.data.user.id
      // );
      if (data.status) {
        setgetswitchdates(data.data);
      } else {
        console.log("False");
      }
    } catch (err) {
      console.log("Error fetching connections:", err);
    }
  };

  const Deletedata = async (id) => {
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.deleteleaveabsence, {
        includeToken: true,
        customData: {
          relaties_id: getdata.data.relaties.id,
          role: getdata.data.user.role,
          user_id: getdata.data.user.id,
          leave_id: id,
        },
      });
      // console.log(data.status, "ruhgvdel========");
      if (data.status) {
        setAbsenceLeave((prevData) =>
          prevData.filter((item) => item.id !== id)
        );
        // setDeleteData(data.data);
      } else {
        console.log("False");
        Alert.alert("Error", data.message);
      }
    } catch (err) {
      console.log("Error fetching connections:", err);
    }
  };

  const getdata = async () => {
    try {
      const data = await ApiService(apiConstants.getmodaldata, {
        includeToken: true,
      });
      if (data.status) {
        setModalData(data.data);
      } else {
        console.log("False connections");
      }
    } catch (err) {
      console.log("Error fetching connections:", err);
    }
  };

  useEffect(() => {
    Absenceleave();
    // Absencedetails();
    if (!defaultdate) {
      Employees();
      gettypes();
    }
    StusSearch();
    // StusSearch();
    getdata();
  }, [selectedItem]);

  const toggleItem = async (id) => {
    if (expandedItem === id) {
      console.log("--");
      // If the item is already expanded, collapse it
      setExpandedItem(null);
      // setAbsenceDetails([]); // Clear the details when collapsing
    } else {
      console.log("-- --");
      // If the item is not expanded, fetch details and expand it
      // await Absencedetails(id); // Fetch the details only when expanding
      setExpandedItem(id);
    }
  };

  const StusSearch = async () => {
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.getstatus, {
        includeToken: true,
        customData: {
          slug: "human_resource_view",
          relaties_id: getdata.data.relaties.id,
          role: getdata.data.user.role,
          user_id: getdata.data.user.id,
        },
      });
      // console.log(data, "suv==========");
      if (data.status) {
        setStatusData(data.data);
      } else {
        console.log("False connections");
      }
    } catch (err) {
      console.log("Error status :", err);
    }
  };

  const approvedrequest = async ({ id, status_id }) => {
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.approvedstatus, {
        includeToken: true,
        customData: {
          relaties_id: getdata.data.relaties.id,
          role: getdata.data.user.role,
          user_id: getdata.data.user.id,
          leave_id: id,
          status_id: status_id,
        },
      });
      // console.log(data, "suv==========");
      if (data.status) {
        setApproveddata(data.data.color_code);
        // console.log("ajhnbkajnckaju-=-=-=--=", data.data);
        Alert.alert(data.message);
        // Absenceleave();
      } else {
        console.log("False connections");
      }
    } catch (err) {
      console.log("Error approved api :", err);
    }
  };

  const renderItem = ({ item }) => {
    return (
      <View style={styles.box}>
        <View
          style={{
            backgroundColor: Colors.white, // Background color for clarity
          }}
        >
          {/* First Row: Day and Status */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              flex: 1,
            }}
          >
            {/* Day */}
            <TouchableOpacity onPress={() => toggleItem(item.id)}>
              <Text
                style={[
                  styles.day,
                  {
                    fontSize: 16,
                    flex: 5,
                  },
                ]}
              >
                {t(item?.employerscheduledata?.day) || "-"} (
                {item?.total_hours || "N/A"})
              </Text>
            </TouchableOpacity>

            {/* Status */}
            <View>
              <View style={styles.statusbg}>
                {item.leave_absence_store === 0 ? (
                  // Render when leave_absence_store is 0
                  <TouchableOpacity
                    onPress={() => {
                      checkconflictinghours(item.id),
                        update_leave_absence(item.id);
                    }}
                  >
                    <View
                      style={[
                        styles.statusbox,
                        {
                          backgroundColor: Colors.primary,
                          paddingVertical: 8,
                          paddingHorizontal: 16,
                          borderRadius: 4,
                          // flex:4
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusname,
                          {
                            color: Colors.white,
                            fontFamily: FONTS.LexendRegular,
                            fontSize: 14, // Ensure readability
                          },
                        ]}
                      >
                        {t("Submit")}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <>
                    {item?.status_permission?.read === true ? (
                      <SelectDropdown
                        data={statusdata}
                        onSelect={(selectedItem) => {
                          setSelectedItemstatus(selectedItem); // Update selected item state
                          approvedrequest({
                            id: item.id,
                            status_id: selectedItemstatus.id,
                          });
                          console.log(
                            item.id,
                            "jhsdcid=====-=-=-=-=-=-=-=-=-=-=-="
                          );
                        }}
                        renderButton={(selectedItem, isOpened) => {
                          return (
                            <View
                              style={[
                                styles.dropdownButtonStyle,
                                {
                                  // width: "70%",
                                  flex: 4,
                                  alignSelf: "flex-end",
                                  backgroundColor: selectedItem?.id
                                    ? selectedItem?.color // Apply selected color if IDs match
                                    : // approveddata ? approveddata :
                                    item?.status_data?.color ||
                                    Colors.primary, // Default color
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.dropdownButtonTxtStyle,
                                  {
                                    color: Colors.white,
                                  },
                                ]}
                              >
                                {selectedItem?.status_name
                                  ? selectedItem?.status_name // Display the selected item's status name
                                  : item?.status_data?.status_name // Fallback to initial status name
                                    ? item?.status_data?.status_name
                                    : "Contract"}
                              </Text>
                            </View>
                          );
                        }}
                        renderItem={(item, index, isSelected) => {
                          return (
                            <TouchableOpacity
                              style={[
                                styles.dropdownItemStyle,
                                {
                                  // backgroundColor: Colors.white,
                                  // backgroundColor:
                                  //   selectedItemstatus?.id === item?.id // Highlight selected item
                                  //     ? selectedItemstatus?.color ||
                                  //       Colors.lightGray // Use selected color
                                  //     : Colors.white, // Default color for unselected items
                                },
                              ]}
                              onPress={() => { }}
                            >
                              <Text
                                style={[
                                  styles.dropdownItemTxtStyle,
                                  {
                                    // Highlight text for selected item
                                    color: Colors.black, // Default text color
                                  },
                                ]}
                              >
                                {item.status_name}
                              </Text>
                            </TouchableOpacity>
                          );
                        }}
                        showsVerticalScrollIndicator={false}
                        dropdownStyle={styles.dropdownMenuStyle}
                      />
                    ) : (
                      <View
                        style={[
                          // styles.statusbox,
                          {
                            backgroundColor:
                              item?.status_data?.color || Colors.primary,
                            paddingVertical: 8,
                            paddingHorizontal: 16,
                            borderRadius: 4,
                            // width: "80%",
                            flex: 4,
                            alignSelf: "flex-end",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusname,
                            {
                              color: Colors.white,
                              fontFamily: FONTS.LexendRegular,
                              fontSize: 14, // Ensure readability
                              textAlign: "center",
                              flexWrap: "wrap",
                              width: "100%",
                            },
                          ]}
                        >
                          {t(item?.status_data?.status_name)}
                        </Text>
                      </View>
                    )}
                  </>
                )}
              </View>
            </View>
          </View>

          {/* Second Row: Date and Leave Type */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 8, // Add spacing between rows
            }}
          >
            {/* Date */}

            <Text
              style={[
                styles.date,
                {
                  fontSize: 14,
                  fontFamily: FONTS.LexendRegular,
                  color: Colors.textgray,
                },
              ]}
            >
              {item.date || "-"}
            </Text>

            {/* Leave Type */}
            <Text
              style={{
                fontSize: 14,
                fontFamily: FONTS.LexendRegular,
                color: Colors.black,
                textAlign: "right",
              }}
            >
              {t(item?.leave_type_data?.leave_type_name) || "No Leave Type"}
            </Text>
          </View>
        </View>

        {expandedItem === item.id && (
          // {expandedItem === item.id && absencedetails.length > 0 && (
          <View>
            {/* {absencedetails.map((detail, index) => ( */}
            <View>
              <View style={styles.line}></View>
              <View style={styles.renderdetails}>
                <View style={styles.contract}>
                  <Text style={[styles.daydetails, { paddingVertical: 8 }]}>
                    {item?.employementdata?.contract_name}
                  </Text>
                </View>
              </View>

              <View style={styles.line}></View>
              <View style={styles.data}>
                <Text style={[styles.daydetails, { width: "50%" }]}>
                  {t("Begin & Einde")}
                </Text>
                <Text
                  style={[styles.date, { width: "50%", textAlign: "right" }]}
                >
                  {item?.start_time && item?.end_time ? (
                    <>
                      {item?.start_time} - {item?.end_time}
                      {`\n`}
                      {item?.reason_field}
                    </>
                  ) : (
                    <>
                      {item?.employerscheduledata?.start_time} -{" "}
                      {item?.employerscheduledata?.end_time}
                      {`\n`}
                      {item.reason_field || "-"}
                    </>
                  )}
                </Text>
              </View>

              <View style={styles.line}></View>

              <View style={styles.data}>
                <Text style={[styles.daydetails, { width: "50%" }]}>
                  {t("Contract Leave")}
                </Text>
                <Text
                  style={[styles.date, { width: "50%", textAlign: "right" }]}
                >
                  {/* {item?.data?.leave_type_data?.leave_type_name}{" "} */}
                  {item?.leave_type_data?.leave_hour_system == 1 ? "Yes" : "No"}
                </Text>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "flex-end",
                  // alignItems: "center",
                  marginTop: 15,
                }}
              >
                {item?.permissions?.permission_edit === true && (
                  <>
                    {/* Edit Button */}
                    <TouchableOpacity
                      style={{ marginHorizontal: 10, marginVertical: 5 }} // Add spacing between the icons
                      onPress={() =>
                        navigation.navigate("Leaverequest", {
                          leave_id: item.id,
                          type: "edit",
                          bgcolor: bgcolor,
                          item: item,
                        })
                      }
                    >
                      <Image
                        source={Images.edit}
                        style={{ height: 20, width: 20 }}
                        tintColor={Colors.primary}
                      />
                    </TouchableOpacity>
                  </>
                )}
                {item?.permissions?.permission_delete == true && (
                  <>
                    {/* Delete Button */}
                    <TouchableOpacity
                      style={{ marginLeft: 10, marginVertical: 5 }}
                      onPress={() => Deletedata(item.id)}
                    >
                      <Image
                        source={Images.delete}
                        style={{ height: 20, width: 20 }}
                      />
                    </TouchableOpacity>
                  </>
                )}
              </View>
              {item?.leave_log !== null && (
                <Text
                  style={{
                    textAlign: "right",
                    fontFamily: FONTS.LexendRegular,
                    color: Colors.textgray,
                  }}
                >
                  {/* {item?.data?.leave_log?.created_at} */}
                  Log :{" "}
                  {formatDateToTimezone(item?.leave_log?.created_at, timezone)}
                  {`\n`}
                  {item?.leave_log?.user_name?.username}
                </Text>
              )}
            </View>
            {/* ))} */}
          </View>
        )}
      </View>
    );
  };

  const renderItem1 = ({ item }) => {
    const isExpanded = expandedItemId === item.id;
    return (
      <>
        <View style={styles.box}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <TouchableOpacity
              // onPress={() => {
              //   Absencedetails(item.id), toggleItem(item.id);
              // }}
              onPress={() => toggleItem1(item.id)}
              style={{ flex: 1 }} // Makes this TouchableOpacity take available space
            >
              <View style={styles.renderitemmain}>
                <Text style={[styles.day, { width: "80%" }]}>
                  {item?.employementdata?.contract_name || "-"}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={{ marginLeft: 10 }}>
              <View style={styles.statusbg}>
                <View
                  style={[
                    styles.statusbox,
                    {
                      backgroundColor: item.status_data.color,
                      paddingVertical: 8, // Optional: Add padding for better touch area
                      paddingHorizontal: 16, // Optional: Adjust horizontal padding
                      borderRadius: 4, // Optional: Rounded corners
                    },
                  ]}
                >
                  <Text style={styles.statusname}>
                    {item.status_data.status_name}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
          {isExpanded && (
            <View>
              <View>
                <View style={styles.line}></View>
                <View style={styles.data}>
                  <Text style={[styles.daydetails, { width: "50%" }]}>
                    {t("Hour")}
                  </Text>
                  <Text
                    style={[styles.date, { width: "50%", textAlign: "right" }]}
                  >
                    {item.leave_type_data.leave_hour || "--"}
                  </Text>
                </View>
                <View style={styles.line}></View>
                <View style={styles.data}>
                  <Text style={[styles.daydetails, { width: "50%" }]}>
                    {t("Type")}
                  </Text>
                  <Text
                    style={[styles.date, { width: "50%", textAlign: "right" }]}
                  >
                    {item?.leave_type_data?.leave_type_name}{" "}
                    {item?.leave_type_data?.leave_hour_system == 1
                      ? "Contract Leave : Yes"
                      : "Contract Leave : No"}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "flex-end",
                    // alignItems: "center",
                    marginTop: 15,
                  }}
                >
                  {item?.permission?.edit == true ? (
                    <TouchableOpacity
                      style={{ marginHorizontal: 10 }} // Add spacing between the icons
                      onPress={() =>
                        navigation.navigate("Leaverequest", {
                          leave_id: item.id,
                          type: "edit",
                        })
                      } // Assuming edit function should be called
                    >
                      <Image
                        source={Images.edit}
                        style={{ height: 20, width: 20 }}
                        tintColor={Colors.primary}
                      />
                    </TouchableOpacity>
                  ) : (
                    ""
                  )}
                  {item?.permission?.delete == true && (
                    <TouchableOpacity
                      style={{ marginLeft: 10 }}
                      onPress={() => Deletedata(item.id)}
                    >
                      <Image
                        source={Images.delete}
                        style={{ height: 20, width: 20 }}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          )}
        </View>
      </>
    );
  };

  const renderItem2 = ({ item }) => {
    const isExpanded = expandedItemId1 === item.id;
    return (
      <>
        <View style={styles.box}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <TouchableOpacity
              // onPress={() => {
              //   Absencedetails(item.id), toggleItem(item.id);
              // }}
              onPress={() => toggleItem2(item.id)}
              style={{ flex: 1 }} // Makes this TouchableOpacity take available space
            >
              <View
                style={[
                  styles.renderitemmain,
                  { justifyContent: "space-between", flexDirection: "row" },
                ]}
              >
                <Text style={[styles.day, { width: "80%" }]}>
                  {t(item?.employerscheduledata?.day) || "-"}
                </Text>
                <Text
                  style={[styles.day, { width: "80%", color: Colors.textgray }]}
                >
                  {t(item?.date) || "-"}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={{ marginLeft: 10 }}></TouchableOpacity>
          </View>
          {isExpanded && (
            <View>
              <View>
                <View style={styles.line}></View>
                <View style={styles.data}>
                  <Text style={[styles.daydetails, { width: "50%" }]}>
                    {t("Begin & Einde")}
                  </Text>
                  <Text
                    style={[styles.date, { width: "50%", textAlign: "right" }]}
                  >
                    {item?.start_time && item?.end_time ? (
                      <>
                        {item?.start_time} - {item?.end_time} (
                        {item?.total_hours}) {item?.reason_field}
                      </>
                    ) : (
                      <>
                        {item?.employerscheduledata?.start_time} -{" "}
                        {item?.employerscheduledata?.end_time} (
                        {item?.total_hours}) {item.data?.reason_field}
                      </>
                    )}
                  </Text>
                </View>
                <View style={styles.line}></View>
                <View style={styles.data}>
                  <Text style={[styles.daydetails, { width: "50%" }]}>
                    {t("Reason")}
                  </Text>
                  <Text
                    style={[styles.date, { width: "50%", textAlign: "right" }]}
                  >
                    {item?.reason_field || "--"}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "flex-end",
                    // alignItems: "center",
                    marginTop: 15,
                  }}
                >
                  {item?.permission?.edit == true ? (
                    <TouchableOpacity
                      style={{ marginHorizontal: 10 }} // Add spacing between the icons
                      onPress={() =>
                        navigation.navigate("Leaverequest", {
                          leave_id: item.id,
                          type: "edit",
                        })
                      } // Assuming edit function should be called
                    >
                      <Image
                        source={Images.edit}
                        style={{ height: 20, width: 20 }}
                        tintColor={Colors.primary}
                      />
                    </TouchableOpacity>
                  ) : (
                    ""
                  )}
                  {item?.permission?.delete == true && (
                    <TouchableOpacity
                      style={{ marginLeft: 10 }}
                      onPress={() => Deletedata(item.id)}
                    >
                      <Image
                        source={Images.delete}
                        style={{ height: 20, width: 20 }}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          )}
        </View>
      </>
    );
  };

  const renderItem3 = ({ item }) => {
    const isExpanded = expandedItemId2 === item.id;
    return (
      <>
        {item?.employee_data && (
          <View style={styles.box}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <TouchableOpacity
                // onPress={() => {
                //   Absencedetails(item.id), toggleItem(item.id);
                // }}
                onPress={() => toggleItem3(item.id)}
                style={{ flex: 1 }} // Makes this TouchableOpacity take available space
              >
                <View style={styles.renderitemmain}>
                  <Text style={[styles.day, { width: "80%" }]}>
                    {t(item?.employee_data?.display_name) || "-"}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={{ marginLeft: 10 }}>
                <View style={styles.statusbg}>
                  <View
                    style={[
                      styles.statusbox,
                      {
                        backgroundColor: item.status_data.color,
                        paddingVertical: 8, // Optional: Add padding for better touch area
                        paddingHorizontal: 16, // Optional: Adjust horizontal padding
                        borderRadius: 4, // Optional: Rounded corners
                      },
                    ]}
                  >
                    <Text style={styles.statusname}>
                      {item.status_data.status_name}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
            {isExpanded && (
              <View>
                <View style={styles.line}></View>
                <View style={styles.renderdetails}>
                  <View style={styles.contract}>
                    <Text style={[styles.daydetails, { paddingVertical: 8 }]}>
                      {item?.branch_calendar?.cal_name || "--"}
                    </Text>
                  </View>
                  <View style={styles.statusbg}>
                    {item.status_data && (
                      <View
                        style={[
                          styles.statusbox,
                          {
                            backgroundColor: Colors.primarylite,
                          },
                        ]}
                      >
                        <Text
                          style={[styles.statusname, { color: Colors.primary }]}
                        >
                          {item?.class_data?.name || "--"}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <View>
                  <View style={styles.line}></View>
                  <View style={styles.data}>
                    <Text style={[styles.daydetails, { width: "50%" }]}>
                      {t("From & To")}
                    </Text>
                    <Text
                      style={[
                        styles.date,
                        { width: "50%", textAlign: "right" },
                      ]}
                    >
                      {item.date} {item.new_date}
                    </Text>
                  </View>
                  <View style={styles.line}></View>
                  <View style={styles.data}>
                    <Text style={[styles.daydetails, { width: "50%" }]}>
                      {t("Description")}
                    </Text>
                    <Text
                      style={[
                        styles.date,
                        { width: "50%", textAlign: "right" },
                      ]}
                    >
                      {item.short_description}
                    </Text>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "flex-end",
                      // alignItems: "center",
                      marginTop: 15,
                    }}
                  >
                    {item?.permission?.edit == true ? (
                      <TouchableOpacity
                        style={{ marginHorizontal: 10 }} // Add spacing between the icons
                        onPress={() =>
                          navigation.navigate("Leaverequest", {
                            leave_id: item.id,
                            type: "edit",
                          })
                        } // Assuming edit function should be called
                      >
                        <Image
                          source={Images.edit}
                          style={{ height: 20, width: 20 }}
                          tintColor={Colors.primary}
                        />
                      </TouchableOpacity>
                    ) : (
                      ""
                    )}
                    {item?.permission?.delete == true && (
                      <TouchableOpacity
                        style={{ marginLeft: 10 }}
                        onPress={() => Deletedata(item.id)}
                      >
                        <Image
                          source={Images.delete}
                          style={{ height: 20, width: 20 }}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            )}
          </View>
        )}
      </>
    );
  };

  const checkconflictinghours = async (id) => {
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.check_conflicting_hours, {
        includeToken: true,
        customData: {
          user_id: getdata.data.user.id,
          leave_id: id,
          relaties_id: getdata.data.relaties.id,
          role: getdata.data.user.role,
        },
      });
      // console.log(data.status, "ruhgvdel========");
      if (data.status) {
        update_leave_absence();
        console.log("dfhnviudj====", data.status);
      } else {
        console.log("False");
        Alert.alert("Error", data.message);
      }
    } catch (err) {
      console.log("Error fetching connections:", err);
    }
  };

  const update_leave_absence = async (id) => {
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.update_leave_absence, {
        includeToken: true,
        customData: {
          user_id: getdata.data.user.id,
          leave_id: id,
          relaties_id: getdata.data.relaties.id,
          role: getdata.data.user.role,
        },
      });
      // console.log(data.status, "ruhgvdel========");
      if (data.status) {
        Absenceleave();
        console.log("dfhnviudj====111111", data.status);
      } else {
        console.log("False");
        Alert.alert("Error", data.message);
      }
    } catch (err) {
      console.log("Error fetching connections:", err);
    }
  };

  const Employees = async () => {
    setLoading(true);
    try {
      const getdata = await getData("USERDATA");

      const data = await ApiService(apiConstants.employee, {
        includeToken: true,
        customData: {
          relaties_id: getdata.data.relaties.id,
          role: getdata.data.user.role,
          user_id: getdata.data.user.id,
          // ...(type === "leaverequest" && { soort_relatie: "kind" }),
        },
      });
      if (data.status) {
        setLoading(false);

        const formattedData = data.data.map((item) => ({
          ...item.contract,
          display_name: item.display_name,
          leave_details: item.leave_details,
          created_at: item.contract.created_at,
          // status_id: item.contract_status,
        }));
        setEmployeedata(formattedData);
        // console.log("jasxaisikialjadiojdiajadouhjaud", formattedData);

        const filteredData = data.data.filter((item) => {
          // console.log("Relaties ID in item:", item.contract.relaties_id);
          // console.log("Relaties ID from USERDATA:", getdata.data.relaties.id);
          // console.log("Status Name:", item.contract.status_name);
          return (
            // item.contract.relaties_id === getdata.data.relaties.id &&
            // item.contract.status_name === "Active"
            id === item.contract.id
          );
        });
        console.log("Filtered Data:", filteredData);
        if (filteredData.length > 0) {
          const dropdownOptions = filteredData.map((item) => ({
            label: item.contract.contract_name,
            value: item.contract.id,
            relaties_id: item.contract.relaties_id,
            employer_id: item.contract.employer_id,
          }));
          console.log("ddropdownOptions[0].value", dropdownOptions[0].value);
          // console.log('');
          setCname(dropdownOptions[0].label); // Set the label for cname
          setSelectedrelatiesId(dropdownOptions[0]?.relaties_id);
          setAbsenceEmployeId(dropdownOptions[0]?.employer_id);
          console.log("selectedidddddd-=-=-=-", dropdownOptions[0]);
          setSelectedItem(dropdownOptions[0].value);
          Dateset(dropdownOptions[0].value); // Set the value for Dateset
        } else {
          console.log("No active contracts found.");
        }
      } else {
        setLoading(false);
        console.log("False connections");
      }
    } catch (err) {
      console.log("Error fetching connections:", err);
    }
  };

  const gettypes = async (id) => {
    console.log("hdaiuhs=====types log ", id);
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.getleavetypes, {
        includeToken: true,
        customData: {
          relaties_id: getdata.data.relaties.id,
          role: getdata.data.user.role,
          user_id: getdata.data.user.id,
          contract_id: id ? id : selectedItem, // Pass the selected contract ID here
        },
      });
      if (data.status) {
        setTypes(data.data);
        // console.log(data.data, "jshrfuhrsf=======");
      } else {
        console.log("False connections");
      }
    } catch (err) {
      console.log("Error types :", err);
    }
  };

  const onDayPress = (day) => {
    console.log("jdhcdios-=-===-==--=-=-=", day);
    console.log("jdhcdios-=-===-==--=-=-=", selectedDates);
    const selectedDay = day.dateString;

    // Prevent selection of dates not in selectedDates
    if (!selectedDates[selectedDay]?.enabled) {
      return;
    }

    setSelectedDates((prevDates) => {
      const isSelected = !prevDates[selectedDay]?.selected;

      // Update `calenderdate` to reflect the newly selected/deselected dates
      const updatedCalenderDates = isSelected
        ? [...calenderdate, selectedDay] // Add date if selected
        : calenderdate.filter((date) => date !== selectedDay); // Remove date if deselected

      setCalenderDate(updatedCalenderDates);
      const scheduleId = selectedDates[selectedDay]?.schedule_id || null;
      const totalhours = selectedDates[selectedDay]?.total_hours || null;
      console.log("jdhcdios", totalhours);
      return {
        ...prevDates,
        [selectedDay]: {
          ...prevDates[selectedDay],
          selected: isSelected,
          marked: true, // Always keep the dot visible
          dotColor: isSelected ? Colors.white : Colors.primary, // White for selected, primary for others
          textColor: isSelected ? Colors.white : Colors.primary, // Adjust text color
          selectedColor: isSelected ? Colors.primary : Colors.primary, // Background color for selected
          schedule_id: scheduleId, // Store schedule_id
          total_hours: totalhours,
        },
      };
    });
  };

  const absencedatepress = (day) => {
    const selectedDay = day.dateString;

    // Prevent selecting a disabled date
    if (!selectedDates[selectedDay]?.enabled) {
      return;
    }

    // Keep dots for all previously selectable dates
    const updatedMarkedDates = { ...selectedDates };

    // Remove previous selection (but keep dots)
    Object.keys(updatedMarkedDates).forEach((date) => {
      if (updatedMarkedDates[date].selected) {
        updatedMarkedDates[date] = {
          ...updatedMarkedDates[date],
          selected: false,
        };
      }
    });

    // Ensure `schedule_id` is assigned correctly
    const scheduleId = selectedDates[selectedDay]?.schedule_id || null;
    // const totalhours = selectedDates[selectedDay]?.total_hours || null;
    // console.log('jdhcdios' , totalhours);

    // Set new selection and maintain dots for all other dates
    updatedMarkedDates[selectedDay] = {
      ...updatedMarkedDates[selectedDay], // Keep existing properties
      selected: true, // Only the latest selection is highlighted
      marked: true,
      dotColor: Colors.primary, // Dot remains visible
      textColor: Colors.white, // Change text color for selection
      selectedColor: Colors.primary, // Background color for selected
      schedule_id: scheduleId, // Store schedule_id
      // total_hours: totalhours, // Store schedule_id
    };

    console.log("Selected Date:", selectedDay, "Schedule ID:", scheduleId);

    setAbsenceDate(selectedDay); // Store only the selected date
    setSelectedDates(updatedMarkedDates); // Keep dots and update selection
  };

  const Dateset = async (id) => {
    console.log("fdjviopdfjvdfopivjdf-=-=", id);
    setLoading(true);
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.get_time_line_by_employee_id, {
        includeToken: true,
        customData: {
          contract_id: id,
          relaties_id: getdata.data.relaties.id,
          role: getdata.data.user.role,
          user_id: getdata.data.user.id,
        },
      });

      if (data.status) {
        const fetchedDates = data.data;
        const newSelectedDates = {};

        // Populate selectedDates with fetched data
        fetchedDates.forEach((item) => {
          newSelectedDates[item.date] = {
            selected: false, // Initially not selected
            marked: true, // Show a dot marking
            enabled: true, // Enable only these dates
            dotColor: Colors.primary,
            schedule_id: item.schedule_id, // Store schedule_id
            selectedColor: Colors.primary,
            textColor: Colors.primary,
            total_hours: item.total_hours,
          };
        });

        setSelectedDates(newSelectedDates);
        // console.log('dfuhjuvdfiku' , newSelectedDates);
      } else {
        console.log("No data found");
      }
    } catch (err) {
      console.log("Error fetching dates:", err);
    } finally {
      setLoading(false);
    }
  };

  const CreateLeave = async () => {
    try {
      const getdata = await getData("USERDATA");

      // Prepare selected dates and schedule IDs
      const datesToSend = Object.keys(selectedDates)
        .filter((key) => selectedDates[key]?.selected)
        .map((key) => ({
          date: key,
          schedule_id: selectedDates[key]?.schedule_id, // Retrieve schedule_id
          total_hours: selectedDates[key]?.total_hours, // Retrieve schedule_id
        }));

      const requestdataa = {
        relaties_id: selectedItem.relaties_id
          ? selectedItem.relaties_id
          : selectedrelatiesId,
        role: getdata.data.user.role,
        user_id: getdata.data.user.id,
        contract_id: selectedItem?.id ? selectedItem?.id : selectedItem,
        leave_type: selectedItemtype?.id ? selectedItemtype?.id : "",
        date: datesToSend.map((d) => d.date).join(",") || "",
        schedule_id: datesToSend.map((d) => d.schedule_id).join(",") || "", // Send schedule IDs as a string
        reason_field: dis,
        total_hours: datesToSend.map((d) => d.total_hours).join(","),
      };
      // console.log('datadata==',requestdataa);
      const data = await ApiService(apiConstants.storeleaveabsence, {
        includeToken: true,
        customData: requestdataa,
      });
      // console.log('datadata', data,requestdataa);
      if (data.status) {
        Absenceleave(); // Refresh leave data
        console.log(data, "Leave created successfully");
      } else {
        Alert.alert("Errors", data.message);
        console.log("API Error:", data.message);
      }
    } catch (err) {
      console.log("Error during leave creation:", err);
    }
  };

  const Absenceleavecreate = async () => {
    try {
      const getdata = await getData("USERDATA");

      const datesToSend = Object.keys(selectedDates)
        .filter((key) => selectedDates[key]?.selected)
        .map((key) => ({
          date: key,
          schedule_id: selectedDates[key]?.schedule_id || null, // Retrieve schedule_id
        }));

      const requestdataa = {
        relaties_id: selectedItem.relaties_id
          ? selectedItem.relaties_id
          : selectedrelatiesId,
        user_id: getdata.data.user.id,
        role: getdata.data.user.role,
        contract_id: selectedItem?.id ? selectedItem?.id : selectedItem,
        date: datesToSend.map((d) => d.date).join(",") || "",
        total_hours: Hours,
        schedule_id: datesToSend.map((d) => d.schedule_id).join(",") || "", // Send schedule IDs as a string
        absence_reason: Absencedis,
        absence_employer_id: absenceEmployee.relaties_id
          ? absenceEmployee.relaties_id
          : absenceEmployeeId,
      };

      const data = await ApiService(apiConstants.store_absence, {
        includeToken: true,
        customData: requestdataa,
      });

      if (data.status) {
        Absenceleave();
        console.log(data, "Leave created successfully");
      } else {
        Alert.alert("Errors", data.message);
        console.log("API Error:", data.message);
      }
    } catch (err) {
      console.log("Error during leave creation:", err);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    Absenceleave();
    Aditionalleave();
    getabsenceleavesData();
    getswitchdatesdata();
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };
  // console.log("selectde dateeee", calenderdate);
  const handleLeavePress = () => {
    setLeavemodalopen(true);
    setCalenderDate([]);
    setDisc("");
  };

  const handleAbsencePress = () => {
    setAbsencemodalopen(true);
    setAbsenceDate([]);
    setHours("");
    setAbsenceDisc("");
  };
  useEffect(() => {
    id;
  });

  const Button = ({ onPress, title }) => (
    <TouchableOpacity onPress={onPress} style={styles.button}>
      <Text style={styles.startbuttonText}>{t(title)}</Text>
    </TouchableOpacity>
  );
  return (
    // <SafeAreaView style={[styles.container, { backgroundColor: bgcolor }]}>
    <>
      <StatusBar backgroundColor={bgcolor} barStyle={"light-content"} />
      {loading && <Loader color={Colors.primary} />}

      <BlueHeader
        bgcolor={bgcolor}
        title={t("AbsenceRequest")}
        Righticon={Images.refresh}
        onPressRight={Absenceleave}
        SearchBarInput
      // value={searchQuery}
      // onChangeText={setSearchQuery}
      // arrowOnPress={() => setSortModalVisible(!sortmodalVisible)}
      // onPressfilter={() => setFilterModalVisible(true)}
      />

      <ScrollView
        style={{
          backgroundColor: Colors.litegray1,
          height: "100%",
          marginTop: heightPercentageToDP(-1),
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary, "#F048C6"]}
            tintColor={Colors.primary}
          />
        }
      >
        <Text
          style={[
            styles.day,
            { fontSize: RFValue(16), marginHorizontal: 20, marginTop: 10 },
          ]}
        >
          {employee_name}
          {/* {permission?.leave?.create}
          { permission?.absence?.create} */}
        </Text>

        <View style={styles.btncontainer}>
          {
            permission?.leave?.create == 1 && <Button onPress={handleLeavePress} title="+ Leave" />
          }
          {
            permission?.absence?.create == 1 && <Button onPress={handleAbsencePress} title="+ Absence" />
          }

        </View>

        {/* <ScrollView> */}
        <View style={styles.top}>
          <FlatList
            bounces={false}
            data={absenceleave}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => {
              return <Text style={styles.emptyText}>{t("No Request Found.")}</Text>;
            }}
            ListHeaderComponent={() => (
              <View style={styles.tview}>
                <Text
                  style={{
                    fontSize: 17,
                    fontFamily: FONTS.LexendMedium,
                    color: Colors.black,
                  }}
                >
                  {t("Leave Requests")}
                </Text>
              </View>
            )}
          />
        </View>

        <View style={styles.top}>
          <FlatList
            bounces={false}
            data={aditionalleave}
            renderItem={renderItem1}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => {
              return <Text style={styles.emptyText}>{t('No Request Found.')}</Text>;
            }}
            ListHeaderComponent={() => (
              <View style={styles.tview}>
                <Text
                  style={{
                    fontSize: 17,
                    fontFamily: FONTS.LexendMedium,
                    color: Colors.black,
                  }}
                >
                  {t("Additional Leaves")}
                </Text>
              </View>
            )}
          />
        </View>

        <View style={styles.top}>
          <FlatList
            bounces={false}
            data={getabsenceleaves}
            renderItem={renderItem2}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => {
              return <Text style={styles.emptyText}>{t("No Request Found.")}</Text>;
            }}
            ListHeaderComponent={() => (
              <View style={styles.tview}>
                <Text
                  style={{
                    fontSize: 17,
                    fontFamily: FONTS.LexendMedium,
                    color: Colors.black,
                  }}
                >
                  {t("Absence Leaves")}
                </Text>
              </View>
            )}
          />
        </View>

        <View style={[styles.top, { marginBottom: 20 }]}>
          <FlatList
            bounces={false}
            data={getswitchdates}
            renderItem={renderItem3}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => {
              return <Text style={styles.emptyText}>{t("No Request Found.")}</Text>;
            }}
            ListHeaderComponent={() => (
              <View style={styles.tview}>
                <Text
                  style={{
                    fontSize: 17,
                    fontFamily: FONTS.LexendMedium,
                    color: Colors.black,
                  }}
                >
                  {t("Switch dates")}
                </Text>
              </View>
            )}
          />
        </View>

        <Modal
          animationIn={"fadeIn"}
          transparent={true}
          visible={modalOptionsVisible}
          onRequestClose={() => {
            setModalOptionsVisible(false);
          }}
          onSwipeComplete={() => {
            setModalOptionsVisible(false);
          }}
          onBackdropPress={() => {
            setModalOptionsVisible(false);
          }}
          onBackButtonPress={() => {
            setModalOptionsVisible(false);
          }}
        >
          <View
            style={[
              styles.modalOptionsContainer,
              {
                top:
                  Platform.OS === "ios"
                    ? height > 800
                      ? 90 // iOS devices with large height
                      : 50 // iOS devices with small height
                    : Platform.OS === "android"
                      ? height > 800
                        ? 40 // Android devices with large height
                        : 30 // Android devices with small height
                      : 50, // Default fallback (if neither iOS nor Android)
              },
            ]}
          >
            <FlatList
              data={modaldata}
              // data={MODALDATA}
              renderItem={({ item }) => {
                const handlePress = async () => {
                  if (item.link_to === "leave_request") {
                    // navigation.navigate("CreateLeaverequest");
                    navigation.navigate("Leaverequest", {
                      leave_id: 18,
                      type: "create",
                    });
                  } else if (item.link_to === "switch_date") {
                    navigation.navigate("Switchdate");
                  } else if (item.link_to === "additional_leave") {
                    navigation.navigate("Additionalleave");
                  } else if (item.link_to === "additional_days") {
                    navigation.navigate("Calendercomponent");
                  }
                };
                return (
                  <TouchableOpacity
                    style={styles.option}
                    onPress={() => {
                      handlePress();
                      setModalOptionsVisible(false);
                    }}
                  >
                    <Image
                      source={{ uri: item.item_image }}
                      tintColor={Colors.primary}
                      style={styles.modalimages}
                    />
                    <Text style={styles.modalitems}>{t(item.item_title)}</Text>
                  </TouchableOpacity>
                );
              }}
              keyExtractor={(item) => item.id.toString()}
            />
          </View>
        </Modal>

        {/* </ScrollView> */}
      </ScrollView>
      {/* <Filtersortmodal
        sortModalVisible={sortmodalVisible}
        setSortModalVisible={setSortModalVisible}
        handleSortPress={arrowOnPress}
        filterModalVisible={filterModalvisible}
        setFilterModalVisible={setFilterModalVisible}
        handleCheckboxChange={handleCheckboxChange}
        applyFilters={applyFilters}
        statusData={statusdata}
        selectedStatusIds={selectedStatusIds}
        modalheight={"90%"}
        data={[
          { id: 1, title: "Name" },
          { id: 2, title: "Status" },
        ]}
      /> */}

      {/* </View> */}
      <Modal
        onBackdropPress={() => {
          setLeavemodalopen(false);
        }}
        onBackButtonPress={() => {
          setLeavemodalopen(false);
        }}
        style={styles.mview}
        visible={leavemodalopen}
      >
        <View style={styles.mcontainer}>
          <Text
            style={[
              styles.logout,
              {
                fontSize: 20,
                marginVertical: 10,
                fontFamily: FONTS.LexendSemiBold,
                color: Colors.black,
              },
            ]}
          >
            {t("Leave Request")}
          </Text>
          <Text style={[styles.day, { marginTop: 5 }]}>
            {t("Contract")}
            <Text style={{ color: Colors.red }}>*</Text>
          </Text>
          <SelectDropdown
            data={employedata}
            onSelect={(selectedItem) => {
              gettypes(selectedItem.id);
              setDefaultdate(true);
              Dateset(selectedItem.id);
              setSelectedItem(selectedItem);

              // setSelectedrelatiesId(selectedItem.relaties_id);
              console.log("selecteddddddddddd-=-==-=", selectedItem.id);
            }}
            renderButton={(item) => {
              return (
                <View
                  style={[
                    styles.dropdownButtonStyle,
                    // !isLanguageValid && styles.invalidInput,
                  ]}
                >
                  <Text style={[styles.dropdownButtonTxtStyle]}>
                    {/* {selectedItem
                      ? selectedItem
                      : t("Select Employe")} */}
                    {item?.contract_name
                      ? item?.contract_name
                      : cname || t("Select Contract")}
                  </Text>
                  <Image
                    source={Images.down}
                    style={{
                      height: 20,
                      width: 20,
                      tintColor: Colors.black,
                    }}
                  />
                </View>
              );
            }}
            renderItem={(item, index, isSelected) => {
              return (
                <View
                  style={[
                    styles.dropdownItemStyle,
                    isSelected && { backgroundColor: Colors.white },
                  ]}
                >
                  <Text style={styles.dropdownItemTxtStyle}>
                    {t(item.contract_name)}
                  </Text>
                </View>
              );
            }}
            showsVerticalScrollIndicator={false}
            dropdownStyle={styles.dropdownMenuStyle}
            search
            searchInputStyle={styles.dropdownsearchstyle}
            searchInputTxtStyle={{
              color: Colors.black,
              fontFamily: FONTS.LexendMedium,
            }}
          />
          <Text style={[styles.day, { marginTop: 5 }]}>{t("Type")}</Text>
          <SelectDropdown
            data={types}
            // disabled={!selectedItem?.id ? selectedItem?.id : selectedItem}
            onSelect={(item) => setSelectedItemtype(item)}
            renderButton={(selectedItem1) => {
              return (
                <View
                  style={[
                    styles.dropdownButtonStyle,
                    // !isLanguageValid && styles.invalidInput,
                  ]}
                >
                  <Text style={[styles.dropdownButtonTxtStyle]}>
                    {selectedItem1
                      ? selectedItem1.leave_type_name
                      : t("Select Type")}
                  </Text>
                  <Image
                    source={Images.down}
                    style={{
                      height: 20,
                      width: 20,
                      tintColor: Colors.black,
                    }}
                  />
                </View>
              );
            }}
            renderItem={(item, index, isSelected) => {
              return (
                <View
                  style={[
                    styles.dropdownItemStyle,
                    isSelected && { backgroundColor: Colors.white },
                  ]}
                >
                  <Text style={styles.dropdownItemTxtStyle}>
                    {t(item.leave_type_name)}
                  </Text>
                </View>
              );
            }}
            showsVerticalScrollIndicator={false}
            dropdownStyle={styles.dropdownMenuStyle}
            search
            searchInputStyle={styles.dropdownsearchstyle}
            searchInputTxtStyle={{
              color: Colors.black,
              fontFamily: FONTS.LexendMedium,
            }}
          />
          <Text style={[styles.day, { marginTop: 5 }]}>
            {t("Date")}
            <Text style={{ color: Colors.red }}>*</Text>
          </Text>

          <View style={styles.dateInput}>
            <ScrollView
              vertical
              style={{ maxWidth: "80%", maxHeight: "80%" }}
              showsHorizontalScrollIndicator={false}
            >
              <Text style={styles.dateText}>
                {Array.isArray(calenderdate) && calenderdate.length > 0
                  ? calenderdate
                    .map((date) =>
                      new Date(date).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short", // "Feb" instead of "02"
                        year: "numeric",
                      })
                    )
                    .join(" , ")
                  : t("Select Datum")}

                {/* {Array.isArray(calenderdate) && calenderdate.length > 0
                  ? calenderdate.join(" , ")
                  : "Select Datum"} */}
                {/* {calenderdate ? calenderdate : "Select"} */}
              </Text>
            </ScrollView>
            <TouchableOpacity
              style={{
                backgroundColor: Colors.primary,
                padding: 7,
                borderRadius: 5,
              }}
              onPress={() => setOpenCalender(true)}
            >
              <Image
                source={Images.date}
                style={{ tintColor: Colors.white, height: 20, width: 20 }}
              />
            </TouchableOpacity>
          </View>

          <Modal
            isVisible={opencalender}
            backdropOpacity={0.5}
            animationType="slide"
            onBackdropPress={() => setOpenCalender(false)}
          >
            <View style={styles.modalContent}>
              <Calendar
                onDayPress={onDayPress}
                markedDates={selectedDates}
                markingType={"custom"} // Adjusted marking type
                theme={{
                  todayTextColor: Colors.primary,
                  textSectionTitleColor: Colors.black,
                  selectedDayBackgroundColor: Colors.primary,
                  selectedDayTextColor: Colors.white,
                  dayTextColor: Colors.black,
                  textDisabledColor: Colors.litegray,
                  monthTextColor: Colors.black,
                  indicatorColor: Colors.primary,
                  arrowColor: Colors.primary,
                }}
              />
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  onPress={() => setOpenCalender(false)}
                  style={styles.closeButton}
                >
                  <Text style={styles.buttonText}>{t("Close")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setOpenCalender(false);
                  }}
                  style={styles.setDateButton}
                >
                  <Text style={[styles.buttonText, { color: Colors.white }]}>
                    {t("Set Date")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
          <Text style={[styles.day, { marginTop: 5, paddingVertical: 0 }]}>
            {t("Reason")}
            <Text style={{ color: Colors.red }}>*</Text>
          </Text>
          <Input
            value={dis}
            onChangeText={(txt) => {
              setDisc(txt), setDisError("");
            }}
            keyboardType="default"
            // iconSource={Images.document}
            error={diserror}
          />

          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <TouchableOpacity
              style={styles.leavebutton}
              onPress={() => setLeavemodalopen(false)}
            >
              <Text
                style={[
                  styles.day,
                  { fontSize: RFValue(16), color: Colors.white },
                ]}
              >
                {t("Cancel")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.leavebutton}
              onPress={() => {
                if (!dis) {
                  setDisError(t("Reason is required"));
                } else {
                  CreateLeave();
                  setLeavemodalopen(false);
                }
              }}
            >
              <Text
                style={[
                  styles.day,
                  { fontSize: RFValue(16), color: Colors.white },
                ]}
              >
                {t("Save")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        onBackdropPress={() => {
          setAbsencemodalopen(false);
        }}
        onBackButtonPress={() => {
          setAbsencemodalopen(false);
        }}
        style={styles.mview}
        visible={absenceModalopen}
      >
        <View style={styles.mcontainer}>
          <Text
            style={[
              styles.logout,
              {
                fontSize: 20,
                marginVertical: 10,
                fontFamily: FONTS.LexendSemiBold,
                color: Colors.black,
              },
            ]}
          >
            {t("Absence")}
          </Text>

          <Text style={[styles.day, { marginTop: 5 }]}>
            {t("Contract")}
            <Text style={{ color: Colors.red }}>*</Text>
          </Text>
          <SelectDropdown
            data={employedata}
            onSelect={(selectedItem) => {
              setAbsenceemployee(selectedItem);
              Dateset(selectedItem.id);
            }}
            renderButton={(item) => {
              return (
                <View style={[styles.dropdownButtonStyle]}>
                  <Text style={[styles.dropdownButtonTxtStyle]}>
                    {item?.contract_name
                      ? item?.contract_name
                      : cname || t("Select Contract")}
                  </Text>
                  <Image
                    source={Images.down}
                    style={{
                      height: 20,
                      width: 20,
                      tintColor: Colors.black,
                    }}
                  />
                </View>
              );
            }}
            renderItem={(item, index, isSelected) => {
              return (
                <View
                  style={[
                    styles.dropdownItemStyle,
                    isSelected && { backgroundColor: Colors.white },
                  ]}
                >
                  <Text style={styles.dropdownItemTxtStyle}>
                    {item.contract_name}
                  </Text>
                </View>
              );
            }}
            showsVerticalScrollIndicator={false}
            dropdownStyle={styles.dropdownMenuStyle}
            search
            searchInputStyle={styles.dropdownsearchstyle}
            searchInputTxtStyle={{
              color: Colors.black,
              fontFamily: FONTS.LexendMedium,
            }}
          />

          <Text style={[styles.day, { marginTop: 5 }]}>
            {t("Date")}
            <Text style={{ color: Colors.red }}>*</Text>
          </Text>

          <View style={styles.dateInput}>
            <ScrollView
              vertical
              style={{ maxWidth: "80%", maxHeight: "80%" }}
              showsHorizontalScrollIndicator={false}
            >
              <Text style={styles.dateText}>
                {/* {absencedate
                  ? new Date(absencedate).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short", // "Feb" instead of "02"
                    year: "numeric",
                  })
                  : t("Select Datum")} */}
                {absencedate && !isNaN(new Date(absencedate).getTime())
                  ? new Date(absencedate).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                  : t("Select Datum")}


              </Text>
            </ScrollView>
            <TouchableOpacity
              style={{
                backgroundColor: Colors.primary,
                padding: 7,
                borderRadius: 5,
              }}
              onPress={() => setOpenCalender(true)}
            >
              <Image
                source={Images.date}
                style={{ tintColor: Colors.white, height: 20, width: 20 }}
              />
            </TouchableOpacity>
          </View>

          <Modal
            isVisible={opencalender}
            backdropOpacity={0.5}
            animationType="slide"
            onBackdropPress={() => setOpenCalender(false)}
          >
            <View style={styles.modalContent}>
              <Calendar
                onDayPress={absencedatepress}
                markedDates={selectedDates}
                markingType={"custom"} // Adjusted marking type
                theme={{
                  todayTextColor: Colors.primary,
                  textSectionTitleColor: Colors.black,
                  selectedDayBackgroundColor: Colors.primary,
                  selectedDayTextColor: Colors.white,
                  dayTextColor: Colors.black,
                  textDisabledColor: Colors.litegray,
                  monthTextColor: Colors.black,
                  indicatorColor: Colors.primary,
                  arrowColor: Colors.primary,
                }}
              />
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  onPress={() => setOpenCalender(false)}
                  style={styles.closeButton}
                >
                  <Text style={styles.buttonText}>{t("Close")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setOpenCalender(false);
                  }}
                  style={styles.setDateButton}
                >
                  <Text style={[styles.buttonText, { color: Colors.white }]}>
                    {t(" Set Date")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <Input
            value={Hours}
            onChangeText={(txt) => {
              setHours(txt);
            }}
            keyboardType="default"
            title={"Hours"}
          />

          <Text style={[styles.day, { marginTop: 5, paddingVertical: 0 }]}>
            {t("Reason")}
            <Text style={{ color: Colors.red }}>*</Text>
          </Text>
          <Input
            value={Absencedis}
            onChangeText={(txt) => {
              setAbsenceDisc(txt), setADisError("");
            }}
            keyboardType="default"
            // iconSource={Images.document}
            error={Abdiserror}
          />

          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <TouchableOpacity
              style={styles.leavebutton}
              onPress={() => setAbsencemodalopen(false)}
            >
              <Text
                style={[
                  styles.day,
                  { fontSize: RFValue(16), color: Colors.white },
                ]}
              >
                {t("Cancel")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.leavebutton}
              onPress={() => {
                if (!Absencedis) {
                  setADisError(t("Reason is required"));
                } else {
                  Absenceleavecreate();
                  setAbsencemodalopen(false);
                }
              }}
            >
              <Text
                style={[
                  styles.day,
                  { fontSize: RFValue(16), color: Colors.white },
                ]}
              >
                Save
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
    // {/* </SafeAreaView> */}
  );
};

export default Absencerequest;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  box: {
    borderWidth: 1,
    marginHorizontal: 10,
    borderRadius: 10,
    // flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginVertical: 10,
    borderColor: Colors.litegray,
    backgroundColor: Colors.white,
  },
  title: {
    fontFamily: FONTS.LexendMedium,
    fontSize: RFValue(16),
    color: Colors.black,
    paddingVertical: 10,
  },
  date: {
    fontFamily: FONTS.LexendRegular,
    fontSize: RFValue(13),
    color: Colors.textgray,
  },
  day: {
    fontFamily: FONTS.LexendRegular,
    fontSize: RFValue(13),
    color: Colors.black,
    paddingVertical: 8,
    // width: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 30,
  },
  modalOptionsContainer: {
    position: "absolute",
    right: 4,
    backgroundColor: "white",
    borderRadius: 10,
    justifyContent: "space-around",
    elevation: 5,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modalOptionsContainer1: {
    position: "absolute",
    right: 4,
    backgroundColor: "white",
    borderRadius: 10,
    justifyContent: "space-around",
    elevation: 5,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  option: {
    padding: 10,
    color: Colors.black,
    flexDirection: "row",
  },
  mview: {
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
    margin: 0,
    backgroundColor: Colors.transparant,
  },
  mcontainer: {
    flex: 1,
    position: "absolute",
    borderRadius: 10,
    backgroundColor: Colors.white,
    width: "100%",
    padding: 15,
  },
  emptyText: {
    textAlign: "center",
    color: Colors.textgray,
    fontFamily: FONTS.LexendRegular,
    marginVertical: 20,
  },
  renderitemmain: {
    justifyContent: "center",
    flex: 7,
  },
  statusbox: {
    paddingHorizontal: 10,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    height: RFValue(35),
  },
  statusname: {
    fontFamily: FONTS.LexendRegular,
    color: Colors.white,
    fontSize: RFValue(13),
  },
  statusbg: {
    flex: 4,
    justifyContent: "center",
  },
  modalimages: {
    height: 20,
    width: 20,
    marginRight: 10,
  },
  modalitems: {
    color: Colors.black,
    fontFamily: FONTS.LexendRegular,
  },
  renderdetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  contract: {
    justifyContent: "center",
    flex: 7,
  },
  daydetails: {
    fontFamily: FONTS.LexendRegular,
    fontSize: RFValue(14),
    color: Colors.black,
  },
  daydate: {
    flexDirection: "row",
  },
  line: {
    height: 1,
    backgroundColor: Colors.litegray,
    marginVertical: 15,
  },
  data: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerbutton: {
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    width: "25%",
    borderRadius: 5,
    paddingVertical: 5,
  },
  top: {
    borderWidth: 3,
    marginHorizontal: 10,
    marginTop: 20,
    borderColor: Colors.litegray,
    borderRadius: 10,
  },
  tview: {
    padding: 5,
    marginHorizontal: 10,
    marginTop: 10,
    alignSelf: "flex-start",
  },
  dropdownButtonStyle: {
    height: RFValue(45),
    borderWidth: 1,
    borderColor: Colors.litegray,
    width: "100%",
    borderRadius: 7,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
    marginTop: RFValue(2),
  },
  dropdownButtonTxtStyle: {
    flex: 1,
    fontSize: 14,
    marginLeft: "3%",
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
  },
  dropdownMenuStyle: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
  },
  dropdownItemStyle: {
    width: "100%",
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dropdownItemTxtStyle: {
    fontSize: 14,
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
    marginRight: 10,
  },
  dateInput: {
    // width: widthPercentageToDP(90),
    height: heightPercentageToDP(7),
    backgroundColor: Colors.white,
    borderRadius: 10,
    borderColor: Colors.litegray,
    borderWidth: 1,
    paddingHorizontal: 15,
    alignItems: "center",
    marginTop: 5,
    flexDirection: "row",
    // marginHorizontal: 20,
    marginBottom: 10,
    justifyContent: "space-between",
  },
  dateText: {
    fontSize: 14,
    color: Colors.black,
    fontFamily: FONTS.LexendRegular,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 10,
    width: "100%",
    alignItems: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  closeButton: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    marginRight: 10,
    borderColor: Colors.primary,
    borderWidth: 1,
    width: "40%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  setDateButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    width: "40%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  buttonText: {
    color: Colors.primary,
    fontSize: 16,
    fontFamily: FONTS.LexendMedium,
  },
  leavebutton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    width: "43%",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 10,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginRight: 10,
  },
  startbuttonText: {
    color: Colors.white,
    fontFamily: FONTS.LexendRegular,
  },
  btncontainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "90%",
    alignSelf: "center",
  },
  dropdownsearchstyle: {
    borderWidth: 1,
    borderColor: Colors.litegray,
    width: "95%",
    alignSelf: "center",
    marginVertical: 10,
    borderRadius: 10,
    height: 40,
  },
});
