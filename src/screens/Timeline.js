import {
  Dimensions,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  FlatList,
  PermissionsAndroid,
  Platform,
  Alert,
  Pressable,
  ScrollView,
  Switch,
  TextInput,
  Linking,
  RefreshControl,
  Touchable,
  LogBox,
  ActivityIndicator,
  BackHandler,
} from "react-native";
import React, { useContext, useEffect, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../constants/color";
import { FONTS } from "../constants/fontFamily";
import { Images } from "../constants/images";
import { RFValue } from "react-native-responsive-fontsize";
import { getData, storeData } from "../utils/storeData";
import Loader from "../components/loading";
import ApiService from "../utils/Apiservice";
import apiConstants, { checkin } from "../api/apiConstants";
import { useTranslation } from "react-i18next";
// import messaging from "@react-native-firebase/messaging";
import * as RNLocalize from "react-native-localize";
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from "react-native-responsive-screen";
import { RadioButton } from "react-native-paper";
import ButtonComponent from "../components/buttonComponent";
import Modal from "react-native-modal";
import axios from "axios";
import DatePicker from "react-native-date-picker";
import VersionCheck from "react-native-version-check";
import BlueHeader from "../components/BlueHeader";
import { languagedata } from "../Translation/i18n";
import CustomModal from "../components/CustomModal";
import moment from "moment";
import { GoogleAPi } from "../components/GoogleAPI";
import { RegisterBackContext } from "../constants/GoBackContext";
import Svg, { Path } from "react-native-svg";
import { PERMISSIONS, request, RESULTS } from "react-native-permissions";
import Geolocation from "@react-native-community/geolocation";
// import RNAndroidLocationEnabler, { promptForEnableLocationIfNeeded } from 'react-native-android-location-enabler';
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
// const GOOGLE_MAPS_API_KEY = "AIzaSyBVCjdibPBQN8s0Iy06ITwgMvrRZZRLcog";
let MultiAddress = false;
const Timeline = () => {
  const isFocused = useIsFocused();
  const [GPSPermission, setGPSPermission] = useState(false);
  let cost_data = null;
  const { t } = useTranslation();
  const [logo, setLogo] = useState(null);
  const [companyName, setCompanyname] = useState(null);
  const { width } = Dimensions.get("screen");
  const [loading, setLoading] = useState(false);
  const [checkinVisible, setCheckOutVisible] = useState(false);
  const [step, setStep] = useState(1);
  const [data, setData] = useState([]);
  const [modaldata, setmodaldata] = useState([]);
  const [starting_point_data, setstarting_point_data] = useState([]);
  const [destination_data, setdestination_data] = useState([]);
  const [relatiesdata, setrelatiesdata] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [scheduledata, setscheuledata] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [selected, setSelected] = useState(); // Track the selected radio button
  const [selected1, setSelected1] = useState();
  const [ModalCheckIn, setModalChekIn] = useState(false);
  const [ModalCheckOut, setModalCheckOut] = useState(false);
  const [isTravelCostEnabled, setIsTravelCostEnabled] = useState(true);
  const [cost, setcost] = useState("");
  const flatListRef = useRef(null);
  const [countcost, setCountCost] = useState("");
  const [distance, setDistance] = useState(null);
  const [selectedAddressDetails, setSelectedAddressDetails] = useState(null);
  const [RefreshHold, setRefreshHold] = useState(true);
  const [selectedDestinationDetails, setSelectedDestinationDetails] =
    useState(null);
  const [breakTime, setBreakTime] = useState("00:00");
  const [stopTime, setStopTime] = useState("Yes");
  const [description, setDescription] = useState("");
  const [isCheckIn, setIsCheckIn] = useState("check_out");
  const [isHomeSelected, setIsHomeSelected] = useState(false);
  const [openTime, setOpenTime] = useState(false);
  const [open, setOpen] = useState(false);
  const [editdate, setEditDate] = useState(new Date());
  const [edittime, setEditTime] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [username, setUsername] = useState(null);
  const [DayOnSwitch, setDayOnSwitch] = useState(false);
  //for check version
  // const [visible, setVisible] = useState(false);
  const [latestVersion, setLatestVersion] = useState("");
  const [timelinedataa, setTimelineData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [permmisiion, setpermmisiion] = useState();
  LogBox.ignoreAllLogs();
  //Permission API check
  const { RegisterBack, setRegisterBack, GOOGLE_API_KEY, setGOOGLE_API_KEY } = useContext(RegisterBackContext)
  const [isAllowed, setIsAllowed] = useState(false); // Permission state
  const [FCMtoken, setFCMtoken] = useState(""); // Permission state
  const [MultipleAddressTrue, setMultipleAddressTrue] = useState(false);
  const [isLoading, setIsLoading] = useState(false)
  const [Coordinate, setCoordinates] = useState(null)
  const companylusername = async () => {
    const username = await getData("USERDATA");
    setUsername(username.data.relaties);

    //   console.log(username.data.relaties.display_name,'jhfsiufhiuhuf');
  };
  useEffect(() => {
    if (selected1 === "Home") {
      setStopTime("Yes");
    } else {
      setStopTime(""); // Or any other default value
    }
  }, [selected1]);
  useEffect(() => {
    // checkForUpdate();
    // const get = async () => {
    //   let key = await GoogleAPi()
    //   // Alert.alert(String(key))
    //   setGoogleApi(key)
    // }
    // get();
    // GetCostglobbaly()
    // Alert.alert(String(isTravelCostEnabled))
    companylusername();
  }, []);


  const [currentDate1, setCurrentDate1] = useState("");

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();

      // Format the date as "12 Mar 2025"
      const formattedDate = now.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

      // Format the time as "11:55"
      const formattedTime = now.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false, // Use 24-hour format, set to true for AM/PM format
      });

      setCurrentDate1(formattedDate);
      setCurrentTime(formattedTime);
    };

    updateDateTime(); // Initialize immediately
    const interval = setInterval(updateDateTime, 1000); // Update every second

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  // const checkForUpdate = async () => {
  //   try {
  //     const latest = await VersionCheck.getLatestVersion(); // Get latest store version
  //     const current = VersionCheck.getCurrentVersion(); // Get installed app version

  //     console.log("Latest Version:", latest);
  //     console.log("Current Version:", current);
  //     if(Platform.OS==='android'){
  //       Alert.alert("ANDROID")
  //     }
  //     setLatestVersion(latest);

  //     if (latest !== current) {
  //       setVisible(true); // Show modal if versions are different
  //     }
  //   } catch (error) {
  //     console.error("Error checking app version:", error);
  //   }
  // };

  useEffect(() => {

    // Alert.alert(`${checkin}`)
    if (permmisiion?.simpel_check_in_out?.read == '1') {
      if (!(isCheckIn == "check_in")) {
        setSelected("Office"), setAddresses(modaldata["Office"]);
        setSelected1("Home"); /// by default selected
        onSelect1("Home");
      } else {
        setSelected("Home"), setAddresses(modaldata["Home"]);
        setSelected1("Office"); /// by default selected
        onSelect1("Office");
      }
      setDestinations(modaldata?.Office);
    }
  }, [permmisiion, modaldata])
  const openStore = () => {
    const url =
      Platform.OS === "ios"
        ? "https://apps.apple.com/nl/app/erp-portaal/id6523437695"
        : "https://play.google.com/store/apps/details?id=com.erpportaal&hl=nl";

    Linking.openURL(url).catch((err) =>
      console.error("Error opening store:", err)
    );
  };
  const handleBackPress = React.useCallback(() => {
    Alert.alert(
      t("Hold on!"),
      t("Are you sure you want to exit?"),
      [
        {
          text: t("Cancel"),
          onPress: () => null,
          style: "cancel",
        },
        {
          text: t("YES"),
          onPress: () => BackHandler.exitApp(),
        },
      ]
    );
    return true;
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const subscription = BackHandler?.addEventListener(
        "hardwareBackPress",
        handleBackPress
      );

      return () => subscription?.remove();
    }, [handleBackPress])
  );
  useEffect(() => {
    // Update time initially
    setCurrentTime(new Date());
  }, []);

  // const [currentTime, setCurrentTime] = useState("");

  // const updateTime = () => {
  //   const date = new Date();
  //   const options = {
  //     hour: "2-digit",
  //     minute: "2-digit",
  //     hour12: false,
  //   };
  //   const formattedTime = date.toLocaleTimeString("en-US", options);
  //   setCurrentTime(formattedTime);
  // };
  //console.log("currentTime", currentTime);

  // useEffect(() => {
  //   // updateTime();
  //   const intervalId = setInterval(updateTime, 1000);
  //   const timeZoneChangeListener = RNLocalize.addEventListener
  //     ? RNLocalize.addEventListener("change", updateTime)
  //     : null;
  //   return () => {
  //     clearInterval(intervalId);
  //     if (timeZoneChangeListener) {
  //       timeZoneChangeListener.remove();
  //     }
  //   };
  // }, []);

  const getCurrentDate = () => {
    const today = new Date();

    // Format 1: dd MMM yyyy (e.g., 09 Oct 2024)
    const options = { day: "2-digit", month: "short", year: "numeric" };
    const formattedDate1 = today.toLocaleDateString("en-US", options);
    const [month, day, year] = formattedDate1.split(/[\s,]+/);
    const currentDate = `${day} ${month} ${year}`; // '09 Oct 2024'

    // Format 2: yyyy-mm-dd (e.g., 2024-10-09)
    const yearNumeric = today.getFullYear();
    const monthNumeric = String(today.getMonth() + 1).padStart(2, "0");
    const dayNumeric = String(today.getDate()).padStart(2, "0");
    const formatDate = `${yearNumeric}-${monthNumeric}-${dayNumeric}`; // '2024-10-09'
    return { currentDate, formatDate };
  };
  const { currentDate, formatDate } = getCurrentDate();
  // console.log(currentDate , 'jsdhbksudh-=-=--',formatDate);
  const formatTo24Hour = (date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };
  const companylogoo = async () => {
    const companylogo = await getData("COMPANYLOGO");

    setLogo(companylogo);

    const name = await getData("COMPANYLOGIN");
    // console.log("Fetched companyName:", name); // ✅ Log the fetched value
    setCompanyname(name); // ✅ Ensure correct state update
  };
  useEffect(() => {

    companylogoo();
  }, []); // No dependencies needed

  useEffect(() => {
    // companylogoo();
    fetchtimeline();
    fetchPermission();
  }, [companyName]);
  // checks permission for button to show or hide
  useEffect(() => {
    checkPermission();
  }, []);
  const checkPermission = async () => {
    // const storedData = await getData("PERMISSION_DATA");
    const storedData = permmisiion;
    // console.log("🔍 Checking Permission:", storedData);

    if (storedData?.employee_check_in_out.read) {
      // Ensure the correct key is used
      // console.log("If ma Gayu");

      setIsAllowed(true);
    } else {
      // console.log("else ma Gayu");
      setIsAllowed(false);
    }
  };

  const getTodayAndTomorrowDates = () => {
    const today = new Date();
    const tomorrow = new Date();

    // Set tomorrow's date by adding 1 day to today's date
    tomorrow.setDate(today.getDate() + 1);

    // Format dates to 'YYYY-MM-DD' format
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    return {
      today: formatDate(today),
      tomorrow: formatDate(tomorrow),
    };
  };
  const { today, tomorrow } = getTodayAndTomorrowDates();

  // permision mate api calling

  const fetchPermission = async () => {
    try {
      const getdata = await getData("USERDATA");
      if (
        !getdata ||
        !getdata.data ||
        !getdata.data.user ||
        !getdata.data.relaties
      ) {
        // console.log("Missing required user data:", getdata);
        return;
      }
      const response = await ApiService(apiConstants.permission, {
        includeToken: true,
        customData: {
          relaties_id: getdata.data.relaties.id,
          // role: 'sales_',
          user_id: getdata.data.user.id,
          role: getdata.data.user.role,
          // firebase_token:FCMtoken
        },
      });

      if (response?.status && response?.data) {
        // console.log("Permission Data Fetched:", response.data);
        setpermmisiion(response.data);
        if (response.data?.employee_check_in_out.read) {
          // Ensure the correct key is used
          // console.log("If ma Gayu");

          setIsAllowed(true);
        } else {
          // console.log("else ma Gayu");
          setIsAllowed(false);
        }
        // Store permission data in AsyncStorage
        await storeData("PERMISSION_DATA", response.data);
        // console.log("Data stored in AsyncStorage successfully!");

        // Verify after storing
        // const verifyData = await getData("PERMISSION_DATA");
        // console.log("Verified Stored Data:", verifyData);
      }
    } catch (error) {
      // console.log("Error fetching permission:", error.response?.data || error);
    }
  };

  //asyncstorage data check
  // useEffect(() => {
  //   const checkStoredData = async () => {
  //     const storedData = await getData("PERMISSION_DATA");
  //     console.log("Stored Permission Data:", storedData);
  //   };

  //   checkStoredData();
  // }, []);

  const fetchtimeline = async () => {

    setLoading(true);
    try {
      const getdata = await getData("USERDATA"); // Get the user data

      const response = await ApiService(apiConstants.timeline, {
        includeToken: true,
        customData: {
          role: getdata.data.user.role,
          relaties_id: getdata.data.relaties.id,
          user_id: getdata.data.user.id,
          s_date: today,
          e_date: today,
        },
      });

      if (response.success) {
        // console.log("dskcjmdslk-=-=-", data);
        const processedData = response.data.map((item) => {
          if (item?.calendar_data?.success) {
            const calendarSchedule = item.calendar_data.data.map(
              (schedule) => ({
                date: schedule.date,
                day: schedule.day,
                class: schedule.class,
                start_time: schedule.start_time,
                end_time: schedule.end_time,
                break_time: schedule.break_time,
                total_time: schedule.total_time,
                schedule_status: schedule.schedule_status,
              })
            );
            return { ...item, calendarSchedule };
          } else {
            return item; // Return item as is if no calendar data
          }
        });

        setData(processedData); // Update the state with processed data
        setLoading(false);
      } else {
        setLoading(false);
        // console.log("Timeline fetch unsuccessful");
      }
    } catch (err) {
      setLoading(false);
      // console.log("Error fetching timeline data:", err);
    }
  };

  // useEffect(() => {
  //   // get fcm token
  //   const getFCMToken = async () => {
  //     try {
  //       const fcmToken = await messaging().getToken();
  //       if (fcmToken) {
  //         setFCMtoken(fcmToken);
  //         // console.log("FCM Token:", fcmToken);
  //         // console.log(
  //         //   "************ Successfully retrieved FCM token ************"
  //         // );
  //       } else {
  //         // console.log("Failed to get FCM token");
  //       }
  //     } catch (error) {
  //       // console.log("Error getting FCM token:", error);
  //     }
  //   };

  //   const requestUserPermission = async () => {
  //     // android work perfect.......execute notification.....
  //     if (Platform.OS === "android") {
  //       try {
  //         const granted = await PermissionsAndroid.request(
  //           PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
  //         );

  //         if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
  //           // console.log("Notification permission denied");
  //           return;
  //         }
  //       } catch (error) {
  //         // console.log("Error requesting notification permission:", error);
  //       }
  //     } else if (Platform.OS === "ios") {
  //       // ios in get fcm token but not execute notification .....
  //       const authStatus = await messaging().requestPermission();
  //       const enabled =
  //         authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
  //         authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  //       if (!enabled) {
  //         // console.log("Notification permission not granted");
  //         return;
  //       }
  //     }
  //     try {
  //       await messaging().registerDeviceForRemoteMessages();
  //       const apnsToken = await messaging().getAPNSToken();
  //       // console.log("APNs Token:", apnsToken);
  //       // console.log("Device registered for remote messages");
  //       await getFCMToken();
  //     } catch (error) {
  //       // console.log("Error registering device for remote messages:", error);
  //     }
  //   };

  //   requestUserPermission();
  //   const unsubscribeOnMessage = messaging().onMessage(
  //     async (remoteMessage) => {
  //       // console.log(
  //       //   "A new FCM message arrived:",
  //       //   JSON.stringify(remoteMessage)
  //       // );
  //     }
  //   );

  //   return () => {
  //     unsubscribeOnMessage();
  //   };
  // }, []);

  const timelinedata = async () => {
    setTimelineData([])
    setscheuledata([])
    setData([])
    if (!refreshing) {
      setRefreshing(true);
      setTimeout(() => {
        setRefreshing(false);
      }, 1000);
    } else {
      setRefreshing(false);
    }
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.timelinedata, {
        includeToken: true,
        customData: {
          relaties_id: getdata.data.relaties.id,
          role: getdata.data.user.role,
          user_id: getdata.data.user.id,
        },
      });
      if (data.status) {
        // console.log(data.data, "timelinedatatataatta");
        setTimelineData(data.data);
      } else {
        // console.log("False connections");
      }
    } catch (err) {
      // console.log("Error fetching connections:", err);
    }
  };

  useEffect(() => {
    timelinedata();
    // fetchcustomer()
    setData([])
    setrelatiesdata([])
    setTimelineData([])
  }, []);

  const fetchcustomer = async () => {
    setscheuledata([])
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.gettimelinedata, {
        includeToken: true,
        customData: {
          relaties_id: getdata.data.relaties.id,
          role: getdata.data.user.role,
          user_id: getdata.data.user.id,
          // date: "2025-02-19",
          date: formatDate,
        },
      });
      if (data.status) {
        setmodaldata(data.data);
        setstarting_point_data(data.starting_point_data);
        setdestination_data(data.destination_data);
        if (data.cico_status == "check_out") {
          onSelect(data.check_in_out_data.end_point_type);
        }

        setrelatiesdata(data);
        setDestinations(data.data.Destination || []);
        setIsCheckIn(data.cico_status);
        console.log("dshgbdksj-=-=-=-", data);

        if (relatiesdata.schedule_data.success == true) {
          setscheuledata(relatiesdata.schedule_data);
          // console.log("MY DATTTTTTTTTTTTTTTTTT=>", relatiesdata.schedule_data);

        }
      } else {
        // console.log("False connections");
      }
    } catch (err) {
      // console.log("Error fetching connections:", err);
    }
  };

  // console.log( , 'dateteteteteetet');

  const Checkin = async () => {
    setData([])
    setTimelineData([])
    setCheckOutVisible(false)
    setIsLoading(true)
    try {

      const getdata = await getData("USERDATA");
      const scheduleItem = scheduledata?.data?.[0] || {};
      const data = await ApiService(apiConstants.checkintimeline, {
        includeToken: true,
        customData: {
          relaties_id: getdata.data.relaties.id,
          role: getdata.data.user.role,
          user_id: getdata.data.user.id,
          type: "check_in",
          check_in_out_date: editdate ? formatDateForAPI(editdate) : formatDate,
          // check_in_out_date: editdate ? formatDatee(editdate) : currentDate,
          check_in_out_time: edittime
            ? formatTime(edittime)
            : formatTime(currentTime),
          start_point_check_in: selected,
          option_start_point_check_in: selectedAddressDetails?.address,
          option_start_point_check_in_id: selectedAddressDetails?.id,
          end_point_check_in: selected1,
          option_end_point_check_in: selectedDestinationDetails?.address,
          option_end_point_check_in_id: selectedDestinationDetails?.id,
          distance: distance || 0,
          single_trip_cost: countcost,
          schedule_id: scheduleItem?.schedule_id || 0,
          schedule_employee_contract_id:
            scheduledata?.employment_contract?.id || null,
          schedule_day: scheduleItem?.day || null,
          schedule_start_time: scheduleItem?.start_time || null,
          schedule_end_time: scheduleItem?.end_time || null,
          schedule_break_time: scheduleItem?.break_time || null,
          schedule_total_time: scheduleItem?.total_time || null,
          schedule_class: scheduleItem?.class || null,
          travel_cost_enabled: isTravelCostEnabled,
          closing_day: 0,
          schedule_status: scheduledata?.status_text_value || null,
          check_in_current_latitude: Coordinate?.lat || "",
          check_in_current_longitude: Coordinate?.lng || "",
          is_direct: permmisiion?.simpel_check_in_out?.read == '1' ? 1 : null,
        },
      });
      if (data.status) {
        // console.log("check
        //  in successfully", data);
        //   Alert.alert(
        //  //   "Check in Successfull",
        //      data.message);
        timelinedata();
        onRefresh();
        setModalChekIn(true);


        //     Alert.alert(
        //       t("EmployeeCheckIn"),
        //       `${editdate ? formatDateForAPI(editdate) : formatDate} (${edittime ? formatTime(edittime) : formatTime(currentTime)
        //       })
        // ${selected || "N/A"}  ${" > "} ${selected1 || "N/A"}`
        //     );
      } else {
        // console.log("False connections");
      }
    } catch (err) {
      // console.log("Error fetching connections:", err);
      Alert.alert("Error : ", err);
    }
    finally {
      setIsLoading(false)
      fetchcustomer();

    }
  };

  // const Checkout = async () => {
  //   try {
  //     const getdata = await getData("USERDATA");
  //     const scheduleItem = scheduledata?.data?.[0] || {};
  //     const data = await ApiService(apiConstants.checkouttimeline, {
  //       includeToken: true,
  //       customData: {
  //         relaties_id: getdata.data.relaties.id,
  //         role: getdata.data.user.role,
  //         user_id: getdata.data.user.id,
  //         distance: distance || 0,
  //         check_in_out_date: editdate ? editdate : currentDate,
  //         check_in_out_time: edittime ? edittime : currentTime,
  //         type: "check_out",
  //         closing_day: isHomeSelected,
  //         single_trip_cost: countcost,
  //         stop_time: stopTime == "Yes" ? 1 :0,
  //         check_in_id: relatiesdata.check_in_out_data.id,
  //         break_time: breakTime,
  //         description: description,
  //         start_point_check_out: selected,
  //         option_start_point_check_out: selectedAddressDetails?.address,
  //         option_start_point_check_out_id: selectedAddressDetails?.id,
  //         end_point_check_out: selected1,
  //         option_end_point_check_out: selectedDestinationDetails?.address,
  //         option_end_point_check_out_id: selectedDestinationDetails?.id,
  //         schedule_id: scheduleItem?.schedule_id || 0,
  //         schedule_employee_contract_id: scheduledata?.employment_contract?.id || null, // From employment_contract
  //         schedule_day: scheduleItem?.day || null,
  //         schedule_start_time: scheduleItem?.start_time || null,
  //         schedule_end_time: scheduleItem?.end_time || null,
  //         schedule_break_time: scheduleItem?.break_time || null,
  //         schedule_total_time: scheduleItem?.total_time || null,
  //         schedule_class: scheduleItem?.class || null,
  //         schedule_status: scheduledata?.status_text_value || null,
  //       },
  //     });
  //     console.log('gfxahfvd' , data.errors);
  //     if (data.status) {
  //       console.log("check out successfully", data);
  //       Alert.alert("Check out Successfull", data.message);
  //     } else {
  //       console.log("False connections");
  //     }
  //   } catch (err) {
  //     console.log("Error fetching connections:", err);
  //   }
  // };
  const openLocationSettings = () => {
    if (Platform.OS === 'android') {
      Linking.openSettings(); // Opens device settings
    } else {
      Linking.openURL('App-Prefs:root=Privacy&path=LOCATION'); // iOS (may not work on all versions)
    }
  };

  const Checkout = async () => {
    setData([])
    setCheckOutVisible(false)
    setIsLoading(true)
    try {
      const getdata = await getData("USERDATA");
      const scheduleItem = scheduledata?.data?.[0] || {};

      const data = await ApiService(apiConstants.checkouttimeline, {
        includeToken: true,
        customData: {
          relaties_id: getdata.data.relaties.id,
          role: getdata.data.user.role,
          user_id: getdata.data.user.id,
          distance: distance || 0,
          check_in_out_date: editdate ? formatDateForAPI(editdate) : formatDate,
          check_in_out_time: edittime
            ? formatTime(edittime)
            : formatTime(currentTime),
          type: "check_out",
          closing_day: permmisiion?.simpel_check_in_out?.read == '1' ? 1 : isHomeSelected ? 1 : 0,
          single_trip_cost: countcost && !isNaN(countcost) ? countcost : 0,
          stop_time: permmisiion?.simpel_check_in_out?.read == '1' ? 1 : stopTime === "Yes" ? 1 : 0,
          check_in_id: relatiesdata.check_in_out_data.id,
          break_time: breakTime,
          description: description,
          start_point_check_out: selected,
          option_start_point_check_out: selectedAddressDetails?.address,
          option_start_point_check_out_id: selectedAddressDetails?.id,
          end_point_check_out: selected1,
          option_end_point_check_out: selectedDestinationDetails?.address,
          option_end_point_check_out_id: selectedDestinationDetails?.id,
          schedule_id: scheduleItem?.schedule_id || 0,
          schedule_employee_contract_id:
            scheduledata?.employment_contract?.id || null,
          schedule_day: scheduleItem?.day || null,
          schedule_start_time: scheduleItem?.start_time || null,
          schedule_end_time: scheduleItem?.end_time || null,
          schedule_break_time: scheduleItem?.break_time || null,
          schedule_total_time: scheduleItem?.total_time || null,
          schedule_class: scheduleItem?.class || null,
          schedule_status: scheduledata?.status_text_value || null,
          travel_cost_enabled: isTravelCostEnabled,
          check_out_current_latitude: Coordinate?.lat || "",
          check_out_current_longitude: Coordinate?.lng || "",
          is_direct: permmisiion?.simpel_check_in_out?.read == '1' ? 1 : null,
        },
      });

      // ✅ Log full API response for debugging
      // console.log("API Response:", data);

      if (data.status) {
        setDescription("");
        console.log("Check out successfully:", data);
        // Alert.alert("Check out Successful", data.message);
        // Alert.alert("Check out Successful", data.message);
        setModalCheckOut(true);
        timelinedata();
        onRefresh();

        //     Alert.alert(
        //       t("EmployeeCheckOut"),
        //       `${editdate ? formatDateForAPI(editdate) : formatDate}(${edittime ? formatTime(edittime) : formatTime(currentTime)
        //       })
        // ${selected || "N/A"}${" >"}  ${selected1 || "N/A"}`
        //     );
      } else {
        // console.log("Checkout failed. Errors:", data.errors);

        // ✅ Log individual validation errors if available
        if (data.errors) {
          Object.entries(data.errors).forEach(([key, messages]) => {
            // console.log(`Validation Error - ${key}: ${messages.join(", ")}`);
          });
        }
      }
    } catch (err) {
      console.log("Check Out Error Error fetching connections:", err);
    }
    finally {
      setIsLoading(false)
      fetchcustomer();

    }
  };

  useEffect(() => {
    if (relatiesdata?.relaties_data?.is_travel_costs_enable !== undefined) {
      setIsTravelCostEnabled(relatiesdata.relaties_data.is_travel_costs_enable ? true : false);
      // Alert.alert(String(relatiesdata.relaties_data.is_travel_costs_enable ? true :false))
    }
    // Alert.alert(String(distance))
  }, [relatiesdata]);
  const SwitchRender = (distances) => {

    if (isTravelCostEnabled) {
      let id;
      if (selected === 'Office' && selectedAddressDetails?.id) {
        id = selectedAddressDetails.id;
      } else if (selected1 === 'Office' && selectedDestinationDetails?.id) {
        id = selectedDestinationDetails.id;
      }
      if (id !== undefined) {
        GetCostglobbalyFun(id, (
          Number(distances) * Number(relatiesdata?.company_data?.travel_cost)
        ).toFixed(2));
      } else {
        console.warn("Office selected but ID not found.");
      }
      // cost_data =(
      //     Number(distance) * Number(relatiesdata?.company_data?.travel_cost)
      //   ).toFixed(2);
      setCountCost(
        (
          Number(distance) * Number(relatiesdata?.company_data?.travel_cost)
        ).toFixed(2)
      );
    } else {
      cost_data = 0;
    }
  }
  useEffect(() => {
    setCountCost(
      (
        Number(distance) * Number(relatiesdata?.company_data?.travel_cost)
      ).toFixed(2)
    );
  }, [isTravelCostEnabled, selected, selected1,])

  const filteredData = Object.keys(modaldata)
    .filter((category) => modaldata[category].length > 0)
    .map((category) => ({
      title: category,
      data: modaldata[category],
    }));

  const renderItem = ({ item, index }) => {
    const calendarData = item?.calendar_data;
    //    {calendarData?.data.map((schedule, index) => { Direct add this lin old render data
    const sortedSchedules = Array.isArray(calendarData?.data)
      ? [...calendarData.data].sort((a, b) => {
        const timeA = new Date(`1970-01-01T${a?.start_time || '00:00'}`);
        const timeB = new Date(`1970-01-01T${b?.start_time || '00:00'}`);
        return timeA - timeB;
      })
      : [];


    return (
      <>
        {calendarData?.success && calendarData?.data?.length > 0 && (
          <View
            style={{
              borderColor: Colors.black,
              borderWidth: 1,
              width: "100%",
              padding: 10,
              // marginHorizontal: 10, // Space between items
              // marginRight: 10,
              borderRadius: 10,
              justifyContent: "center",
              backgroundColor: Colors.litegray1,
              // backgroundColor:
              //   calendarData?.data[0]?.branch_calendar?.background_color ||
              //   Colors.white,
              // flexShrink: 1,
              // marginBottom: 20,
              marginVertical: 10,
            }}
          >
            <Text
              style={{
                color: Colors.black,
                fontSize: RFValue(14),
                fontFamily: FONTS.LexendRegular,
                alignSelf: "center",
                // bottom:20
              }}
              numberOfLines={2}
            >
              {username?.display_name}
            </Text>
            <View
              style={{
                flexDirection: "column",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: Colors.black,
                  fontSize: RFValue(14),
                  fontFamily: FONTS.LexendMedium,
                  paddingVertical: 5,
                }}
              >
                {t(calendarData?.data[0]?.day)} {item.display_date}{" "}
                {/* Display formatted date */}
              </Text>

              <Text
                style={{
                  color: Colors.black,
                  fontSize: RFValue(14),
                  fontFamily: FONTS.LexendMedium,
                }}
              >
                {calendarData?.data[0]?.schedule_status_text}{" "}
                {/* Display the day */}
              </Text>
            </View>

            {/* Map through the `data` array inside `calendar_data` to display schedules */}
            {sortedSchedules?.map((schedule, index) => (
              // <View
              //   key={index}
              //   style={{
              //     flexDirection: "column", // Stack items vertically
              //     justifyContent: "center",
              //     alignItems: "flex-start", // Align items to the left
              //     marginTop: 10, // Space between schedules
              //     padding: 10, // Padding inside the schedule view
              //     borderWidth: 1, // Add a border to each schedule item
              //     borderColor: Colors.textgray, // Border color
              //     borderRadius: 5, // Rounded corners for each schedule entry
              //      backgroundColor:schedule?.schedule_status_background_color!=="" || null ? schedule?.schedule_status_background_color : Colors.textgray
              //   }}
              // >
              //   <Text
              //     style={{
              //       color: Colors.black,
              //       fontSize: RFValue(14),
              //       fontFamily: FONTS.LexendRegular,
              //       // marginBottom: 5, // Space between class and time
              //       alignSelf: "center",
              //     }}
              //   >
              //     {schedule.start_time} - {schedule.end_time} (
              //     {schedule.total_time}) - {schedule.class}
              //   </Text>
              // </View>
              <View
                key={index}
                style={{
                  flexDirection: "row", // Stack items vertically
                  // justifyContent: "center",
                  alignItems: "center", // Align items to the left
                  marginTop: 10, // Space between schedules
                  padding: 10, // Padding inside the schedule view
                  borderWidth: 1, // Add a border to each schedule item
                  borderColor: Colors.textgray, // Border color
                  borderRadius: 5, // Rounded corners for each schedule entry,
                  paddingHorizontal: 15,
                  overflow: 'hidden',
                  backgroundColor: schedule?.schedule_status_background_color !== "" || null ? schedule?.schedule_status_background_color : Colors.textgray
                }}
              >
                {/* Display class */}
                <View style={{ width: '8%', }}>
                  {
                    schedule?.schedule_status_icon !== null &&
                    <Svg
                      width={20}
                      height={20}
                      viewBox={schedule?.schedule_status_icon?.viewBox || "0 0 100 100"}
                    >
                      <Path
                        d={schedule?.schedule_status_icon?.path}
                        fill={schedule?.schedule_status_text_color !== null || "" ? schedule?.schedule_status_text_color : Colors.primary}
                        strokeWidth="2"
                      />
                    </Svg>
                  }
                </View>
                <Text
                  style={{
                    color: schedule?.schedule_status_text_color !== null || "" ? schedule?.schedule_status_text_color : Colors.black,
                    fontSize: RFValue(13),
                    fontFamily: FONTS.LexendRegular,
                    // marginBottom: 5, // Space between class and time
                    alignSelf: "flex-start",
                    textDecorationLine: (schedule?.schedule_status_text == 'Absence' || schedule?.schedule_status_text == 'move_schedule') ? 'line-through' : 'none'

                  }}
                >
                  {/* Class: {schedule.class} */}
                  {schedule.start_time} - {schedule.end_time} (
                  {schedule.total_time}) - {schedule.class}
                </Text>

                {
                  schedule?.emp_schedule_status_icon?.length > 0 &&
                  schedule?.emp_schedule_status_icon?.map((el) => (
                    <View style={{ marginHorizontal: 2 }}>
                      <Svg
                        width={20}
                        height={20}
                        viewBox={el?.viewBox || "0 0 100 100"}
                      >
                        <Path
                          d={el?.path}
                          fill={schedule?.schedule_status_text_color !== null || "" ? schedule?.schedule_status_text_color : Colors.primary}
                          strokeWidth="2"
                        />
                      </Svg>
                    </View>
                  ))
                }

                {/* Display schedule time (start, end, total) */}
              </View>
            ))}
            {
              Array.isArray(calendarData?.break_schedule?.data) &&
              calendarData?.break_schedule.data.map((el, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: "row",
                    // justifyContent: "center",
                    alignItems: "flex-start",
                    marginTop: 10,
                    padding: 10,
                    borderWidth: 1,
                    borderColor: Colors.textgray,
                    borderRadius: 5,
                    overflow: 'hidden'
                    // gap: 5
                  }}
                >

                  <View style={{ width: '9%' }}>
                    <Svg
                      width={20}
                      height={20}
                      viewBox={el?.icon?.viewBox || "0 0 100 100"}
                    >
                      <Path
                        d={el?.icon?.path}
                        // fill={el?.schedule_status_text_color!==null || "" ? schedule?.schedule_status_text_color : Colors.primary}
                        fill={'red'}
                        strokeWidth="2"
                      />
                    </Svg>
                  </View>
                  <Text
                    style={{
                      color: Colors.red,
                      fontSize: RFValue(13),
                      fontFamily: FONTS.LexendRegular,
                      // marginBottom: 5,
                      alignSelf: "center",
                    }}
                  >
                    {`${el?.start_time.slice(0, 5) || '--'} - ${el?.end_time.slice(0, 5) || '--'} (${el?.total_break_time.slice(0, 5) || '--'}) ${el?.stand_by_relaties_data !== null ? (`- ${el?.stand_by_relaties_data.display_name}` || '') : '- Geen Standby'}`}
                  </Text>
                </View>
              ))
            }

            {calendarData?.data[0]?.work_details?.map((item, index) => (
              <Text
                key={index}
                style={{
                  color: Colors.black,
                  fontSize: RFValue(14),
                  fontFamily: FONTS.LexendRegular,
                  marginVertical: 5,
                }}
              >
                • {item.display_title} #{item.display_id}
              </Text>
            ))}

          </View>
        )}
      </>
    );
  };

  const renderItem1 = ({ item, index }) => {
    const calendarData = item?.calendar_data;
    // console.log("DATA CHECKING:-", item);

    const checkInOutData = calendarData?.check_in_out;

    const isCheckIn = item.cico_status === "Check-in";
    const bgcolorr = item.cico_bg_color;
    const date = isCheckIn ? item.check_in_date : item.check_out_date;
    const date_with_day = isCheckIn
      ? item?.check_in_date_with_day
      : item?.check_out_date_with_day;
    const time = isCheckIn ? item.check_in_time : item.check_out_time;
    const stop_time = isCheckIn ? "" : item.stop_time;
    const break_time = isCheckIn ? "" : item.break_time;
    const endPointType = isCheckIn
      ? item.check_in_end_point_type
      : item.check_out_end_point_type;
    const endPointId = isCheckIn
      ? item.check_in_end_point_data?.id
      : item.check_out_end_point_data?.id;
    const endPointAddress = isCheckIn
      ? item.check_in_end_point_address
      : item.check_out_end_point_address;
    let row2Dataid = "";
    let row2Datatitle = "";

    if (isCheckIn) {
      const checkInData = item[`check_in_end_point_${endPointType}_data`] ?? {}; // Handle null
      // console.log("CHECKINDATA:-", checkInData);

      if (endPointType === "Task") {
        row2Dataid = "#" + (checkInData?.id ?? "");
        row2Datatitle = checkInData?.title ?? "Default Task Title";
      } else if (endPointType === "Workoder") {
        row2Dataid = "#" + (checkInData?.id ?? "");
        row2Datatitle = checkInData?.order_name ?? "Default Workorder Title";
      } else if (endPointType === "Project") {
        row2Dataid = "#" + (checkInData?.id ?? "");
        // row2Dataid = "";
        row2Datatitle = checkInData?.project_name ?? "Default Project Title";
      } else if (endPointType === "Office") {
        row2Dataid = "";
        row2Datatitle =
          checkInData?.relatie?.display_name ?? "Default Office Name";
      } else {
        row2Dataid = "";
        row2Datatitle = endPointType ?? "Unknown Type";
      }
      // console.log("HOME CHECK DATa:- ", checkInData);

    } else {
      const checkOutData =
        item[`check_out_end_point_${endPointType}_data`] ?? {}; // Handle null

      // console.log("CHECKOUT DATA", checkOutData);

      if (endPointType === "Task") {
        row2Dataid = "#" + (checkOutData?.id ?? "");
        row2Datatitle = checkOutData?.title ?? "Default Task Title";
      } else if (endPointType === "Workoder") {
        row2Dataid = "#" + (checkOutData?.id ?? "");
        row2Datatitle = checkOutData?.order_name ?? "Default Workorder Title";
      } else if (endPointType === "Project") {
        row2Dataid = "#" + (checkOutData?.id ?? "");
        // row2Dataid = "";
        row2Datatitle = checkOutData?.project_name ?? "Default Project Title";
      } else if (endPointType === "Office") {
        row2Dataid = "";
        row2Datatitle =
          checkOutData?.relatie?.display_name ?? "Default Office Name";
      } else {
        row2Dataid = "";
        row2Datatitle = endPointType ?? "Unknown Type";
      }
    }

    const previousItem = index > 0 ? timelinedataa[index - 1] : null; // Assuming data is the array of items

    // console.log("Previous Item", previousItem?.check_in_date, "   ", previousItem?.check_out_date);

    const PeviousisCheckIn =
      previousItem && previousItem.cico_status === "Check-in";
    const isDifferentDate =
      previousItem &&
      (PeviousisCheckIn
        ? previousItem.check_in_date
        : previousItem.check_out_date) !== date;
    // console.log("date===", date, "Is Differant", isDifferentDate);

    // let isDifferentDate = "";
    // let linedate = "";
    // if(isDifferentDate == "") {
    //    isDifferentDate = 0;

    // }else{

    // }

    return (
      <View>
        {(isDifferentDate || index == 0) && (
          <View
            style={[
              styles.header,
              { justifyContent: "space-between", marginVertical: 10 },
            ]}
          >
            <Text style={styles.headerCell}>
              {t(date_with_day)}, {t(date)}
            </Text>
          </View>
        )}

        <View style={{ flexDirection: "row", paddingVertical: 10 }}>
          {/* <View style={{ flexDirection: 'row', paddingVertical: 10,borderTopWidth:   isDifferentDate ? 2 : 0 ,borderBlockColor:Colors.lightprimary }}> */}
          <View
            style={{
              backgroundColor: bgcolorr ? bgcolorr : Colors.lightprimary,
              paddingHorizontal: 10,
              paddingVertical: 10,
              justifyContent: "center",
              alignItems: "center",
              borderRadius: 5,
              width: "25%",
            }}
          >
            <Text style={styles.key}>{endPointType}</Text>
            {row2Dataid && <Text style={styles.key}>{row2Dataid}</Text>}

            {/* <Text style={styles.key}>{item.cico_status}</Text> */}
            {/* <Text style={styles.key}>{item.cico_status_text}</Text>
            <Text style={styles.key}>{t(date)}</Text> */}
            <Text style={styles.key}>{time}</Text>
          </View>
          <View
            style={{
              backgroundColor: Colors.lightprimary,
              width: 2,
              height: "100%",
              marginHorizontal: 5,
            }}
          ></View>
          <View style={{ width: "69%" }}>
            <Text style={styles.key}>
              {/* {row2Dataid} */}
              {/* {'\n'} */}
              {row2Datatitle}
            </Text>
            {
              !isCheckIn &&
              <View>
                <Text style={styles.key}>
                  {/* {row2Dataid} */}
                  {/* {'\n'} */}
                  {t("Breake") + ": "}
                  {break_time?.slice(0, 5)}
                </Text>
                <Text style={styles.key}>
                  {/* {row2Dataid} */}
                  {/* {'\n'} */}
                  {t("Close day") + ": "}
                  {stop_time ? t('Yes') : t('No')}
                </Text>
              </View>
            }

            <Text style={[styles.key, {}]}>
              {endPointType == "Home" ? "" : endPointAddress?.split(",")?.slice(0, -1)?.join(",")}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const formattedData = Object.keys(modaldata).map((category) => ({
    title: category,
  }));

  const formattedDatastart = Object.keys(starting_point_data).map(
    (category) => ({
      title: category,
    })
  );

  const formattedDataend = Object.keys(destination_data).map((category) => ({
    title: category,
  }));

  const onSelect = (title) => {
    setSelected(title); // Update the selected category
    if (modaldata[title]?.length == 1) {
      setMultipleAddressTrue(true)
      MultiAddress = true;
    } else { setMultipleAddressTrue(false); MultiAddress = false }
    setAddresses(modaldata[title]); // Store the data of the selected category
  };
  const onSelect1 = (title) => {
    setSelected1(title);
    if (modaldata[title]?.length == 1) {
      MultiAddress = true
    } else {
      MultiAddress = false
    }
    setDestinations(modaldata[title]); // Store the data of the selected category
  };

  const onAddressSelect = (addressId) => {
    setSelectedAddress(addressId);
    const addressDetails = addresses.find((item) => item.id === addressId);
    setSelectedAddressDetails(addressDetails);
  };

  const onDestinationSelect = (destinationId) => {
    setSelectedDestination(destinationId);
    const destinationDetails = destinations.find(
      (item) => item.id === destinationId
    );
    setSelectedDestinationDetails(destinationDetails);
  };

  // const renderItemradio = ({ item }) => {
  //   return (
  //      <TouchableOpacity
  //     style={styles.checkinoutbg}
  //     onPress={() => onSelect(item.title)}
  //   >
  //     <RadioButton.Android
  //       color={Colors.primary}
  //       value={item.title} // Use category name as value
  //       status={selected === item.title ? "checked" : "unchecked"}
  //       // Update state on press
  //       onPress={() => onSelect(item.title)}
  //     />

  //     <Text style={styles.itemradioText}>{t(item.title)}</Text>
  //   </TouchableOpacity>
  //   )
  // };
  const renderItemradio = ({ item }) => {

    return (
      <TouchableOpacity
        style={[styles.checkinoutbg, { backgroundColor: Colors.primary }]}
        // onPress={() => {onSelect(item.title)

        // }}
        onPress={() => {
          onSelect(item.title)
          if (MultiAddress) {
            setStep(4);
            MultiAddress = false
          } else {
            setStep(3);
          }

        }}
      >
        <RadioButton.Android
          color={Colors.white}
          value={item.title}
          status={selected === item.title ? "checked" : "unchecked"}
          // onPress={() => onSelect(item.title)}
          onPress={() => {
            onSelect(item.title)
            setStep(3);

          }}
        />
        <Text style={[styles.itemradioText, { color: Colors.white }]}>{t(item.title)}</Text>
      </TouchableOpacity>
    );
  };
  const renderItemradio1 = ({ item }) => (
    // <View >
    <TouchableOpacity
      style={[styles.checkinoutbg, { backgroundColor: Colors.green }]}
      onPress={() => {
        onSelect1(item.title);
        item.title === t("Home") && setIsHomeSelected(true); // Update state on press
        if (MultiAddress) {
          setStep(6)
        } else {
          setStep(5)
        }
      }}
    >
      <RadioButton.Android
        color={Colors.white}
        value={item.title} // Use category name as value
        status={selected1 === item.title ? "checked" : "unchecked"}
        onPress={() => {
          setStep(5)
          onSelect1(item.title),
            item.title === t("Home") && setIsHomeSelected(true); // Update state on press
        }}
      />
      <Text style={[styles.itemradioText, { color: Colors.white, fontWeight: 'bold' }]}>{t(item.title)}</Text>
    </TouchableOpacity>
    // </View>
  );

  const renderAddressItem = ({ item }) => {
    return (
      // <View >
      <TouchableOpacity
        style={styles.checkinoutbg}
        // onPress={() => onAddressSelect(item.id)} // Update selected address on press
        onPress={() => {
          onAddressSelect(item.id)
          setStep(4);
        }}
      >
        <RadioButton.Android
          color={Colors.primary}
          value={item.id}
          status={selectedAddress === item.id ? "checked" : "unchecked"} // Check if selected
          // onPress={() => onAddressSelect(item.id)}
          onPress={() => {
            onAddressSelect(item.id)
            setStep(4);
          }}
        />
        <View style={{ flexDirection: "column" }}>
          <Text style={styles.itemradioText}>{t(item.title)}</Text>
          <Text style={styles.itemradioText}>{item.address}</Text>
        </View>
      </TouchableOpacity>
      // </View>
    );
  };

  const renderDestinationItem = ({ item }) => {
    return (
      // <View >
      <TouchableOpacity
        style={styles.checkinoutbg}
        onPress={() => { onDestinationSelect(item.id); setStep(6); }} // Update selected destination on press
      >
        <RadioButton.Android
          color={Colors.primary}
          value={item.id}
          status={selectedDestination === item.id ? "checked" : "unchecked"} // Check if selected
          onPress={() => { onDestinationSelect(item.id); setStep(6); }}
        />
        <View style={{ flexDirection: "column" }}>
          <Text style={styles.itemradioText}>{item.title}</Text>
          <Text style={styles.itemradioText}>{item.address}</Text>
        </View>
      </TouchableOpacity>
      // </View>
    );
  };

  useEffect(() => {
    if (addresses && addresses.length > 0) {
      const defaultAddress =
        addresses.find((address) => address.is_default == true) || addresses[0];
      setSelectedAddress(defaultAddress.id);
      setSelectedAddressDetails(defaultAddress);
    }
  }, [addresses]);

  useEffect(() => {
    if (destinations && destinations.length > 0) {
      const defaultDestination =
        destinations.find((destination) => destination.is_default == true) ||
        destinations[0];
      setSelectedDestination(defaultDestination.id);
      setSelectedDestinationDetails(defaultDestination);
    }
  }, [destinations]);

  useEffect(() => {
    fetchcustomer();
  }, []);

  // useEffect(() => {
  //   if (step >= 5) {
  //     const get = async () => {
  //       let key = await GoogleAPi()
  //       setGOOGLE_API_KEY(key)
  //     }
  //     get();
  //   }

  //   if (step >= 6) {
  //     if (
  //       isTravelCostEnabled
  //     ) {
  //       if (selected === 'Office' || selected1 === 'Office') {
  //         let id;

  //         if (selected === 'Office' && selectedAddressDetails?.id) {
  //           id = selectedAddressDetails.id;
  //         } else if (selected1 === 'Office' && selectedDestinationDetails?.id) {
  //           id = selectedDestinationDetails.id;
  //         }

  //         if (id !== undefined) {
  //           GetCostglobbalyFun(id);
  //           // Alert.alert(String(countcost));
  //         } else {
  //           console.warn("Office selected but ID not found.");
  //         }
  //       }
  //     }
  //   }
  // }, [step])
  useEffect(() => {
    if (relatiesdata?.relaties_data?.is_travel_costs_enable !== undefined) {
      // setIsTravelCostEnabled(relatiesdata.relaties_data.is_travel_costs_enable);
      setIsTravelCostEnabled(
        Boolean(relatiesdata.relaties_data.is_travel_costs_enable)
      );
    }
    if (relatiesdata?.relaties_data?.is_travel_costs_enable == 1) {
      const address1 = selectedAddressDetails?.address;
      const address2 = selectedDestinationDetails?.address;

      if (address1 && address2) {
        calculateDistance(address1, address2)
          .then((distance) => {
            setDistance(distance);
          })
          .catch((error) => console.error(error.message));
      }
    }
  }, [relatiesdata]);
  useEffect(() => {
    const fetchGoogleApiKey = async () => {
      const key = await GoogleAPi();
      setGOOGLE_API_KEY(key);
    };

    const handleTravelCost = () => {
      if (!isTravelCostEnabled) return;

      let id;
      if (selected === 'Office' && selectedAddressDetails?.id) {
        id = selectedAddressDetails.id;
      } else if (selected1 === 'Office' && selectedDestinationDetails?.id) {
        id = selectedDestinationDetails.id;
      }

      if (id !== undefined) {
        GetCostglobbalyFun(id);
      } else {
        console.warn("Office selected but ID not found.");
      }
    };

    // Step 5: fetch Google API Key
    if (step >= 5) {
      fetchGoogleApiKey();
    }

    // Step 6: handle travel cost
    if (step >= 6) {
      setTimeout(() => {
        handleTravelCost();
      }, 0)
    }

  }, [step, selected, selected1, selectedAddressDetails, selectedDestinationDetails, isTravelCostEnabled]);
  async function geocodeAddress(address) {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json`,
        {
          params: {
            address: address,
            key: GOOGLE_API_KEY,
          },
        }
      );
      if (response.data.status === "OK") {

        return response.data.results[0].geometry.location; // { lat, lng }
      } else {
        throw new Error(
          `Geocoding failed for ${address}: ${response.data.status}`
        );
      }
    } catch (error) {
      throw new Error(`Geocoding error: ${error.message}`);
    }
  }

  async function calculateDistance(address1, address2) {
    try {
      const loc1 = await geocodeAddress(address1);
      const loc2 = await geocodeAddress(address2);

      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/distancematrix/json`,
        {
          params: {
            origins: `${loc1.lat},${loc1.lng}`,
            destinations: `${loc2.lat},${loc2.lng}`,
            travelMode: "DRIVING",
            key: GOOGLE_API_KEY,
          },
        }
      );
      if (response.data.status === "OK") {
        const distance =
          response.data.rows[0].elements[0].distance.value / 1000; // Convert to km
        // Alert.alert(String(distance.toFixed(2)))

        return distance.toFixed(2);
      } else {
        throw new Error(`Distance calculation failed: ${response.data.status}`);
      }
    } catch (error) {
      // throw new Error(`Distance calculation error: ${error.message}`);
    }
  }

  const address1 = selectedAddressDetails?.address;
  const address2 = selectedDestinationDetails?.address;

  // calculateDistance(address1, address2)
  //   .then(async (distance) => {
  //     setDistance(distance);
  //     console.log("AllAddress Data Both=>", selected !== undefined &&
  //       selected1 !== undefined &&
  //       countcost !== "" &&
  //       isTravelCostEnabled);



  //     // console.log(`Distance: ${distance} km`);
  //     // Alert.alert(String(distance))

  //   })
  //   .catch((error) => console.error(error.message));
  useEffect(() => {
    const address1 = selectedAddressDetails?.address;
    const address2 = selectedDestinationDetails?.address;
    if (isTravelCostEnabled) {
      if (address1 && address2 && step >= 5) {
        calculateDistance(address1, address2)
          .then((distance) => {
            setDistance(distance);
            SwitchRender(distance);
          })
          .catch((error) => console.error(error.message));
        // console.log("API Call...");

      }
    }
  }, [selectedAddressDetails, selectedDestinationDetails, isTravelCostEnabled]);

  const handleDateChange = (selectedDate) => {
    // console.log("selectedDate", selectedDate);
    if (selectedDate) {
      setEditDate(selectedDate); // Store as a Date object
    }
    setOpen(false);
  };

  const formatDatee = (date) => {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };
  const formatDateForAPI = (date) => {
    return new Date(date).toISOString().split("T")[0];
    // Output: "2025-02-20"
  };

  const formatTime = (time) => {
    let validTime = time instanceof Date && !isNaN(time) ? time : new Date(); // Use current time if invalid

    return validTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false, // Change to true for 12-hour format
    });
  };

  const onRefresh = async () => {


    setRefreshing(true);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    // const [data, setData] = useState([]);
    // const [modaldata, setmodaldata] = useState([]);
    // const [starting_point_data, setstarting_point_data] = useState([]);
    // const [destination_data, setdestination_data] = useState([]);
    // const [relatiesdata, setrelatiesdata] = useState([]);
    // const [addresses, setAddresses] = useState([]);
    // const [destinations, setDestinations] = useState([]);
    // const [scheduledata, setscheuledata] = useState([]);
    // Clear current data
    // Await or ensure data fetching doesn't overlap
    await Promise.all([
      timelinedata(),
      fetchPermission(),
      fetchtimeline(),
      languagedata()

    ]);

    setRefreshing(false);
  };
  async function GetCostglobbalyFun(id, cost = null) {
    // Alert.alert(String(cost))
    setRefreshHold(false);
    try {
      const getdata = await getData("USERDATA");
      let data = await ApiService(apiConstants.test_post, {
        includeToken: true,
        customData: {
          relaties_id: getdata.data.relaties.id,
          role: getdata.data.user.role,
          user_id: getdata.data.user.id,
          cost: cost !== null ? cost : countcost || 0,
          office_id: id
        },
      });
      if (data?.status == true) {
        let postdata = data?.data;
        // Alert.alert(String(data.data.cost))
        // Alert.alert(String(data?.cost))
        setCountCost(`${data.data.cost}`)

      }
      // console.log("New APi Reponse Cheking:", data);

    } catch (error) {
      console.log("Cost Get Api Error:-", error.message);

    }
  }

  // useEffect(() => {
  //   const get = async () => {
  //     try {
  //       const { latitude, longitude } = await getLatLong();

  //       console.log("Coordinates: ", latitude, longitude);
  //       Alert.alert("Location Fetched", `Lat: ${latitude}, Long: ${longitude}`);
  //     } catch (error) {
  //       console.log("Error Get Coordinate useEffect: ", error);
  //       Alert.alert("Error", "Failed to get coordinates.");
  //     }
  //   };
  //   get();
  // }, []);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      const {promptForEnableLocationIfNeeded} = require("react-native-android-location-enabler");
      try {
        await promptForEnableLocationIfNeeded({
          interval: 10000,
          fastInterval: 5000,
        });
        const result = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
        return result === RESULTS.GRANTED;
      } catch (error) {
        console.warn('Android GPS or permission issue:', error);
        return false;
      }
    } else {
      const result = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
      return result === RESULTS.GRANTED;
    }
  };

  const getDeviceCoordinates = async () => {
    const granted = await requestLocationPermission();
    setGPSPermission(granted)
    if (!granted) {
      Alert.alert('Permission Denied', 'Location permission is required to continue.');
      return null;
    }

    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCoordinates({ lat: latitude, lng: longitude })
          console.log("Coordinates", { lat: latitude, lng: longitude });

          resolve({ lat: latitude, lng: longitude });
        },
        (error) => {
          console.warn('Location Error:', error.message);
          reject(null);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    });
  };

  useEffect(() => {
    getDeviceCoordinates()
  }, [isFocused])

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={Colors.white} barStyle={"dark-content"} />

      {loading && <Loader color={Colors.primary} />}
      <View
        style={{
          paddingBottom: 15,
          marginTop: 10,
          borderBottomWidth: 1.5,
          borderBottomColor: Colors.litegray,
          flexDirection: "row",
          // justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 20,
        }}
      >
        <Image
          resizeMode="contain"
          // source={Images.logo}
          source={{ uri: logo }}
          style={{
            width: 80, // Set width only
            aspectRatio: 3, // Keeps aspect ratio (adjust based on the image)
            // backgroundColor: Colors.red, // Debugging
            ...(companyName == "playground" && {
              right: 20,
            }),
          }}
        />

        <Text
          style={{
            fontFamily: FONTS.LexendMedium,
            fontSize: RFValue(18),
            color: Colors.black,
            flex: 1, // Takes up remaining space to center the text
            textAlign: "center",
            right: 30,
          }}
        >
          {t("Timeline")}
        </Text>
        <TouchableOpacity
          style={[styles.icon]}
          onPress={() => onRefresh()}
          refreshing={refreshing}
        >
          <Image
            source={Images.refresh}
            style={styles.searchicon}
            tintColor={Colors.black}
          />
        </TouchableOpacity>
      </View>
      <ScrollView>
        <View style={{ paddingHorizontal: 15 }}>

          <FlatList
            data={data}
            renderItem={renderItem}
            bounces={false}
            keyExtractor={(item, index) => item?.date || index?.toString()}
            horizontal={true} // Enable horizontal scrolling
            showsHorizontalScrollIndicator={false} // Hide scroll bar
            contentContainerStyle={{
              width: "100%",
            }}
          />
        </View>
        {/* 
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary, "#F048C6"]}
            tintColor={Colors.primary}
          />
        }
      > */}
        <FlatList
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 15 }}
          bounces={false}
          data={timelinedataa}
          ref={flatListRef}
          keyExtractor={(item, index) =>
            item?.id ? item.id.toString()+index : `item-${index}`
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary, "#F048C6"]}
              tintColor={Colors.primary}
            />
          }
          // data={data}
          renderItem={renderItem1}

        />
        {/* <FlatList
        showsVerticalScrollIndicator={false}
        bounces={false}
        data={timelinedataa}
        ref={flatListRef}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary, "#F048C6"]}
            tintColor={Colors.primary}
          />
        }
        // data={data}
        renderItem={renderItem1}
        keyExtractor={(item) => `${item.id}`}
        ListHeaderComponent={() => (
          <>
            <FlatList
              data={data}
              renderItem={renderItem}
              bounces={false}
              keyExtractor={(item, index) => item.date || index.toString()}
              horizontal={true} // Enable horizontal scrolling
              showsHorizontalScrollIndicator={false} // Hide scroll bar
              contentContainerStyle={{
                width: "100%",
              }}
            />
          </>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyListContainer}>
            <Text
              style={[styles.day, { alignSelf: "center", marginTop: 15 }]}
            >
              {t("No Data")}
            </Text>
          </View>
        )}
        contentContainerStyle={{
          marginHorizontal: 10,
          padding: 5,
        }}
      /> */}
        {/* </ScrollView> */}

        {/* <Modal
        visible={visible}
        onBackdropPress={() => setVisible(false)}
        avoidKeyboard={true}
        style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", margin: 0 }}
      >
        <View
          style={[
            styles.modal,
            { width: "90%", alignSelf: "center", paddingVertical: 20 },
          ]}
        >
          <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
            <TouchableOpacity
              style={styles.closebtnbg}
              onPress={() => setVisible(false)}
            >
              <Image source={Images.close} style={{ height: 20, width: 20 }} />
            </TouchableOpacity>
          </View>
          <Text
            style={{
              fontSize: 18,
              fontFamily: FONTS.LexendBold,
              marginBottom: 10,
            }}
          >
            Update Available
          </Text>
          <Text>
            Your app version is outdated. Please update to the latest version.
          </Text>

          <TouchableOpacity
            onPress={openStore}
            style={{
              marginTop: 20,
              padding: 10,
              backgroundColor: Colors.primary,
              borderRadius: 5,
              fontFamily: FONTS.LexendRegular,
            }}
          >
            <Text
              style={{
                color: Colors.white,
                fontFamily: FONTS.LexendBold,
                alignSelf: "center",
              }}
            >
              Update Now
            </Text>
          </TouchableOpacity>
        </View>
      </Modal> */}
        <View>

          <Modal
            isVisible={isLoading}
            animationIn={"zoomIn"}
            animationOut={"zoomOut"}
          >
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size={'large'} color={Colors.primary} />
            </View>
          </Modal>

        </View>
        {ModalCheckIn && <CustomModal
          Title={t("EmployeeCheckIn")}
          MiddleText={`${editdate ? formatDateForAPI(editdate) : formatDate} (${edittime ? formatTime(edittime) : formatTime(currentTime)
            })
    ${selected || "N/A"}  ${" > "} ${selected1 || "N/A"}`}
          isVisible={ModalCheckIn}
          setVisible={setModalChekIn}
        />}
        {ModalCheckOut && <CustomModal
          Title={t("EmployeeCheckOut")}
          MiddleText={`${editdate ? formatDateForAPI(editdate) : formatDate}(${edittime ? formatTime(edittime) : formatTime(currentTime)
            })
    ${selected || "N/A"}${" >"}  ${selected1 || "N/A"}`}
          isVisible={ModalCheckOut}
          setVisible={setModalCheckOut}
        />}

        <Modal
          avoidKeyboard={true}
          isVisible={checkinVisible}
          onBackdropPress={() => { setCheckOutVisible(false); MultiAddress = false }}
          animationIn={"zoomIn"}
          animationOut={"zoomOut"}
        >
          <View style={styles.modal}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: "row", justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                {

                  step == 1 ? <View /> :
                    <TouchableOpacity
                      style={styles.closebtnbg}
                      onPress={() => {
                        if (addresses?.length == 1) {
                          setStep(step - 2)
                          setAddresses([])
                        } else {
                          setStep(step - 1);
                        }
                        // setAddresses(modaldata[selected] || []),
                        // setAddresses(modaldata[selected1] || []);
                      }}
                    >
                      <Image
                        source={Images.back}
                        style={{ height: 20, width: 20 }}
                      />
                    </TouchableOpacity>
                }
                <TouchableOpacity
                  style={styles.closebtnbg}
                  onPress={() => { setCheckOutVisible(false); MultiAddress = false }}
                >
                  <Image
                    source={Images.close}
                    style={{ height: 20, width: 20 }}
                  />
                </TouchableOpacity>

              </View>
              <Text style={styles.checkinouttext}>
                {" "}
                {isCheckIn == "check_in" ? "Check In" : "Check Out"}
              </Text>
              {step == 1 && (
                <>
                  {relatiesdata?.cico_permission?.can_edit_date_time == true ? (
                    <>
                      <TouchableOpacity onPress={() => setOpen(true)}>
                        <Text style={styles.title}>{t("Date")} :</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.dateInput}
                        onPress={() => setOpen(true)}
                      >
                        <Text
                          style={{
                            color: Colors.black,
                            paddingLeft: 10,
                            fontFamily: FONTS.LexendRegular,
                          }}
                        >
                          {editdate
                            ? formatDatee(editdate)
                            : currentDate || t("Select Datum")}
                        </Text>

                        <View
                          style={{
                            backgroundColor: Colors.primary,
                            padding: 7,
                            borderRadius: 5,
                          }}
                        >
                          <Image
                            source={Images.date}
                            style={{
                              tintColor: Colors.white,
                              height: 20,
                              width: 20,
                            }}
                          />
                        </View>
                      </TouchableOpacity>

                      <DatePicker
                        modal
                        mode="date"
                        date={editdate instanceof Date ? editdate : new Date()}
                        // date={editdate ? editdate : new Date("1990")}
                        open={open}
                        // onConfirm={(selectedDate) => {setEditDate(selectedDate) ,     console.log("Formatted Date:", formatDatee(selectedDate))}}
                        onConfirm={handleDateChange}
                        onCancel={() => {
                          setOpen(false);
                        }}
                        title={t("Voer geboortedatum in")}
                        confirmText="Select"
                        dividerColor={Colors.primary}
                        buttonColor={Colors.primary}
                      />

                      {/* <TextInput
                      style={styles.input}
                      value={editdate}
                      onChangeText={setEditDate}
                      placeholder="Enter Date"
                      placeholderTextColor={Colors.textgray}
                    /> */}

                      <Text style={styles.title}>{t("Time")} :</Text>
                      <>
                        <TouchableOpacity
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: 10,
                            borderWidth: 1,
                            borderRadius: 5,
                            borderColor: "#ccc",
                          }}
                          onPress={() => setOpenTime(true)}
                        >
                          <Text
                            style={{
                              color: "black",
                              paddingLeft: 10,
                              fontFamily: FONTS.LexendRegular,
                            }}
                          >
                            {edittime
                              ? formatTime(edittime)
                              : formatTime(currentTime)}
                          </Text>

                          <View
                            style={{
                              backgroundColor: Colors.primary,
                              padding: 7,
                              borderRadius: 5,
                            }}
                          >
                            <Image
                              source={Images.clock}
                              style={{
                                tintColor: Colors.white,
                                height: 20,
                                width: 20,
                              }}
                            />
                          </View>
                        </TouchableOpacity>

                        <DatePicker
                          modal
                          mode="time"

                          date={edittime instanceof Date ? edittime : new Date()} // Ensure a valid Date object
                          open={openTime}
                          // onConfirm={(selectedTime) => {
                          //   setEditTime(selectedTime instanceof Date ? selectedTime : new Date()); // Store as Date object
                          //   setOpenTime(false);
                          //   console.log("Selected Time:", selectedTime);
                          // }}
                          // date={edittime instanceof Date ? edittime : currentTime} // Default to current time if edittime is null
                          locale="en-GB"
                          is24hourSource="locale"

                          // open={openTime}
                          onConfirm={(selectedTime) => {
                            setEditTime(new Date(selectedTime)); // store as Date object
                            const formatted = moment(selectedTime).format('HH:mm');
                            // console.log("Formatted 24h time:", formatted); // e.g., "13:45"
                            setOpenTime(false);
                          }}

                          onCancel={() => setOpenTime(false)}
                          confirmText="Select"
                          dividerColor="blue"
                          buttonColor="blue"
                        />
                        {/* <DatePicker
                        modal
                        mode="time"
                        date={edittime instanceof Date ? edittime : new Date()} // Ensure a valid Date object
                        locale="en"
                        is24hourSource="locale"
                        open={openTime}
                        onConfirm={(selectedTime) => {
                          setEditTime(new Date(selectedTime)); // Store as Date object
                          setOpenTime(false);
                          console.log("Selected Time:", selectedTime);
                        }}
                        onCancel={() => setOpenTime(false)}
                        title="Select Time"
                        confirmText="Select"
                        dividerColor="blue"
                        buttonColor="blue"
                      /> */}
                      </>

                      {/* <TextInput
                      style={styles.input}
                      value={edittime}
                      onChangeText={setEditTime}
                      placeholder="Enter Time"
                      placeholderTextColor={Colors.textgray}
                    /> */}
                    </>
                  ) : (
                    <>
                      <Text style={styles.title}>{t("Date")} :</Text>
                      <View style={styles.checkinoutbg}>
                        <Text style={styles.title}>{t("Current Date")} :</Text>
                        <Text style={styles.checkouttext}> {currentDate1}</Text>
                      </View>

                      <Text style={styles.title}>{t("Time")} :</Text>
                      <View style={styles.checkinoutbg}>
                        <Text style={styles.title}>{t("Current Time")} :</Text>
                        <Text style={styles.checkouttext}> {currentTime}</Text>
                      </View>
                    </>
                  )}
                  {isCheckIn != "check_in" && permmisiion?.simpel_check_in_out?.read == '1' && (
                    <>
                      <Text style={styles.title}>{t("BREAK TIME")}</Text>
                      <RadioButton.Group
                        onValueChange={(value) => setBreakTime(value)}
                        value={breakTime}
                      >
                        <View
                          style={[
                            styles.radioGroup,
                            {
                              alignItems: "center",
                              justifyContent: "center",
                            },
                          ]}
                        >
                          {["00:00", "00:30", "00:45", "01:00", "01:30"].map(
                            (time, index) => (
                              <TouchableOpacity
                                key={index}
                                style={[
                                  styles.radioButtonContainer,
                                  {
                                    backgroundColor:
                                      breakTime === time
                                        ? Colors.primary
                                        : Colors.white,
                                  },
                                ]}
                                onPress={() => setBreakTime(time)}
                              >
                                <RadioButton.Android
                                  color={Colors.white}
                                  value={time}
                                  status={
                                    breakTime === time
                                      ? "checked"
                                      : "unchecked"
                                  }
                                />
                                <Text
                                  style={[
                                    styles.radioText,
                                    {
                                      color:
                                        breakTime === time
                                          ? Colors.white
                                          : Colors.black,
                                    },
                                  ]}
                                >
                                  {time}
                                </Text>
                              </TouchableOpacity>
                            )
                          )}
                        </View>
                      </RadioButton.Group>
                    </>
                  )}
                  <ButtonComponent
                    title={
                      permmisiion?.simpel_check_in_out?.read == '1'
                        ? isCheckIn == "check_in"
                          ? t("Check In")
                          : t("Check Out")
                        : t("Next")
                    }
                    onPress={async () => {
                      setCountCost("")
                      setDistance(null)
                      if (permmisiion?.simpel_check_in_out?.read == '1') {

                        if (isCheckIn == "check_in") {

                          Checkin();
                        } else {
                          Checkout();
                        }
                      } else {
                        setSelected();
                        setStep(2);
                      }
                    }}
                    marginTop={20}
                  />
                </>
              )}
              {step > 1 && (
                <View style={{ flexDirection: "row", alignItems: "center" }}>

                  <Text
                    style={[
                      styles.checkinouttext,
                      { flex: 1, textAlign: "center" },
                    ]}
                  >
                    {step == 2 && t("Starting Point")}
                    {step == 3 && t(`${selected}`)}
                    {step == 4 && t("Select Destination")}
                    {step == 5 && t(`${selected1}`)}
                    {step == 6 && t(`Travel Cost`)}
                  </Text>
                </View>
              )}
              {step == 2 && (
                <>
                  <View style={styles.radioButtons}>
                    <FlatList
                      data={formattedDatastart}
                      renderItem={renderItemradio}
                      keyExtractor={(item) => `${item?.id}`}
                    />
                  </View>
                  {/* <TouchableOpacity
                    disabled={!selected && true}
                    style={[
                      styles.nextButton,
                      { backgroundColor: selected ? Colors.primary : "#ccc" },
                    ]}
                  // onPress={() => {
                  //   if (selected) {
                  //     setStep(3);
                  //   } else {
                  //     // Alert.alert(" Select Starting Point")
                  //   }
                  // }}
                  >
                    <Text style={styles.buttontext}>{t("Next")}</Text>
                  </TouchableOpacity> */}
                </>
              )}
              {step == 3 && (
                <>
                  <FlatList
                    data={addresses}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderAddressItem}
                  />
                  {/* <TouchableOpacity
                    disabled={!selectedAddress && true}
                    style={[
                      styles.nextButton,
                      {
                        backgroundColor: selectedAddress
                          ? Colors.primary
                          : "#ccc",
                      },
                    ]}
                    // onPress={() => setStep(4)}
                    onPress={() => {
                      if (selectedAddress) {
                        setStep(4);
                      } else {
                        // Alert.alert(" Select Starting Point")
                      }
                    }}
                  >
                    <Text style={styles.buttontext}>{t("Next")}</Text>
                  </TouchableOpacity> */}
                  {/* <TouchableOpacity
                  style={styles.nextButton}
                  onPress={() => setStep(4)}
                >
                  <Text style={styles.buttontext}>{t("Next")}</Text>
                </TouchableOpacity> */}
                </>
              )}
              {step == 4 && (
                <>
                  <FlatList
                    data={formattedDataend}
                    keyExtractor={(item) => `${item?.id}`}
                    renderItem={renderItemradio1}
                  />

                  {isCheckIn !== "check_in" && selected1 === t("Home") && (
                    <>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginVertical: 10,
                        }}
                      >
                        <Text
                          style={[
                            styles.itemradioText,
                            { flex: 1, textAlign: "right" },
                          ]}
                        >
                          {t("Closing Day")}
                        </Text>
                        <Switch
                          value={isHomeSelected}
                          onValueChange={setIsHomeSelected}
                          trackColor={{
                            false: Colors.Boxgray,
                            true: Colors.primary,
                          }}
                          thumbColor={isHomeSelected ? "white" : "white"}
                        />
                      </View>
                    </>
                  )}

                  {/* <TouchableOpacity
                    disabled={!selected1 && true}
                    style={[
                      styles.nextButton,
                      { backgroundColor: selected1 ? Colors.primary : "#ccc" },
                    ]}
                    onPress={() => {
                      if (selected1) {
                        setStep(5);
                      }
                    }}
                  >
                    <Text style={styles.buttontext}>{t("Next")}</Text>
                  </TouchableOpacity> */}
                </>
              )}
              {step == 5 && (
                <>
                  <FlatList
                    data={destinations}
                    keyExtractor={(item) => item?.id.toString()}
                    renderItem={renderDestinationItem}
                  />
                  {/* <TouchableOpacity
                    disabled={!selectedDestination && true}
                    style={[
                      styles.nextButton,
                      {
                        backgroundColor: selectedDestination
                          ? Colors.primary
                          : "#ccc",
                      },
                    ]}
                    onPress={() => {
                      if (selectedDestination) {
                        setStep(6);
                      }
                    }}
                  >
                    <Text style={styles.buttontext}>{t("Next")}</Text>
                  </TouchableOpacity> */}
                </>
              )}
              {step == 6 && (
                <>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={styles.itemradioText}>
                      {t("Enable Travel Cost")}
                    </Text>
                    <View
                      style={{
                        borderColor: Colors.Boxgray,
                        borderWidth: 1,
                        borderRadius: 50,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Switch
                        value={isTravelCostEnabled}
                        onValueChange={() => setIsTravelCostEnabled(pre => !pre)}
                        trackColor={{
                          false: Colors.Boxgray,
                          true: Colors.primary,
                        }}
                        thumbColor={isTravelCostEnabled ? "white" : "white"}
                      />
                    </View>
                  </View>

                  <View style={styles.checkinoutbg}>
                    <Text style={styles.title}>{t("Distance")} : </Text>
                    <Text style={styles.checkouttext}> {distance || 0} Km</Text>
                  </View>
                  <View style={[styles.checkinoutbg, { marginBottom: 20 }]}>
                    <Text style={styles.title}>{t("Cost")} : </Text>
                    {
                      isTravelCostEnabled ? <Text style={styles.checkouttext}>
                        {/* {(Number(distance) * Number(cost)).toFixed(2)} */}
                        {Number(countcost) ? `${countcost}` : "0.00"}
                      </Text>
                        :
                        <Text style={styles.checkouttext}>
                          {/* {(Number(distance) * Number(cost)).toFixed(2)} */}
                          {"0.00"}
                        </Text>

                    }
                    {/* <Text style={styles.checkouttext}>
                    
                    {isTravelCostEnabled ? (countcost || "0") : "0.00"}
                  </Text> */}
                  </View>

                  <TouchableOpacity
                    style={styles.nextButton}
                    onPress={() => {
                      if (isCheckIn !== "check_in") {
                        setStep(7);
                      } else {
                        setData([])
                        setTimelineData([])
                        Checkin();
                        setCheckOutVisible(false);
                        fetchcustomer();
                      }
                    }}
                  >
                    <Text style={styles.buttontext}>
                      {isCheckIn == "check_in" ? t("Check In") : t("Next")}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
              {isCheckIn !== "check_in" && step == 7 && (
                <>
                  <Text style={styles.sectionTitle}>{t("BREAK TIME")}*</Text>
                  <RadioButton.Group
                    onValueChange={(value) => setBreakTime(value)}
                    value={breakTime}
                  >
                    <View style={styles.radioGroup}>
                      {["00:00", "00:30", "00:45", "01:00", "01:30"].map(
                        (time, index) => (
                          <TouchableOpacity key={index} style={styles.radioButtonContainer} onPress={() => setBreakTime(time)}>
                            <RadioButton.Android
                              color={Colors.primary}
                              value={time}
                              status={
                                breakTime === time ? "checked" : "unchecked"
                              }
                            />
                            <Text style={styles.radioText}>{time}</Text>
                          </TouchableOpacity>
                        )
                      )}
                    </View>
                  </RadioButton.Group>

                  <Text style={styles.sectionTitle}>{t("STOP TIME")}*</Text>
                  <RadioButton.Group
                    onValueChange={(value) => setStopTime(value)}
                    value={stopTime}
                  >
                    <View style={styles.radioGroup}>
                      {["Yes", "No"].map((option, index) => (
                        <TouchableOpacity key={index} style={styles.radioButtonContainer} onPress={() => setStopTime(option)}>
                          <RadioButton.Android
                            color={Colors.primary}
                            value={option}
                            status={stopTime === option ? "checked" : "unchecked"}
                          />
                          <Text style={styles.radioText}>{option}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </RadioButton.Group>

                  <Text style={styles.sectionTitle}>{t("DESCRIPTION")}</Text>
                  <TextInput
                    style={[styles.textInput, { marginBottom: 20 }]}
                    value={description}
                    onChangeText={setDescription}
                    placeholder={t("Enter description...")}
                    multiline
                    placeholderTextColor={Colors.textgray}
                  />

                  <TouchableOpacity
                    style={styles.nextButton}
                    onPress={() => {
                      if (!breakTime) {
                        Alert.alert(t("Error"), t("Please select break time"));
                        return;
                      } else if (!stopTime) {
                        Alert.alert(t("Error"), t("Please select stop time"));
                        return;
                      } else {
                        setData([])
                        setTimelineData([])
                        Checkout();
                        setCheckOutVisible(false);
                        fetchcustomer();
                      }
                    }}
                  >
                    <Text style={styles.buttontext}>{t("Check Out")}</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </Modal>

        {/* <View style={styles.addbutton}> */}

        {/* {loading ? (
        <Text>Loading...</Text>
      ) : isAllowed ? (
        <TouchableOpacity
          style={styles.addbuttonTouch}
          onPress={() => {
            fetchcustomer();
            setStep(1);
            setCheckOutVisible(true);
            onSelect(),
              onSelect1(),
              setEditDate(""),
              setEditTime(""),
              // setEditDate(currentDate),
              setEditTime(currentTime);
          }}
        >
          <Image source={Images.plus} style={{ width: 25, height: 25 }}></Image>
        </TouchableOpacity>
      ) : (
        <Text>Button is Hidden</Text>
        
      )}  */}
      </ScrollView>

      {!loading && isAllowed && (
        <TouchableOpacity
          style={styles.addbuttonTouch}
          onPress={() => {
            fetchcustomer();
            setStep(1);
            setCheckOutVisible(true);
            onSelect();
            onSelect1();
            setEditDate("");
            setEditTime("");
            if (!GPSPermission) {
              getDeviceCoordinates();
            }
          }}
        >
          <Image source={Images.plus} style={{ width: 25, height: 25 }} />
        </TouchableOpacity>
      )}

      {/* </View> */}
    </SafeAreaView>
  );
};

export default Timeline;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  row1: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cell: {
    flex: 1,
    alignSelf: "center",
    textAlign: "center",
    fontSize: 12,
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
  },
  box1: {
    // borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    // flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingVertical: 10,
    backgroundColor: Colors.lightprimary,
    borderRadius: 5,
    // justifyContent: "space-between",
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCell: {
    // flex: 1,
    alignSelf: "center",
    textAlign: "center",
    fontFamily: FONTS.LexendMedium,
    // textAlign: 'center',
    fontSize: 13,
    color: Colors.black,
  },
  addbutton: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginHorizontal: 20,
  },
  addbuttonTouch: {
    width: 50,
    height: 50,
    backgroundColor: Colors.primary,
    borderRadius: 25,
    // marginBottom: 20,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    right: 10,
    bottom: 10,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    width: Dimensions.get("screen").width * 0.8,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "black",
    shadowOffset: { width: 0, height: 2 }, // Shadow direction
    shadowOpacity: 0.3, // Shadow opacity
    shadowRadius: 5, // Shadow blur
  },
  itemradio: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  itemradioText: {
    flex: 1,
    padding: 4,
    color: Colors.black,
    fontFamily: FONTS.LexendRegular,
    width: "70%",
  },
  buttontext: {
    color: Colors.white,
    fontFamily: FONTS.LexendRegular,
  },
  contract: {
    height: RFValue(45),
    width: "100%",
    borderWidth: 1,
    borderColor: Colors.litegray,
    alignSelf: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    borderRadius: 10,
    marginVertical: 10,
  },
  currentdatetime: {
    fontFamily: FONTS.LexendRegular,
    fontSize: RFValue(13),
    color: Colors.black,
  },
  pnbContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 10,
  },
  nextButton: {
    color: "white",
    padding: 10,
    backgroundColor: Colors.primary,
    borderRadius: 5,
    marginBottom: 10,
    alignItems: "center",
    marginTop: 10,
  },
  closeBox: {
    position: "absolute",
    top: 0,
    right: 0,
    margin: 10,
  },
  close: {
    color: "white",
    width: 20,
    height: 20,
    borderColor: "black",
    border: "0.9",
  },
  radioButtons: {
    flexDirection: "row", // Or 'row' depending on your layout preference
    justifyContent: "space-between",
    fontFamily: FONTS.LexendRegular,
    fontSize: 12,
  },
  modal: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 20,
    maxHeight: heightPercentageToDP("90%"),
    paddingBottom: 50
  },
  checkinouttext: {
    alignSelf: "center",
    fontFamily: FONTS.LexendMedium,
    paddingVertical: 10,
    fontSize: RFValue(15),
    color: Colors.black,
  },
  currentdatetime: {
    fontFamily: FONTS.LexendRegular,
    fontSize: RFValue(13),
    color: Colors.black,
  },
  scheduledatabg: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  checkboxbg: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginVertical: 5,
  },
  checkinoutbg: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderColor: Colors.litegray,
    marginVertical: 3,
  },
  checkouttext: {
    fontSize: RFValue(12),
    color: Colors.textgray,
    fontFamily: FONTS.LexendRegular,
  },
  title: {
    paddingVertical: 8,
    fontSize: RFValue(13),
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
  },
  closebtnbg: {
    height: 35,
    width: 35,
    borderWidth: 1,
    borderColor: Colors.litegray,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: Colors.black,
    width: "100%",
    fontFamily: FONTS.LexendRegular,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: FONTS.LexendMedium,
    marginVertical: 8,
    color: Colors.black,
  },
  radioGroup: {
    flexDirection: "row",
    // justifyContent: "space-between",
    marginBottom: 10,
    width: "100%",
    flex: 1,
    flexWrap: "wrap",
  },
  radioButton: {
    padding: 10,
    borderWidth: 1,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 60,
  },
  radioButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  radioText: {
    fontSize: 14,
    fontFamily: FONTS.LexendRegular,
    color: "#000",
  },
  radioTextSelected: {
    color: "#FFF",
  },
  textInput: {
    height: 100,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    textAlignVertical: "top",
    color: Colors.black,
  },
  radioButtonContainer: {
    borderWidth: 1,
    borderRadius: 10,
    borderColor: Colors.Boxgray,
    flexDirection: "row",
    alignItems: "center",
    padding: 5,
    marginBottom: 10,
    marginRight: 10,
  },
  dateInput: {
    width: "100%",
    height: heightPercentageToDP(7),
    backgroundColor: Colors.white,
    borderRadius: 10,
    borderColor: Colors.litegray,
    borderWidth: 1,
    paddingHorizontal: 15,
    alignItems: "center",
    marginTop: 10,
    flexDirection: "row",
    marginBottom: 10,
    justifyContent: "space-between",
  },
  key: {
    fontSize: 14,
    fontFamily: FONTS.LexendMedium,
    color: Colors.black,
  },
  value: {
    fontSize: 12,
    fontFamily: FONTS.LexendRegular,
    color: Colors.primary,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    borderWidth: 1,
    borderRadius: 7,
    borderColor: Colors.litegray,
    height: 38,
    width: 38,
    //padding: 8,
    margin: 10,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    right: 0,
  },
  searchicon: {
    height: RFValue(15),
    width: RFValue(15),
  },
});