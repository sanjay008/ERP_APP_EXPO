import {
  Alert,
  Button,
  Image,
  // SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import Header from "../components/header";
import SelectDropdown from "react-native-select-dropdown";
import { useTranslation } from "react-i18next";
import { Images } from "../constants/images";
import { Colors } from "../constants/color";
import { RFValue } from "react-native-responsive-fontsize";
import { FONTS } from "../constants/fontFamily";
import DatePicker from "react-native-date-picker";
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from "react-native-responsive-screen";
import ApiService from "../utils/Apiservice";
import { getData } from "../utils/storeData";
import apiConstants from "../api/apiConstants";
import BlueHeader from "../components/BlueHeader";
import { SafeAreaView } from "react-native-safe-area-context";

const Leaverequest = ({ route, navigation }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [openTime, setOpenTime] = useState(false);
  const [openendTime, setOpenendTime] = useState(false);
  const [openbreakTime, setOpenBreakTime] = useState(false);
  const [selectedItem, setSelectedItem] = useState({});
  const [selectedItemtype, setSelectedItemtype] = useState({});
  const [date, setDate] = useState("");
  const [time, setTime] = useState(null);
  const [endtime, setendTime] = useState(null);
  const [breaktime, setbreakTime] = useState(null);
  const [totalHours, setTotalHours] = useState("");
  const [input, setInput] = useState("");
  const [employee, setEmployee] = useState("");
  const [types, setTypes] = useState([]);
  const [Editdata, setEditData] = useState([]);
  const [absencedetails, setAbsenceDetails] = useState([]);
  const { leave_id, item } = route.params || {};
  const { type, bgcolor } = route.params;
  console.log(leave_id, "leave id ===", type);

  const formatDateToDDMMYYYY = (date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleDateChange = (selectedDate) => {
    const formattedDate = formatDateToDDMMYYYY(selectedDate); // DD-MM-YYYY
    const formattedDateee = selectedDate.toISOString().split("T")[0]; // Format selected date to "YYYY-MM-DD"
    console.log("===== Formatted Date:", formattedDateee);
    setDate(formattedDateee);
    setOpen(false);
  };

  const employeedata = async () => {
    console.log("hhhcuhsjj=========");
    // setLoading(true);
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.employee, {
        includeToken: true,
        customData: {
          relaties_id: getdata.data.relaties.id,
          role: getdata.data.user.role,
          user_id: getdata.data.user.id,
          // status_id: 2,
        },
      });
      if (data.status) {
        // setLoading(false);
        const formattedData = data.data.map((item) => ({
          ...item.contract,
          title: item.contract.contract_name,
          id: item.contract.id,
          contractDetails: item.contract,
        }));
        setEmployee(formattedData);
        // console.log('kjudshcn===',formattedData);
      } else {
        console.log("false");
        // setLoading(false);
      }
    } catch (err) {
      console.log("Error fetching connections employee data :", err);
    }
  };

  const gettypes = async (id) => {
    console.log("hdaiuhs=====types log ");
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.getleavetypes, {
        includeToken: true,
        customData: {
          relaties_id: getdata.data.relaties.id,
          role: getdata.data.user.role,
          user_id: getdata.data.user.id,
          contract_id: id, // Pass the selected contract ID here
        },
      });
      if (data.status) {
        setTypes(data.data);
        console.log(data.data, "jshrfuhrsf=======");
      } else {
        console.log("False connections");
      }
    } catch (err) {
      console.log("Error types :", err);
    }
  };
  console.log(selectedItemtype?.id, "hdcidksuhudsjch=======");

  const Absencedetails = async () => {
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.Absencerequestdetails, {
        includeToken: true,
        customData: {
          relaties_id: getdata.data.relaties.id,
          role: getdata.data.user.role,
          user_id: getdata.data.user.id,
          leave_id: leave_id,
        },
      });
      if (data.status) {
        const dataa = Array.isArray(data.data) ? data.data : [data.data];
        const processedData = dataa.map((item) => {
          // Return just the necessary data, like `id` or any other field
          return {
            id: item.id,
            contract_name: item.contract_name,
            date: item.date,
            start_time: item.start_time,
            end_time: item.end_time,
            break_time: item.break_time,
            total_hours: item.total_hours,
            schedule_start_time: item?.employerscheduledata?.start_time,
            schedule_end_time: item?.employerscheduledata?.end_time,
            schedule_break_time: item?.employerscheduledata?.break_time,
            schedule_total_time: item?.employerscheduledata?.total_time,
            schedule_id: item?.employerscheduledata?.id,
          };
        });

        // Set the processed data in the state
        setAbsenceDetails(processedData);
      } else {
        console.log("False");
      }
    } catch (err) {
      console.log("Error fetching connections:", err);
    }
  };

  useEffect(() => {
    employeedata();
    Absencedetails();
    gettypes();
    // editdata();
  }, []);

  const handleTimeConfirm = (selectedTime) => {
    setTime(selectedTime);
    setOpenTime(false);
  };

  const handleEndTimeConfirm = (selectedTime) => {
    setendTime(selectedTime);
    setOpenendTime(false);
  };

  const handleBreakTimeConfirm = (selectedTime) => {
    setbreakTime(selectedTime);
    setOpenBreakTime(false);
  };

  // const calculateTotalHours = () => {
  //   if (time && endtime) {
  //     // Convert start and end time to Date objects
  //     const start = new Date(`1990-01-01T${time.toTimeString().slice(0, 5)}`);
  //     const end = new Date(`1990-01-01T${endtime.toTimeString().slice(0, 5)}`);

  //     // Calculate the difference in milliseconds
  //     const diffInMs = end.getTime() - start.getTime();

  //     // Convert breaktime to minutes if it's selected, else default to 0
  //     const breakTimeInMinutes = breaktime
  //       ? breaktime.getMinutes() + breaktime.getHours() * 60
  //       : 0;

  //     // Subtract break time in milliseconds (convert breakTimeInMinutes to ms)
  //     const totalMs = diffInMs - breakTimeInMinutes * 60 * 1000;

  //     // Calculate hours and minutes from totalMs
  //     const hours = Math.floor(totalMs / (1000 * 60 * 60));
  //     const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));

  //     setTotalHours(`${hours}:${minutes < 10 ? "0" : ""}${minutes}`);
  //   } else {
  //     setTotalHours("Invalid time inputs");
  //   }
  // };

  // const calculateTotalHours = () => {
  //   // Ensure end time is valid, fallback to API value if not provided
  //   const end = endtime
  //     ? new Date(`1990-01-01T${endtime.toTimeString().slice(0, 5)}`)
  //     : absencedetails[0]?.end_time
  //     ? new Date(`1990-01-01T${absencedetails[0]?.end_time}`)
  //     : new Date(`1990-01-01T${absencedetails[0]?.schedule_end_time}`); // Default to midnight if not available

  //   // Handle break time calculation properly
  //   const breakTimeInMinutes = breaktime
  //     ? breaktime.getHours() * 60 + breaktime.getMinutes() // Use the correct hour/minute calculation
  //     : absencedetails[0]?.break_time
  //     ? new Date(`1990-01-01T${absencedetails[0]?.break_time}`).getHours() *
  //         60 +
  //       new Date(`1990-01-01T${absencedetails[0]?.break_time}`).getMinutes()
  //     : 0; // Default to 0 if break time not available

  //   // Ensure start time is valid, fallback to API value if not provided
  //   const start = time
  //     ? new Date(`1990-01-01T${time.toTimeString().slice(0, 5)}`)
  //     : absencedetails[0]?.start_time
  //     ? new Date(`1990-01-01T${absencedetails[0]?.start_time}`)
  //     : new Date(`1990-01-01T${absencedetails[0]?.schedule_start_time}`); // Default to midnight if not available

  //   // Calculate the difference in milliseconds between end and start time
  //   const diffInMs = end.getTime() - start.getTime();

  //   // Subtract break time in milliseconds (convert breakTimeInMinutes to ms)
  //   const totalMs = diffInMs - breakTimeInMinutes * 60 * 1000;

  //   // Calculate total time in minutes (convert totalMs to minutes)
  //   const totalMinutes = totalMs / (1000 * 60);

  //   // Convert minutes to decimal hours
  //   const totalHours = totalMinutes / 60;
  //   const finall = totalHours
  //     ? totalHours.toFixed(2)
  //     : absencedetails[0]?.total_hours
  //     ? absencedetails[0]?.total_hours
  //     : absencedetails[0]?.schedule_total_time;

  //   // Format and set the total hours as a decimal number
  //   setTotalHours(finall); // Limiting to 2 decimal places
  // };

  const calculateTotalHours = () => {
    // Ensure end time is valid, fallback to API value if not provided
    const end = endtime
      ? new Date(`1990-01-01T${endtime.toTimeString().slice(0, 5)}`)
      : absencedetails[0]?.end_time
      ? new Date(`1990-01-01T${absencedetails[0]?.end_time}`)
      : new Date(`1990-01-01T${absencedetails[0]?.schedule_end_time}`);

    // Handle break time calculation properly
    const breakTimeInMinutes = breaktime
      ? breaktime.getHours() * 60 + breaktime.getMinutes()
      : absencedetails[0]?.break_time
      ? new Date(`1990-01-01T${absencedetails[0]?.break_time}`).getHours() *
          60 +
        new Date(`1990-01-01T${absencedetails[0]?.break_time}`).getMinutes()
      : 0;

    // Ensure start time is valid, fallback to API value if not provided
    const start = time
      ? new Date(`1990-01-01T${time.toTimeString().slice(0, 5)}`)
      : absencedetails[0]?.start_time
      ? new Date(`1990-01-01T${absencedetails[0]?.start_time}`)
      : new Date(`1990-01-01T${absencedetails[0]?.schedule_start_time}`);

    // Calculate the difference in milliseconds between end and start time
    const diffInMs = end.getTime() - start.getTime();

    // Subtract break time in milliseconds
    const totalMs = diffInMs - breakTimeInMinutes * 60 * 1000;

    // Calculate total time in minutes
    const totalMinutes = totalMs / (1000 * 60);

    // Convert minutes to decimal hours
    const totalHours = totalMinutes / 60;

    // Ensure 0 is correctly handled and set the final total hours
    const finall = totalHours;
    // totalHours !== null && totalHours !== undefined
    //   ? totalHours.toFixed(2)
    //   : absencedetails[0]?.total_hours !== null &&
    //     absencedetails[0]?.total_hours !== undefined
    //   ? absencedetails[0]?.total_hours
    //   : absencedetails[0]?.schedule_total_time;

    // Format and set the total hours
    setTotalHours(finall);
  };
  // Trigger calculateTotalHours whenever any of the time states change

  useEffect(() => {
    calculateTotalHours();
  }, [time, endtime, breaktime]); // Recalculate when any of these change

  // Handle button click to manually calculate (optional)
  const handleButtonClick = () => {
    calculateTotalHours();
  };

  // const calculateTotalHours = () => {
  //   // Ensure end time is valid, fallback to API value if not provided
  //   const end = endtime
  //     ? new Date(`1990-01-01T${endtime.toTimeString().slice(0, 5)}`)
  //     : absencedetails[0]?.end_time
  //     ? new Date(`1990-01-01T${absencedetails[0]?.end_time}`)
  //     : new Date("1990-01-01T00:00:00"); // Default to midnight if not available

  //   // Handle break time calculation properly
  //   const breakTimeInMinutes = breaktime
  //     ? breaktime.getHours() * 60 + breaktime.getMinutes() // Use the correct hour/minute calculation
  //     : absencedetails[0]?.break_time
  //     ? new Date(`1990-01-01T${absencedetails[0]?.break_time}`).getHours() *
  //         60 +
  //       new Date(`1990-01-01T${absencedetails[0]?.break_time}`).getMinutes()
  //     : 0; // Default to 0 if break time not available

  //   // Ensure start time is valid, fallback to API value if not provided
  //   const start = time
  //     ? new Date(`1990-01-01T${time.toTimeString().slice(0, 5)}`)
  //     : absencedetails[0]?.start_time
  //     ? new Date(`1990-01-01T${absencedetails[0]?.start_time}`)
  //     : new Date("1990-01-01T00:00:00"); // Default to midnight if not available

  //   // Calculate the difference in milliseconds between end and start time
  //   const diffInMs = end.getTime() - start.getTime();

  //   // Subtract break time in milliseconds (convert breakTimeInMinutes to ms)
  //   const totalMs = diffInMs - breakTimeInMinutes * 60 * 1000;

  //   // Calculate hours and minutes from totalMs
  //   const hours = Math.floor(totalMs / (1000 * 60 * 60));
  //   const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));

  //   // Format and set the total hours as output
  //   setTotalHours(`${hours}:${minutes < 10 ? "0" : ""}${minutes}`);
  // };

  // const timeToDecimal = (time) => {
  //   console.log("jsdcfkujsdhk====00000=");

  //   if (!time || typeof time !== "string" || !time.includes(":")) {
  //     console.error("Invalid time format:", time);
  //     return 0; // Fallback value if time is invalid
  //   }

  //   const [hours, minutes] = time.split(":").map(Number);
  //   return hours + minutes / 60;
  // };

  // // Calculate total hours
  // useEffect(() => {
  //   console.log("jsdcfkujsdhk=====111111111111");
  //   if (time && endtime && breaktime) {
  //     const startDecimal = timeToDecimal(time);
  //     const endDecimal = timeToDecimal(endtime);
  //     const breakDecimal = timeToDecimal(breaktime);

  //     const calculatedHours = startDecimal - endDecimal - breakDecimal;
  //     setTotalHours(calculatedHours.toFixed(2)); // Keep 2 decimal places
  //   }
  // }, [time, endtime, breaktime]);

  const editdata = async (id) => {
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.editleaveabsence, {
        includeToken: true,
        customData: {
          relaties_id: getdata.data.relaties.id,
          role: getdata.data.user.role,
          user_id: getdata.data.user.id,
          contract_id: id,
          leave_type: selectedItemtype?.id,
          date: date,
          schedule_id: absencedetails[0].schedule_id,
          leave_id: leave_id,
          reason_field: input,
          start_time: time
            ? time.toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })
            : absencedetails[0]?.start_time
            ? absencedetails[0]?.start_time
            : absencedetails[0]?.schedule_start_time,
          end_time: endtime
            ? endtime.toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false, // Ensures 24-hour format
              })
            : absencedetails[0]?.end_time
            ? absencedetails[0]?.end_time
            : absencedetails[0]?.schedule_end_time,
          break_time: breaktime
            ? new Date(breaktime).toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false, // Ensures 24-hour format
              })
            : absencedetails[0]?.break_time
            ? new Date(
                `1990-01-01T${absencedetails[0]?.break_time}`
              ).toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })
            : absencedetails[0]?.schedule_break_time
            ? new Date(
                `1990-01-01T${absencedetails[0]?.schedule_break_time}`
              ).toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })
            : "",
          total_hours: totalHours
            ? totalHours
            : absencedetails[0]?.total_hours
            ? absencedetails[0]?.total_hours
            : absencedetails[0]?.schedule_total_time,
          // total_hours: "9.00",
        },
      });
      if (data.status) {
        setEditData(data);
        console.log(data, "jshrfuhrsf=======edit data ");
      } else {
        Alert.alert("Errors", data.message);
        console.log("False connections");
      }
    } catch (err) {
      console.log("Error edit errorss11111  :", err);
    }
  };

  // const CreateLeave = async () => {
  //   try {
  //     const getdata = await getData("USERDATA");
  //     console.log("1111111111111");
  //     const data = await ApiService(apiConstants.storeleaveabsence, {
  //       includeToken: true,
  //       customData: {
  //         relaties_id: getdata.data.relaties.id,
  //         role: getdata.data.user.role,
  //         user_id: getdata.data.user.id,
  //         contract_id: selectedItem.id,
  //         leave_type: selectedItemtype?.id,
  //         date: date,
  //         schedule_id: leave_id,
  //         reason_field: input,
  //       },
  //     });
  //     console.log("222222");
  //     console.log("data", data);
  //     if (data.status) {
  //       navigation.goBack();
  //       console.log(data.data, "jshrfuhrsf=======edit data ");
  //     } else {
  //       Alert.alert("Errors", data.message);
  //       console.log("False connections");
  //     }
  //   } catch (err) {
  //     console.log("Error edit error  :", err);
  //     // Alert.alert("Error", err);
  //   }
  // };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgcolor }]}>
      {/* <Header back title={"Leave Request"} /> */}
      {/* <StatusBar backgroundColor={bgcolor} barStyle={"light-content"} /> */}
      <BlueHeader title={t("Leave Requests")} />
      <View
        style={{
          backgroundColor: Colors.white,
          height: "100%",
          marginTop: RFValue(45),
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        }}
      >
        <ScrollView showsVerticalScrollIndicator={false} style={{}}>
          <Text style={styles.title}>{t("Contract")}</Text>
          <SelectDropdown
            data={employee}
            onSelect={(selectedItem) => {
              setSelectedItem(selectedItem); // Set the selected item state
              gettypes(selectedItem.id); // Fetch leave types for the selected employee
              editdata(selectedItem.id);
            }}
            renderButton={(selectedItem, isOpened) => {
              return (
                <View style={[styles.dropdownButtonStyle]}>
                  <Text
                    style={[
                      styles.dropdownButtonTxtStyle,
                      { color: Colors.black },
                      // { color: selectedItem ? Colors.black : Colors.textgray },
                    ]}
                  >
                    {selectedItem?.title
                      ? selectedItem.title
                      : item?.employementdata?.contract_name || t("Contract")}
                  </Text>
                  <Image
                    source={Images.down}
                    style={{
                      height: 20,
                      width: 20,
                      tintColor: Colors.textgray,
                    }}
                  />
                </View>
              );
            }}
            renderItem={(item, index, isSelected) => {
              return (
                <TouchableOpacity
                  style={[
                    styles.dropdownItemStyle,
                    isSelected && { backgroundColor: Colors.white },
                  ]}
                  onPress={() => {}}
                >
                  <Text style={styles.dropdownItemTxtStyle}>{item.title}</Text>
                </TouchableOpacity>
              );
            }}
            showsVerticalScrollIndicator={false}
            dropdownStyle={styles.dropdownMenuStyle}
          />

          <Text style={[styles.title, { marginTop: 10 }]}>{t("Datum")}</Text>
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
              {date ? date : item.date || t("Select Datum")}
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
                style={{ tintColor: Colors.white, height: 20, width: 20 }}
              />
            </View>
          </TouchableOpacity>
          <DatePicker
            modal
            mode="date"
            date={date ? new Date(date) : new Date("1990")}
            open={open}
            onConfirm={handleDateChange}
            onCancel={() => {
              setOpen(false);
            }}
            title={t("Voer geboortedatum in")}
            confirmText="Select"
            dividerColor={Colors.primary}
            buttonColor={Colors.primary}
          />

          <Text style={styles.title}>{t("Verlaat Type")}</Text>
          <SelectDropdown
            data={types}
            disabled={!selectedItem?.id}
            onSelect={(item) => setSelectedItemtype(item)}
            renderButton={(selectedItemtype) => (
              <View style={[styles.dropdownButtonStyle]}>
                <Text
                  style={[
                    styles.dropdownButtonTxtStyle,
                    {
                      color: Colors.black,
                    },
                  ]}
                >
                  {selectedItemtype
                    ? selectedItemtype.leave_type_name
                    : item?.leave_type_data?.leave_type_name ||
                      t("Select Verlaat Type")}
                </Text>
                <Image
                  source={Images.down}
                  style={{
                    height: 20,
                    width: 20,
                    tintColor: Colors.textgray,
                  }}
                />
              </View>
            )}
            renderItem={(item, index, isSelected) => (
              <TouchableOpacity
                style={[
                  styles.dropdownItemStyle,
                  isSelected && { backgroundColor: Colors.white },
                ]}
              >
                {/* <Text style={styles.dropdownItemTxtStyle}>{item.title}</Text> */}
                <Text style={styles.dropdownItemTxtStyle}>
                  {item.leave_type_name}
                </Text>
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
            dropdownStyle={styles.dropdownMenuStyle}
          />

          <Text style={styles.title}>{t("Keden")}</Text>
          <View style={styles.input}>
            <TextInput
              value={input}
              placeholder="Type here..."
              placeholderTextColor={Colors.textgray}
              style={{
                position: "absolute",
                padding: 10,
                width: "100%",
                color: Colors.black,
                fontFamily: FONTS.LexendRegular,
              }}
              onChangeText={(txt) => setInput(txt)}
              multiline
              maxLength={30}
            />
            <Text style={styles.charCount}>
              {t("Max")} {30} {t("characters")}
            </Text>
          </View>

          {type == "edit" && (
            <>
              <>
                <Text style={styles.title}>{t("Start Time")}</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => setOpenTime(true)}
                >
                  <Text
                    style={{
                      color: Colors.black,
                      paddingLeft: 10,
                      fontFamily: FONTS.LexendRegular,
                    }}
                  >
                    {time
                      ? time.toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })
                      : absencedetails[0]?.start_time
                      ? absencedetails[0]?.start_time
                      : absencedetails[0]?.schedule_start_time}
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
                      style={{ tintColor: Colors.white, height: 20, width: 20 }}
                    />
                  </View>
                </TouchableOpacity>

                <DatePicker
                  modal
                  mode="time"
                  date={
                    time
                      ? new Date(time)
                      : absencedetails[0]?.start_time
                      ? new Date(`1990-01-01T${absencedetails[0]?.start_time}`)
                      : absencedetails[0]?.schedule_start_time
                      ? new Date(
                          `1990-01-01T${absencedetails[0]?.schedule_start_time}`
                        )
                      : new Date("1990-01-01T00:00:00")
                  }
                  locale="fr"
                  is24hourSource="locale"
                  open={openTime}
                  onConfirm={handleTimeConfirm}
                  onCancel={() => setOpenendTime(false)}
                  title={t("Select Time")}
                  confirmText="Select"
                  dividerColor={Colors.primary}
                  buttonColor={Colors.primary}
                />
              </>
              <>
                <Text style={styles.title}>{t("End Time")}</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => setOpenendTime(true)}
                >
                  <Text
                    style={{
                      color: Colors.black,
                      paddingLeft: 10,
                      fontFamily: FONTS.LexendRegular,
                    }}
                  >
                    {endtime
                      ? endtime.toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false, // Ensures 24-hour format
                        })
                      : absencedetails[0]?.end_time
                      ? absencedetails[0]?.end_time
                      : absencedetails[0]?.schedule_end_time}
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
                      style={{ tintColor: Colors.white, height: 20, width: 20 }}
                    />
                  </View>
                </TouchableOpacity>

                <DatePicker
                  modal
                  mode="time"
                  date={
                    endtime
                      ? new Date(endtime)
                      : absencedetails[0]?.end_time
                      ? new Date(`1990-01-01T${absencedetails[0]?.end_time}`)
                      : absencedetails[0]?.schedule_end_time
                      ? new Date(
                          `1990-01-01T${absencedetails[0]?.schedule_end_time}`
                        )
                      : new Date("1990-01-01T00:00:00")
                  }
                  locale="fr"
                  is24hourSource="locale"
                  open={openendTime}
                  onConfirm={handleEndTimeConfirm}
                  onCancel={() => setOpenendTime(false)}
                  title={t("Select Time")}
                  confirmText="Select"
                  dividerColor={Colors.primary}
                  buttonColor={Colors.primary}
                />
              </>

              <>
                <Text style={styles.title}>{t("Break Time")}</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => setOpenBreakTime(true)}
                >
                  <Text
                    style={{
                      color: Colors.black,
                      paddingLeft: 10,
                      fontFamily: FONTS.LexendRegular,
                    }}
                  >
                    {breaktime
                      ? breaktime.toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false, // Ensures 24-hour format
                        })
                      : absencedetails[0]?.break_time
                      ? absencedetails[0]?.break_time
                      : absencedetails[0]?.schedule_break_time}
                    {/* {breaktime
                      ? new Date(breaktime).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false, // Ensures 24-hour format
                        })
                      : absencedetails[0]?.break_time
                      ? new Date(
                          `1990-01-01T${absencedetails[0]?.break_time}`
                        ).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })
                      : absencedetails[0]?.schedule_break_time
                      ? new Date(
                          `1990-01-01T${absencedetails[0]?.schedule_break_time}`
                        ).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })
                      : ""} */}
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
                      style={{ tintColor: Colors.white, height: 20, width: 20 }}
                    />
                  </View>
                </TouchableOpacity>

                <DatePicker
                  modal
                  mode="time"
                  date={
                    breaktime
                      ? new Date(breaktime)
                      : absencedetails[0]?.break_time
                      ? new Date(`1990-01-01T${absencedetails[0]?.break_time}`)
                      : absencedetails[0]?.schedule_break_time
                      ? new Date(
                          `1990-01-01T${absencedetails[0]?.schedule_break_time}`
                        )
                      : new Date("1990-01-01T00:00:00")
                  }
                  locale="fr"
                  is24hourSource="locale"
                  open={openbreakTime}
                  onConfirm={handleBreakTimeConfirm}
                  onCancel={() => setOpenBreakTime(false)}
                  title={t("Select Time")}
                  confirmText="Select"
                  dividerColor={Colors.primary}
                  buttonColor={Colors.primary}
                />
              </>

              {/* <Button
                title={t("Calculate Total Hours")}
                onPress={handleButtonClick}
              /> */}

              <Text style={styles.title}>{t("Total Hours")}</Text>
              <View style={styles.contract}>
                {absencedetails.length > 0 && (
                  <Text style={styles.currentdatetime}>
                    {/* {absencedetails[0].total_hours
                      ? absencedetails[0].total_hours
                      : absencedetails[0].schedule_total_time} */}
                    {totalHours
                      ? totalHours
                      : absencedetails[0]?.total_hours
                      ? absencedetails[0]?.total_hours
                      : absencedetails[0]?.schedule_total_time}
                    {/* {totalHours} */}
                  </Text>
                )}
              </View>
            </>
          )}

          <View
            style={[
              styles.buttoncontainer,
              { marginTop: type == "create" ? 50 : 10 },
            ]}
          >
            <TouchableOpacity style={styles.borderbutton}>
              <Text
                style={{
                  color: Colors.black,
                  fontFamily: FONTS.LexendRegular,
                  fontSize: RFValue(14),
                }}
              >
                {t("Sluiten")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.colorbutton}
              onPress={() => {
                if (type == "edit") {
                  if (selectedItem?.id) {
                    editdata(selectedItem.id);
                    if (!Editdata) {
                      Alert.alert(Editdata.message, "errorsssss");
                      console.log(Editdata.message, "idjcoi====000000");
                    } else {
                      console.log(Editdata.message, "idjcoi====");
                      navigation.goBack("");
                    }
                  } else {
                    console.log("Please select a contract first.");
                    // Optionally, display an alert
                    Alert.alert("Error", "Please select a contract first.");
                  }
                } else {
                  if (selectedItem?.id) {
                    console.log("=-=-");
                    if (date) {
                      console.log("oooo-=-");
                      if (selectedItemtype.leave_type_name) {
                        console.log("xxxx-=-");
                        CreateLeave();
                      } else {
                        console.log("Please select a Datum first.");
                        Alert.alert("Please select a Type.");
                      }
                    } else {
                      console.log("Please select a Datum first.");
                      Alert.alert("Please select a Datum.");
                    }
                  } else {
                    console.log("Please select a contract first.");
                    Alert.alert("Error", "Please select a contract first.");
                  }
                }
              }}
            >
              <Text
                style={{
                  color: Colors.white,
                  fontFamily: FONTS.LexendRegular,
                  fontSize: RFValue(14),
                }}
              >
                {t("Opslaan")}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default Leaverequest;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dropdownButtonStyle: {
    width: widthPercentageToDP(90),
    height: heightPercentageToDP(7),
    borderWidth: 1,
    borderColor: Colors.litegray,
    borderRadius: 7,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
    marginTop: RFValue(5),
    marginVertical: 10,
    marginHorizontal: 20,
    marginBottom: 15,
  },
  dropdownButtonTxtStyle: {
    flex: 1,
    fontSize: 14,
    marginLeft: "3%",
    // fontWeight: "500",
    fontFamily: FONTS.LexendRegular,
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
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
  },
  dropdownItemTxtStyle: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
  },
  title: {
    fontSize: RFValue(14),
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
    marginTop: 20,
    marginHorizontal: 20,
  },
  dateInput: {
    width: widthPercentageToDP(90),
    height: heightPercentageToDP(7),
    // maxHeight:'20%',
    backgroundColor: Colors.white,
    borderRadius: 10,
    borderColor: Colors.litegray,
    borderWidth: 1,
    // paddingLeft: 10,
    // paddingRight: 10,
    paddingHorizontal: 15,
    // paddingVertical: 15,
    alignItems: "center",
    marginTop: 10,
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 10,
    justifyContent: "space-between",
  },
  dateInputText: {
    fontSize: RFValue(12),
    fontFamily: FONTS.LexendMedium,
    color: Colors.black,
    paddingLeft: 15,
  },
  input: {
    // height: 120,
    paddingVertical: heightPercentageToDP(4),
    borderWidth: 1,
    borderColor: Colors.litegray,
    borderRadius: 10,
    marginTop: 4,
    paddingHorizontal: 10,
    marginHorizontal: 20,
  },
  charCount: {
    position: "absolute",
    bottom: 5,
    paddingHorizontal: 15,
    fontSize: 12,
    color: Colors.black,
    alignSelf: "flex-end",
  },
  buttoncontainer: {
    flexDirection: "row",
    // position: "absolute",
    // bottom: 20,
    // left: 20, // Keep some spacing from the left side
    // right: 20, // Keep some spacing from the right side
    justifyContent: "space-between",
    marginVertical: 10,
    marginHorizontal: 20,
    marginBottom: 100,
    // marginHorizontal: 20,
    // marginVertical: 20,
  },
  borderbutton: {
    borderColor: Colors.litegray,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    height: heightPercentageToDP(7),
    width: widthPercentageToDP(40),
  },
  colorbutton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    height: heightPercentageToDP(7),
    width: widthPercentageToDP(40),
  },
  contract: {
    height: RFValue(45),
    width: "90%",
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
    paddingHorizontal: 20,
  },
});
