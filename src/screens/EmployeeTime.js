import {
  FlatList,
  // SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  StatusBar,
} from "react-native";
import React, { useEffect, useState } from "react";
import { Colors } from "../constants/color";
import Header from "../components/header";
import { t } from "i18next";
import { FONTS } from "../constants/fontFamily";
import { RFValue } from "react-native-responsive-fontsize";
import apiConstants from "../api/apiConstants";
import { getData } from "../utils/storeData";
import ApiService from "../utils/Apiservice";
import SelectDropdown from "react-native-select-dropdown";
import { Images } from "../constants/images";
import Loader from "../components/loading";
import BlueHeader from "../components/BlueHeader";
import { heightPercentageToDP } from "react-native-responsive-screen";
import Footer from "../components/Footer";
import { SafeAreaView } from "react-native-safe-area-context";

const EmployeeTime = ({ route }) => {
  const { bgcolor } = route.params;
  const [expandedItemId2, setExpandedItemId2] = useState(null);
  const [Employeedata, setEmployeedata] = useState([]);
  const [selectedItem, setSelectedItem] = useState({});
  const [selectedItemmonth, setSelectedItemmonth] = useState({});
  const [Loding, setLoding] = useState(true);
  const [isDescending, setIsDescending] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [filteredTasklist, setFilteredTasklist] = useState([]);

  // useEffect(() => {
  //   GetEmployeeTimeData();
  // }, []);
  useEffect(() => {
    GetEmployeeTimeData(selectedItem?.title, selectedItemmonth?.value);
  }, [selectedItem, selectedItemmonth]);

  const handleSelectItem = (item) => {
    setSelectedItem(item);
  };

  const handleSelectItemmonth = (item) => {
    setSelectedItemmonth(item);
  };

  const formatTime = (time) => {
    if (!time) return ""; // Handle null or undefined time
    return time.length > 5 ? time.slice(0, 5) : time; // If 'HH:mm:ss', extract 'HH:mm'; else, return as is
  };

  const toggleItem = (itemId) => {
    setExpandedItemId2((prevId) => (prevId === itemId ? null : itemId));
  };
  
  const Dataaaa = [
    {
      id: "1",
      class: "Betty",
      date: "09 Nov 2024",
      schedule: "08:30 - 18:00",
      break: "00:30",
      checkIn: "14:21",
      shortTime: "-05:51",
    },
    {
      id: "2",
      class: "Betty",
      date: "09 Nov 2024",
      schedule: "07:00 - 16:30",
      break: "01:00",
      checkIn: "14:18",
      shortTime: "-07:18",
    },
    {
      id: "3",
      class: "Betty",
      date: "28 Oct 2024",
      schedule: "07:00 - 16:30",
      break: "00:30",
      checkIn: "19:24",
      shortTime: "-12:24",
    },
  ];

  // const renderItem = ({ item }) => {
  //   const formattedTime = `${formatTime(item.start_time)}-${formatTime(item.end_time)} (${formatTime(item.break_time)})`;
  //   const isExpanded = expandedItemId2 === item.id;
  //   return (
  //     <>
  //       <View style={styles.box}>
  //         <View style={styles.row}>
  //           <TouchableOpacity
  //             onPress={() => toggleItem(item.id)}
  //             style={{ flex: 1 }}
  //           >
  //             <View style={styles.renderitemmain}>
  //               <Text style={[styles.day, { width: "80%" }]}>
  //                 {item.current_date || "-"}
  //               </Text>
  //             </View>
  //           </TouchableOpacity>

  //           <TouchableOpacity style={{ marginLeft: 10 }}>
  //               <View style={styles.statusbg}>
  //                 <View
  //                   style={[
  //                     styles.statusbox,
  //                     { backgroundColor: Colors.primarylite },
  //                   ]}
  //                 >
  //           <Text style={styles.statusname}>{item.schedule_status || "--"}</Text>
  //           </View>
  //               </View>
  //             </TouchableOpacity>
  //         </View>

  //         {isExpanded && (
  //           <View>
  //             <View style={styles.line}></View>
  //             <View style={styles.data}>
  //               <Text style={[styles.daydetails, { width: "50%" }]}>
  //               Schedule Break
  //               </Text>
  //               <Text
  //                 style={[styles.date, { width: "50%", textAlign: "right" }]}
  //               >
  //                 {formattedTime}
  //               </Text>
  //             </View>
  //             <View style={styles.line}></View>
  //             <View style={styles.data}>
  //               <Text style={[styles.daydetails, { width: "50%" }]}>
  //               Break
  //               </Text>
  //               <Text
  //                 style={[styles.date, { width: "50%", textAlign: "right" }]}
  //               >
  //                 {item.original_break_time}
  //               </Text>
  //             </View>
  //             <View style={styles.line}></View>
  //             <View style={styles.data}>
  //               <Text style={[styles.daydetails, { width: "50%" }]}>
  //               Overtime
  //               </Text>
  //               <Text
  //                 style={[styles.date, { width: "50%", textAlign: "right" }]}
  //               >
  //                 {item.total_over_time}
  //               </Text>
  //             </View>
  //             <View style={styles.line}></View>
  //             <View style={styles.data}>
  //               <Text style={[styles.daydetails, { width: "50%" }]}>
  //                 Description
  //               </Text>
  //               <Text
  //                 style={[styles.date, { width: "50%", textAlign: "right" }]}
  //               >
  //                 {item.description}
  //               </Text>
  //             </View>
  //           </View>
  //         )}
  //       </View>
  //     </>
  //   );
  // };

  const formatDate = (dateString) => {
    if (!dateString) {
      return "-"; // or any default value you want to return when the dateString is invalid
    }
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const [year, month, day] = dateString.split("-");
    // Check if dateString has a valid format
    if (!year || !month || !day) {
      return "-"; // return empty string or handle as needed if the format is invalid
    }
    return `${day} ${months[parseInt(month, 10) - 1]}`;
  };

  const renderItem1 = ({ item, index }) => {
    const formattedTime = `${formatTime(item.start_time)}(${formatTime(
      item.original_start_time
    )}) ${formatTime(item.end_time)}(${formatTime(
      item.original_end_time ? item.original_end_time : "--"
    )})`;
    const Breakk = formatTime(
      item.original_break_time ? item.original_break_time : "--"
    );

    return (
      <>
        <View style={styles.row1}>
          <Text style={styles.cell}>{formatDate(item.current_date)}</Text>
          <Text
            style={[
              styles.cell,
              {
                textAlign: "left",
                // borderLeftColor: Colors.primary,
                // borderWidth: 1,
              },
            ]}
          >
            {formattedTime}
          </Text>
          <Text style={styles.cell}>{Breakk}</Text>
          <View
            style={[
              styles.cell,
              styles.box1,
              {
                backgroundColor:
                  item.approved_disapproved == 1
                    ? "#E0FCE0"
                    : item.approved_disapproved == 2
                    ? "#F8EBEB"
                    : Colors.white,
              },
            ]}
          >
            <Text
              onPress={() => {
                console.log("=-==", item.description);
                Alert.alert(t("Omschrijving"), item.description);
              }}
              style={[
                {
                  color:
                    item.approved_disapproved == 1
                      ? "#30e930"
                      : item.approved_disapproved == 2
                      ? "#e3afaf"
                      : Colors.black,
                  fontSize: 12,
                  fontFamily: FONTS.LexendRegular,
                },
              ]}
            >
              {item.formatted_total_over_time
                ? item.formatted_total_over_time + "  ⓘ"
                : "--"}{" "}
              {/* {item.approved_disapproved == 1
                // ? "✓"
                ? "Ⓘ"
                : item.approved_disapproved == 2
                ? "Ⓘ"
                // ? "✕"
                : ""} */}
            </Text>
          </View>
        </View>
      </>
    );
  };

  const currentYear = new Date().getFullYear();
  const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, "0"); // Gets current month in "MM" format
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const currentMonthName = monthNames[new Date().getMonth()];
  const GetEmployeeTimeData = async (year, month) => {
    setLoding(true);
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.getemployeetimeregistration, {
        includeToken: true,
        customData: {
          relaties_id: getdata.data.relaties.id,
          year: year ? year : currentYear,
          month: month ? month : currentMonth,
          role: getdata.data.user.role,
          user_id: getdata.data.user.id,
        },
      });
      /// select any month after filter thay che but je month ma data no hoi to data not found nathi set karelu ......
      console.log(
        "customData",
        getdata.data.relaties.id,
        selectedItem.title ? selectedItem.title : currentYear,
        selectedItemmonth.value ? selectedItemmonth.value : currentMonth
      );
      setLoding(false);
      if (data.status) {
        setEmployeedata(data.data);
      } else {
        console.log("False");
        setEmployeedata([]); // Clear previous data
      }
    } catch (err) {
      setLoding(false);
      console.error("Error fetching data:", err);
    }
  };

  // const handleSelectItem = (selectedItem, index) => {
  //   console.log("=-=-");
  //   GetEmployeeTimeData(
  //     selectedItem.title,
  //     selectedItemmonth ? selectedItemmonth.title : undefined
  //   );
  //   setSelectedItem(selectedItem);
  // };
  // const handleSelectItemmonth = (selectedItemm, index) => {
  //   setSelectedItemmonth(selectedItemm);
  //   GetEmployeeTimeData(
  //     selectedItem ? selectedItem.title : selectedItem,
  //     selectedItemm.value
  //   );
  // };

  // useEffect(() => {
  //   const filterBySearchQuery = (pro) =>
  //     pro.project_name.toLowerCase().includes(searchQuery.toLowerCase());

  //   const filterBySelectedStatus = (pro) => {
  //     if (selectedItems.length === 0) return true;
  //     return selectedItems.includes(pro?.contract_status);
  //   };
  //   const filtered = Employeedata
  //     .filter(filterBySearchQuery)
  //     .filter(filterBySelectedStatus);
  //   setFilteredTasklist(filtered);
  // }, [searchQuery, Employeedata, selectedItems]);

  const sortByCreatedAt = () => {
    const sortedData = [...Employeedata].sort((a, b) => {
      return isDescending
        ? new Date(b.current_date) - new Date(a.current_date) // Descending order
        : new Date(a.current_date) - new Date(b.current_date); // Ascending order
    });

    setEmployeedata(sortedData);
    setIsDescending(!isDescending); // Toggle sort direction
  };

  return (
    // <SafeAreaView style={[styles.container, { backgroundColor: bgcolor }]}>
    <>
      <StatusBar backgroundColor={bgcolor} barStyle={"light-content"} />
      {/* <Header title={t("Timesheet")} back /> */}
      <BlueHeader
        bgcolor={bgcolor}
        title={t("Timesheet")}
        Righticon={Images.refresh}
        onPressRight={GetEmployeeTimeData}
        SearchBarInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        sort={Images.arrow}
        onPressfilter={sortByCreatedAt}
      />
      <View
        style={{
          backgroundColor: Colors.litegray1,
          height: "100%",
          marginTop: heightPercentageToDP(-1),
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
          flex: 1,
          paddingTop: 10,
        }}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={{ marginHorizontal: 16, marginBottom: 5 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                width: "100%",
                marginTop: 10,
              }}
            >
              <View style={{ width: "43%" }}>
                {/* <Text style={styles.title}>{t("Year")}</Text> */}
                <SelectDropdown
                  data={[
                    { title: 2023 },
                    { title: 2024 },
                    { title: 2025 },
                    { title: 2026 },
                    { title: 2027 },
                    { title: 2028 },
                  ]}
                  onSelect={handleSelectItem}
                  renderButton={(item, isOpened) => {
                    return (
                      <View style={[styles.dropdownButtonStyle]}>
                        <Text style={[styles.dropdownButtonTxtStyle]}>
                          {selectedItem.title
                            ? selectedItem.title
                            : currentYear}
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
                          {item.title}
                        </Text>
                      </View>
                    );
                  }}
                  showsVerticalScrollIndicator={false}
                  dropdownStyle={styles.dropdownMenuStyle}
                />
              </View>
              <View style={{ width: "43%" }}>
                {/* <Text style={styles.title}>{t("Month")}</Text> */}
                <SelectDropdown
                  data={[
                    { title: "January", value: "01" },
                    { title: "February", value: "02" },
                    { title: "March", value: "03" },
                    { title: "April", value: "04" },
                    { title: "May", value: "05" },
                    { title: "June", value: "06" },
                    { title: "July", value: "07" },
                    { title: "August", value: "08" },
                    { title: "September", value: "09" },
                    { title: "October", value: "10" },
                    { title: "November", value: "11" },
                    { title: "December", value: "12" },
                  ]}
                  onSelect={handleSelectItemmonth}
                  renderButton={(item, isOpened) => {
                    return (
                      <View style={[styles.dropdownButtonStyle]}>
                        <Text style={[styles.dropdownButtonTxtStyle]}>
                          {selectedItemmonth.title
                            ? selectedItemmonth.title
                            : currentMonthName}
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
                          {item.title}
                        </Text>
                      </View>
                    );
                  }}
                  showsVerticalScrollIndicator={false}
                  dropdownStyle={styles.dropdownMenuStyle}
                />
              </View>
            </View>
          </View>
          {Loding && <Loader />}
          {/* <FlatList
        data={Employeedata}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <View style={styles.emptyListContainer}>
            <Text style={[styles.day,{alignSelf:'center',marginTop:15}]}>No Data</Text>
          </View>
        )}
      /> */}
          <FlatList
            showsVerticalScrollIndicator={false}
            bounces={false}
            data={Employeedata}
            renderItem={renderItem1}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={() => (
              <View style={styles.header}>
                {/* <Text style={styles.headerCell}>Class</Text> */}
                <Text style={styles.headerCell}>{t("Date")}</Text>
                <Text style={styles.headerCell}>CI/CO</Text>
                <Text style={styles.headerCell}>{t("Break")}</Text>
                <Text style={styles.headerCell}>{t("OverTime")}</Text>
              </View>
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
              marginTop: 20,
              paddingBottom: 20,
              backgroundColor: Colors.white,
            }}
          />
        </ScrollView>
      </View>
      {/* <Footer /> */}
      {/* </SafeAreaView> */}
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  box: {
    padding: 15,
    marginBottom: 15,
    backgroundColor: Colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.litegray,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  renderitemmain: { flexDirection: "row", alignItems: "center" },
  day: {
    fontSize: RFValue(14),
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
  },
  statusbg: { alignItems: "center" },
  statusbox: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 4 },
  statusname: {
    fontSize: RFValue(13),
    color: Colors.black,
    fontFamily: FONTS.LexendRegular,
  },
  line: { height: 1, backgroundColor: Colors.litegray, marginVertical: 10 },
  renderdetails: { flexDirection: "row", alignItems: "center" },
  daydetails: {
    fontSize: RFValue(14),
    color: Colors.black,
    fontFamily: FONTS.LexendMedium,
  },
  data: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  date: {
    fontSize: RFValue(13),
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
  },
  listContent: { padding: 16 },
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
    backgroundColor: Colors.white,
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
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
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
    marginTop: RFValue(5),
  },
  container1: {
    margin: 10,
  },
  header: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingVertical: 10,
    backgroundColor: Colors.lightprimary,
    borderRadius: 5,
  },
  headerCell: {
    flex: 1,
    alignSelf: "center",
    textAlign: "center",
    fontFamily: FONTS.LexendMedium,
    // textAlign: 'center',
    fontSize: 13,
    color: Colors.black,
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
});

export default EmployeeTime;
