import {
  Alert,
  FlatList,
  Image,
  // SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import Header from "../components/header";
import { getData } from "../utils/storeData";
import ApiService from "../utils/Apiservice";
import apiConstants from "../api/apiConstants";
import { FONTS } from "../constants/fontFamily";
import { Colors } from "../constants/color";
import { RFValue } from "react-native-responsive-fontsize";
import Loader from "../components/loading";
import { t } from "i18next";
import SelectDropdown from "react-native-select-dropdown";
import { Images } from "../constants/images";
import BlueHeader from "../components/BlueHeader";
import Footer from "../components/Footer";
import { SafeAreaView } from "react-native-safe-area-context";
import { heightPercentageToDP } from "react-native-responsive-screen";
import { useTranslation } from "react-i18next";

const ProjectTimeDetails = ({ navigation, route }) => {
  const { t } = useTranslation();
  const [projectstimee, setProjectstimee] = useState([]);
  const [Loding, setLoding] = useState(true);
  const [selectedItem, setSelectedItem] = useState({});
  const [selectedItemmonth, setSelectedItemmonth] = useState({});
  const { item } = route.params;
  const { color } = route.params;
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

  const GetProjectTimeData = async (year, month) => {
    setLoding(true);
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.projecttimeregistration, {
        includeToken: true,
        customData: {
          relaties_id: getdata.data.relaties.id,
          role: getdata.data.user.role,
          user_id: getdata.data.user.id,
          project_id: item && item.id,
          year: year ? year : currentYear,
          month: month ? month : currentMonth,
        },
      });

      if (data.status) {
        setLoding(false);
        setProjectstimee(data.data);
      } else {
        setLoding(false);
        console.log("False");
      }
    } catch (err) {
      setLoding(false);
      console.log("Error fetching connections:", err);
    }
  };

  useEffect(() => {
    GetProjectTimeData();
  }, []);

  const formatTime = (time) => {
    if (!time) return ""; // Handle null or undefined time
    return time.length > 5 ? time.slice(0, 5) : time; // If 'HH:mm:ss', extract 'HH:mm'; else, return as is
  };

  const renderItem1 = ({ item }) => {
    const formattedTime = `${formatTime(item.original_start_time)}-${formatTime(
      item.original_end_time
    )}`;
    const Breakk = formatTime(item.break_time ? item.break_time : "--");
    return (
      <>
        <View style={styles.row1}>
          <Text style={styles.cell}>{formatDate(item.current_date)}</Text>
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
              onPress={() => {
                console.log("=-==", item.description);
                Alert.alert(t("Omschrijving"), item.description);
              }}
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
              {item.total_time ? `${item.total_time} Ⓘ` : "--"}
            </Text>
          </View>
        </View>
      </>
    );
  };

  const handleSelectItem = (selectedItem, index) => {
    console.log("=-=-");
    GetProjectTimeData(
      selectedItem.title,
      selectedItemmonth ? selectedItemmonth.title : undefined
    );
    setSelectedItem(selectedItem);
  };

  const handleSelectItemmonth = (selectedItemm, index) => {
    setSelectedItemmonth(selectedItemm);
    GetProjectTimeData(
      selectedItem ? selectedItem.title : selectedItem,
      selectedItemm.value
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color }}>
      <StatusBar backgroundColor={color} barStyle={"light-content"} />
      {/* <Header title={item.project_name} back /> */}
      <BlueHeader
        title={item.project_name}
        Righticon={Images.refresh}
        onPressRight={GetProjectTimeData}
      />
      <View
        style={{
          backgroundColor: Colors.litegray1,
          height: "100%",
          marginTop: heightPercentageToDP(1),
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          flex: 1,
          paddingTop: 10,
        }}
      >
        {Loding && <Loader />}
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
          <FlatList
            bounces={false}
            data={projectstimee}
            renderItem={renderItem1}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={() =>
              projectstimee && projectstimee.length > 0 ? (
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
    </SafeAreaView>
  );
};

export default ProjectTimeDetails;

const styles = StyleSheet.create({
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
    fontSize: 12,
    textAlign: "center",
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
  day: {
    fontSize: RFValue(14),
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
  },
});
