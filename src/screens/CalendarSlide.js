import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Image,
  FlatList,
  StatusBar,
  Alert,
} from "react-native";
import React, { useEffect, useState } from "react";
import { BottamScreens } from "../navigation/bottam";
import { RFValue } from "react-native-responsive-fontsize";
import { Colors } from "../constants/color";
import { Images } from "../constants/images";
import { getData, storeData } from "../utils/storeData";
import { SafeAreaView } from "react-native-safe-area-context";
import { heightPercentageToDP } from "react-native-responsive-screen";
import { FONTS } from "../constants/fontFamily";
import apiConstants from "../api/apiConstants";
import ApiService from "../utils/Apiservice";
import { useFocusEffect } from "@react-navigation/native";
import Loader from "../components/loading";
import Modal from "react-native-modal";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DatePicker from "react-native-date-picker";
import { Calendar, Timeline } from "react-native-calendars";
import moment from "moment";
import Svg, { Circle, Path, Rect } from "react-native-svg";


const CalendarSlide = ({ navigation }) => {
  const [logo, setLogo] = useState(null);
  const [username, setUsername] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(false);
  const { width } = Dimensions.get("screen");
  const { height } = Dimensions.get("window");
  const { t } = useTranslation();
  const [modalOptionsVisible, setModalOptionsVisible] = useState(false);
  const [logmodalVisible, setLogModalVisible] = useState(false);
  const [companyName, setCompanyname] = useState(null);
  const [editdate, setEditDate] = useState(new Date());
  const [editdateformate, setEditDateformate] = useState();
  const [open, setOpen] = useState(false);
  const [opencalender, setOpenCalender] = useState(false);
  const [Weeks, setWeeks] = useState('');
  const formatDate = (date) => {
    return date.toISOString().split("T")[0]; // YYYY-MM-DD format
  };

  useEffect(() => {
    getISOWeek(new Date());
  }, [])
  function getISOWeek(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    setWeeks(weekNo)
    // return weekNo;
  }
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  // console.log("timeline", timeline);
  // const handleDateChange = (selectedDate) => {
  //   console.log("selectedDate", selectedDate);

  //   if (selectedDate) {
  //     setEditDate(selectedDate); // Store as a Date object
  //   }
  //   setOpen(false);
  // };


  const formatDatee = (date) => {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      year: "numeric",
      month: "short",
    });
  };
  const companylogoo = async () => {
    const companylogo = await getData("COMPANYLOGO");
    setLogo(companylogo);
    const username = await getData("USERDATA");
    setUsername(username.data.relaties);
    const companyname = await getData("COMPANYLOGIN");
    setCompanyname(companyname);
    // console.log("companyname", companyname);

    //   console.log(username.data.relaties.display_name,'jhfsiufhiuhuf');
  };


  const getCurrentWeekOfMonth = () => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1); // First day of the current month
    const dayOfWeek = firstDayOfMonth.getDay();
    const startDayOffset = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    const currentDay = today.getDate();
    const currentWeek = Math.ceil((currentDay + startDayOffset) / 7);
    return currentWeek;
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
  const fetchtimeline = async (finalFormattedDate) => {
    // setLoading(true);
    // const timeoutId = setTimeout(() => {
    setLoading(true);
    //   console.log("runningfor 5 sec");
    // }, 100);
    const currentWeek = getCurrentWeekOfMonth(); // Calculate the current week first
    // console.log("currentWeek-=--===--==", finalFormattedDate); // Now you can log the value of currentWeek

    try {
      const getdata = await getData("USERDATA"); // Get the user data
      // console.log("getdata", getdata);

      const data = await ApiService(apiConstants.timeline, {
        includeToken: true,
        customData: {
          role: getdata.data.user.role,
          relaties_id: getdata.data.relaties.id,
          user_id: getdata.data.user.id,
          s_date: finalFormattedDate,
          e_date: finalFormattedDate,

        },
      });

      if (data.success) {
        // console.log(data);
        // console.log("TODAY REPONSE", data.data);

        setLoading(false);
        const processedData = data.data.map((item) => {
          if (item?.calendar_data && item?.calendar_data?.success) {
            // Access the schedule data inside calendar_data
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
                schedule_status_text: schedule.schedule_status_text,
                work_details: schedule.work_details
              })
            );

            // Return item with calendar schedule data added
            return {
              ...item,
              calendarSchedule: calendarSchedule, // Add calendar data to item
            };
          } else {
            setLoading(false);
            // If no calendar data, return the item as is
            return item;
          }
        });

        setTimeline(processedData);
        // setTimeline(data.data); // Set the timeline data
        // console.log("klsdjcisdgbfgbfgbfggfbfgbfg", data.data);
      } else {
        setLoading(false);
      }
    } catch (err) {
      setLoading(false);
      console.log("Error fetching connections home data :", err);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      // Call your functions when the screen is focused
      companylogoo();
    }, [])
  );
  useEffect(() => {
    fetchtimeline(selectedDate);
  }, []);

  const DATA = [
    {
      id: 1,
      name: "Anne Smith",
      icon: Images.home,
      time: "2 Hours ago",
      dic: "Emergency",
      dic1: "Fire",
      discription: "sdjfhi isdjiodfjsciojs oidjsucopdsjfs ojpo;kdjscpod",
    },
    {
      id: 2,
      name: "John Doe",
      icon: Images.home,
      time: "2 Hours ago",
      dic: "Emergency",
      dic1: "Fire",
      discription: "sdjfhi isdjiodfjsciojs oidjsucopdsjfs ojpo;kdjscpod",
    },
    {
      id: 3,
      name: "Anne Smith",
      icon: Images.home,
      time: "2 Hours ago",
      dic: "Emergency",
      dic1: "Fire",
      discription: "sdjfhi isdjiodfjsciojs oidjsucopdsjfs ojpo;kdjscpod",
    },
    {
      id: 4,
      name: "John Doe",
      icon: Images.home,
      time: "2 Hours ago",
      dic: "Emergency",
      dic1: "Fire",
      discription: "sdjfhi isdjiodfjsciojs oidjsucopdsjfs ojpo;kdjscpod",
    },
  ];

  const renderItem = ({ item }) => {
    // Ensure calendar_data exists and is successful
    const calendarData = item?.calendar_data;

    //    {calendarData?.data.map((schedule, index) => { Direct add this lin old render data
    const sortedSchedules = Array.isArray(calendarData?.data)
      ? [...calendarData.data].sort((a, b) => {
        const timeA = new Date(`1970-01-01T${a?.start_time || '00:00'}`);
        const timeB = new Date(`1970-01-01T${b?.start_time || '00:00'}`);
        return timeA - timeB;
      })
      : [];

    // console.log(calendarData?.success, "Calendar Data Success");
    // console.log(item, "Item Data Structure"); // Add a log to inspect the item structure

    return (
      <>
        {calendarData?.success && calendarData?.data?.length > 0 && (
          <View
            style={{
              borderColor: Colors.black,
              borderWidth: 1,
              width: "90%",
              padding: 10,
              marginHorizontal: 20,
              marginVertical: 10,
              borderRadius: 10,
              justifyContent: "center",
              backgroundColor:
                Colors.litegray1, // Set background color dynamically

              // backgroundColor:
              //   calendarData?.data[0]?.branch_calendar?.background_color ||
              //   Colors.white, // Set background color dynamically
            }}
          >
            {/* Display the day and date in a row */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              {/* <Text
                style={{
                  color: Colors.black,
                  fontSize: RFValue(16),
                  fontFamily: FONTS.LexendMedium,
                  paddingVertical: 5,
                }}
              >
                {item.display_date} 
                {calendarData?.data[0]?.schedule_status_text} Display formatted date
              </Text> */}

              <Text
                style={{
                  color: Colors.black,
                  fontSize: RFValue(14),
                  fontFamily: FONTS.LexendMedium,
                  marginVertical: 5
                }}
              >
                {t(calendarData?.data[0]?.day)} {item.display_date}
              </Text>
            </View>

            {/* Map through the `data` array inside `calendar_data` to display schedules */}

            {sortedSchedules.map((schedule, index) => {
              // console.log("seffegegererhb", schedule);

              return (
                // <View
                //   key={index}
                //   style={{
                //     marginTop: 10,
                //     padding: 10,
                //     borderWidth: 1,
                //     borderColor: Colors.textgray,
                //     borderRadius: 5,
                //     paddingHorizontal: 10,
                //     overflow: 'hidden',
                //     backgroundColor:
                //       schedule?.schedule_status_background_color !== "" && schedule?.schedule_status_background_color !== null
                //         ? schedule?.schedule_status_background_color
                //         : Colors.textgray
                //   }}
                // >
                //   <View style={{ flexDirection: "row", alignItems: "center", }}>
                //     <View style={{ width: '7%', }}>
                //       {schedule?.schedule_status_icon !== null && (
                //         <Svg
                //           width={20}
                //           height={20}
                //           viewBox={schedule?.schedule_status_icon?.viewBox || "0 0 100 100"}
                //         >
                //           <Path
                //             d={schedule?.schedule_status_icon?.path}
                //             fill={
                //               schedule?.schedule_status_text_color !== null && schedule?.schedule_status_text_color !== ""
                //                 ? schedule?.schedule_status_text_color
                //                 : Colors.primary
                //             }
                //             strokeWidth="2"
                //           />
                //         </Svg>
                //       )}
                //     </View>
                //     <Text
                //       numberOfLines={2}
                //       style={{
                //         // flex:1,
                //         color:
                //           schedule?.schedule_status_text_color !== null && schedule?.schedule_status_text_color !== ""
                //             ? schedule?.schedule_status_text_color
                //             : Colors.black,
                //         fontSize: RFValue(13),
                //         fontFamily: FONTS.LexendRegular,
                //         alignSelf: "flex-start",
                //         textDecorationLine:
                //           schedule?.schedule_status_text === 'Absence' || schedule?.schedule_status_text === 'move_schedule'
                //             ? 'line-through'
                //             : 'none'
                //       }}
                //     >
                //       {schedule.start_time} - {schedule.end_time} - {schedule?.break_time} ({schedule.total_time?.replace('.', ':')}) - {schedule.class?.length > 5
                //         ? `${schedule.class}`
                //         : schedule.class}
                //     </Text>
                //     {schedule?.emp_schedule_status_icon?.length > 0 &&
                //       schedule?.emp_schedule_status_icon?.map((el, iconIndex) => (
                //         <View key={iconIndex} style={{ marginHorizontal: 2 }}>
                //           <Svg
                //             width={20}
                //             height={20}
                //             viewBox={el?.viewBox || "0 0 100 100"}
                //           >
                //             <Path
                //               d={el?.path}
                //               fill={
                //                 schedule?.schedule_status_text_color !== null && schedule?.schedule_status_text_color !== ""
                //                   ? schedule?.schedule_status_text_color
                //                   : Colors.primary
                //               }
                //               strokeWidth="2"
                //             />
                //           </Svg>
                //         </View>
                //       ))}
                //     {/* <View style={{ width: '7%', }}></View> */}
                //   </View>

                //   {Boolean(schedule?.is_overtime) && (
                //     <Text
                //       style={{
                //         fontSize: RFValue(12),
                //         fontFamily: FONTS.LexendRegular,
                //         color: Colors.black,
                //         marginLeft: '8%'
                //       }}
                //     >
                //       {/* {`Extra Shift  (${schedule?.overtime})`} */}
                //       {`Extra Shift ${schedule?.overtime == 0 ? "" : `(${schedule?.overtime})`}`}
                //     </Text>
                //   )}
                // </View>
                <View
                  key={index}
                  style={{
                    marginTop: 10,
                    padding: 10,
                    borderWidth: 1,
                    borderColor: Colors.textgray,
                    borderRadius: 5,
                    paddingHorizontal: 10,
                    overflow: 'hidden',
                    backgroundColor:
                      schedule?.schedule_status_background_color
                        ? schedule?.schedule_status_background_color
                        : Colors.textgray,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", flexWrap: 'wrap' }}>
                    {/* Left Icon */}
                    <View style={{ width: '7%' }}></View>
                    {schedule?.schedule_status_icon && (
                      <View style={{ marginRight: 8 }}>
                        <Svg
                          width={20}
                          height={20}
                          viewBox={schedule?.schedule_status_icon?.viewBox || "0 0 100 100"}
                        >
                          <Path
                            d={schedule?.schedule_status_icon?.path}
                            fill={
                              schedule?.schedule_status_text_color
                                ? schedule?.schedule_status_text_color
                                : Colors.primary
                            }
                            strokeWidth="2"
                          />
                        </Svg>
                      </View>
                    )}

                    {/* Timing and Class Text */}
                    <Text
                      numberOfLines={2}
                      style={{
                        flex: 1,
                        color:
                          schedule?.schedule_status_text_color || Colors.black,
                        fontSize: RFValue(13),
                        fontFamily: FONTS.LexendRegular,
                        textDecorationLine:
                          schedule?.schedule_status_text === 'Absence' || schedule?.schedule_status_text === 'move_schedule'
                            ? 'line-through'
                            : 'none',
                      }}
                    >
                      {schedule.start_time} - {schedule.end_time} - {schedule?.break_time} ({schedule.total_time?.replace('.', ':')}) -
                      {schedule.class}
                    </Text>

                    {/* Right Icons (if any) */}
                    {schedule?.emp_schedule_status_icon?.length > 0 &&
                      schedule?.emp_schedule_status_icon.map((el, iconIndex) => (
                        <View key={iconIndex} style={{ marginLeft: 5 }}>
                          <Svg
                            width={20}
                            height={20}
                            viewBox={el?.viewBox || "0 0 100 100"}
                          >
                            <Path
                              d={el?.path}
                              fill={
                                schedule?.schedule_status_text_color
                                  ? schedule?.schedule_status_text_color
                                  : Colors.primary
                              }
                              strokeWidth="2"
                            />
                          </Svg>
                        </View>
                      ))}
                  </View>

                  {/* Overtime Section */}
                  {Boolean(schedule?.is_overtime) && (
                    <Text
                      style={{
                        fontSize: RFValue(12),
                        fontFamily: FONTS.LexendRegular,
                        color: Colors.black,
                        marginTop: 4,
                        marginLeft: 28, // aligns below icon
                      }}
                    >
                      {`Extra Shift ${schedule?.overtime == 0 ? "" : `(${schedule?.overtime})`}`}
                    </Text>
                  )}
                </View>
              );
            })}

            {

              Array.isArray(calendarData?.break_schedule?.data) &&
              calendarData?.break_schedule.data.map((el, index) => {

                return (
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
                      // gap:5
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
                )
              })
            }


            {sortedSchedules[0]?.work_details?.map((item, index) => (
              <Text
                key={index}
                onPress={() =>
                  navigation.navigate(item.screen_name, { id: item.details_id, color: item.color })
                }
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

            {/* <Text
              onPress={()=>
  
                navigation.navigate("Details", { id: 5, color:  Colors.primaryblue})
              }
              style={{
                color: Colors.black,
                fontSize: RFValue(14),
                fontFamily: FONTS.LexendRegular,
                // marginVertical:5
              }}
            >
              • workoder #232 uyrhgu 
            </Text> */}
            {/* Display description for the item */}
            {/* <Text
                style={{
                  color: Colors.textgray,
                  fontSize: RFValue(12),
                  fontFamily: FONTS.LexendRegular,
                  paddingVertical: 5,
                  width: "70%",
                }}
              >
                {item.discription}
              </Text> */}
          </View>
        )}
      </>
    );
  };

  // const renderItem = ({ item }) => {
  //   console.log(item.calendar_data.success, "adjchdkshcijk");
  //   return (
  //     <>
  //       {item?.calendar_data?.success == true && (
  //         <View
  //           style={{
  //             borderColor: Colors.litegray,
  //             borderWidth: 1,
  //             width: "90%",
  //             padding: 10,
  //             marginHorizontal: 20,
  //             marginVertical: 10,
  //             borderRadius: 10,
  //             justifyContent: "center",
  //             // backgroundColor:Colors.red
  //           }}
  //         >
  //           <Text
  //             style={{
  //               color: Colors.black,
  //               fontSize: RFValue(16),
  //               fontFamily: FONTS.LexendMedium,
  //               paddingVertical: 5,
  //             }}
  //           >
  //             {item.date}
  //             {/* {item?.calendar_data.data[0]?.date} */}
  //           </Text>
  //           <Text
  //             style={{
  //               color: Colors.black,
  //               fontSize: RFValue(14),
  //               fontFamily: FONTS.LexendMedium,
  //             }}
  //           >
  //             {item.day}
  //             {/* {item?.calendar_data.data[0]?.date} */}
  //           </Text>

  //           <View
  //             style={{
  //               flexDirection: "row",
  //               justifyContent: "space-between",
  //               width: "60%",
  //               alignItems: "center",
  //             }}
  //           >
  //             <Text
  //               style={{
  //                 color: Colors.black,
  //                 fontSize: RFValue(12),
  //                 fontFamily: FONTS.LexendRegular,
  //               }}
  //             >
  //               {item.dic}
  //             </Text>
  //             {/* <Image
  //             source={Images.down}
  //             style={{
  //               height: 15,
  //               width: 15,
  //               transform: [{ rotate: "280deg" }],
  //               marginTop: 5,
  //             }}
  //           /> */}
  //             <Text
  //               style={{
  //                 color: Colors.black,
  //                 fontSize: RFValue(12),
  //                 fontFamily: FONTS.LexendRegular,
  //               }}
  //             >
  //               {item.dic1}
  //               <Text style={{ color: Colors.textgray, fontSize: RFValue(12) }}>
  //                 {item.time}
  //               </Text>
  //             </Text>
  //           </View>
  //           <Text
  //             style={{
  //               color: Colors.textgray,
  //               fontSize: RFValue(12),
  //               fontFamily: FONTS.LexendRegular,
  //               paddingVertical: 5,
  //               width: "70%",
  //             }}
  //           >
  //             {item.discription}
  //           </Text>
  //           {/*
  //         <Image
  //           source={Images.userblanck}
  //           style={{ height: 90, width: 100, position: "absolute", right: -30 }}
  //         /> */}
  //         </View>
  //       )}
  //     </>
  //   );
  // };

  const RemoveAllKeys = async () => {
    await AsyncStorage.clear();
    setLogModalVisible(false);
    setModalOptionsVisible(false);
    navigation.navigate("CompanyLogin");
    // navigation.navigate("Login");
    await storeData("SELECT", true);
  };

  const RefreshControl = () => {
    console.log("Refresh   -=-=--=-==-=");
    fetchtimeline(selectedDate);
  };

  return (
    <SafeAreaView style={{ backgroundColor: Colors.white, flex: 1 }}>
      <StatusBar backgroundColor={Colors.white} barStyle={"dark-content"} />
      {loading && <Loader color={Colors.primary} />}
      {/* <View
        style={{
          paddingBottom: 15,
          marginTop: 10,
          borderBottomWidth: 1.5,
          borderBottomColor: Colors.litegray,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 20, // Perfect horizontal padding
          // borderWidth: 1,
          // borderColor: "red",
          // flex:1
        }}
      >
        <View style={{ flex: 1, flexDirection: "row" }}>
        <Image
            resizeMode="contain"
            source={{ uri: logo }} // Replace with actual logo
            style={{
              width: width * 0.5, // Adjust for responsiveness
              height: RFValue(30), // Fixed height
              // alignSelf: "center",
              ...(companyName == "playground" && {
                position:'absolute',
                left:-50
              })
            }}
          />
          <Text
            style={{
              fontFamily: FONTS.LexendMedium,
              fontSize: RFValue(18),
              color: Colors.black,
              flex:1 , 
              textAlign:'center',
              backgroundColor:'red'
            }}
          >
            Timeline
          </Text>
         
        </View>
        <TouchableOpacity
          onPress={() => RefreshControl()}
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
            source={Images.refresh}
            style={{
              height: 20,
              width: 20,
            }}
          />
        </TouchableOpacity>
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
            marginLeft: 5,
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
      </View> */}

      <View
        style={{
          paddingBottom: 15,
          marginTop: 10,
          borderBottomWidth: 1.5,
          borderBottomColor: Colors.litegray,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20, // Perfect horizontal padding
        }}
      >
        {/* Left Side: Logo & Timeline */}
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
          {/* Logo on the Left */}
          {/* <Image
            resizeMode="contain"
            source={{ uri: logo }} // Replace with actual logo
            style={{
              width: width * 0.5, // Adjust for responsiveness
              height: RFValue(30),
              ...(companyName == "playground" && {
                position: "absolute",
                left: -50,
              }),
              // backgroundColor:Colors.red
            }}
          /> */}
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

          {/* Timeline Text in Center */}
          <Text
            style={{
              fontFamily: FONTS.LexendMedium,
              fontSize: RFValue(18),
              color: Colors.black,
              flex: 1, // Ensures it takes available space to center
              textAlign: "center",
              // left:20
              // backgroundColor: "red", // For debugging alignment
            }}
          >
            {t("Timeline")}
          </Text>
        </View>

        {/* Right Side: Icons */}
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {/* Refresh Icon */}
          <TouchableOpacity
            onPress={() => RefreshControl()}
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
              source={Images.refresh}
              style={{
                height: 20,
                width: 20,
              }}
            />
          </TouchableOpacity>

          {/* Dots Icon */}
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
              marginLeft: 5,
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

      {/* <View
        style={{
          paddingBottom: 15,
          marginTop: 10,
          borderBottomWidth: 1.5,
          borderBottomColor: Colors.litegray,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          // flex: 1, // Ensure the entire row takes available space
        }}
      >
   
        <Text
          style={{
            fontFamily: FONTS.LexendMedium,
            fontSize: RFValue(18),
            color: Colors.black,
            flex: 1, // Takes up available space to center the text
            textAlign: "center", // Centers the text inside the available space
            left: 20,
          }}
        >
          Timeline
        </Text>

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            onPress={() => RefreshControl()}
            style={styles.headerbuttonbg}
          >
            <Image source={Images.refresh} style={styles.headerbuttons} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setModalOptionsVisible(true)}
            style={[styles.headerbuttonbg, { marginLeft: 10 }]}
          >
            <Image source={Images.dots} style={styles.headerbuttons} />
          </TouchableOpacity>
        </View>
      </View> */}

      {
        username &&
        <View
          style={{
            backgroundColor: Colors.lightprimary,
            height: "16%",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View style={styles.Box}>
            <View style={{ width: '55%', flexDirection: 'row', alignItems: 'center', }}>
              <Image
                source={{ uri: username?.file_path }}
                style={[
                  styles.image,
                  { height: RFValue(55), width: RFValue(55), borderRadius: 10 },
                ]}
              />
              <View style={{ width: '100%' }}>


                <Text style={[styles.name, { flex:1 }]} numberOfLines={2}>
                  {username?.display_name}
                </Text>
                <Svg
                  width={20}
                  height={20}
                  viewBox={"0 0 100 100"}
                >
                  <Path
                    d={""}
                    fill="none"
                    stroke="blue"
                    strokeWidth="2"
                  />
                </Svg>
              </View>
            </View>
            <View style={{ width: '42%', alignItems: 'flex-start', }}>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setOpenCalender(true)}
              // onPress={() => setOpen(true)}
              >
                <Text
                  style={{
                    color: Colors.black,
                    paddingHorizontal: 5,
                    fontFamily: FONTS.LexendRegular,
                  }}
                >
                  {selectedDate
                    ? formatDatee(selectedDate)
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
                      height: 15,
                      width: 15,
                    }}
                  />
                </View>
              </TouchableOpacity>
              <Text style={styles.Weeks}>{Weeks !== "" ? `Weeks ${Weeks}` : ""}</Text>
            </View>

          </View>
        </View>
      }

      <FlatList
        data={timeline}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
      // ListEmptyComponent={()=>(
      //   <Text style={{ color: Colors.black,
      //     fontFamily: FONTS.LexendRegular,marginTop:20,alignSelf:'center'}} >{t("No Data")}</Text>
      // )}
      // contentContainerStyle={{marginBottom:100,height:500}}
      />
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


      <Modal
        isVisible={opencalender}
        backdropOpacity={0.5}
        animationType="slide"
        onBackdropPress={() => setOpenCalender(false)}
        animationIn={'zoomIn'}
        animationOut={'zoomOut'}
      >
        <View style={styles.modalContent}>
          <Calendar
            onDayPress={(day) => {
              const formattedDate = moment(day.dateString).format("YYYY-MM-DD");
              setSelectedDate(formattedDate);
              getISOWeek(new Date(formattedDate));
            }}
            markedDates={{
              [selectedDate]: {
                selected: true,
                customStyles: {
                  container: { backgroundColor: Colors.primary },
                  text: { color: Colors.white },
                },
              },
            }}
            markingType={"custom"}
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
                console.log("Selected Date:", selectedDate);
                setOpenCalender(false);
                fetchtimeline(selectedDate)
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

    </SafeAreaView>
  );
};

export default CalendarSlide;

const styles = StyleSheet.create({
  Box: {
    paddingVertical: 10,
    width: "90%",
    alignSelf: "center",
    borderWidth: 1,
    borderRadius: 10,
    borderColor: Colors.litegray,
    paddingLeft: RFValue(10),
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    justifyContent: 'space-between'
  },
  name: {
    fontSize: RFValue(13),
    color: Colors.black,
    fontFamily: FONTS.LexendMedium,
    paddingHorizontal: 5,
    width: "45%",
  },
  modaltext: {
    color: Colors.black,
    fontFamily: FONTS.LexendRegular,
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
  mcontainer: {
    flex: 1,
    position: "absolute",
    borderRadius: 10,
    backgroundColor: Colors.white,
    width: "100%",
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
  logout: {
    color: Colors.black,
    fontSize: 16,
    alignSelf: "center",
    fontFamily: FONTS.LexendRegular,
    marginTop: 15,
    alignSelf: "flex-start",
    paddingHorizontal: 25,
  },
  no: {
    color: Colors.black,
    fontSize: 18,
    fontFamily: FONTS.LexendRegular,
    paddingHorizontal: 20,
  },
  headerbuttonbg: {
    borderWidth: 1,
    borderRadius: 7,
    borderColor: Colors.litegray,
    height: 35,
    width: 35,
    justifyContent: "center",
    alignItems: "center",
  },
  headerbuttons: {
    height: 20,
    width: 20,
  },
  dateInput: {
    // width: "100%",
    // height: heightPercentageToDP(7),
    backgroundColor: Colors.white,
    borderRadius: 10,
    // borderWidth: 1,
    paddingRight: 15,
    alignItems: "center",
    marginTop: 10,
    flexDirection: "row",
    marginBottom: 10,
    justifyContent: "flex-start",
    position: "absolute",
    right: 0,
    left: 0
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
  Weeks: {
    marginTop: 40,
    fontSize: RFValue(11),
    fontWeight: '500',
    fontFamily: FONTS.LexendRegular,
    marginLeft: 5
  }
});