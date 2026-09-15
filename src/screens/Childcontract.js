import {
  StyleSheet,
  Text,
  View,
  // SafeAreaView,
  FlatList,
  TouchableOpacity,
  Image,
  StatusBar,
  RefreshControl,
} from "react-native";
import React, { useEffect, useState } from "react";
import Header from "../components/header";
import { Colors } from "../constants/color";
import { FONTS } from "../constants/fontFamily";
import { RFValue } from "react-native-responsive-fontsize";
import { Images } from "../constants/images";
import apiConstants from "../api/apiConstants";
import { getData } from "../utils/storeData";
import { useTranslation } from "react-i18next";
import Loader from "../components/loading";
import ApiService from "../utils/Apiservice";
import { heightPercentageToDP } from "react-native-responsive-screen";
import { SafeAreaView } from "react-native-safe-area-context";

const ChildContract = ({ navigation, route }) => {
  const { id, bgcolor } = route.params || {};
  const { t } = useTranslation();
  const [childcontract, setChildcontract] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const Childdata = async () => {
    // setLoading(true);
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.childcontract, {
        includeToken: true,
        customData: {
          relaties_id: id,
          role: getdata.data.user.role,
          user_id: getdata.data.user.id,
        },
      });
      if (data.status) {
        // setLoading(false);
        setChildcontract(data.data);
      } else {
        // setLoading(false);
        console.log("false");
      }
    } catch (err) {
      // setLoading(false);
      console.log("Error fetching connections:", err);
    }
  };

  useEffect(() => {
    Childdata();
  }, []);

  const sortByCreatedAt = () => {
    const sortedData = [...displayedData].sort((a, b) => {
      return isDescending
        ? new Date(b.created_at) - new Date(a.created_at)
        : new Date(a.created_at) - new Date(b.created_at);
    });

    setDisplayedData(sortedData);
    setIsDescending(!isDescending);
  };

  const renderItem = ({ item }) => {
    return (
      <TouchableOpacity
        onPress={() =>
          navigation.navigate("Childcontactdetails", {
            id: item.id,
            color: bgcolor,
          })
        }
        // onPress={() => navigation.navigate("Employeedetails", { id: item.id })}
      >
        <View style={styles.Box}>
          {item.status ? (
            <View style={styles.statusbg}>
              <View
                style={[
                  styles.statusbox,
                  { backgroundColor: item.status.color || Colors.primary },
                ]}
              >
                <Text style={styles.statusname}>{item.status.status_name}</Text>
              </View>
            </View>
          ) : null}
          <View style={styles.textContainer}>
            <Text style={styles.name}>{item.contract_name || "--"}</Text>
            <Text style={styles.name1}>
              {t("Kind Name")} : {item.child_data.display_name}
            </Text>
            <Text style={styles.standard}>
              {t("Begin datum")} : {item.start_date}
            </Text>
            <Text style={styles.standard}>
              {t("Einddatum")} : {item.end_date}
            </Text>
            <Text style={styles.standard}>
              {t("Daycare Contract")} :
              {item?.contract_template_data?.template_name || "--"}
            </Text>
            <Text style={styles.standard}>
              {t("School")} : {item?.relaties_school_data?.display_name || "--"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  const onRefresh = () => {
    setRefreshing(true);
    Childdata();
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  return (
    <SafeAreaView style={{ backgroundColor: bgcolor, flex: 1 }}>
      <StatusBar backgroundColor={bgcolor} barStyle={"light-content"} />
      {loading && <Loader color={Colors.primary} />}
      <View style={styles.iconbg}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.icon]}
        >
          <Image
            source={Images.back}
            style={{ height: RFValue(20), width: RFValue(20) }}
            tintColor={Colors.white}
          />
        </TouchableOpacity>
        <Text style={styles.header}>{t("Arbeidsovereenkomst")}</Text>
        <TouchableOpacity style={[styles.icon]} onPress={sortByCreatedAt}>
          <Image
            source={Images.arrow}
            style={styles.searchicon}
            tintColor={Colors.white}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.background}>
        <FlatList
          data={childcontract}
          renderItem={renderItem}
          keyExtractor={(item) => item?.id?.toString()}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Image
                source={Images.noconnection}
                style={styles.fallbackImage}
              />
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary, "#F048C6"]}
              tintColor={Colors.primary}
            />
          }
        />
      </View>
    </SafeAreaView>
  );
};

export default ChildContract;

const styles = StyleSheet.create({
  header: {
    fontSize: RFValue(19),
    fontFamily: FONTS.LexendMedium,
    color: Colors.white,
    alignSelf: "center",
    // marginTop: heightPercentageToDP(3),
  },
  background: {
    backgroundColor: Colors.white,
    height: "100%",
    marginTop: heightPercentageToDP(6),
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  icon: {
    borderWidth: 1,
    borderRadius: 7,
    borderColor: Colors.litegray,
    height: 38,
    width: 38,
    justifyContent: "center",
    alignItems: "center",
  },
  Box: {
    paddingVertical: 10,
    borderWidth: 2,
    marginTop: RFValue(15),
    borderRadius: 10,
    borderColor: Colors.Boxgray,
    paddingHorizontal: RFValue(10),
    marginHorizontal: RFValue(12),
  },
  textContainer: {
    flexDirection: "column",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  name: {
    fontSize: RFValue(15),
    color: Colors.black,
    fontFamily: FONTS.LexendMedium,
    marginBottom: 10,
  },
  standard: {
    fontSize: RFValue(12),
    color: Colors.black,
    fontFamily: FONTS.LexendRegular,
    marginTop: RFValue(5),
  },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: RFValue(120),
  },
  fallbackImage: {
    width: RFValue(200),
    height: RFValue(200),
    resizeMode: "contain",
  },
  searchicon: {
    height: RFValue(15),
    width: RFValue(15),
  },
  statusbg: {
    flexDirection: "row",
    justifyContent: "flex-end",
    flex: 1,
  },
  statusbox: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 5,
    paddingHorizontal: 10,
    marginRight: 10,
    marginTop: 10,
    paddingVertical: 5,
  },
  statusname: {
    color: Colors.white,
    fontFamily: FONTS.LexendRegular,
    fontSize: 14,
  },
  iconbg: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginTop: heightPercentageToDP(3),
  },
  name1: {
    fontSize: RFValue(12),
    color: Colors.black,
    fontFamily: FONTS.LexendRegular,
    // marginTop: RFValue(10),
  },
});

// import {
//   StyleSheet,
//   Text,
//   View,
//   SafeAreaView,
//   FlatList,
//   TouchableOpacity,
//   Image,
// } from "react-native";
// import React, { useEffect, useState } from "react";
// import Header from "../components/header";
// import { Colors } from "../constants/color";
// import { FONTS } from "../constants/fontFamily";
// import { RFValue } from "react-native-responsive-fontsize";
// import { Images } from "../constants/images";
// import apiConstants from "../api/apiConstants";
// import { getData } from "../utils/storeData";
// import { useTranslation } from "react-i18next";
// import Loader from "../components/loading";
// import ApiService from "../utils/Apiservice";

// const ChildContract = ({ navigation,route }) => {
//   const { id } = route.params || {};
//   const { t } = useTranslation();
//   const [childcontract, setChildcontract] = useState([]);
//   const [loading, setLoading] = useState(false);

//   const Childdata = async () => {
//     setLoading(true);
//     try {
//       const getdata = await getData("USERDATA");
//       const data = await ApiService(apiConstants.childcontract, {
//         includeToken: true,
//         customData: {
//           relaties_id:id,
//           role: getdata.data.user.role,
//           user_id: getdata.data.user.id,
//         },
//       });
//       if (data.status) {
//         setLoading(false);
//         setChildcontract(data.data);
//       } else {
//         console.log("false");
//         setLoading(false);
//       }
//     } catch (err) {
//       setLoading(false);
//       console.log("Error fetching connections:", err);
//     }
//   };

//   useEffect(() => {
//     Childdata();
//   }, []);

//   const renderItem = ({ item }) => {
//     return (
//       <TouchableOpacity
//         style={styles.box}
//         onPress={() =>
//           navigation.navigate("Childcontactdetails", { id: item.id })
//         }
//       >
//         <Image
//           source={{
//             uri: item?.child_data?.profile_image?.file_path
//               ? item?.child_data?.profile_image?.file_path
//               : Images.userblanck,
//           }}
//           style={styles.renderimage}
//         />
//         <View style={styles.textContainer}>
//           <Text style={styles.name}>{item.contract_name}</Text>
//           <Text style={styles.name1}>{item.child_data.display_name}</Text>
//         </View>
//       </TouchableOpacity>
//     );
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       {loading && <Loader color={Colors.primary} />}
//       <Header back title={t("Kind Overeenkomst")} />
//       <FlatList
//         data={childcontract}
//         renderItem={renderItem}
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={{
//           paddingHorizontal: 20,
//         }}
//         ListEmptyComponent={() => {
//           return (
//             <Text style={styles.emptyText}>No Child Contract Found .</Text>
//           );
//         }}
//         // ListFooterComponent={() => {
//         //   return childcontract.length > 0 ? (
//         //     <View style={styles.box1}>
//         //       <Text style={styles.value}>{t("Profile img of relation")}</Text>

//         //       <Text style={styles.bulletText}>
//         //         {`\u2022`}
//         //         {"  "}Childrens are connected relations of Parents
//         //         {"\n"}
//         //         {`\u2022`}
//         //         {"  "}Show own Child Contract if child logins but this will not
//         //         happen
//         //         {"\n"}
//         //         {`\u2022`}
//         //         {"  "}Show Contract of connected relations When Parent login
//         //         {"\n"}
//         //         {`\u2022`}
//         //         {"  "}in most scenario, the parent will use the APP
//         //         {"\n"}
//         //         {`\u2022`}
//         //         {"  "}Parents can have multiple childs
//         //         {"\n"}
//         //         {`\u2022`}
//         //         {"  "}Show all contracts of all childs
//         //         {"\n"}
//         //         {`\u2022`}
//         //         {"  "}Childs can have multiple contracts
//         //       </Text>
//         //     </View>
//         //   ) : null;
//         // }}
//       />
//     </SafeAreaView>
//   );
// };

// export default ChildContract;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: Colors.white,
//   },
//   box: {
//     borderColor: Colors.litegray,
//     borderWidth: 1,
//     borderRadius: 10,
//     padding: 15,
//     marginVertical: 8,
//     backgroundColor: Colors.white,
//     flexDirection: "row",
//   },
//   title: {
//     fontFamily: FONTS.LexendRegular,
//     fontSize: RFValue(14),
//     color: Colors.black,
//   },
//   textContainer: {
//     flexDirection: "column",
//     justifyContent: "center",
//     paddingHorizontal: 15,
//   },
//   name: {
//     fontSize: RFValue(14),
//     color: Colors.black,
//     fontFamily: FONTS.LexendMedium,
//   },
//   name1: {
//     fontSize: RFValue(12),
//     color: Colors.black,
//     fontFamily: FONTS.LexendRegular,
//     marginTop: RFValue(10),
//   },
//   box1: {
//     borderColor: Colors.litegray,
//     borderWidth: 1,
//     borderRadius: 10,
//     padding: 15,
//     marginVertical: 10,
//     backgroundColor: Colors.white,
//   },
//   value: {
//     fontFamily: FONTS.LexendRegular,
//     color: Colors.black,
//     marginBottom: RFValue(10),
//   },
//   label: {
//     fontFamily: FONTS.LexendRegular,
//     color: Colors.textgray,
//   },
//   bulletText: {
//     flexDirection: "row",
//     marginVertical: 4,
//     paddingLeft: 10,
//     textAlign: "left",
//     lineHeight: 20,
//     fontFamily: FONTS.LexendRegular,
//     color: Colors.textgray,
//   },
//   emptyText: {
//     textAlign: "center",
//     color: Colors.textgray,
//     fontFamily: FONTS.LexendRegular,
//     marginVertical: 20,
//   },
//   renderimage: {
//     height: 50,
//     width: 50,
//     borderRadius: 7,
//   },
// });
