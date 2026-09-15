import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  Alert,
  BackHandler,
  Image,
  // SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Platform,
  ScrollView,
  FlatList,
  TextInput,
  PermissionsAndroid,
  RefreshControl,
} from "react-native";
import Header from "../components/header";
import { Colors } from "../constants/color";
import { Images } from "../constants/images";
import { FONTS } from "../constants/fontFamily";
import Modal from "react-native-modal";
import { RFValue } from "react-native-responsive-fontsize";
import { getData, storeData } from "../utils/storeData";
import {
  heightPercentageToDP,
  heightPercentageToDP as hp,
  widthPercentageToDP,
} from "react-native-responsive-screen";
import { useTranslation } from "react-i18next";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import apiConstants, { employee } from "../api/apiConstants";
import axios from "axios";
import Input from "../components/input";
import SelectDropdown from "react-native-select-dropdown";
import ButtonComponent from "../components/buttonComponent";
// import messaging from "@react-native-firebase/messaging";
import * as RNLocalize from "react-native-localize";
import CheckBox from "react-native-check-box";
import Loader from "../components/loading";
import ApiService from "../utils/Apiservice";
import DatePicker from "react-native-date-picker";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import Footer from "../components/Footer";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Employee from "./Employee";
import { RegisterBackContext } from "../constants/GoBackContext";
import GooglePlacesInput from "../components/GooglePlacesInput";
import LanguageChange from "../components/LanguageChange";

const Home = ({ navigation }) => {
  const googlePlacesRef = useRef(null);
  // const GOOGLE_API_KEY = "AIzaSyBVCjdibPBQN8s0Iy06ITwgMvrRZZRLcog";
  const { RegisterBack, setRegisterBack, GOOGLE_API_KEY, setGOOGLE_API_KEY, setToast } = useContext(RegisterBackContext)
  const { t } = useTranslation();
  const [logo, setLogo] = useState(null);
  const [companyName, setCompanyname] = useState(null);
  const [HomeDataLoad, setHomeDataLoad] = useState(false);
  const { width } = Dimensions.get("screen");
  const { height } = Dimensions.get("window");
  const [modalOptionsVisible, setModalOptionsVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [logmodalVisible, setLogModalVisible] = useState(false);
  const [checkinVisibleproject, setCheckinVisibleproject] = useState(false);
  const [checkOutVisibleproject, setCheckOutVisibleproject] = useState(false);
  const [checkinVisible, setCheckinVisible] = useState(false);
  const [checkOutVisible, setCheckOutVisible] = useState(false);
  const [homedata, setHomeData] = useState([]);
  const [employee, setEmployee] = useState("");
  const [projects, setProjects] = useState("");
  const [employeeerror, setEmployeeerror] = useState("");
  const [projectserror, setprojectseerror] = useState("");
  const [scheduledata, setScheduledata] = useState([]);
  const [checkedItems, setCheckedItems] = useState({});
  const [checkin, setCheckin] = useState([]);
  const [checkinproject, setCheckinproject] = useState([]);
  const [getdata, setgetdata] = useState([]);
  const [getdataproject, setgetdataproject] = useState([]);
  const [checkout, setCheckOut] = useState([]);
  const [breaktime, setBreakTime] = useState({});
  const [breaktimeproject, setBreakTimeproject] = useState({});
  const [selectitem, setSelectItem] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedprojects, setSelectedprojects] = useState(null);
  const [input, setInput] = useState("");
  const [inputproject, setInputproject] = useState("");
  const [selectedBreak, setSelectedBreak] = useState("00:00");
  const [selectedBreakproject, setSelectedBreakproject] = useState("00:00");
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [noschedule, setNoSchedule] = useState("");
  const [checkInOutStatus, setCheckInOutStatus] = useState(null);
  const [checkInOutStatusproject, setCheckInOutStatusproject] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [location, setLocation] = useState("");
  const [locationerror, setLocationerror] = useState("");
  const [focus, setFocus] = useState(false);
  const [address, setAdress] = useState("");
  const [projecterror, setProjecterror] = useState("");
  const [addresserror, setAddresserror] = useState("");
  const [userData, setUserData] = useState("");
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

  const handleCheckOut = () => {
    setIsCheckedIn(false);
    Checkin(selectedEmployee.id);
  };

  const handleCheckIn = () => {
    if (!selectedEmployee) {
      console.error("No employee selected for check-in.");
      return;
    }
    Checkin(selectedEmployee.id);
  };


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

  const updateTime = () => {
    const date = new Date();
    const options = {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    };
    const formattedTime = date.toLocaleTimeString("en-US", options);
    setCurrentTime(formattedTime);
  };

  const formatTime = (time) => {
    return time.slice(0, 5);
  };

  useEffect(() => {
    updateTime();
    const intervalId = setInterval(updateTime, 1000);
    const timeZoneChangeListener = RNLocalize.addEventListener
      ? RNLocalize.addEventListener("change", updateTime)
      : null;
    return () => {
      clearInterval(intervalId);
      if (timeZoneChangeListener) {
        timeZoneChangeListener.remove();
      }
    };
  }, []);

  const companylogoo = async () => {
    const companylogo = await getData("COMPANYLOGO");
    setLogo(companylogo);
    const userDatatatata = await getData("USERDATA");
    setUserData(userDatatatata);
    const companyname = await getData("COMPANYLOGIN");
    setCompanyname(companyname);
    console.log("companyname", companyname);
  };

  const homeiconsdata = async () => {
    setHomeDataLoad(true)
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.home, {
        includeToken: true,
        customData: {
          role: getdata.data.user.role,
          // relaties_id: getdata.data.relaties.id,
          // user_id: getdata.data.user.id,
        },
      });
      if (data?.status) {
        console.log(data);

        // Filter duplicates
        const uniqueData = data?.data.filter(
          (item, index, self) =>
            index === self.findIndex((t) => t.id === item.id)
        );
        setHomeData(uniqueData);
        // console.log(uniqueData, "adjhcdkahcn-=-=-=-");
      } else {
        console.log("false");
        setToast({
          top: 45,
          text: data?.message,
          type: "error",
          visible: true,
        });
      }
    } catch (error) {
      if (axios?.isAxiosError(error)) {
        console.log("📛 API Error Details:", {
          status: error?.response?.status,
          data: error?.response?.data,
          message: error?.message,
        });
        setToast({
          visible: true,
          text: error?.response?.data?.message || t("Something Wrong"),
          type: 'error',
          top: 45,
        })
      }
      // console.log("Error fetching connections home data :", err);
    }
    finally {

      setHomeDataLoad(false)

    }
  };



  const employeedata = async () => {
    // setLoading(true);
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.employee, {
        includeToken: true,
        customData: {
          relaties_id: getdata.data.relaties.id,
          role: getdata.data.user.role,
          status_id: 33,
          user_id: getdata.data.user.id,
        },
      });

      if (data?.status) {
        // setLoading(false);
        const today = new Date();

        const formattedData = data.data.map((item) => ({
          ...item.contract,
          title: item.contract.contract_name,
          id: item.contract.id,
          contractDetails: item.contract,
        }));

        setEmployee(formattedData);

        // Filter for contracts active today and pass to handleSelectEmployee
        const activeContracts = formattedData.filter((item) => {
          const fromDate = new Date(item.from);
          const endDate = new Date(item.end);
          return today >= fromDate && today <= endDate;
        });

        // Call handleSelectEmployee with the first active contract if it exists
        if (activeContracts.length > 0) {
          handleSelectEmployee(activeContracts[0]);
        }
      } else {
        console.log("false");
        // setLoading(false);
        setEmployeeerror(data.message);
        console.log("asjkuahds==============", data.message);
      }
    } catch (err) {
      // setLoading(false);
      console.log("Error fetching connections employee data :", err);
    }
  };

  const getprojectsData = async () => {
    // setLoading(true);
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.getprojects, {
        includeToken: true,
        customData: {
          relaties_id: getdata.data.relaties.id,
          role: getdata.data.user.role,
          user_id: getdata.data.user.id,
        },
      });

      if (data.status) {
        // setLoading(false);
        setProjects(data.data);
      } else {
        // setLoading(false);
      }
    } catch (err) {
      console.log("Error fetching connections employee data :", err);
    }
  };

  const Scheduledata = async (id) => {
    // setLoading(true);
    const requestData = new FormData();
    const verify_token = await getData("USERDATA");
    requestData.append("token", verify_token.data.user.verify_token);
    requestData.append("relaties_id", verify_token.data.relaties.id);
    requestData.append("user_id", verify_token.data.user.id);
    requestData.append("role", verify_token.data.user.role);
    requestData.append("contract_id", id);
    requestData.append("contract_type", "employment_contract");
    requestData.append("todays_date", formatDate);
    // requestData.append("todays_date", currentTime);
    // console.log("schedule data ====", requestData);

    axios({
      method: "POST",
      url: apiConstants.getcontractschedule,
      data: requestData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
      .then((res) => {
        // setLoading(false);
        if (res.data.status) {
          if (res.data.data.success) {
            // setScheduledata(res.data.data.data);
            const scheduleData = res.data.data.data;
            setScheduledata(res.data.data.data);
            // console.log("res.data.data", res.data.data);
            scheduleData.forEach((item) => {
              const { schedule_status } = item;

              if (schedule_status["Not Scheduled"] === true) {
                setSchedule("Not Scheduled");
              } else if (schedule_status["Switch Date"] === true) {
                setSchedule("Switch Date");
              } else if (schedule_status["Absence"] === true) {
                setSchedule("Absence");
              } else if (schedule_status["Leave"] === true) {
                setSchedule("Leave");
              } else if (schedule_status["Scheduled"] === true) {
                setSchedule("Scheduled");
              }

              console.log(schedule, "Current Schedule Status");
            });

          } else {
            console.log("data not found");
          }
        } else {
          console.log("status false");
          setNoSchedule(t("EmployeeError"));
          // setNoSchedule("Employer Calendar Schedules not found for date");
          // setLoading(false);
        }
      })
      .catch((err) => console.log("schedule ===", err));
  };


  const Checkin = async (id) => {
    setLoading(true);
    const requestData = new FormData();
    const verify_token = await getData("USERDATA");

    requestData.append("token", verify_token.data.user.verify_token);
    requestData.append("relaties___id", verify_token.data.relaties.id);
    requestData.append("user_id", verify_token.data.user.id);
    requestData.append("role", verify_token.data.user.role);
    requestData.append("contract_id", id || "");
    requestData.append("original_end_time", selectitem.end_time || "");
    requestData.append("original_break_time", selectitem.break_time || "");
    requestData.append("check_in_out", "1");
    requestData.append("original_day", selectitem.day || "");
    requestData.append("start_time", selectitem.start_time || "");
    requestData.append("original_start_time", currentTime);
    requestData.append("class_id", selectitem.class_id || "");
    requestData.append("schedule_status", schedule || "");
    requestData.append("current_date", currentDate);
    axios({
      method: "POST",
      url: apiConstants.checkin,
      data: requestData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
      .then(async (res) => {
        setLoading(false);
        if (res?.data.status) {
          Alert.alert(
            "Success",
            `${t("EmployeeCheckIn")}\n ${currentDate} ${currentTime}`
          );
          setCheckin(res.data.data);
          await storeData("CHECK_IN_ID", res?.data?.data.id || "");
          await storeData("CHECKINOUT", res?.data?.data?.check_in_out);
          setCheckInOutStatus(res.data.data.check_in_out);
        } else {
          setLoading(false);
          console.log("status false");
        }
      })
      .catch((err) => console.log("check innn========", err));
  };

  const CheckinForProject = async (id) => {
    if (!selectedprojects) {
      setProjecterror("select Project");
      console.log("===");
    } else {

      setCheckinVisibleproject(false);
      console.log("===-1[1[1[[11[1[1[");
      setLoading(true);

      const requestData = new FormData();
      const verify_token = await getData("USERDATA");

      requestData.append("token", verify_token.data.user.verify_token);
      requestData.append("relaties_id", verify_token.data.relaties.id);
      requestData.append("user_id", verify_token.data.user.id);
      requestData.append("role", verify_token.data.user.role);
      requestData.append("todays_date", currentDate);
      requestData.append("project_id", selectedprojects.id);
      requestData.append("currect_time", currentTime);
      requestData.append("currect_address", location);
      // requestData.append("currect_address", address);
      requestData.append(
        "working_address",
        selectedprojects.gmaps_working_address
      );

      requestData.append("project_relaties_id", verify_token.data.relaties.id);
      requestData.append("check_in_out", "1");
      requestData.append("hour_rate", selectedprojects.hour_rate);
      requestData.append("cost", selectedprojects.travel_cost);
      console.log("ccccccccc====", requestData);

      axios({
        method: "POST",
        url: apiConstants.storeprojectcheckin,
        data: requestData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
        .then(async (res) => {
          setLoading(false);
          console.log("status check------:", res.data);
          if (res.data.status) {
            setLoading(false);
            setCheckinVisibleproject(false);
            setCheckInOutStatusproject(res.data.data.check_in_out);
            // setCheckin(res.data.data);
          } else {
            setLoading(false);
            console.log("status false");
          }
        })
        .catch((err) => console.log("check innn========", err));
      // }
    }
  };

  const Checkoutbtn = async () => {
    console.log("resresres", requestData);
    const requestData = new FormData();

    const verify_token = await getData("USERDATA");
    requestData.append("token", verify_token.data.user.verify_token);
    requestData.append("user_id", verify_token.data.user.id);
    requestData.append("relaties_id", verify_token.data.relaties.id);
    requestData.append("role", verify_token.data.user.role);
    requestData.append("current_date", currentDate);

    axios({
      method: "POST",
      url: apiConstants.getcheckout,
      data: requestData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
      .then(async (res) => {
        if (res.data.status) {
          await setgetdata(res.data.data);
          setBreakTime(res.data.break_data);
          await storeData("CHECK_IN_ID", res.data.data.id || "");
          await storeData("CHECKINOUT", res.data.data.check_in_out);
          setCheckInOutStatus(res.data.data.check_in_out);
        } else {
          console.log("false");
        }
      })
      .catch((err) => console.log("get data", err));
  };

  const Checkoutbtnproject = async () => {
    const requestData = new FormData();

    const verify_token = await getData("USERDATA");
    requestData.append("token", verify_token.data.user.verify_token);
    requestData.append("user_id", verify_token.data.user.id);
    requestData.append("relaties_id", verify_token.data.relaties.id);
    requestData.append("role", verify_token.data.user.role);
    requestData.append("todays_date", currentDate);
    // requestData.append("user_id", verify_token.data.user.id);
    // requestData.append("current_date", currentDate);
    axios({
      method: "POST",
      url: apiConstants.getdatacicoprojectid,
      data: requestData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
      .then(async (res) => {
        if (res.data.status) {
          await setgetdataproject(res.data.data);
          setBreakTimeproject(res.data.break_data);
          setCheckInOutStatusproject(res.data.data.check_in_out);
          await storeData("CHECK_IN_ID_PROJECT", res.data.data.id || "");
          await storeData("CHECKINOUT_PROJECT", res.data.data.check_in_out || "");
        } else {
          console.log("false");
        }
      })
      .catch((err) => console.log("get data", err));
  };



  const CheckOut = async () => {
    setLoading(true);
    const requestData = new FormData();
    const verify_token = await getData("USERDATA");

    const check_in_idd = await getData("CHECK_IN_ID");
    requestData.append("token", verify_token.data.user.verify_token);
    requestData.append("start_time_check_out", getdata.start_time || "");
    requestData.append("end_time_check_out", getdata.end_time || "");
    requestData.append("description", input);
    requestData.append("check_in_out", "0");
    requestData.append("original_start_time_out", getdata.original_start_time);
    requestData.append(
      "original_end_time_out",
      getdata.original_end_time || ""
    );
    requestData.append("original_break_time_out", selectedBreak);
    requestData.append("original_day", getdata.day || "");
    requestData.append("user_id", verify_token.data.user.id);
    requestData.append("check_in_id", check_in_idd);
    // console.log(check_in_idd, "check in idddddd===");
    requestData.append("current_time_check_out", currentTime);
    requestData.append("relaties_id", verify_token.data.relaties.id);
    requestData.append("role", verify_token.data.user.role);
    requestData.append("current_date", currentDate);
    console.log(requestData, "egfci====");

    axios({
      method: "POST",
      url: apiConstants.checkout,
      data: requestData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
      .then(async (res) => {
        setLoading(false);

        if (res.data.status) {
          setLoading(false);

          Alert.alert(
            "Success",
            `${t("EmployeeCheckOut")}\nCheck in: ${getdata.current_date} ${getdata.original_start_time
            }\nCheck Out: ${currentDate} ${currentTime}\n ${t(
              "Break"
            )}: ${selectedBreak}\n ${t("Omschrijving")}:${input ? input : "--"}`
          );

          setCheckOut(res.data.data);
          await storeData("CHECKINOUT", res.data.data.check_in_out);
          setCheckInOutStatus(res.data.data.check_in_out);
        } else {
          console.log("status false");
          setLoading(false);
        }
      })
      .catch((err) => console.log(err));
  };

  const CheckOutprojects = async () => {
    console.log("111111");
    setLoading(true);
    const requestData = new FormData();
    const verify_token = await getData("USERDATA");
    const check_in_idd = await getData("CHECK_IN_ID");
    requestData.append("token", verify_token.data.user.verify_token);
    requestData.append("relaties_id", verify_token.data.relaties.id);
    requestData.append("todays_date", currentDate);
    requestData.append("project_id", getdataproject.id);
    requestData.append(
      "check_in_project_time",
      getdataproject.original_start_time
    );
    requestData.append("currect_time", currentTime);
    requestData.append("description", inputproject);
    requestData.append("user_id", verify_token.data.user.id);
    requestData.append("role", verify_token.data.user.role);
    requestData.append("check_in_out", "0");
    requestData.append(
      "original_project_break_time_check_in_out",
      selectedBreakproject
    );
    axios({
      method: "POST",
      url: apiConstants.storeprojectcheckout,
      data: requestData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
      .then(async (res) => {
        setLoading(false);
        console.log("Checkin response:=========", res.data.status);
        if (res.data.status) {
          setLoading(false);
          // setCheckOut(res.data.data);
          // await storeData("CHECKINOUT", res.data.data.check_in_out);
          setCheckInOutStatusproject(res.data.data.check_in_out);
        } else {
          console.log("status false");
          setLoading(false);
        }
      })
      .catch((err) => console.log(err));
  };

  const fetchAllData = async () => {
    try {
      await Promise.all([Checkoutbtn()]);
      await Promise.all([Checkoutbtnproject()]);
      console.log("All data fetched successfully");
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAllData();
      userdata();
    }, [])
  );



  useEffect(() => {
    homeiconsdata();
    employeedata();
    companylogoo();
    getprojectsData();
    getDataFun()
    const fetchAdditionalData = async () => {
      try {
        await homeiconsdata();
        await employeedata();
        await companylogoo();
        await getprojectsData();
        // await Scheduledata();
      } catch (error) {
        console.error("Error fetching additional data:", error);
      }
    };

    fetchAdditionalData();
    // CheckOut();
    //  Checkin();
    // Scheduledata();
  }, []);
  const getDataFun = async () => {
    // const GOOGLEMAPAPIKEY = await getData("GOOGLEMAPAPIKEY");
    // setGOOGLE_API_KEY(GOOGLEMAPAPIKEY)
  }
  const renderItem1 = ({ item, index }) => {
    // console.log("Items Navigate:-",item);

    const handlePress = async () => {
      if (item.link_to === "connections") {
        // navigation.navigate("Customer", { bgcolor: item.color_code });
        navigation.navigate("Connection", { bgcolor: item.color_code });
      } else if (item.link_to === "workorders") {
        navigation.navigate("Workorder", { bgcolor: item.color_code });
      } else if (item.link_to === "project") {
        navigation.navigate("Project", { bgcolor: item.color_code });
        // navigation.navigate("Profile");
      } else if (item.link_to === "employees") {
        navigation.navigate("Employee", { bgcolor: item.color_code });
      } else if (item.link_to === "checkinout") {
        employeedata();
        if (checkInOutStatus == 0) {
          setSelectedEmployee(null);
          setScheduledata(null);
          setNoSchedule("");
          setCheckinVisible(true);
        } else {
          setCheckOutVisible(true);
        }
      } else if (item.link_to === "tasks") {
        navigation.navigate("Tasklist", {
          bgcolor: item.color_code,
          title: t(item.item_title)
        });

      } else if (item.link_to === "tenantcontracts") {
        navigation.navigate("Contract", { bgcolor: item.color_code });
      } else if (item.link_to === "child") {
        navigation.navigate("Connection", {
          type: "child",
          bgcolor: item.color_code,
        });
        // navigation.navigate("ChildContract");
      } else if (item.link_to === "absence_request_employee") {
        navigation.navigate("Employee", {
          bgcolor: item.color_code,
          type: "leaverequest",
        });
        // navigation.navigate("Absencerequest", { bgcolor: item.color_code });
      } else if (item.link_to === "employee_time_registration") {
        navigation.navigate("EmployeeTime", { bgcolor: item.color_code });
      } else if (item.link_to === "child_time_registration") {
        navigation.navigate("ChildTime", { bgcolor: item.color_code });
      } else if (item.link_to === "project_time_registration") {
        navigation.navigate("ProjectTime", { bgcolor: item.color_code });
      } else if (item.link_to === "task_house") {
        navigation.navigate("AddTask", { item: item });
      } else if (item.link_to === "task_child") {
        navigation.navigate("AddTask", { item: item });
      } else if (item.link_to === "task_user") {
        navigation.navigate("AddTask", { item: item });
      } else if (item.link_to === "task_multiple_user") {
        navigation.navigate("TaskMultipalUser", { item: item });
      } else if (item.link_to === "bookinglist") {
        navigation.navigate('BookingList', { itemData: item })
      } else if (item.link_to === "pay_job") {
        navigation.navigate("Payjob", { item: item });
      } else if (item.link_to === "pay_order") {
        navigation.navigate("Payorder", { item: item });
      } else if (item.link_to === "Ticket") {
        // navigation.navigate("Ticket", { item: item });
        navigation.navigate("AllTicket", { item: item });
      } else if (item.link_to === "Check_In/Out_for_Project") {
        getprojectsData();
        Checkoutbtnproject();

        if (checkInOutStatusproject == 0) {
          console.log("===");
          setLocation(null);
          // setSelectedEmployee(null);
          // setScheduledata(null);
          // setNoSchedule("");
          setCheckinVisibleproject(true);
          // setCheckOutVisible(true);
          // handleOpenModal();
        } else {
          // Checkoutbtnproject();
          console.log("---");

          setCheckOutVisibleproject(true);
          // setCheckinVisible(true);
        }
      } else if (item.link_to === "customers") {
        navigation.navigate("Customer", {
          data: item,
          bgcolor: item.color_code,
        });
      } else if (item.link_to === "relaties") {
        navigation.navigate("Profile", { item: item });
      } else if (item.link_to === "MyCompany") {
        navigation.navigate("MyCompany", { item: item });
      } else if (item.link_to === "EcommerceTemplate") {
        navigation.navigate("EcommerceTemplateDetails", { bgcolor: item?.color_code });
      } else if (item?.link_to === "EventList") {
        navigation.navigate("EventList", { bgcolor: item?.color_code });
      } else if (item?.link_to === "MyBookings") {
        navigation.navigate("MyBookings", { bgcolor: item?.color_code });
      }else if (item?.link_to === "AllPastBooking") {
        navigation.navigate("AllPastBooking", { bgcolor: item?.color_code,item_title:item?.item_title });
      }
    };

    return (
      // <View style={styles.boxcontainer1}>
      <TouchableOpacity
        style={[
          styles.icons1,
          {
            backgroundColor: item.color_code ? item.color_code : "#EDB20F",
            marginBottom: index == homedata.length - 1 && 60,
          },
        ]}
        onPress={handlePress}
      >
        <Image
          defaultSource={Images.userblanck}
          source={{ uri: item?.item_image }}
          style={[
            styles.image1,
            { borderRadius: item.link_to == "relaties" ? 5 : 0 },
          ]}
          tintColor={item.link_to != "relaties" && Colors.white}
        />
        {/* <Text>{item.item_image}</Text> */}
        <Text style={styles.text1} numberOfLines={2} ellipsizeMode="tail">
          {t(item.item_title)}
        </Text>
      </TouchableOpacity>
      // </View>
    );
  };

  const RemoveAllKeys = async () => {
    await AsyncStorage.clear();
    setModalVisible(!modalVisible);
    setLogModalVisible(false);
    setModalOptionsVisible(false);
    navigation.navigate("CompanyLogin");
    // navigation.navigate("Login");
    await storeData("SELECT", true);
  };

  const handleSelectEmployee = (selectedItem) => {
    console.log("Selected employee:", selectedItem.id);
    setSelectedEmployee(selectedItem);
    Scheduledata(selectedItem.id).then((data) => {
      setScheduledata(data);
    });
  };
  const handleSelectProjects = (selectedItem) => {
    setProjecterror("");

    console.log("Selected employee:", selectedItem.project_name);
    setSelectedprojects(selectedItem);
  };


  const timerRef = useRef(null);
  useEffect(() => {
    if (checkinVisible) {
      startInactivityTimer();
    }
    return () => clearTimeout(timerRef.current);
  }, [checkinVisible]);

  useEffect(() => {
    if (checkinVisible) {
      startInactivityTimerproject();
    }
    return () => clearTimeout(timerRef.current);
  }, [checkinVisibleproject]);

  const startInactivityTimer = () => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setCheckinVisible(false);
    }, 60000);
  };

  const startInactivityTimerproject = () => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setCheckinVisibleproject(false);
    }, 60000); // 60000 ms = 60 seconds
  };

  const findNearestSchedule = () => {
    let nearestIndex = -1;
    let smallestDifference = Infinity;
    scheduledata.forEach((item, index) => {
      const startTime = new Date(`1970-01-01T${item.start_time}`).getTime();
      const currentTimestamp = new Date(`1970-01-01T${currentTime}`).getTime();
      const difference = Math.abs(currentTimestamp - startTime);

      if (difference < smallestDifference) {
        smallestDifference = difference;
        nearestIndex = index;
      }
    });

    if (nearestIndex !== -1) {
      handleCheckboxChange(nearestIndex);
      setSelectItem(scheduledata[nearestIndex]);
    }
  };

  useEffect(() => {
    if (scheduledata && scheduledata.length > 0) {
      findNearestSchedule();
    }
  }, [scheduledata, currentTime]);

  const handleCheckboxChange = (index) => {
    setCheckedItems(() => {
      const updatedCheckedItems = {};
      updatedCheckedItems[index] = true;
      return updatedCheckedItems;
    });
    setSelectItem(scheduledata[index]);
  };


  const onRefresh = async () => {
    setRefreshing(true); // Start refreshing state

    try {
      // Perform the async operations
      await homeiconsdata(); // Fetch home icons data
      setSelectedEmployee(null);
      setScheduledata(null);
      setNoSchedule("");
      await companylogoo(); // Fetch company logo
      // Uncomment if needed
      // await CheckOut();
      // await Checkin();
    } catch (error) {
      console.error("Error during refresh:", error); // Handle errors gracefully
    } finally {
      // End refreshing after operations are completed
      setTimeout(() => {
        setRefreshing(false);
      }, 1000);
    }
  };



  const convertToMinutes = (time) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };
  const userdata = async () => {
    const userDatatatata = await getData("USERDATA");
    setUserData(userDatatatata);
  };
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.safe, { paddingTop: insets.top, }]}>

      <StatusBar backgroundColor={Colors.white} barStyle={"dark-content"} />
      {loading && <Loader color={Colors.primary} />}


      <View
        style={{
          paddingBottom: 15,
          marginTop: 10,
          borderBottomWidth: 1.5,
          borderBottomColor: Colors.litegray,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          justifyContent: 'space-between'

        }}
      >

        <Image
          resizeMode="contain"
          // source={Images.logo}
          source={{ uri: logo }}
          style={{
            width: 80, 
            aspectRatio: 3, 
          
            ...(companyName == "playground" && {
              right: 20,
            }),
          }}
        />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 15 }}>
          <LanguageChange />
          {/* Right Side: Icon */}
          <TouchableOpacity
            onPress={() => setModalOptionsVisible(true)}
            style={{
              borderWidth: 1,
              borderRadius: 7,
              borderColor: Colors.litegray,
              height: 35,
              width: 35,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Image
              source={Images.dots}
              style={{
                height: 20,
                width: 20,
              }}
            />
          </TouchableOpacity>
        </View>
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
                    ? 90
                    : 50
                  : Platform.OS === "android"
                    ? height > 800
                      ? 40
                      : 30
                    : 50,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.option}
            onPress={() => {
              setModalOptionsVisible(false);
              navigation.navigate("AboutApp");
            }}
          >
            <Text style={styles.modaltext}>{t("Over app")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.option}
            onPress={() => {
              setModalOptionsVisible(true);
              setLogModalVisible(true);
            }}
          >
            <Text style={styles.modaltext}>{t("Uitloggen")}</Text>
          </TouchableOpacity>
          <Modal
            onBackdropPress={() => {
              setLogModalVisible(false);
            }}
            onBackButtonPress={() => {
              setLogModalVisible(false);
            }}
            style={styles.mview}
            visible={logmodalVisible}
          >
            <View style={styles.mcontainer}>
              <Text
                style={[
                  styles.logout,
                  {
                    fontSize: 20,
                    marginTop: 32,
                    fontFamily: FONTS.LexendSemiBold,
                  },
                ]}
              >
                {t("Uitloggen")} ?
              </Text>
              <Text style={styles.logout}>
                {t("Weet u zeker dat u wilt uitloggen?")}
              </Text>
              <View style={styles.bottmModal}>
                <TouchableOpacity
                  style={styles.mdlbutton}
                  onPress={() => setLogModalVisible(false)}
                >
                  <Text style={styles.no}>{t("Annuleren")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={async () => RemoveAllKeys()}
                  style={[
                    styles.mdlbutton,
                    { backgroundColor: Colors.primary },
                  ]}
                >
                  <Text style={[styles.no, { color: Colors.white }]}>
                    {t("Uitloggen")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <TouchableOpacity
            style={styles.option}
            onPress={() => {
              setModalOptionsVisible(false);
              navigation.navigate("Profile");
            }}
          >
            <Text style={styles.modaltext}>{t("My Profile")}</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <FlatList
        data={homedata}
        renderItem={renderItem1}
        // renderItem={renderItem}
        style={{ flexGrow: 1 }}
        // numColumns={2}
        keyExtractor={(item, index) =>
          `${item?.id ?? 'no-id'}-${index}-${Date.now()}`
        }// Unique key
        showsVerticalScrollIndicator={false}
        // columnWrapperStyle={{
        //   justifyContent: "space-between",
        //   paddingHorizontal: 30,
        // }}
        ListEmptyComponent={() => (
          !HomeDataLoad &&
          <View style={{ width, height: height / 1.4, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={styles.text}>{t("No Permission Slide")}</Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 20, paddingTop: 10 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary, "#F048C6"]}
            tintColor={Colors.primary}
          />
        }
      />


      <Modal
        avoidKeyboard={true}
        isVisible={checkinVisible}
        onBackdropPress={() => setCheckinVisible(false)}
      >
        <View style={styles.modal}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
              <TouchableOpacity
                style={styles.closebtnbg}
                onPress={() => setCheckinVisible(false)}
              >
                <Image source={Images.close} style={styles.iconstyle} />
              </TouchableOpacity>
            </View>

            <Text style={styles.checkinouttext}>{t("Check In / Out")}</Text>
            {loading && <Loader style={{ color: Colors.primary }} />}
            <SelectDropdown
              data={employee}
              disabled={employee.length > 0 ? false : true} // data is empty after not open dropdown after data is execute dropdown open condition
              onSelect={handleSelectEmployee}
              renderButton={(selectedItem, isOpened) => {
                return (
                  <View style={[styles.dropdownButtonStyle]}>
                    <Text style={[styles.dropdownButtonTxtStyle]}>
                      {selectedEmployee && selectedEmployee.title
                        ? selectedEmployee.title
                        : employee.length > 0
                          ? t("Contract")
                          : employeeerror}
                    </Text>
                    {employee.length > 0 && (
                      <Image
                        source={Images.down}
                        style={styles.iconstyle}
                        tintColor={Colors.black}
                      />
                    )}
                  </View>
                );
              }}
              renderItem={(item, index) => {
                return (
                  <TouchableOpacity
                    style={[styles.dropdownItemStyle, { padding: 10 }]}
                    onPress={() => {
                      handleSelectEmployee(item);
                    }}
                  >
                    <Text style={styles.dropdownItemTxtStyle}>
                      {item.title}
                    </Text>
                  </TouchableOpacity>
                );
              }}
              showsVerticalScrollIndicator={false}
              dropdownStyle={styles.dropdownMenuStyle}
            />

            {/* <SelectDropdown
              data={employee}
              disabled={employee.length === 0}
              onSelect={handleSelectEmployee}
              renderButton={(selectedItem, isOpened) => {
                return (
                  <View style={styles.dropdownButtonStyle}>
                    <Text style={styles.dropdownButtonTxtStyle}>
                      {selectedEmployee?.title || t("Select Employee")}
                    </Text>
                    <Image
                      source={Images.down}
                      style={styles.iconstyle}
                      tintColor={Colors.black}
                    />
                  </View>
                );
              }}
              renderItem={(item, index) => (
                <TouchableOpacity
                  style={[styles.dropdownItemStyle, { padding: 10 }]}
                  onPress={() => handleSelectEmployee(item)}
                >
                  <Text style={styles.dropdownItemTxtStyle}>{item.title}</Text>
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
              dropdownStyle={styles.dropdownMenuStyle}
            /> */}

            <View style={styles.contract}>
              <Text style={styles.currentdatetime}>{currentDate}</Text>
            </View>

            <View style={styles.contract}>
              <Text style={styles.currentdatetime}>{currentTime}</Text>
            </View>

            {scheduledata && scheduledata.length > 0
              ? scheduledata.map((item, index) => (
                <View key={index} style={styles.datacontainer}>
                  <CheckBox
                    isChecked={!!checkedItems[index]}
                    onClick={() => {
                      handleCheckboxChange(index);
                      setSelectItem(item);
                    }}
                    rightText="Schedule found"
                    rightTextStyle={styles.checkboxrighttext}
                    checkBoxColor="#4E83E7"
                    style={{ flex: 1 }}
                  />

                  <View style={styles.scheduledatabg}>
                    <View style={styles.datatext}>
                      <Text style={styles.data1}>{t("Start time")} : </Text>
                      <Text style={styles.data}>{item.start_time}</Text>
                    </View>
                    <View style={styles.datatext}>
                      {/* <Text style={styles.data1}>{t("Current time")} : </Text> */}
                      <Text style={styles.data1}>{t("Breake")} : </Text>
                      <Text style={styles.data}>{currentTime}</Text>
                    </View>
                  </View>

                  <View style={styles.datatext}>
                    <Text style={styles.data1}>{t("End time")} : </Text>
                    <Text style={styles.data}>{item.end_time}</Text>
                  </View>

                  <View style={styles.checkboxbg}>
                    <View style={styles.schedulebtn}>
                      <Text style={styles.scheduletext}>{schedule}</Text>
                    </View>
                  </View>
                </View>
              ))
              : noschedule && (
                <View style={{ marginVertical: 10 }}>
                  <Text style={styles.noscheduletext}>
                    {noschedule}{" "}
                    <Text style={styles.noscheduledate}>{currentDate} .</Text>
                  </Text>
                </View>
              )}

            <ButtonComponent
              // disabled={noschedule && true}
              // backgroundColor={noschedule ? Colors.litegray : Colors.primary}
              // color={noschedule ? Colors.black : Colors.white}
              backgroundColor={Colors.primary}
              color={Colors.white}
              title={
                getdata.check_in_out == 0 && checkin.check_in_out == 0
                  ? t("Check Out")
                  : t("Check In")
              }
              onPress={() => {
                if (isCheckedIn) {
                  handleCheckOut();
                  setCheckOutVisible(false);
                } else {
                  handleCheckIn();
                  setCheckinVisible(false);
                  Checkoutbtn();
                }
              }}
            />
          </ScrollView>
        </View>
      </Modal>

      <Modal
        avoidKeyboard={true}
        isVisible={checkOutVisible}
        onBackdropPress={() => setCheckOutVisible(false)}
      >
        <View style={styles.modal}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
              <TouchableOpacity
                style={styles.closebtnbg}
                onPress={() => {
                  setCheckOutVisible(false);
                }}
              >
                <Image source={Images.close} style={styles.iconstyle} />
              </TouchableOpacity>
            </View>
            <Text style={styles.checkinouttext}>{t("Check In / Out")}</Text>
            <View style={styles.checkinoutbg}>
              <Text style={styles.title}>{t("Relation")} : </Text>
              <Text style={styles.checkouttext}>{getdata.display_name}</Text>
            </View>
            <View style={styles.checkinoutbg}>
              <Text style={styles.title}>{t("Contract")} : </Text>
              <Text style={styles.checkouttext}>
                {getdata.emp_contract_name}
              </Text>
            </View>
            <View style={styles.checkinoutbg}>
              <Text style={styles.title}>{t("Current date")} : </Text>
              <Text style={styles.checkouttext}>{currentDate}</Text>
            </View>
            <View style={styles.checkinoutbg}>
              <Text style={styles.title}>{t("Currenttime")} : </Text>
              <Text style={styles.checkouttext}>{currentTime}</Text>
            </View>
            <Text style={styles.title}>{t("Break Time")} : </Text>

            <View style={styles.breaktimemain}>
              {/* {breaktime && breaktime.length > 0
                ? breaktime.map((item) => {
                    const formattedTime = formatTime(item.break_time);
                    const isSelected = formattedTime === selectedBreak;

                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.breaktimebg,
                          {
                            backgroundColor: isSelected
                              ? Colors.primary
                              : Colors.white,
                          },
                        ]}
                        onPress={() => setSelectedBreak(formattedTime)}
                      >
                        <Text
                          style={[
                            styles.title,
                            { color: isSelected ? Colors.white : Colors.black },
                          ]}
                        >
                          {formattedTime}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                : null} */}
              {breaktime && breaktime.length > 0 ? (
                // Sort the breaktime array in ascending order
                [...breaktime]
                  .sort(
                    (a, b) =>
                      convertToMinutes(a.break_time) -
                      convertToMinutes(b.break_time)
                  )
                  .map((item) => {
                    const formattedTime = formatTime(item.break_time);
                    const isSelected = formattedTime === selectedBreak;

                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.breaktimebg,
                          {
                            backgroundColor: isSelected
                              ? Colors.primary
                              : Colors.white,
                          },
                        ]}
                        onPress={() => setSelectedBreak(formattedTime)}
                      >
                        <Text
                          style={[
                            styles.title,
                            { color: isSelected ? Colors.white : Colors.black },
                          ]}
                        >
                          {formattedTime}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
              ) : (
                <Text style={styles.checkouttext}>
                  No break times available
                </Text>
              )}
            </View>
            <Text style={styles.title}>{t("Omschrijving")}</Text>

            <View style={styles.input}>
              <TextInput
                value={input}
                // placeholder="Type here..."
                placeholderTextColor={Colors.textgray}
                style={styles.discription}
                onChangeText={(txt) => setInput(txt)}
                multiline
              />
            </View>

            <ButtonComponent
              title={
                getdata.check_in_out == 0 && checkin.check_in_out == 0
                  ? t("Check In")
                  : t("Check Out")
              }
              onPress={() => {
                CheckOut();
                setCheckOutVisible(false);
                setInput(null);
              }}
              marginTop={20}
            />
          </ScrollView>
        </View>
      </Modal>

      <Modal
        avoidKeyboard={true}
        isVisible={checkinVisibleproject}
        onBackdropPress={() => setCheckinVisibleproject(false)}
      >
        <View style={styles.modal}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
              <TouchableOpacity
                style={styles.closebtnbg}
                onPress={() => {
                  setCheckinVisibleproject(false);
                  setProjecterror("");
                  setAddresserror("");
                }}
              >
                <Image source={Images.close} style={styles.iconstyle} />
              </TouchableOpacity>
            </View>
            <Text style={styles.checkinouttext}>{t("Check In / Out")}</Text>
            <SelectDropdown
              data={projects}
              disabled={projects.length > 0 ? false : true} // data is empty after not open dropdown after data is execute dropdown open condition
              onSelect={handleSelectProjects}
              renderButton={(selectedItem, isOpened) => {
                return (
                  <View style={[styles.dropdownButtonStyle]}>
                    <Text style={[styles.dropdownButtonTxtStyle]}>
                      {selectedprojects && selectedprojects.project_name
                        ? selectedprojects.project_name
                        : projects.length > 0
                          ? "Projects"
                          : projectserror
                            ? projectserror
                            : "Projects"}
                    </Text>
                    {projects.length > 0 && !projectserror && (
                      <Image
                        source={Images.down}
                        style={styles.iconstyle}
                        tintColor={Colors.black}
                      />
                    )}
                  </View>
                );
              }}
              renderItem={(item, index) => {
                return (
                  <TouchableOpacity
                    style={[styles.dropdownItemStyle, { padding: 10 }]}
                    onPress={() => {
                      handleSelectProjects(item);
                    }}
                  >
                    <Text style={styles.dropdownItemTxtStyle}>
                      {item.project_name}
                    </Text>
                  </TouchableOpacity>
                );
              }}
              showsVerticalScrollIndicator={false}
              dropdownStyle={styles.dropdownMenuStyle}
            />
            {projecterror && (
              <Text
                style={{
                  color: "red",
                  fontSize: 12,
                  fontFamily: FONTS.LexendRegular,
                }}
              >
                {projecterror}
              </Text>
            )}

            <Text style={[styles.currentdatetime, { marginVertical: 10 }]}>
              {t("Current address")}
            </Text>
            <View style={styles.address}>
              <Image
                source={Images.location}
                style={styles.locationinput}
                tintColor={focus == true ? Colors.primary : Colors.gray}
              />
              {/* <GooglePlacesAutocomplete
                ref={googlePlacesRef}
                placeholder={location ? location : t("Current address")}
                minLength={2}
                autoFocus={false}
                returnKeyType={"search"}
                fetchDetails={true}
                onPress={(data, details = null) => {
                  setLocationerror("");
                  setLocation(data.description);
                }}
                onChangeText={(txt) => setLocation(txt)}
                query={{
                  key: GOOGLE_API_KEY,
                  language: "en",
                }}
                styles={{
                  textInputContainer: [
                    styles.textInputContainer,
                    {
                      borderColor:
                        focus == true ? Colors.primary : Colors.litegray,
                      backgroundColor:
                        focus == true ? Colors.primarylite : "transparent",
                    },
                  ],
                  textInput: styles.textInput,
                  description: styles.predefinedPlacesDescription,
                  predefinedPlacesDescription:
                    styles.predefinedPlacesDescription,
                }}
                nearbyPlacesAPI="GooglePlacesSearch"
                debounce={200}
                textInputProps={{
                  onFocus: () => setFocus(true),
                  onBlur: () => setFocus(false),
                  placeholderTextColor: location
                    ? Colors.black
                    : Colors.textgray,
                }}
              /> */}
              <GooglePlacesInput
                InputStyle={{ backgroundColor: Colors.white }}
                apiKey={GOOGLE_API_KEY}
                value={location}
                onChangeText={setLocation}
                Icon={Images.location}
                onSelect={(item) => {
                  setLocation(item.description);
                  setLocationerror("");

                }}
                placeholder={t("Current address")}
              />
              <Text style={styles.error}>{locationerror}</Text>
            </View>

            <View style={styles.contract}>
              <Text style={styles.currentdatetime}>{currentDate}</Text>
            </View>

            <View style={styles.contract}>
              <Text style={styles.currentdatetime}>{currentTime}</Text>
            </View>
            {selectedprojects && (
              <>
                <Text
                  style={{
                    fontSize: RFValue(14),
                    fontFamily: FONTS.LexendRegular,
                    color: Colors.black,
                    marginTop: RFValue(5),
                  }}
                >
                  {t("Working Address")}
                </Text>
                <View style={styles.contract}>
                  <Text style={styles.currentdatetime}>
                    {selectedprojects.gmaps_working_address}
                  </Text>
                </View>
              </>
            )}

            {/* <Input
              value={address}
              onChangeText={(txt) => {
                setAdress(txt);
                setAddresserror("");
              }}
              title={t("Currunt Address")}
              // iconSource={Images.facebook}
              error={addresserror}
            /> */}

            <ButtonComponent
              marginTop={10}
              onPress={() => {
                CheckinForProject();

                Checkoutbtnproject();
              }}
              title={
                getdata.check_in_out == 0 && checkin.check_in_out == 0
                  ? t("Check Out")
                  : t("Check In")
              }
            />
          </ScrollView>
        </View>
      </Modal>

      <Modal
        isVisible={checkOutVisibleproject}
        onBackdropPress={() => setCheckOutVisibleproject(false)}
        avoidKeyboard={true}
      >
        <View style={styles.modal}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
              <TouchableOpacity
                style={styles.closebtnbg}
                onPress={() => setCheckOutVisibleproject(false)}
              >
                <Image source={Images.close} style={styles.iconstyle} />
              </TouchableOpacity>
            </View>
            <Text style={styles.checkinouttext}>{t("Check In / Out")}</Text>

            <View style={styles.checkinoutbg}>
              <Text style={styles.title}>{t("Project")} : </Text>
              <Text style={styles.checkouttext}>
                {getdataproject?.project_names?.project_name
                  ? getdataproject?.project_names?.project_name
                  : "--"}
              </Text>
            </View>

            <View style={styles.checkinoutbg}>
              <Text style={styles.title}>{t("Current date")} : </Text>
              <Text style={styles.checkouttext}>{currentDate}</Text>
            </View>
            <View style={styles.checkinoutbg}>
              <Text style={styles.title}>{t("Currenttime")} : </Text>
              <Text style={styles.checkouttext}>{currentTime}</Text>
            </View>
            <View style={styles.checkinoutbg}>
              <Text style={styles.title}>
                {t("Check In")} {t("Address")} :{" "}
              </Text>
              <Text style={[styles.checkouttext, { width: "52%" }]}>
                {getdataproject?.currect_address
                  ? getdataproject?.currect_address
                  : getdataproject?.currect_address?.gmaps_working_address
                    ? getdataproject?.currect_address?.gmaps_working_address
                    : "--"}
              </Text>
            </View>
            <Text style={styles.title}>{t("Break Time")} : </Text>

            <View style={styles.breaktimemain}>
              {/* {breaktime && breaktime.length > 0
                ? breaktime.map((item) => {
                    const formattedTime = formatTime(item.break_time);
                    const isSelected = formattedTime === selectedBreak;

                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.breaktimebg,
                          {
                            backgroundColor: isSelected
                              ? Colors.primary
                              : Colors.white,
                          },
                        ]}
                        onPress={() => setSelectedBreak(formattedTime)}
                      >
                        <Text
                          style={[
                            styles.title,
                            { color: isSelected ? Colors.white : Colors.black },
                          ]}
                        >
                          {formattedTime}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                : null} */}
              {breaktimeproject && breaktimeproject.length > 0 ? (
                // Sort the breaktime array in ascending order
                [...breaktimeproject]
                  .sort(
                    (a, b) =>
                      convertToMinutes(a.break_time) -
                      convertToMinutes(b.break_time)
                  )
                  .map((item) => {
                    const formattedTime = formatTime(item.break_time);
                    const isSelected = formattedTime === selectedBreakproject;

                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.breaktimebg,
                          {
                            backgroundColor: isSelected
                              ? Colors.primary
                              : Colors.white,
                          },
                        ]}
                        onPress={() => setSelectedBreakproject(formattedTime)}
                      >
                        <Text
                          style={[
                            styles.title,
                            { color: isSelected ? Colors.white : Colors.black },
                          ]}
                        >
                          {formattedTime}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
              ) : (
                <Text style={styles.checkouttext}>
                  {t("No break times available")}
                </Text>
              )}
            </View>
            <Text style={styles.title}>{t("Omschrijving")}</Text>

            <View style={styles.input}>
              <TextInput
                value={inputproject}
                // placeholder="Type here..."
                placeholderTextColor={Colors.textgray}
                style={styles.discription}
                onChangeText={(txt) => setInputproject(txt)}
                multiline
              />
            </View>

            <ButtonComponent
              title={
                getdataproject.check_in_out == 0 && checkin.check_in_out == 0
                  ? t("Check In")
                  : t("Check Out")
              }
              onPress={() => {
                CheckOutprojects();
                setCheckOutVisibleproject(false);
                setInputproject(null);
                Checkoutbtnproject();
              }}
              marginTop={20}
            />
          </ScrollView>
        </View>
      </Modal>
      {/* 
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => navigation.navigate("Profile")}
        style={{
          flexDirection: "row",
          borderTopStartRadius: 20,
          borderTopEndRadius: 20,
          paddingHorizontal: 25,
          alignItems: "center",
          backgroundColor: Colors.litegray, // Background color for shadow visibility
          borderWidth: 1,
          borderColor: Colors.Boxgray,
          paddingBottom: 15,
          paddingTop: 15,
          position: "absolute",
          bottom: 0,
          width: "100%",
          // marginHorizontal:20,

          // Shadow for iOS
          shadowColor: Colors.black,
          shadowOffset: {
            width: 0,
            height: -2, // Negative value for shadow on top
          },
          shadowOpacity: 0.1, // Adjust for visibility
          shadowRadius: 3.84,

          // Elevation for Android
          elevation: 6,
        }}
      >
        <Image
          source={
            userData?.data?.relaties?.file_path
              ? { uri: userData?.data?.relaties?.file_path }
              : Images.userblanck
          }
          defaultSource={Images.userblanck}
          style={{
            height: 40,
            width: 40,
            borderRadius: 5,
            borderWidth: 1,
            borderColor: Colors.litegray,
            ...(userData?.data?.relaties?.file_path
              ? {}
              : {
                  height: 40,
                  width: 40,
                  borderRadius: 5,
                  borderWidth: 1,
                  borderColor: Colors.litegray,
                }),
          }}
        />
        <Text
          style={{
            fontSize: 16,
            color: Colors.black,
            fontFamily: FONTS.LexendMedium,
            marginLeft: 15,
            width: "80%",
          }}
        >
          {userData?.data?.relaties?.display_name
            ? userData?.data?.relaties?.display_name
            : "Profiel"}
        </Text>
      </TouchableOpacity> */}
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    // paddingHorizontal: 24,
    borderBottomWidth: 1.5,
    borderBottomColor: Colors.litegray,
    flexDirection: "row",
    // alignItems: 'center',
    // backgroundColor:Colors.primaryopacity
  },
  safe: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  modalOptionsContainer: {
    position: "absolute",
    // top: hp("9%"),
    // top: 45,
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
  },
  logout: {
    color: Colors.black,
    fontSize: 16,
    alignSelf: "center",
    fontFamily: FONTS.LexendRegular,
    marginTop: 15,
    alignSelf: "flex-start",
    paddingHorizontal: 25,
  },
  bottmModal: {
    flexDirection: "row",
    marginTop: 34,
    justifyContent: "space-evenly",
    marginHorizontal: 24,
  },
  no: {
    color: Colors.black,
    fontSize: 18,
    fontFamily: FONTS.LexendRegular,
    paddingHorizontal: 20,
  },
  mdlbutton: {
    height: 45,
    backgroundColor: Colors.litegray,
    justifyContent: "center",
    marginBottom: 32,
    borderRadius: 4,
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
  },
  icons: {
    width: 120,
    height: 130,
    backgroundColor: Colors.white,
    alignItems: "center",
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 5,
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
    shadowOffset: { width: -2.5, height: -2.5 },
    shadowRadius: 4,
    elevation: 8,
    justifyContent: "center",
  },
  icons1: {
    flexDirection: "row",
    backgroundColor: "#EDB20F",
    marginHorizontal: 20,
    padding: 20,
    marginVertical: heightPercentageToDP(1.5),
    borderRadius: 10,
    alignItems: "center",
  },
  image: {
    height: 50,
    width: 50,
    marginHorizontal: 20,
  },
  image1: {
    height: 45,
    width: 45,
    // marginHorizontal: 20,

  },
  text: {
    color: Colors.black,
    fontSize: 16,
    marginTop: 10,
  },
  text1: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: FONTS.LexendMedium,
    paddingLeft: 15,
  },
  boxcontainer: {
    flexDirection: "column",
    flex: 1,
    margin: 10,
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 10,
  },
  boxcontainer1: {
    // flex: 1,
    // margin: 10,
    // alignItems: "center",
    // backgroundColor: Colors.white,
    // borderRadius: 10,
  },
  modal: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: hp("90%"),
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
    marginTop: RFValue(5),
    marginVertical: 10,
  },
  dropdownButtonTxtStyle: {
    flex: 1,
    fontSize: RFValue(13),
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
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownItemTxtStyle: {
    flex: 1,
    fontSize: RFValue(13),
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
  },
  datacontainer: {
    borderWidth: 1,
    borderColor: Colors.litegray,
    borderRadius: 10,
    padding: 10,
    marginVertical: 5,
  },
  data1: {
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
  },
  data: {
    fontFamily: FONTS.LexendRegular,
    color: Colors.textgray,
  },
  datatext: {
    flexDirection: "row",
    paddingVertical: 5,
  },
  input: {
    height: hp(15),
    borderWidth: 1,
    borderColor: Colors.litegray,
    borderRadius: 10,
    marginTop: 4,
    paddingHorizontal: 10,
  },
  breaktimebg: {
    borderWidth: 1,
    paddingVertical: 5,
    paddingHorizontal: 14,
    marginRight: 10,
    borderColor: Colors.litegray,
    borderRadius: 10,
  },
  title: {
    paddingVertical: 8,
    fontSize: RFValue(13),
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
  },
  checkouttext: {
    fontSize: RFValue(12),
    color: Colors.textgray,
    fontFamily: FONTS.LexendRegular,
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
  modaltext: {
    color: Colors.black,
    fontFamily: FONTS.LexendRegular,
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
  iconstyle: {
    height: 20,
    width: 20,
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
  checkboxrighttext: {
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
  },
  schedulebtn: {
    backgroundColor: Colors.lightprimary,
    paddingHorizontal: 10,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    height: 30,
    width: "38%",
    marginLeft: 10,
  },
  scheduletext: {
    fontFamily: FONTS.LexendRegular,
    color: Colors.primary,
  },
  noscheduletext: {
    color: Colors.red,
    fontFamily: FONTS.LexendRegular,
    fontSize: RFValue(12),
  },
  noscheduledate: {
    color: Colors.red,
    fontFamily: FONTS.LexendMedium,
    fontSize: RFValue(12),
  },
  breaktimemain: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginVertical: 10,
  },
  discription: {
    position: "absolute",
    padding: 10,
    width: "100%",
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
    maxHeight: 90,
    fontSize: RFValue(12),
  },
  textInputContainer: {
    height: RFValue(45),
    borderWidth: 1,
    borderColor: Colors.litegray,
    borderRadius: 10,
    alignItems: "center",
    paddingHorizontal: 10,
    marginTop: RFValue(5),
    color: Colors.black,
    fontFamily: FONTS.LexendRegular,
    marginBottom: 5,
    backgroundColor: "red",
  },
  textInput: {
    fontSize: 15,
    color: Colors.black,
    fontFamily: FONTS.LexendRegular,
    paddingLeft: 35,
    backgroundColor: "transparent",
  },
  predefinedPlacesDescription: {
    color: "#1faadb",
    color: Colors.black,
    fontFamily: FONTS.LexendRegular,
  },
  address: { zIndex: 30 },
  locationinput: {
    height: 22,
    width: 22,
    borderRadius: 7,
    position: "absolute",
    left: 10,
    top: 18,
    zIndex: 30,
  },
});
