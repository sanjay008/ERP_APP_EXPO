// import {
//   Alert,
//   Dimensions,
//   FlatList,
//   Image,
//   Platform,
//   // SafeAreaView,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import React, { useEffect, useState } from "react";
// import Header from "../components/header";
// import { Images } from "../constants/images";
// import { Colors } from "../constants/color";
// import { FONTS } from "../constants/fontFamily";
// import { RFValue } from "react-native-responsive-fontsize";
// import Modal from "react-native-modal";
// import { useTranslation } from "react-i18next";
// import { getData } from "../utils/storeData";
// import apiConstants from "../api/apiConstants";
// import { heightPercentageToDP } from "react-native-responsive-screen";
// import ApiService from "../utils/Apiservice";
// import { SafeAreaView } from "react-native-safe-area-context";

// const Absencedetails = ({ navigation, route }) => {
//   const { id } = route.params;
//   const { t } = useTranslation();
//   const { height } = Dimensions.get("window");
//   const [expandedItem, setExpandedItem] = useState(null);
//   const [modalOptionsVisible, setModalOptionsVisible] = useState(false);
//   const [absencedetails, setAbsenceDetails] = useState([]);
//   const [modaldata, setModalData] = useState("");

//   const toggleItem = (itemId) => {
//     setExpandedItem(expandedItem === itemId ? null : itemId);
//   };

//   const Absencedetails = async () => {
//     try {
//       const getdata = await getData("USERDATA");
//       const data = await ApiService(apiConstants.Absencerequestdetails, {
//         includeToken: true,
//         customData: {
//           relaties_id: getdata.data.relaties.id,
//           role: getdata.data.user.role,
//           user_id: getdata.data.user.id,
//           leave_id: id,
//         },
//       });
//       if (data.status) {
//         const dataa = Array.isArray(data.data) ? data.data : [data.data];
//         setAbsenceDetails(dataa);
//       } else {
//         console.log("False");
//       }
//     } catch (err) {
//       console.log("Error fetching connections:", err);
//     }
//   };

//   useEffect(() => {
//     Absencedetails();
//   }, []);

//   const renderItem = ({ item }) => {
//     return (
//       <View>
//         <TouchableOpacity
//           style={styles.box}
//           onPress={() => toggleItem(item.id)}
//         >
//           <View style={styles.renderitemmain}>
//             <View style={styles.contract}>
//               <Text style={[styles.day, { paddingVertical: 8 }]}>
//                 {item?.employementdata?.contract_name}
//               </Text>
//               <View style={styles.daydate}>
//                 <Text style={[styles.date, { marginRight: 5 }]}>
//                   {item?.employerscheduledata?.day}
//                 </Text>
//                 <Text style={styles.date}>{item.date}</Text>
//               </View>
//             </View>

//             <View style={styles.statusbg}>
//               {item.status_data && (
//                 <View
//                   style={[
//                     styles.statusbox,
//                     {
//                       backgroundColor:
//                         item?.status_data?.color || Colors.primary,
//                     },
//                   ]}
//                 >
//                   <Text style={styles.statusname}>
//                     {item?.status_data?.status_name}
//                   </Text>
//                 </View>
//               )}
//             </View>
//           </View>

//           {expandedItem === item.id && (
//             <View>
//               <View style={styles.line}></View>
//               <View style={styles.data}>
//                 <Text style={[styles.day, { width: "50%" }]}>
//                   Begin & Einde
//                 </Text>
//                 <Text
//                   style={[styles.date, { width: "50%", textAlign: "right" }]}
//                 >
//                   {item.start_time && item.end_time ? (
//                     <>
//                       {item.start_time} - {item.end_time} ({item.total_hours}){" "}
//                       {item.reason_field}
//                     </>
//                   ) : (
//                     <>
//                       {item?.employerscheduledata?.start_time} -{" "}
//                       {item?.employerscheduledata?.end_time} ({item.total_hours}
//                       ) {item.reason_field}
//                     </>
//                   )}
//                 </Text>
//               </View>
//               <View style={styles.line}></View>
//               <View style={styles.data}>
//                 <Text style={[styles.day, { width: "50%" }]}>Type</Text>
//                 <Text
//                   style={[styles.date, { width: "50%", textAlign: "right" }]}
//                 >
//                   {item.leave_type_data.leave_type_name}{" "}
//                   {item.leave_type_data.leave_hour_system == 1
//                     ? "Contract Leave : Yes"
//                     : "Contract Leave : No"}
//                 </Text>
//               </View>
//             </View>
//           )}
//         </TouchableOpacity>
//       </View>
//     );
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <Header
//         title={t("Verlofaanvragen")}
//         back
//         rightbutton={Images.plus}
//         rightbuttonclick={() => setModalOptionsVisible(true)}
//       />
//       <FlatList
//         data={absencedetails}
//         renderItem={renderItem}
//         keyExtractor={(item) => item.id.toString()}
//         ListHeaderComponent={() => {
//           return (
//             <View style={styles.header}>
//               <Text style={styles.title}>{t("Contractnaam")}</Text>
//               <Text style={styles.title}>{t("Status")}</Text>
//             </View>
//           );
//         }}
//       />

//       <Modal
//         animationIn={"fadeIn"}
//         transparent={true}
//         visible={modalOptionsVisible}
//         onRequestClose={() => {
//           setModalOptionsVisible(false);
//         }}
//         onSwipeComplete={() => {
//           setModalOptionsVisible(false);
//         }}
//         onBackdropPress={() => {
//           setModalOptionsVisible(false);
//         }}
//         onBackButtonPress={() => {
//           setModalOptionsVisible(false);
//         }}
//       >
//         <View
//           style={[
//             styles.modalOptionsContainer,
//             {
//               top:
//                 Platform.OS === "ios"
//                   ? height > 800
//                     ? 90 // iOS devices with large height
//                     : 50 // iOS devices with small height
//                   : Platform.OS === "android"
//                   ? height > 800
//                     ? 40 // Android devices with large height
//                     : 30 // Android devices with small height
//                   : 50, // Default fallback (if neither iOS nor Android)
//             },
//           ]}
//         ></View>
//       </Modal>
//     </SafeAreaView>
//   );
// };

// export default Absencedetails;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: Colors.white,
//   },
//   box: {
//     borderWidth: 1,
//     marginHorizontal: 20,
//     borderRadius: 10,
//     justifyContent: "space-between",
//     paddingHorizontal: 20,
//     paddingVertical: 10,
//     marginVertical: 10,
//     borderColor: Colors.litegray,
//   },
//   title: {
//     fontFamily: FONTS.LexendMedium,
//     fontSize: RFValue(16),
//     color: Colors.black,
//     paddingVertical: 10,
//   },
//   date: {
//     fontFamily: FONTS.LexendRegular,
//     fontSize: RFValue(13),
//     color: Colors.textgray,
//   },
//   day: {
//     fontFamily: FONTS.LexendRegular,
//     fontSize: RFValue(14),
//     color: Colors.black,
//   },
//   header: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginHorizontal: 30,
//   },
//   data: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//   },
//   line: {
//     height: 1,
//     backgroundColor: Colors.litegray,
//     marginVertical: 15,
//   },
//   modalOptionsContainer: {
//     position: "absolute",
//     // top: 50,
//     // top: heightPercentageToDP("10%"),
//     right: 4,
//     backgroundColor: "white",
//     borderRadius: 10,
//     justifyContent: "space-around",
//     elevation: 5,
//     padding: 10,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.3,
//     shadowRadius: 4,
//   },
//   option: {
//     padding: 10,
//     color: Colors.black,
//     flexDirection: "row",
//   },
//   mview: {
//     paddingHorizontal: 20,
//     justifyContent: "center",
//     alignItems: "center",
//     margin: 0,
//     backgroundColor: Colors.transparant,
//   },
//   mcontainer: {
//     flex: 1,
//     position: "absolute",
//     borderRadius: 10,
//     backgroundColor: Colors.white,
//     width: "100%",
//   },
//   renderitemmain: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },
//   contract: {
//     justifyContent: "center",
//     flex: 7,
//   },
//   daydate: {
//     flexDirection: "row",
//   },
//   statusbg: {
//     flex: 4,
//   },
//   statusbox: {
//     paddingHorizontal: 10,
//     borderRadius: 5,
//     alignItems: "center",
//     justifyContent: "center",
//     height: RFValue(35),
//   },
//   statusname: {
//     fontFamily: FONTS.LexendRegular,
//     color: Colors.white,
//     fontSize: RFValue(13),
//   },
//   modalimages: {
//     height: 20,
//     width: 20,
//     marginRight: 10,
//   },
//   modalitems: {
//     color: Colors.black,
//     fontFamily: FONTS.LexendRegular,
//   },
// });
