import {
  FlatList,
  // SafeAreaView,
  StyleSheet,
  Text,
  View,
  StatusBar,
  ScrollView,
  Alert,
} from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import Header from "../components/header";
import { Colors } from "../constants/color";
import { FONTS } from "../constants/fontFamily";
import { getData } from "../utils/storeData";
import { Images } from "../constants/images";
import { RFValue } from "react-native-responsive-fontsize";
import apiConstants from "../api/apiConstants";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import ApiService from "../utils/Apiservice";
import BlueHeader from "../components/BlueHeader";
import Footer from "../components/Footer";
import { SafeAreaView } from "react-native-safe-area-context";
import { heightPercentageToDP } from "react-native-responsive-screen";

const Employeedetails = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { id } = route?.params;
  const { color } = route?.params;
  const [logo, setLogo] = useState(null);
  const [leaveDetailsData, setLeaveDetailsData] = useState([]);
  const [data, setData] = useState("");
  const [role, setRole] = useState(null);

  useEffect(() => {
    companylogo();
    fetchDetails();
  }, []);

  const companylogo = async () => {
    const companylogo = await getData("COMPANYLOGO");
    setLogo(companylogo);
  };

  const fetchDetails = async () => {
    try {
      const getdata = await getData("USERDATA");
      setRole(getdata.data.user.role);
      const data = await ApiService(apiConstants.employeedetails, {
        includeToken: true,
        customData: {
          contract_id: id,
          relaties_id: getdata.data.relaties.id,
          role: getdata.data.user.role,
          user_id: getdata.data.user.id,
        },
      });
      if (data.status) {
        const leaveDetails = data.data.leave_details || {};
        setData(data.data);
        setLeaveDetailsData(Object.entries(leaveDetails));
      } else {
        console.log("error  ", data.message);
      }
    } catch (err) {
      console.log("Error fetching connections:", err);
    }
  };

  const renderLeaveHeader = () => (
    <View style={styles.leaveHeader}>
      <Text style={styles.leaveTitle}></Text>
      <View style={styles.leaveValuesContainer}>
        <Text style={styles.columnLabel}>{t("Start")}</Text>
        <Text style={styles.columnLabel}>{t("Approved")}</Text>
        <Text style={styles.columnLabel}>{t("Left")}</Text>
      </View>
    </View>
  );

  const renderLeaveDetail = ({ item }) => {
    const [Type, details] = item;
    return (
      <View>
        <View style={styles.leaveRow}>
          <Text style={styles.leaveTitle}>{t(Type)}</Text>
          <View style={styles.leaveValuesContainer}>
            <Text style={styles.leaveValue}>{details.start}</Text>
            <Text style={styles.leaveValue}>{details.approved}</Text>
            <Text style={styles.leaveValue}>{details.left}</Text>
          </View>
        </View>
        <View style={styles.line} />
      </View>
    );
  };

  const levedetailsunderdata = () => {
    return (
      <View>
        <View style={styles.row}>
          <Text style={styles.label}>{t("Afwezing")}</Text>
          <Text style={styles.value}>
            {data?.Afwezig?.total_hours} {t("uren")} {" /"}{" "}
            {data?.Afwezig?.days} {t("dagen")}
          </Text>
        </View>
        <View style={styles.line}></View>
        <View style={styles.row}>
          <Text style={styles.total}>{t("Total hours left")}</Text>
          <Text style={styles.totalvalue}>
            {data?.contract?.total_leave_hours || "--"}
          </Text>
        </View>
      </View>
    );
  };

  const renderContractDetailRow = ({ item, index }) => (
    <View>
      <View style={styles.row}>
        <Text style={styles.label}>{item.label}</Text>
        <Text style={styles.value}>{item.value}</Text>
      </View>
      {index < contractDetailsArray.length - 1 && <View style={styles.line} />}
    </View>
  );

  const formatDate = (dateString) => {
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
    return `${day} ${months[parseInt(month, 10) - 1]} ${year}`;
  };

  const contractDetailsArray = [
    { label: t("Werkgever"), value: data?.display_name || "--" },
    {
      label: t("COA"),
      value: data?.contract?.cao_contract == "true" ? "Yes" : "No" || "--",
    },
    {
      label: t("Datum"),
      value:
        data?.contract?.from &&
        data?.contract?.end &&
        data?.contract?.contract_month
          ? `${formatDate(data?.contract?.from)} -- ${formatDate(
              data?.contract?.end
            )} (${data?.contract?.contract_month})`
          : "--",
    },
    {
      label: t("Contact Type"),
      value: data?.contract?.contract_template_data?.template_name || "--",
    },
    {
      label: t("Contract uren"),
      value:
        data?.contract?.contract_hour_per_week &&
        data?.contract?.minimal_hour_per_week &&
        data?.contract?.maximum_hour_per_week
          ? `${data?.contract?.contract_hour_per_week} - min: ${data?.contract?.minimal_hour_per_week} - max: ${data?.contract?.maximum_hour_per_week}`
          : "--",
    },
  ];

  return (
    // <SafeAreaView style={[styles.container, { backgroundColor: color }]}>
    <>
      <StatusBar backgroundColor={color} barStyle={"light-content"} />
      {/* <Heade
          source={{ uri: logo }}
          lefticon={Images.back}
          lefticonclick={() => navigation.goBack()}
        /> */}
      <BlueHeader title={t("Details")} bgcolor={color} />
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
        <ScrollView
          contentContainerStyle={{
            paddingBottom: 20, // Adds bottom padding to the content
          }}
        >
          {/* {role === "superadmin" && (
          <> */}
          <View style={styles.headerbg}>
            <Text style={styles.contractname}>
              {data?.contract?.contract_name}
            </Text>
            {data?.contract?.status_name && (
              <View style={styles.statusContainer}>
                <View
                  style={[
                    styles.statusBox,
                    {
                      backgroundColor: data?.contract?.color || Colors.primary,
                    },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {data?.contract?.status_name}
                  </Text>
                </View>
              </View>
            )}
          </View>

          <View style={styles.leaveBox}>
            <FlatList
              data={contractDetailsArray}
              renderItem={renderContractDetailRow}
              keyExtractor={(item) => item.label}
            />
          </View>

          <Text style={styles.sectionTitle}>{t("Leave Details")}</Text>

          <View style={styles.leaveBox}>
            {renderLeaveHeader()}
            <FlatList
              data={leaveDetailsData}
              renderItem={renderLeaveDetail}
              keyExtractor={(item) => item[0]}
            />
            {levedetailsunderdata()}
          </View>
          {/* </>
        )} */}
        </ScrollView>
      </View>
      {/* <Footer /> */}
    </>
    // </SafeAreaView>
  );
};

export default Employeedetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  leaveBox: {
    marginHorizontal: 15,
    borderColor: Colors.litegray,
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
    backgroundColor: Colors.white,
  },
  line: {
    height: 1,
    backgroundColor: Colors.litegray,
    marginVertical: 8,
  },
  contractHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  contractTitle: {
    marginTop: RFValue(12),
    fontFamily: FONTS.LexendRegular,
    fontSize: RFValue(14),
    color: Colors.black,
  },

  statusContainer: {
    flexDirection: "row",
    flex: 1,
    justifyContent: "flex-end",
  },

  statusBox: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 5,
    paddingHorizontal: 10,
    marginRight: 5,
    marginTop: 5,
    paddingVertical: 5,
  },
  statusText: {
    color: Colors.white,
    fontFamily: FONTS.LexendRegular,
    fontSize: 14,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 5,
  },
  label: {
    fontFamily: FONTS.LexendMedium,
    fontSize: RFValue(12),
    color: Colors.textgray,
  },
  value: {
    fontFamily: FONTS.LexendMedium,
    fontSize: RFValue(12),
    color: Colors.primaryblue,
    textAlign: "right",
    flexWrap: "wrap",
    width: "55%",
  },
  sectionTitle: {
    fontFamily: FONTS.LexendMedium,
    fontSize: RFValue(14),
    color: Colors.black,
    marginBottom: 10,
    marginHorizontal: 16,
  },
  leaveRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 5,
  },
  leaveValue: {
    fontFamily: FONTS.LexendMedium,
    fontSize: RFValue(12),
    color: Colors.primaryblue,
    flex: 1,
    textAlign: "right",
  },
  Title: {
    fontFamily: FONTS.LexendRegular,
    fontSize: RFValue(13),
    color: Colors.black,
    flex: 1,
    textAlign: "right",
  },
  leaveHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    borderBottomColor: Colors.gray,
    paddingBottom: 8,
  },
  columnLabel: {
    fontFamily: FONTS.LexendRegular,
    fontSize: RFValue(9),
    color: Colors.black,
    flex: 1,
    textAlign: "right",
  },

  leaveContainer: {
    marginVertical: 5,
  },
  leaveRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 5,
  },
  leaveTitle: {
    fontFamily: FONTS.LexendMedium,
    fontSize: RFValue(12),
    flex: 1,
    color: Colors.textgray,
  },
  leaveValuesContainer: {
    flexDirection: "row",
    flex: 1.5,
    justifyContent: "space-between",
    alignItems: "center",
  },
  total: {
    fontFamily: FONTS.LexendMedium,
    fontSize: RFValue(13),
    color: Colors.black,
  },
  totalvalue: {
    fontFamily: FONTS.LexendRegular,
    fontSize: RFValue(13),
    color: Colors.primary,
    textAlign: "right",
  },
  headerbg: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginVertical: 10,
  },
  contractname: {
    marginTop: RFValue(12),
    fontFamily: FONTS.LexendMedium,
    fontSize: RFValue(14),
    color: Colors.black,
    width: "60%",
  },
});
