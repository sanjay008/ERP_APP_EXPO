import {
  FlatList,
  // SafeAreaView,
  StyleSheet,
  Text,
  View,
  StatusBar,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
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

const Childcontactdetails = ({ navigation, route }) => {
  const [leaveDetailsData, setLeaveDetailsData] = useState([]);
  const [data, setData] = useState("");
  const [role, setRole] = useState(null);
  const { t } = useTranslation();
  const { id, color } = route.params;
  const [logo, setlogo] = useState(null);
  const [childdetails, setChilddetails] = useState([]);
  const [seconddata, setseconddata] = useState([]);
  const [expandedItem, setExpandedItem] = useState(null);
  const [expandedItemId, setExpandedItemId] = useState(null);

  const toggleItem1 = (itemId) => {
    setExpandedItemId((prevId) => (prevId === itemId ? null : itemId)); // Toggle expansion for the selected item
  };

  const companylogo = async () => {
    const companylogo = await getData("COMPANYLOGO");
    setlogo(companylogo);
  };

  const Childdatadetails = async () => {
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.childcontractdetails, {
        includeToken: true,
        customData: {
          relaties_id: getdata.data.relaties.id,
          role: getdata.data.user.role,
          user_id: getdata.data.user.id,
          contract_id: id,
        },
      });
      if (data.status) {
        setChilddetails(data.data);

        const scheduledata = data.data.schedule_blocks;
        setseconddata(scheduledata);
      } else {
        console.log("false");
      }
    } catch (err) {
      console.log("Error fetching connections:", err);
    }
  };
  console.log("abhkcadbh =========>>>>>>>>>", childdetails.schedule_blocks);

  useEffect(() => {
    Childdatadetails();
    companylogo();
  }, []);

  const renderContractDetailRow = ({ item, index }) => (
    <View>
      <View style={styles.row}>
        <Text style={styles.label}>{item.label}</Text>
        <Text style={styles.value}>{item.value}</Text>
      </View>
      {index < contractDetailsArray.length - 1 && <View style={styles.line} />}
    </View>
  );

  const renderContractDetailRow1 = ({ item, index }) => (
    <View>
      <View style={[styles.row]}>
        <Text style={[styles.label, {}]}>{item.label}</Text>
        <Text style={[styles.value, { width: "30%" }]}>{item.value}</Text>
      </View>
      {index < contractDetailsArray1.length - 1 && <View style={styles.line} />}
    </View>
  );

  const contractDetailsArray = [
    {
      label: t("Kind Name"),
      value: childdetails?.child_data?.display_name || "--",
    },
    {
      label: t("Begin datum"),
      value: childdetails?.start_date || "--",
    },
    {
      label: t("Einddatum"),
      value: childdetails?.end_date || "--",
    },
    {
      label: t("Child Age"),
      value: childdetails?.child_age || "--",
    },
    {
      label: t("Branch"),
      value: childdetails?.branchdata?.relatie?.display_name || "--",
    },
    {
      label: t("Parent 1"),
      value: childdetails?.parent_data_one?.display_name || "--",
    },
    {
      label: t("Parent 2"),
      value: childdetails?.parent_data_second?.display_name || "--",
    },
    {
      label: t("Daycare Contract"),
      value: childdetails?.contract_template_data?.template_name || "--",
    },
    {
      label: t("School"),
      value: childdetails?.relaties_school_data?.display_name || "--",
    },
  ];
  
  const contractDetailsArray1 = [
    {
      label: t("Total Year Price"),
      value:
        childdetails?.company_currency + " " + childdetails.total_year_price ||
        "--",
    },
    {
      label: t("Average Price Per Month"),
      value:
        childdetails?.company_currency + " " + childdetails.average_per_month ||
        "--",
    },
    {
      label: t("Total hours"),
      value: childdetails.total_hours || "--",
    },
    {
      label: t("Average Hours Price"),
      value:
        childdetails?.company_currency +
          " " +
          childdetails.average_hours_price || "--",
    },
  ];

  const renderItem = ({ item }) => {
    const isExpanded = expandedItemId === item.id;
    return (
      //   <View
      //   style={{
      //     flexDirection: "row",
      //     alignItems: "center",
      //     justifyContent: "space-between",
      //   }}
      // >
      //   <TouchableOpacity
      //     onPress={() => toggleItem1(item.id)}
      //     style={{ flex: 1 }} // Makes this TouchableOpacity take available space
      //   >
      //     <View style={styles.renderitemmain}>
      //       <Text style={[styles.daydetails, { paddingVertical: 8 }]}>
      //         {item?.day || "-"}
      //       </Text>
      //       <Text style={styles.date}>
      //         {item.start_time}-{item.end_time}
      //       </Text>
      //     </View>
      //   </TouchableOpacity>

      //   <Text style={[styles.statusname, { color: Colors.black }]}>
      //     {item.block_time.block_name}
      //   </Text>
      //   <Text>{item.block_time.total_time}</Text>
      //   <Text>
      //     {item.company_currency} {item.rate.amount}
      //   </Text>
      // </View>
      <View style={styles.box}>
        <View style={{ marginVertical: 10 }}>
          <View style={styles.row}>
            <Text style={styles.label1}>{item.day}</Text>
            <Text style={styles.valueBlockName}>
              {item?.block_time?.block_name || "-"}
            </Text>
            <Text style={styles.value1}>{item.rate_amount || "-"}</Text>
          </View>

          <View style={styles.row1}>
            <View style={styles.timeContainer}>
              <Image source={Images.time} style={styles.timeIcon} />
              <Text style={styles.totalTimeText}>
                {item?.block_time?.total_time} {"uur"}
              </Text>
            </View>
            <Text style={styles.renderseconddate}>
              {item.start_time || "-"} {" - "} {item.end_time || "-"}
            </Text>
            <Text style={styles.renderseconddate1}>
              {item.company_currency} {item.rate.amount}
            </Text>
          </View>
        </View>

        {isExpanded && (
          <View>
            {/* {absencedetails.map((detail, index) => ( */}
            <View>
              <View style={styles.line}></View>
              <View style={styles.data}>
                <Text style={[styles.daydetails, { width: "50%" }]}>
                  {t("Hours")}
                </Text>
                <Text
                  style={[styles.date, { width: "50%", textAlign: "right" }]}
                >
                  {item.total_hours}
                </Text>
              </View>
              <View style={styles.line}></View>
              <View style={styles.data}>
                <Text style={[styles.daydetails, { width: "50%" }]}>
                  {t("Hprice")}
                </Text>
                <Text
                  style={[styles.date, { width: "50%", textAlign: "right" }]}
                >
                  {item.company_currency}{" "}
                  {item?.rate?.amount && item?.rate?.amount}
                </Text>
              </View>
              <View style={styles.line}></View>
              <View style={styles.data}>
                <Text style={[styles.daydetails, { width: "50%" }]}>
                  {t("Dprice")}
                </Text>
                <Text
                  style={[styles.date, { width: "50%", textAlign: "right" }]}
                >
                  {item.company_currency} {item.day_price}
                </Text>
              </View>
              <View style={styles.line}></View>
              <View style={styles.data}>
                <Text style={[styles.daydetails, { width: "50%" }]}>
                  {t("WKs/Thrs")}
                </Text>
                <Text
                  style={[styles.date, { width: "50%", textAlign: "right" }]}
                >
                  {item.weeks_count} / {item.weeks_hours}
                </Text>
              </View>
              <View style={styles.line}></View>
              <View style={styles.data}>
                <Text style={[styles.daydetails, { width: "50%" }]}>
                  {t("Yprice")}
                </Text>
                <Text
                  style={[styles.date, { width: "50%", textAlign: "right" }]}
                >
                  {item.company_currency} {item.year_price}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "flex-end",
                  marginTop: 15,
                }}
              ></View>
            </View>
            {/* ))} */}
          </View>
        )}
      </View>
    );
  };
  return (
    // <SafeAreaView style={[styles.container, { backgroundColor: color }]}>
    <>
      <BlueHeader title={t("Details")} bgcolor={color} />
      <View
        style={{
          backgroundColor: Colors.litegray1,
          height: "100%",
          marginTop: heightPercentageToDP(-1),
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
          flex: 1,
        }}
      >
        <ScrollView>
          {/* <StatusBar barStyle={"dark-content"} backgroundColor={Colors.white} /> */}
          {/* <Header
          source={{ uri: logo }}
          lefticon={Images.back}
          lefticonclick={() => navigation.goBack()}
        /> */}
          <View style={styles.headerbg}>
            <Text style={styles.contractname}>
              {childdetails?.contract_name}
            </Text>
            {childdetails?.status?.status_name && (
              <View style={styles.statusContainer}>
                <View
                  style={[
                    styles.statusBox,
                    {
                      backgroundColor:
                        childdetails?.status?.color || Colors.primary,
                    },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {childdetails?.status?.status_name}
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

          {/* <Text style={styles.sectionTitle}>{t("Leave Details")}</Text> */}

          <View style={styles.top}>
            <FlatList
              bounces={false}
              data={childdetails.schedule_blocks}
              renderItem={renderItem}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={() => {
                return <Text style={styles.emptyText}>{t("No Data")}</Text>;
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
                    {t("Leave Details")}
                  </Text>
                </View>
              )}
            />
          </View>
          <View style={styles.leaveBox}>
            <FlatList
              data={contractDetailsArray1}
              renderItem={renderContractDetailRow1}
              keyExtractor={(item) => item.label}
            />
          </View>
        </ScrollView>
      </View>
      {/* <Footer /> */}
    {/* </SafeAreaView> */}
    </>  );
};

export default Childcontactdetails;

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
    // height: 35,
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
    fontFamily: FONTS.LexendRegular,
    fontSize: RFValue(12),
    color: Colors.black,
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
    fontFamily: FONTS.LexendRegular,
    fontSize: RFValue(12),
    color: Colors.black,
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
    flex: 1,
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
  top: {
    borderWidth: 1,
    marginHorizontal: 10,
    marginTop: 20,
    borderColor: Colors.litegray,
    borderRadius: 5,
  },
  tview: {
    padding: 5,
    marginHorizontal: 10,
    marginTop: 10,
    alignSelf: "flex-start",
  },
  emptyText: {
    textAlign: "center",
    color: Colors.textgray,
    fontFamily: FONTS.LexendRegular,
    marginVertical: 20,
  },
  statusbox: {
    paddingHorizontal: 10,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    height: RFValue(35),
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
  date: {
    fontFamily: FONTS.LexendRegular,
    fontSize: RFValue(13),
    color: Colors.textgray,
  },
  day: {
    fontFamily: FONTS.LexendRegular,
    fontSize: RFValue(13),
    color: Colors.black,
    paddingVertical: 5,
    width: "60%",
  },
  statusname: {
    fontFamily: FONTS.LexendRegular,
    color: Colors.white,
    fontSize: RFValue(13),
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
  daydetails: {
    fontFamily: FONTS.LexendRegular,
    fontSize: RFValue(14),
    color: Colors.black,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  row1: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  label1: {
    fontFamily: FONTS.LexendRegular,
    color: Colors.textgray,
    fontSize: RFValue(13),
    flex: 2, // Ensures alignment with the block_name text
    textAlign: "left",
  },
  valueBlockName: {
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
    fontSize: RFValue(13),
    flex: 3, // Allows more space for long names
    textAlign: "left",
  },
  value1: {
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
    fontSize: RFValue(13),
    flex: 1,
    textAlign: "right",
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 2,
  },
  timeIcon: {
    height: 20,
    width: 20,
    marginRight: 5,
  },
  totalTimeText: {
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
    fontSize: RFValue(12),
    flex: 2,
  },
  renderseconddate: {
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
    textAlign: "left",
    flex: 3,
    fontSize: RFValue(12),
  },
  renderseconddate1: {
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
    textAlign: "right",
    flex: 1,
    fontSize: RFValue(12),
  },
});



// import {
//   FlatList,
//   Image,
//   SafeAreaView,
//   ScrollView,
//   StyleSheet,
//   Text,
//   View,
// } from "react-native";
// import React, { useEffect, useState } from "react";
// import Header from "../components/header";
// import { Images } from "../constants/images";
// import { getData } from "../utils/storeData";
// import { Colors } from "../constants/color";
// import { RFValue } from "react-native-responsive-fontsize";
// import { FONTS } from "../constants/fontFamily";
// import Notes from "../components/Notes";
// import apiConstants from "../api/apiConstants";
// import { useTranslation } from "react-i18next";
// import ApiService from "../utils/Apiservice";

// const Childcontactdetails = ({ route }) => {
//   const { t } = useTranslation();
//   const { id } = route.params;
//   const [logo, setlogo] = useState(null);
//   const [childdetails, setChilddetails] = useState([]);
//   const [seconddata, setseconddata] = useState([]);

//   const companylogo = async () => {
//     const companylogo = await getData("COMPANYLOGO");
//     setlogo(companylogo);
//   };
//   useEffect(() => {
//     companylogo();
//   }, []);

//   const removeHtmlTags = (htmlString) => {
//     return htmlString.replace(/<[^>]*>/g, "");
//   };

//   const Childdatadetails = async () => {
//     try {
//       const getdata = await getData("USERDATA");
//       const data = await ApiService(apiConstants.childcontractdetails, {
//         includeToken: true,
//         customData: {
//           relaties_id: getdata.data.relaties.id,
//           role: getdata.data.user.role,
//           user_id: getdata.data.user.id,
//           contract_id: id,
//         },
//       });
//       if (data.status) {
//         setChilddetails(data.data);
//         const scheduledata = data.data.schedule_blocks;
//         setseconddata(scheduledata);
//       } else {
//         console.log("false");
//       }
//     } catch (err) {
//       console.log("Error fetching connections:", err);
//     }
//   };

//   useEffect(() => {
//     Childdatadetails();
//   }, []);

//   const DATA = [
//     {
//       id: 1,
//       title: t("Child Name"),
//       dis: childdetails?.child_data?.display_name || "-",
//     },
//     { id: 2, title: t("Begin datum"), dis: childdetails.start_date || "-" },
//     { id: 3, title: t("Einddatum"), dis: childdetails.end_date || "-" },
//     { id: 4, title: t("Child Age"), dis: childdetails.child_age || "-" },
//     { id: 5, title: t("Vestiging"), dis: "KDV Mona Lisa" },
//     {
//       id: 6,
//       title: t("Ouder 1"),
//       dis: childdetails?.parent_data_one?.display_name || "-",
//     },
//     {
//       id: 7,
//       title: t("Ouder 2"),
//       dis: childdetails?.parent_data_second?.display_name || "-",
//     },
//     {
//       id: 8,
//       title: t("contract Kinderopvang"),
//       dis: childdetails?.contract_template_data?.template_name || "-",
//     },
//   ];

//   const renderItem = ({ item }) => {
//     return (
//       <View style={styles.row}>
//         <Text style={styles.label}>{item.title} </Text>
//         <Text style={styles.value}>{item.dis}</Text>
//       </View>
//     );
//   };

//   const renderItemsecond = ({ item }) => {
//     return (
//       <View style={{ marginBottom: 20, marginTop: 10 }}>
//         <View style={styles.row}>
//           <Text style={styles.label1}>{item.day}</Text>
//           <Text style={styles.value1}>
//             {item?.block_time?.block_name || "-"}
//           </Text>
//           <Text style={styles.value1}>{item.rate_amount || "-"}</Text>
//         </View>
//         <View style={styles.row1}>
//           {item.day == "Holidays" && (
//             <Text
//               style={{ fontFamily: FONTS.LexendRegular, color: Colors.black, fontSize:RFValue(12) }}
//             >
//               {childdetails.checked_days_count} {"dagen"}
//             </Text>
//           )}

//           <Text style={styles.renderseconddate}>
//             {item.start_time || "-"}
//             {" - "}
//             {item.end_time || "-"}
//           </Text>
//         </View>
//       </View>
//     );
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <Header back source={{ uri: logo }} />
//       <ScrollView showsVerticalScrollIndicator={false}>
//         <Image
//           source={{ uri: childdetails?.child_data?.profile_image?.file_path }}
//           style={styles.profileimage}
//         />
//         <View>
//           <View>
//             <Text style={styles.title}>{t("Contact Details")}</Text>
//           </View>

//           <View style={styles.box}>
//             <Text style={styles.boxtitle}>{t("Ishaan 2 weken")}</Text>
//             <View style={styles.line}></View>
//             <FlatList
//               data={DATA}
//               renderItem={renderItem}
//               ItemSeparatorComponent={() => <View style={styles.line}></View>}
//               showsVerticalScrollIndicator={false}
//             />
//           </View>
//         </View>
//         <View style={styles.box}>
//           <FlatList
//             data={seconddata}
//             renderItem={renderItemsecond}
//             ItemSeparatorComponent={() => <View style={styles.line}></View>}
//           />
//         </View>
//         {childdetails?.notes?.map((note) => (
//           <Notes
//             key={note.id}
//             title={"Notes"}
//             name={note?.user?.username || "Default Username"}
//             time={note.created_at}
//             dis={removeHtmlTags(note.comment)}
//           />
//         ))}
//       </ScrollView>
//     </SafeAreaView>
//   );
// };

// export default Childcontactdetails;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: Colors.white,
//   },
//   profileimage: {
//     height: 100,
//     width: 100,
//     alignSelf: "center",
//     marginVertical: RFValue(15),
//     borderRadius: 7,
//   },
//   title: {
//     fontSize: RFValue(15),
//     fontFamily: FONTS.LexendMedium,
//     marginHorizontal: 20,
//     marginVertical: 10,
//     color: Colors.black,
//   },
//   label: {
//     fontFamily: FONTS.LexendRegular,
//     color: Colors.textgray,
//     width: "50%",
//     textAlign: "left",
//     paddingRight: 10,
//     fontSize:RFValue(12)
//   },
//   value: {
//     fontFamily: FONTS.LexendRegular,
//     color: Colors.black,
//     width: "50%",
//     textAlign: "right",
//     fontSize:RFValue(12)
//   },
//   row: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginVertical: 5,
//   },
//   line: {
//     height: 1,
//     backgroundColor: Colors.litegray,
//     marginVertical: 8,
//   },
//   box: {
//     borderWidth: 1,
//     borderColor: Colors.litegray,
//     marginHorizontal: 15,
//     borderRadius: 10,
//     paddingVertical: 15,
//     paddingHorizontal: 15,
//     marginVertical: 10,
//   },
//   boxtitle: {
//     fontFamily: FONTS.LexendMedium,
//     fontSize: RFValue(14),
//     color: Colors.black,

//   },
//   label1: {
//     fontFamily: FONTS.LexendRegular,
//     color: Colors.textgray,
//     fontSize:RFValue(12)
//   },
//   value1: {
//     fontFamily: FONTS.LexendRegular,
//     color: Colors.black, fontSize:RFValue(12)
//   },
//   row1: {
//     flexDirection: "row",
//     marginTop: 10,
//     fontSize:RFValue(12)
//   },
//   renderseconddate: {
//     fontFamily: FONTS.LexendRegular,
//     color: Colors.black,
//     position: "absolute",
//     right: "30%",
//     fontSize:RFValue(12)
//   },
// });

