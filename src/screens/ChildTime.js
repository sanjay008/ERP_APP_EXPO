import {
  FlatList,
  // SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
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
import BlueHeader from "../components/BlueHeader";
import Loader from "../components/loading";
import Footer from "../components/Footer";
import { SafeAreaView } from "react-native-safe-area-context";
import { heightPercentageToDP } from "react-native-responsive-screen";

const ChildTime = ({ route }) => {
  const { bgcolor } = route.params;
  const [expandedItemId2, setExpandedItemId2] = useState(null);
  const [Employeedata, setEmployeedata] = useState([]);
  const [selectedItem, setSelectedItem] = useState({});
  const [selectedItemmonth, setSelectedItemmonth] = useState({});
  const [loading, setLoading] = useState(false);

  console.log("=-=-=--Employeedata", Employeedata);
  useEffect(() => {
    GetEmployeeTimeData();
  }, []);
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
  const toggleItem = (itemId) => {
    setExpandedItemId2((prevId) => (prevId === itemId ? null : itemId));
  };

  const formatTime = {};

  const renderItem1 = ({ item }) => {
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
          <Text style={styles.cell}>{item.current_date || "--"}</Text>
          <Text style={styles.cell}>{formattedTime}</Text>
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
              style={[
                styles.cell,
                {
                  color:
                    item.approved_disapproved == 1
                      ? "#30e930"
                      : item.approved_disapproved == 2
                      ? "#e3afaf"
                      : Colors.black,
                },
              ]}
            >
              {item.formatted_total_over_time
                ? item.formatted_total_over_time
                : "--"}{" "}
              {item.approved_disapproved == 1
                ? "✓"
                : item.approved_disapproved == 2
                ? "✕"
                : ""}
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
    setLoading(true);
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.kidstimeregistration, {
        includeToken: true,
        customData: {
          relaties_id: getdata.data.relaties.id,
          role: getdata.data.user.role,
          user_id: getdata.data.user.id,
          year: year ? year : currentYear,
          month: month ? month : currentMonth,
        },
      });

      if (data.status) {
        setLoading(false);
        setEmployeedata(data.data);
      } else {
        setLoading(false);
        console.log("False");
      }
    } catch (err) {
      console.log("Error fetching connections:", err);
    }
  };

  const handleSelectItem = (selectedItem, index) => {
    console.log("=-=-");
    GetEmployeeTimeData(
      selectedItem.title,
      selectedItemmonth ? selectedItemmonth.title : undefined
    );
    setSelectedItem(selectedItem);
  };

  const handleSelectItemmonth = (selectedItemm, index) => {
    setSelectedItemmonth(selectedItemm);
    GetEmployeeTimeData(
      selectedItem ? selectedItem.title : selectedItem,
      selectedItemm.value
    );
  };

  return (
    // <SafeAreaView style={[styles.container, { backgroundColor: bgcolor }]}>
    <>
      <StatusBar backgroundColor={bgcolor} barStyle={"light-content"} />
      {loading && <Loader color={Colors.primary} />}
      {/* <Header title={t("Child Time")} back /> */}
      <BlueHeader
        bgcolor={bgcolor}
        title={t("Child Time")}
        Righticon={Images.refresh}
        onPressRight={GetEmployeeTimeData}
        SearchBarInput
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
                {/* <Text style={styles.title}>Year</Text> */}
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
                {/* <Text style={styles.title}>Month</Text> */}
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
          <FlatList
            bounces={false}
            data={Employeedata}
            renderItem={renderItem1}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={() =>
              Employeedata && Employeedata.length > 0 ? (
                <View style={styles.header}>
                  <Text style={styles.headerCell}>{t("Date")}</Text>
                  <Text style={styles.headerCell}>CI/CO</Text>
                  <Text style={styles.headerCell}>{t("Break")}</Text>
                  <Text style={styles.headerCell}>{t("OverTime")}</Text>
                </View>
              ) : null
            }
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
    </>
    // {/* </SafeAreaView> */}
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
    backgroundColor: "#f1f1f1",
    borderRadius: 5,
  },
  headerCell: {
    flex: 1,
    alignSelf: "center",
    textAlign: "center",
    fontFamily: FONTS.LexendMedium,
    // textAlign: 'center',
    fontSize: 13,
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
    fontSize: 12,
    textAlign: "center",
    fontFamily: FONTS.LexendRegular,
  },
  box1: {
    // borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 4,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ChildTime;

// import {
//   FlatList,
//   SafeAreaView,
//   StyleSheet,
//   Text,
//   View,
//   TouchableOpacity,
//   Image,
// } from "react-native";
// import React, { useState } from "react";
// import { Colors } from "../constants/color";
// import Header from "../components/header";
// import { t } from "i18next";
// import { FONTS } from "../constants/fontFamily";
// import { RFValue } from "react-native-responsive-fontsize";
// import Images from "../constants/images"; // Ensure your image paths are correct

// const ChildTime = () => {
//   const [expandedItemId2, setExpandedItemId2] = useState(null);

//   const toggleItem = (itemId) => {
//     setExpandedItemId2((prevId) => (prevId === itemId ? null : itemId));
//   };
//   const Dataaaa = [
//     {
//       id: 8,
//       relatie_id: 21,
//       employer_name: 8,
//       contract_name: "1",
//       leave_type: null,
//       date: "2024-09-17",
//       schedule_id: 2,
//       start_time: null,
//       end_time: null,
//       break_time: null,
//       schedule_day: null,
//       total_hours: "3",
//       status: "95",
//       leave_absence_store: 0,
//       reason_field: "headdache",
//       created_at: "2024-09-02T13:04:06.000000Z",
//       updated_at: "2024-09-02T13:14:41.000000Z",
//       is_deleted: 0,
//       employementdata: {
//         id: 1,
//         contract_name: "Oprah 2024-2025",
//         from: "2024-06-01",
//         end: "2024-11-30",
//         contract_month: "6",
//         relaties_id: 21,
//         employer_id: "8",
//         contract_type: "15",
//         position: "16",
//         annual_hour_system: null,
//         competition_type: "1",
//         comments: null,
//         contract_hour_per_week: 36,
//         contract_month_salary: "2500",
//         cao_contract: "true",
//         fulltime_cao_month_salary_first: 6,
//         fulltime_cao_month_salary_second: 54,
//         minimal_hour_per_week: "24",
//         maximum_hour_per_week: "36",
//         total_contract_hour_current_year: null,
//         probation: 0,
//         holiday_pay: "8.00",
//         total_holiday_hour: "8.03",
//         holiday_contract: null,
//         holiday_fulltime: "72.24",
//         holiday_fullyear: "33.11",
//         fulltime_month_salary: "2500",
//         contract_cao_month_salary: "2946.00",
//         part_time: null,
//         hourly_rate: null,
//         total_days_count: "183",
//         total_week_count: "26.07",
//         total_month_count: "6.02",
//         total_leave_hours: "105.35",
//         uren: "36",
//         vakantiedagen: "144",
//         verlofbudget: "66",
//         allow_multiple_contract: null,
//         day_working_hours: "9",
//         leave_budget_days: "3.68",
//         schaal_sector: "1",
//         contract_status: "33",
//         contract_pdf: "contract_pdf/u156753521_test/employment/1/contract.pdf",
//         created_at: "2024-08-29T12:24:59.000000Z",
//         updated_at: "2024-10-10T12:42:11.000000Z",
//         is_deleted: 0,
//       },
//       absence_type_data: null,
//       statusdata: null,
//       employerscheduledata: {
//         id: 2,
//         employer_calendar_id: 3,
//         day: "Tuesday",
//         start_time: "12:00:00",
//         end_time: "18:30:00",
//         break_time: "00:30:00",
//         total_time: "6.00",
//         branch_id: "3",
//         class_id: "1",
//         branch_calendar_id: "10,22",
//         start_date: "2024-09-01",
//         end_date: "2024-10-31",
//         created_at: "2024-08-30T18:00:30.000000Z",
//         updated_at: "2024-08-30T18:00:30.000000Z",
//       },
//     },
//     {
//       id: 10,
//       relatie_id: 21,
//       employer_name: 8,
//       contract_name: "1",
//       leave_type: null,
//       date: "2024-10-29",
//       schedule_id: 2,
//       start_time: null,
//       end_time: null,
//       break_time: null,
//       schedule_day: null,
//       total_hours: "6.00",
//       status: "95",
//       leave_absence_store: 0,
//       reason_field: "Sick on Holiday",
//       created_at: "2024-09-02T14:30:37.000000Z",
//       updated_at: "2024-09-02T14:30:37.000000Z",
//       is_deleted: 0,
//       employementdata: {
//         id: 1,
//         contract_name: "Oprah 2024-2025",
//         from: "2024-06-01",
//         end: "2024-11-30",
//         contract_month: "6",
//         relaties_id: 21,
//         employer_id: "8",
//         contract_type: "15",
//         position: "16",
//         annual_hour_system: null,
//         competition_type: "1",
//         comments: null,
//         contract_hour_per_week: 36,
//         contract_month_salary: "2500",
//         cao_contract: "true",
//         fulltime_cao_month_salary_first: 6,
//         fulltime_cao_month_salary_second: 54,
//         minimal_hour_per_week: "24",
//         maximum_hour_per_week: "36",
//         total_contract_hour_current_year: null,
//         probation: 0,
//         holiday_pay: "8.00",
//         total_holiday_hour: "8.03",
//         holiday_contract: null,
//         holiday_fulltime: "72.24",
//         holiday_fullyear: "33.11",
//         fulltime_month_salary: "2500",
//         contract_cao_month_salary: "2946.00",
//         part_time: null,
//         hourly_rate: null,
//         total_days_count: "183",
//         total_week_count: "26.07",
//         total_month_count: "6.02",
//         total_leave_hours: "105.35",
//         uren: "36",
//         vakantiedagen: "144",
//         verlofbudget: "66",
//         allow_multiple_contract: null,
//         day_working_hours: "9",
//         leave_budget_days: "3.68",
//         schaal_sector: "1",
//         contract_status: "33",
//         contract_pdf: "contract_pdf/u156753521_test/employment/1/contract.pdf",
//         created_at: "2024-08-29T12:24:59.000000Z",
//         updated_at: "2024-10-10T12:42:11.000000Z",
//         is_deleted: 0,
//       },
//       absence_type_data: null,
//       statusdata: null,
//       employerscheduledata: {
//         id: 2,
//         employer_calendar_id: 3,
//         day: "Tuesday",
//         start_time: "12:00:00",
//         end_time: "18:30:00",
//         break_time: "00:30:00",
//         total_time: "6.00",
//         branch_id: "3",
//         class_id: "1",
//         branch_calendar_id: "10,22",
//         start_date: "2024-09-01",
//         end_date: "2024-10-31",
//         created_at: "2024-08-30T18:00:30.000000Z",
//         updated_at: "2024-08-30T18:00:30.000000Z",
//       },
//     },
//     {
//       id: 15,
//       relatie_id: 21,
//       employer_name: 8,
//       contract_name: "1",
//       leave_type: null,
//       date: "2024-09-03",
//       schedule_id: 2,
//       start_time: null,
//       end_time: null,
//       break_time: null,
//       schedule_day: null,
//       total_hours: "6.00",
//       status: "95",
//       leave_absence_store: 0,
//       reason_field: "braken",
//       created_at: "2024-09-03T10:58:21.000000Z",
//       updated_at: "2024-09-03T10:58:21.000000Z",
//       is_deleted: 0,
//       employementdata: {
//         id: 1,
//         contract_name: "Oprah 2024-2025",
//         from: "2024-06-01",
//         end: "2024-11-30",
//         contract_month: "6",
//         relaties_id: 21,
//         employer_id: "8",
//         contract_type: "15",
//         position: "16",
//         annual_hour_system: null,
//         competition_type: "1",
//         comments: null,
//         contract_hour_per_week: 36,
//         contract_month_salary: "2500",
//         cao_contract: "true",
//         fulltime_cao_month_salary_first: 6,
//         fulltime_cao_month_salary_second: 54,
//         minimal_hour_per_week: "24",
//         maximum_hour_per_week: "36",
//         total_contract_hour_current_year: null,
//         probation: 0,
//         holiday_pay: "8.00",
//         total_holiday_hour: "8.03",
//         holiday_contract: null,
//         holiday_fulltime: "72.24",
//         holiday_fullyear: "33.11",
//         fulltime_month_salary: "2500",
//         contract_cao_month_salary: "2946.00",
//         part_time: null,
//         hourly_rate: null,
//         total_days_count: "183",
//         total_week_count: "26.07",
//         total_month_count: "6.02",
//         total_leave_hours: "105.35",
//         uren: "36",
//         vakantiedagen: "144",
//         verlofbudget: "66",
//         allow_multiple_contract: null,
//         day_working_hours: "9",
//         leave_budget_days: "3.68",
//         schaal_sector: "1",
//         contract_status: "33",
//         contract_pdf: "contract_pdf/u156753521_test/employment/1/contract.pdf",
//         created_at: "2024-08-29T12:24:59.000000Z",
//         updated_at: "2024-10-10T12:42:11.000000Z",
//         is_deleted: 0,
//       },
//       absence_type_data: null,
//       statusdata: null,
//       employerscheduledata: {
//         id: 2,
//         employer_calendar_id: 3,
//         day: "Tuesday",
//         start_time: "12:00:00",
//         end_time: "18:30:00",
//         break_time: "00:30:00",
//         total_time: "6.00",
//         branch_id: "3",
//         class_id: "1",
//         branch_calendar_id: "10,22",
//         start_date: "2024-09-01",
//         end_date: "2024-10-31",
//         created_at: "2024-08-30T18:00:30.000000Z",
//         updated_at: "2024-08-30T18:00:30.000000Z",
//       },
//     },
//   ];
//   const renderItem = ({ item }) => {
//     const isExpanded = expandedItemId2 === item.id;
//     return (
//       <>
//         {item?.employementdata && (
//           <View style={styles.box}>
//             <View style={styles.row}>
//               <TouchableOpacity
//                 onPress={() => toggleItem(item.id)}
//                 style={{ flex: 1 }}
//               >
//                 <View style={styles.renderitemmain}>
//                   <Text style={[styles.day, { width: "80%" }]}>
//                     {item.employementdata.contract_name || "-"}
//                   </Text>
//                 </View>
//               </TouchableOpacity>

//               {/* <TouchableOpacity style={{ marginLeft: 10 }}>
//                 <View style={styles.statusbg}>
//                   <View
//                     style={[
//                       styles.statusbox,
//                       { backgroundColor: Colors.primarylite },
//                     ]}
//                   > */}
//                     <Text style={styles.statusname}>
//                       {item.reason_field || "--"}
//                     </Text>
//                   {/* </View>
//                 </View>
//               </TouchableOpacity> */}
//             </View>

//             {isExpanded && (
//               <View>
//                 <View style={styles.line}></View>
//                 <View style={styles.renderdetails}>
//                   <Text style={[styles.daydetails, { paddingVertical: 8 }]}>
//                     {item?.employerscheduledata?.day || "--"}
//                   </Text>
//                 </View>
//                 <View style={styles.line}></View>
//                 <View style={styles.data}>
//                   <Text style={[styles.daydetails, { width: "50%" }]}>
//                     From & To
//                   </Text>
//                   <Text
//                     style={[styles.date, { width: "50%", textAlign: "right" }]}
//                   >
//                     {item.date}
//                   </Text>
//                 </View>
//                 <View style={styles.line}></View>
//                 <View style={styles.data}>
//                   <Text style={[styles.daydetails, { width: "50%" }]}>
//                     Description
//                   </Text>
//                   <Text
//                     style={[styles.date, { width: "50%", textAlign: "right" }]}
//                   >
//                     {item.reason_field}
//                   </Text>
//                 </View>
//               </View>
//             )}
//           </View>
//         )}
//       </>
//     );
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <Header title="Child Time"  back/>
//       <FlatList
//         data={Dataaaa}
//         keyExtractor={(item) => item.id.toString()}
//         renderItem={renderItem}
//         contentContainerStyle={styles.listContent}
//       />
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: Colors.white },
//   box: {
//     padding: 15,
//     marginBottom: 15,
//     backgroundColor: Colors.white,
//     borderRadius: 10,
//     borderWidth: 1,
//     borderColor: Colors.litegray,
//   },
//   row: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//   },
//   renderitemmain: { flexDirection: "row", alignItems: "center" },
//   day: {
//     fontSize: RFValue(14),
//     fontFamily: FONTS.LexendRegular,
//     color: Colors.black,
//   },
//   statusbg: { alignItems: "center" },
//   statusbox: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 4 },
//   statusname: { fontSize: RFValue(13),  color: Colors.black,  fontFamily: FONTS.LexendRegular, },
//   line: { height: 1, backgroundColor: Colors.litegray, marginVertical: 10 },
//   renderdetails: { flexDirection: "row", alignItems: "center" },
//   daydetails: {
//     fontSize: RFValue(14),
//     color: Colors.black,
//     fontFamily: FONTS.LexendMedium,
//   },
//   data: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     paddingVertical: 8,
//   },
//   date: { fontSize: RFValue(14), fontFamily: FONTS.LexendRegular,  color: Colors.black, },
//   listContent: { padding: 16 },
// });

// export default ChildTime;
