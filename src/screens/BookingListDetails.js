import {
  Alert,
  FlatList,
  Image,
  InteractionManager,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  // SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import SignatureScreen from "react-native-signature-canvas";
import React, { useContext, useEffect, useRef, useState } from "react";
import Header from "../components/header";
import { Colors } from "../constants/color";
import { FONTS } from "../constants/fontFamily";
import Approved from "../components/approved";
import { Images } from "../constants/images";
import ButtonComponent from "../components/buttonComponent";
import { RFValue, RFPercentage } from "react-native-responsive-fontsize";
import DropdownComponent from "../components/dropdown";
import Modal from "react-native-modal";
import { getData } from "../utils/storeData";
import apiConstants from "../api/apiConstants";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from "react-native-responsive-screen";
import Loader from "../components/loading";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import ApiService from "../utils/Apiservice";
import BlueHeader from "../components/BlueHeader";
import Footer from "../components/Footer";
import moment from "moment";
import TaxiBookPaymentModal from "../components/Taxibookpaymentmodal";
import axios from "axios";
import { RegisterBackContext } from "../constants/GoBackContext";
import TaxiPaymentDetailsCard from "../components/TaxiPaymentDetailsCard";

const BookingListDetails = ({ route, navigation }) => {
  const latitude = 37.7749;
  const longitude = -122.4194;
  const { item:ItemsParmasData, itemData } = route.params || {};
  const { t } = useTranslation();
  const signatureRef = useRef(null);
  const [item,setItem] = useState(ItemsParmasData);
  const ref = useRef();
  const [signature, setSignature] = useState("");
  const [idi, setId] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [detalsData, setdetalsData] = useState({});
  const [tododata, setTodoData] = useState({});
  const [executordata, setexecutordata] = useState([]);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [nameerror, setNameerror] = useState("");
  const [commenterror, setCommenterror] = useState("");
  const [commentmodalVisible, setCommentModalVisible] = useState(null);
  const [loading, setLoding] = useState(false);
  const [logo, setLogo] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [show, setShow] = useState(false);
  const [signatureImage, setSignatureImage] = useState(null);
  const [customerrelationshipid, setcustomerrelationshipid] = useState("");
  const [reset, setRest] = useState(false);
  const [currentStuts, setCurrentStuts] = useState("");
  const [CompateOpen, setComplateOpen] = useState(false);
  const [CompateTEXT, setComplateTEXT] = useState("");
  const [AllPermission, setPermissions] = useState(null);
  const [AllComents, setAllComents] = useState([]);
  const [Status, setStatus] = useState(null);
  const [TodayDate, setTodayDate] = useState(new Date());
  const [DriverComplate, setDriverComplate] = useState(false);
  const [userdata, setUserdata] = useState();
  const [cnote, setCnote] = useState("");
  const [PaymentModal, setPaymentModal] = useState(false);
  const [AllCurrencyData, setAllCurrencyData] = useState([]);
  const [PaymentTypeLoader, setPaymentTypeLoader] = useState(false);
  const [ActualRelatiesPaymentDataRelaties, setActualRelatiesPaymentDataRelaties] = useState(null);
  const removeHtmlTags = (htmlString) => {
    return htmlString.replace(/<[^>]*>/g, "");
  };
  //
  const { setToast } = useContext(RegisterBackContext);

  const openGoogleMaps = (address) => {
    if (!address) {
      Alert.alert("Error", "No address provided");
      return;
    }

    const encodedAddress = encodeURIComponent(address.trim());

    if (Platform.OS === "ios") {
      // Try Google Maps
      const googleMapsURL = `comgooglemaps://?q=${encodedAddress}`;
      const appleMapsURL = `http://maps.apple.com/?q=${encodedAddress}`;

      Linking.canOpenURL(googleMapsURL)
        .then((supported) => {
          if (supported) {
            return Linking.openURL(googleMapsURL);
          } else {
            return Linking.openURL(appleMapsURL);
          }
        })
        .catch((err) => {
          console.error("Error opening map on iOS:", err);
          Alert.alert("Error", "Unable to open map");
        });
    } else {
      // Android
      const url = `geo:0,0?q=${encodedAddress}`;
      Linking.openURL(url).catch(() => {
        // Fallback to Google Maps web if geo: fails
        Linking.openURL(
          `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`
        );
      });
    }
  };

  const signtureStatusUpdateApi = async (selectId) => {
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.workorderuitvoerupdatestusts, {
        includeToken: true,
        customData: {
          relaties_id: getdata.data.relaties.id,
          user_id: getdata.data.user.id,
          role: getdata.data.user.role,
          signature: signature,
          sign_name: name,
          status_id: selectId ? selectId : currentStuts,
          id: id,
        },
      });
      if (data) {
        resetSign();
        setRest(false);
      }
    } catch (err) {
      console.log("Error fetching connections:", err);
    }
  };

  const RenderItem = ({ item, index }) => {
    // console.log("ItemsData=>", item);

    return (
      <View style={styles.detailsmainview}>
        <Text
          style={[
            styles.sub,
            {
              color: Colors.textgray,
              textTransform: "capitalize",
              width: "32%",
            },
          ]}
        >
          {item.name}
        </Text>
        <View style={styles.detailssubject}>
          {item?.id == 9 ? (
            item?.subject?.map((el, i) => (
              <Text
                onPress={() => openGoogleMaps(el?.extra_stop_address)}
                key={i}
                style={[
                  styles.sub,
                  {
                    flex: 1,
                    textAlign: item?.id == 9 ? "left" : "right",
                    width: "90%",
                  },
                ]}
              >
                {`- ${removeCountryFromAddress(el?.extra_stop_address)}`}
              </Text>
            ))
          ) : item?.id == 8 || item?.id == 10 ? (
            <TouchableOpacity
              style={{
                flexDirection: "row",
                width: "90%",
                alignItems: "center",
                gap: 2,
                textAlign: [8, 10, 13, 19].includes(item?.id)
                  ? "left"
                  : "right",
              }}
              onPress={() => openGoogleMaps(item?.subject)}
            >
              <Text style={[styles.sub, { marginRight: 5 }]}>
                {item?.subject}
              </Text>
              {/* <Image
                source={Images.location}
                style={styles.locationimage}
              /> */}
            </TouchableOpacity>
          ) : (
            <Text
              style={[
                styles.sub,
                {
                  width: "90%",
                  textAlign: [8, 10, 13, 19, 15, 18].includes(item?.id)
                    ? "left"
                    : "right",
                },
              ]}
            >
              {item.subject}
            </Text>
          )}
        </View>
        {item.Approved}
      </View>
    );
  };

  const RenderItemCommets = ({ item, index }) => {
    // const canViewPrivateNotes =
    //   String(AllPermission?.private_notes?.read) === "1";

    // if (!canViewPrivateNotes && item?.comment_type === "Private_BookTaxi") {
    //   return null; 
    // }

    return (
      <View
        style={{
          flexDirection: "row",
          backgroundColor: item?.comment_type === "Private_BookTaxi" ? Colors.private_ticket_color : Colors.normalTicketColor,
          padding: 10,
          borderRadius: 10,

        }}
      >
        <View>
          <Image
            source={{ uri: item?.relatie?.file_path }}
            defaultSource={Images.userblanck}
            style={styles.commentimage}
          />
        </View>
        <View style={{ paddingLeft: 10 }}>
          <View>
            <Text style={[styles.sub1]}>{item?.user?.username}</Text>
          </View>
          <Text style={[styles.sub1, { color: Colors.textgray, fontSize: 13 }]}>
            {item.created_at}
          </Text>
          <Text style={[styles.sub1, { textAlign: "left" }]}>
            {removeHtmlTags(item.comment)}
          </Text>
        </View>
      </View>
    );
  };

  useEffect(() => {
    StusSearch();
    const today = new Date();
    const options = { day: "numeric", month: "short", year: "numeric" };
    const formattedDate = today.toLocaleDateString("en-GB", options); // console.log("ITEMS__>",item);

    // Alert.alert(String(formattedDate))

    setTodayDate(formattedDate);
    // console.log(formattedDate);
  }, []);

  const saveSign = (abcd) => {
    signatureRef.current?.saveImage();
    console.log(signatureRef.current, "signatureRef");
    {
      abcd ? "" : approoveee();
    }
    console.log(signature, "djcnsdfj");
  };

  const approoveee = () => {
    if (name != "") {
      setModalVisible(false);
      saveSign("abcd");
      signtureStatusUpdateApi(64);
      setNameerror("");
      onRefresh();
    } else {
      setNameerror("Enter Naam");
    }
  };

  const resetSign = () => {
    setRest(true);
  };

  const onRefresh = () => {
    setRefreshing(true);
    // Detailsworkorder();
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const StusSearch = async () => {
    try {
      const data = await getData("USERDATA");
      setUserdata(data.data);
      if (data.data !== null) {
        let datas = data.data;

        console.log("datas", data.data);

        try {
          let res = await ApiService(apiConstants.get_driver_trip_details, {
            includeToken: true,
            customData: {
              token: datas.user.verify_token,
              relaties_id: datas.relaties.id,
              role: datas.user.role,
              user_id: datas.user.id,
            },
          });
          // console.log("Its My  APi==>", res.data);
          let data = res?.data?.find((el) => {
            return el?.id == item?.id;
          });
          console.log("My Data", data?.comments);
          setItem(data);
          setAllCurrencyData(res?.currencies || []);
          setAllComents(data?.comments);
          setStatus(data);
        } catch (error) {
          console.log("get_driver_trip_details Error:- ", error);
        }
      } else {
        console.log("False connections");
      }
    } catch (err) {
      console.log("Error fetching connections:", err);
    }
  };
  function removeCountryFromAddress(address) {
    const parts = address?.split(",");
    if (parts?.length > 1) {
      parts.pop(); // remove the last part (country)
      return parts.join(",").trim();
    }
    return address;
  }
const CommentAddFun = async () => {
  try {
    const isPublicComment = commentmodalVisible === 1;

    const trimmedComment =
      typeof comment === "string" ? comment.trim() : "";

    const trimmedCnote =
      typeof cnote === "string" ? cnote.trim() : "";

    if (isPublicComment) {
      if (!trimmedComment) {
        Alert.alert(
          DriverComplate
            ? t("Please Enter Ammount!")
            : t("Please Enter Comments!")
        );
        return;
      }

      if (DriverComplate && !trimmedCnote) {
        Alert.alert(t("Please Enter Comments!"));
        return;
      }
    } else {
      if (!trimmedComment) {
        Alert.alert(t("Enter Private Comment"));
        return;
      }
    }

    const data = await getData("USERDATA");
    const UserData = data?.data;

    const verify_token = UserData?.user?.verify_token;
    const relaties_id = UserData?.relaties?.id;
    const role = UserData?.user?.role;
    const user_id = UserData?.user?.id;
    const book_taxi_id = item?.id;

    if (
      !verify_token ||
      !relaties_id ||
      !role ||
      !user_id ||
      !book_taxi_id
    ) {
      Alert.alert(t("Something went wrong"));
      return;
    }

    if (DriverComplate) {
      const completeRes = await ComplateFunComplte?.(1);

      if (completeRes === false) {
        return;
      }
    }

    const amountText = `${item?.currency_symbol?.symbol || ""}${trimmedComment}`;

    const finalComment = isPublicComment
      ? DriverComplate
        ? `${t("Paid")} ${amountText}\n${trimmedCnote}`
        : trimmedComment
      : trimmedComment;

    const req_data = {
      token: verify_token,
      relaties_id,
      role,
      user_id,
      book_taxi_id,
    };

    if (isPublicComment) {
      req_data.comment = finalComment;
    } else {
      req_data.private_comment = finalComment + " "  + trimmedCnote;
    }


    const res = await ApiService(apiConstants.add_trip_comment, {
      customData: req_data,
    });

    if (!res) {
      Alert.alert(t("No response from server"));
      return;
    }

    if (res?.status) {
      setComment("");
      setCommentModalVisible(null);
      setDriverComplate(false);
      setCnote("");

      await StusSearch?.();

      console.log("My Comments:", res);
      return;
    }

    Alert.alert(
      res?.message || t("Failed to add comment")
    );
  } catch (error) {
    console.log("add_trip_comment Error:", error);

    Alert.alert(
      error?.message || t("Something went wrong")
    );
  }
};

  const ComplateFunComplte = async (num) => {
    try {
      const data = await getData("USERDATA");
      let UserData = data.data;
      let res = await ApiService(apiConstants.complate_trip, {
        includeToken: true,
        customData: {
          token: UserData.user.verify_token,
          relaties_id: UserData.relaties.id,
          role: UserData.user.role,
          user_id: UserData.user.id,
          book_taxi_id: item.id,
          complate: num,
        },
      });
      console.log("Compate:-", res);
      if (res.success == true) {
        StusSearch();
        setComplateOpen(false);
        setComment("");
        setCommentModalVisible(null);
        setDriverComplate(false);
      }
    } catch (error) {
      console.log("complate_trip error:-", error);
    }
  };

  const UpdateRelatiesFun = async (relaties) => {
    try {
      const getdata = await getData("USERDATA");
      if (!getdata) {
        setToast({
          top: 45,
          text: t("User Not Found"),
          type: "error",
          visible: true,
        });
        return
      }

      setPaymentTypeLoader(true);

      let ReqData = {
        "display_name": relaties?.display_name,
        "email_adres": relaties?.email_adres,
        "google_maps": relaties?.google_maps,
        "country_code": relaties?.country_code,
        "whatsapp_number": relaties?.mobiel,
        "verify_token": getdata?.data?.user?.verify_token,
        "user_id": getdata?.data?.user?.id,
        "role": getdata?.data?.user?.role,
        "relaties_id": getdata?.data?.relaties?.id,
        "selected_relaties_id": relaties?.id,
      }

      let res = await ApiService(apiConstants.updateProfile, {
        includeToken: true,
        customData: ReqData,
      });

      if (res?.status) {
        console.log("setActualRelatiesPaymentDataRelaties", res);

        setActualRelatiesPaymentDataRelaties(res?.data?.relaties || null)
        setToast({
          top: 45,
          text: res?.message,
          type: "success",
          visible: true,
        });
      } else {
        setToast({
          top: 45,
          text: res?.message,
          type: "error",
          visible: true,
        });
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setToast({
          text:
            error?.response?.data?.message ||
            error?.message ||
            t("Something Wrong"),
          type: "error",
          visible: true,
        });
      }
      console.log("UpdateRelatiesFun Error:-", error);
    } finally {
      setPaymentTypeLoader(false);
    }
  }

  const SavePaymentFun = async (paymentData) => {
    try {
      const raw = String(paymentData?.price ?? '').trim()
      const match = raw.match(/^\d+(\.\d+)?/)
      const price = match ? parseFloat(match[0]) : 0

      if (!price || price <= 0) {
        setToast({
          top: 45,
          text: t("Invalid Amount"),
          type: "error",
          visible: true,
        })
        return
      }

      const method = String(paymentData?.payment ?? '').trim()
      if (!method) {
        setToast({
          top: 45,
          text: t("Payment Method Required"),
          type: "error",
          visible: true,
        })
        return
      }

      const getdata = await getData("USERDATA")
      const user = getdata?.data?.user
      const relaties = getdata?.data?.relaties

      if (!user?.id || !user?.verify_token || !relaties?.id) {
        setToast({
          top: 45,
          text: t("User Not Found"),
          type: "error",
          visible: true,
        })
        return
      }

      if (!item?.id || !item?.currency) {
        setToast({
          top: 45,
          text: t("Invalid Booking Data"),
          type: "error",
          visible: true,
        })
        return
      }

      setPaymentTypeLoader(true)

      const ReqData = {
        verify_token: user.verify_token,
        user_id: user.id,
        role: user.role,
        relaties_id: relaties.id,
        booking_id: item?.id,
        currency: paymentData?.currency?.code,
        amount: price,
        payment_method: method,
      }


      const res = await ApiService(apiConstants.save_taxi_booking_payment, {
        includeToken: true,
        customData: ReqData,
      })

      if (res?.status) {
        setActualRelatiesPaymentDataRelaties(null)
        setPaymentModal(false)
        StusSearch()
        setToast({
          top: 45,
          text: res?.message,
          type: "success",
          visible: true,
        })
      } else {
        setToast({
          top: 45,
          text: res?.message || t("Something Wrong"),
          type: "error",
          visible: true,
        })
      }
    } catch (error) {
      const msg = axios.isAxiosError(error)
        ? error?.response?.data?.message || error?.message
        : t("Something Wrong")

      setToast({
        top: 45,
        text: msg,
        type: "error",
        visible: true,
      })
    } finally {
      setPaymentTypeLoader(false)
    }
  }


const fetchPermission = async () => {
  try {
    const getdata = await getData("USERDATA");

    console.log("Permi userdata", getdata);

    if (
      !getdata ||
      !getdata.data ||
      !getdata.data.user ||
      !getdata.data.relaties
    ) {
      console.log("Missing required user data:", getdata);
      return;
    }

    const response = await ApiService(apiConstants.permission, {
      includeToken: true,
      customData: {
        relaties_id: getdata.data.relaties.id,
        user_id: getdata.data.user.id,
        role: getdata.data.user.role,
      },
    });

    if (response?.data) {
      console.log("Permission Response =>", response?.data);
      setPermissions(response.data);
    } else {
      console.log("Unexpected response:", response);
    }
  } catch (error) {
    console.log("Error fetching permission:", error);
  }
};
useEffect(() => {
  const task = InteractionManager.runAfterInteractions(() => {
    fetchPermission();
  });

  return () => task.cancel();
}, []);


  const isToday = moment(item?.from_date).isSame(moment(), "day");

  return (
    <View style={{ flex: 1 }}>
      {/* <StatusBar backgroundColor={item.colo} barStyle={"light-content"} /> */}

      <BlueHeader
        title={t("Booking ID")}
        // Righticon={Images.refresh}
        // onPressRight={onRefresh}
        bgcolor={itemData?.color_code || "#006400"}
      />
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
        {loading ? (
          <Loader />
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ marginHorizontal: 24 }}
          >
            <View style={styles.headercomponent}>
              <Text style={styles.title}>{t("Order")}</Text>
              {/* <View style={styles.aview}> */}
              <Text
                style={[
                  styles.BookId,
                  {
                    marginTop: 15,
                  },
                ]}
              >
                {item?.id}
              </Text>

              {/* <Text style={styles.date}>{item?.date}</Text>
              </View> */}
            </View>
            <View style={styles.Flex}>
              <View
                style={[
                  styles.aprooveView,
                  {
                    backgroundColor:
                      Status !== null ? Status?.status_color : item?.status_color,
                    marginTop: 10,
                  },
                ]}
              >
                <Text style={[styles.aprrove]}>
                  {Status !== null ? Status?.status_name : item?.status_name}
                </Text>

              </View>
              <View>
                {
                  Number(item?.remaining_payment) !== 0 &&
                  item?.driver_display_names?.some(
                    el => String(el?.id) === String(userdata?.relaties?.id)
                  ) &&
                  <Pressable
                    style={({ pressed }) => [
                      styles.payNowBtn,
                      pressed && styles.payNowBtnPressed,
                    ]}
                    onPress={() => setPaymentModal(true)}
                  >
                    <Text style={styles.payNowBtnText}>{t("Pay Now")}</Text>
                  </Pressable>
                }
              </View>
            </View>




            <View style={{ gap: RFValue(12) }}>
              <View
                style={{
                  paddingHorizontal: RFValue(15),
                  borderRadius: RFValue(8),
                  // marginBottom: RFValue(5)
                }}
              ></View>

              <View
                style={{
                  backgroundColor: Colors.white,
                  padding: RFValue(15),
                  borderRadius: RFValue(8),
                  elevation: 2,
                  shadowColor: Colors.black,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  borderLeftWidth: 4,
                  borderLeftColor: "#4CAF50",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginTop: 5,
                  }}
                >
                  <Text
                    style={[
                      styles.Text,
                      {
                        color: Colors.textgray,
                        fontWeight: "600",
                        flex: 0.4,
                      },
                    ]}
                  >
                    {t("company")}
                  </Text>
                  <Text
                    style={[
                      styles.Text,
                      {
                        color: Colors.black,
                        flex: 0.6,
                        textAlign: "right",
                      },
                    ]}
                  >
                    {item?.company_client_info?.display_name || "_ _"}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginTop: 5,
                  }}
                >
                  <Text
                    style={[
                      styles.Text,
                      {
                        color: Colors.textgray,
                        fontWeight: "600",
                        flex: 0.4,
                      },
                    ]}
                  >
                    {t("Relatie")}
                  </Text>
                  <Text
                    style={[
                      styles.Text,
                      {
                        color: Colors.black,
                        flex: 0.6,
                        textAlign: "right",
                      },
                    ]}
                  >
                    {item?.client_person_info?.display_name || "_ _"}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginTop: 5,
                  }}
                >
                  <Text
                    style={[
                      styles.Text,
                      {
                        color: Colors.textgray,
                        fontWeight: "600",
                        flex: 0.4,
                      },
                    ]}
                  >
                    {t("Type of trip")}
                  </Text>
                  <Text
                    style={[
                      styles.Text,
                      {
                        color: Colors.black,
                        flex: 0.6,
                        textAlign: "right",
                      },
                    ]}
                  >
                    {item?.title_first}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginTop: 5,
                  }}
                >
                  <Text
                    style={[
                      styles.Text,
                      {
                        color: Colors.textgray,
                        fontWeight: "600",
                        flex: 0.4,
                      },
                    ]}
                  >
                    {t("Driver")}
                  </Text>
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={[
                      styles.Text,
                      {
                        color: Colors.black,
                        flex: 0.6,
                        textAlign: "right",
                      },
                    ]}
                  >
                    {Array.isArray(item?.driver_display_names)
                      ? item.driver_display_names
                        .map(el => el?.display_name?.trim())
                        .filter(Boolean)
                        .join(', ')
                      : ''}
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginTop: 5,
                  }}
                >
                  <Text
                    style={[
                      styles.Text,
                      {
                        color: Colors.textgray,
                        fontWeight: "600",
                        flex: 0.4,
                      },
                    ]}
                  >
                    {t("Trip details")}
                  </Text>
                  <Text
                    style={[
                      styles.Text,
                      {
                        color: Colors.black,
                        flex: 0.6,
                        textAlign: "right",
                      },
                    ]}
                    numberOfLines={2}
                  >
                    {item.trip_details_second}{" "}
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginTop: 5,
                  }}
                >
                  <Text
                    style={[
                      styles.Text,
                      {
                        color: Colors.textgray,
                        fontWeight: "600",
                        flex: 0.5,
                      },
                    ]}
                  >
                    {t("Currency")}
                  </Text>
                  <Text
                    style={[
                      styles.Text,
                      {
                        color: Colors.black,
                        flex: 0.5,
                        textAlign: "right",
                      },
                    ]}
                  >
                    {item?.currency}
                  </Text>
                </View>
              </View>
              {item?.flight_schedule && <View
                style={{
                  backgroundColor: Colors.white,
                  padding: RFValue(15),
                  borderRadius: RFValue(8),
                  elevation: 2,
                  shadowColor: Colors.black,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  borderLeftWidth: 4,
                  borderLeftColor: "#556edeff",
                }}
              >
                <Text
                  style={[
                    styles.Text,
                    {
                      color: "#556edeff",
                      fontWeight: "bold",
                      fontSize: RFValue(14),
                      marginBottom: RFValue(8),
                    },
                  ]}
                >
                  {t("Flights")}
                </Text>
                <View
                  style={{
                    // flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginTop: 5,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>

                    <Image
                      source={Images.dapartuar}
                      style={{ height: 20, width: 20, marginRight: 5 }}
                    />
                    <Text
                      style={[
                        styles.aprrove,
                        { color: Colors.black, fontSize: 15 },
                      ]}
                    >
                      {`${item?.flight_schedule?.departure} `}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 5 }}>



                    <Image
                      source={Images.arrivels}
                      style={{ height: 20, width: 20, marginRight: 5 }}
                    />
                    <Text
                      style={[
                        styles.aprrove,
                        { color: Colors.black, fontSize: 15 },
                      ]}
                    >
                      {`${item?.flight_schedule?.arrival
                        }`}
                    </Text></View>
                </View>

              </View>
              }
              <View
                style={{
                  backgroundColor: Colors.white,
                  padding: RFValue(15),
                  borderRadius: RFValue(8),
                  elevation: 2,
                  shadowColor: Colors.black,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  borderLeftWidth: 4,
                  borderLeftColor: "#FF9800",
                }}
              >
                <Text
                  style={[
                    styles.Text,
                    {
                      color: "#FF9800",
                      fontWeight: "bold",
                      fontSize: RFValue(14),
                      marginBottom: RFValue(8),
                    },
                  ]}
                >
                  {t("Locations")}
                </Text>

                <View style={{ marginBottom: RFValue(8), flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View>
                    <Text
                      style={[
                        styles.Text,
                        {
                          color: Colors.textgray,
                          fontWeight: "600",
                          marginBottom: RFValue(3),
                        },
                      ]}
                    >
                      {t("Pickup")}
                    </Text>
                    <Text
                      style={[
                        styles.Text,
                        {
                          color: Colors.black,
                          fontSize: RFValue(12),
                          lineHeight: RFValue(16),
                        },
                      ]}
                      numberOfLines={2}
                    >
                      📍 {item.starting_selected_address}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => openGoogleMaps(item.starting_selected_address)}>

                    <Image
                      source={Images.locationdot}
                      style={{
                        height: RFValue(20),
                        width: RFValue(20),
                        marginLeft: RFValue(5),
                        tintColor: Colors.green,
                      }} />
                  </TouchableOpacity>
                </View>

                <View style={{ marginBottom: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View>

                    <Text
                      style={[
                        styles.Text,
                        {
                          color: Colors.textgray,
                          fontWeight: "600",
                          marginBottom: RFValue(3),
                        },
                      ]}
                    >
                      {t("Drop-off")}
                    </Text>
                    <Text
                      style={[
                        styles.Text,
                        {
                          color: Colors.black,
                          fontSize: RFValue(12),
                          lineHeight: RFValue(16),
                        },
                      ]}
                      numberOfLines={2}
                    >
                      🏁 {item.destination_selected_address}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => openGoogleMaps(item.destination_selected_address)}>

                    <Image
                      source={Images.flag}
                      style={{
                        height: RFValue(20),
                        width: RFValue(20),
                        marginLeft: RFValue(5),
                        tintColor: Colors.dicline,
                      }} />
                  </TouchableOpacity>
                </View>

                {item.extra_stop_details?.length > 0 && (
                  <View>
                    <Text
                      style={[
                        styles.Text,
                        {
                          color: Colors.textgray,
                          fontWeight: "600",
                          marginBottom: RFValue(5),
                          marginTop: 10,
                        },
                      ]}
                    >
                      {t("Extra Stops")}
                    </Text>
                    {item.extra_stop_details.map((el, i) => (
                      <Text
                        key={i}
                        style={[
                          styles.Text,
                          {
                            color: Colors.black,
                            fontSize: RFValue(12),
                            marginBottom: RFValue(3),
                            paddingLeft: RFValue(10),
                            lineHeight: RFValue(16),
                          },
                        ]}
                        numberOfLines={2}
                      >
                        {i + 1}.{" "}
                        {`- ${removeCountryFromAddress(
                          el?.extra_stop_address
                        )}`}
                      </Text>
                    ))}
                  </View>
                )}
              </View>

              <View
                style={{
                  backgroundColor: Colors.white,
                  padding: RFValue(15),
                  borderRadius: RFValue(8),
                  elevation: 2,
                  shadowColor: Colors.black,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  borderLeftWidth: 4,
                  borderLeftColor: "#9C27B0",
                }}
              >
                <Text
                  style={[
                    styles.Text,
                    {
                      color: "#9C27B0",
                      fontWeight: "bold",
                      fontSize: RFValue(14),
                      marginBottom: RFValue(8),
                    },
                  ]}
                >
                  {t("Trip Details")}
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: RFValue(6),
                  }}
                >
                  <View style={{ flex: 1, marginRight: RFValue(10) }}>
                    <Text
                      style={[
                        styles.Text,
                        {
                          color: Colors.textgray,
                          fontWeight: "600",
                          fontSize: RFValue(12),
                        },
                      ]}
                    >
                      {t("Pickup Time")}
                    </Text>
                    <Text
                      style={[
                        styles.Text,
                        { color: Colors.black, fontSize: RFValue(13) },
                      ]}
                    >
                      🕐 {item.pickup_time}
                    </Text>
                  </View>
                  {item.drop_time && (
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.Text,
                          {
                            color: Colors.textgray,
                            fontWeight: "600",
                            fontSize: RFValue(12),
                          },
                        ]}
                      >
                        {t("Drop Time")}
                      </Text>
                      <Text
                        style={[
                          styles.Text,
                          {
                            color: Colors.black,
                            fontSize: RFValue(13),
                          },
                        ]}
                      >
                        🕐 {item.drop_time}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <View
                style={{
                  backgroundColor: Colors.white,
                  padding: RFValue(15),
                  borderRadius: RFValue(8),
                  elevation: 2,
                  shadowColor: Colors.black,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  borderLeftWidth: 4,
                  borderLeftColor: Colors.primary,
                }}
              >
                <Text
                  style={[
                    styles.Text,
                    {
                      color: Colors.primary,
                      fontWeight: "bold",
                      fontSize: RFValue(14),
                      marginBottom: RFValue(8),
                    },
                  ]}
                >
                  {t("Trip Details")}
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                  }}
                >
                  <View style={{ width: "30%", marginBottom: RFValue(6) }}>
                    <Text
                      style={[
                        styles.Text,
                        {
                          color: Colors.textgray,
                          fontWeight: "600",
                          fontSize: RFValue(12),
                        },
                      ]}
                    >
                      {t("Persons")}
                    </Text>
                    <Text
                      style={[
                        styles.Text,
                        { color: Colors.black, fontSize: RFValue(13) },
                      ]}
                    >
                      👥 {item?.total_person}
                    </Text>
                  </View>
                  <View style={{ width: "60%", marginBottom: RFValue(6) }}>
                    <Text
                      style={[
                        styles.Text,
                        {
                          color: Colors.textgray,
                          fontWeight: "600",
                          fontSize: RFValue(12),
                        },
                      ]}
                    >
                      {t("Suitcases")}+ {t("Trollies")}
                    </Text>
                    <Text
                      style={[
                        styles.Text,
                        { color: Colors.black, fontSize: RFValue(13) },
                      ]}
                    >
                      🧳 {item?.total_suitcase_and_trolly}
                    </Text>
                  </View>
                  <View
                    style={{
                      width: "100%",
                      marginBottom: RFValue(6),
                      justifyContent: "space-between",
                      flexDirection: "row",
                    }}
                  >
                    {item?.tour_name && <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.Text,
                          {
                            color: Colors.textgray,
                            fontWeight: "600",
                            fontSize: RFValue(12),
                          },
                        ]}
                      >
                        {t("Tours")}
                      </Text>
                      <Text
                        style={[
                          styles.Text,
                          { color: Colors.black, fontSize: RFValue(13) },
                        ]}
                      >
                        {`${item?.tour_name}\n` || "-"}
                      </Text>
                    </View>}
                    {Number(item?.tour_price_display) > 0 && item?.tour_price_display && <View style={{ flex: 1, alignItems: "flex-end" }}>
                      <Text
                        style={[
                          styles.Text,
                          {
                            color: Colors.textgray,
                            fontWeight: "600",
                            fontSize: RFValue(12),
                          },
                        ]}
                      >
                        {t("Price")}
                      </Text>
                      <Text
                        style={[
                          styles.Text,
                          { color: Colors.black, fontSize: RFValue(13) },
                        ]}
                      >
                        {`${item?.currency} ${item?.tour_price_display}`}
                      </Text>
                    </View>}
                  </View>
                </View>
              </View>

              {/* Vehicle & Payment Section */}
              <View
                style={{
                  backgroundColor: Colors.white,
                  padding: RFValue(15),
                  borderRadius: RFValue(8),
                  elevation: 2,
                  shadowColor: Colors.black,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  borderLeftWidth: 4,
                  borderLeftColor: "#2196F3",
                }}
              >
                <Text
                  style={[
                    styles.Text,
                    {
                      color: "#2196F3",
                      fontWeight: "bold",
                      fontSize: RFValue(14),
                      marginBottom: RFValue(8),
                    },
                  ]}
                >
                  {t("Vehicle & Price")}
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: RFValue(6),
                  }}
                >
                  <Text
                    style={[
                      styles.Text,
                      {
                        color: Colors.textgray,
                        fontWeight: "600",
                        flex: 0.5,
                      },
                    ]}
                  >
                    {t("Category")}
                  </Text>
                  <Text
                    style={[
                      styles.Text,
                      {
                        color: Colors.black,
                        flex: 0.5,
                        textAlign: "right",
                      },
                    ]}
                  >
                    {item?.price_title}
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginVertical: RFValue(6),
                  }}
                >
                  <Text
                    style={[
                      styles.Text,
                      {
                        color: Colors.textgray,
                        fontWeight: "600",
                        flex: 0.5,
                      },
                    ]}
                  >
                    {t("Price")}
                  </Text>
                  {item?.edited_calculated_price ? <Text
                    style={[
                      styles.Text,
                      {
                        color: Colors.black,
                        flex: 0.5,
                        textAlign: "right",
                      },
                    ]}
                  >
                    {`${item?.currency} ${item?.edited_calculated_price}`}
                  </Text> : <Text
                    style={[
                      styles.Text,
                      {
                        color: Colors.black,
                        flex: 0.5,
                        textAlign: "right",
                      },
                    ]}
                  >
                    -
                  </Text>}
                </View>
                {item?.item?.relaties_vehicle_name && (
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginVertical: RFValue(6),
                    }}
                  >
                    <Text
                      style={[
                        styles.Text,
                        {
                          color: Colors.textgray,
                          fontWeight: "600",
                          flex: 0.5,
                          marginTop: 10,
                        },
                      ]}
                    >
                      {t("Vehicle displayname")}
                    </Text>
                    <Text
                      style={[
                        styles.Text,
                        {
                          color: Colors.black,
                          flex: 0.5,
                          textAlign: "right",
                        },
                      ]}
                    >
                      {item?.relaties_vehicle_name?.display_name}
                    </Text>
                  </View>
                )}
                {item?.driver_display_names?.length > 0 && (
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginVertical: RFValue(6),
                    }}
                  >
                    <Text
                      style={[
                        styles.Text,
                        {
                          color: Colors.textgray,
                          fontWeight: "600",
                          flex: 0.5,
                        },
                      ]}
                    >
                      {t("Drivers names")}
                    </Text>
                    <Text
                      style={[
                        styles.Text,
                        {
                          color: Colors.black,
                          flex: 0.5,
                          textAlign: "right",
                          // backgroundColor: 'red'
                        },
                      ]}
                    >
                      {item?.driver_display_names
                        ?.map((el) => {
                          return `👤${el?.display_name}`;
                        })
                        .join("\n")}
                    </Text>
                  </View>
                )}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginVertical: RFValue(6),
                  }}
                >
                  <Text
                    style={[
                      styles.Text,
                      {
                        color: Colors.textgray,
                        fontWeight: "600",
                        fontSize: RFValue(12),
                      },
                    ]}
                  >
                    {t("Payment Method")}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.Text,
                    { color: Colors.black, fontSize: RFValue(13) },
                  ]}
                >
                  {t(`${item?.payment_method}`)}
                </Text>
              </View>

              {
                item?.relaties_vehicle_name?.display_name &&
                <View style={styles.vehicle_name}>
                  <Text style={[styles.Text, { textAlign: "center", color: Colors.black, fontSize: RFValue(13) }]}>{item?.relaties_vehicle_name?.display_name}({item?.relaties_vehicle_name?.voertuig_kenteken})({item?.relaties_vehicle_name?.vehicle_color})</Text>
                  {
                    item?.relaties_vehicle_name?.leads_status_data &&
                    <Text style={[styles.status, { textAlign: "center", backgroundColor: item?.relaties_vehicle_name?.leads_status_data?.color || Colors.green, color: Colors.white }]}>{item?.relaties_vehicle_name?.leads_status_data?.status_name}</Text>
                  }
                </View>
              }

              <View
                style={{
                  backgroundColor: Colors.white,
                  padding: RFValue(15),
                  borderRadius: RFValue(8),
                  elevation: 2,
                  shadowColor: Colors.black,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  borderLeftWidth: 4,
                  borderLeftColor: "#607D8B",
                }}
              >
                <Text
                  style={[
                    styles.Text,
                    {
                      color: "#607D8B",
                      fontWeight: "bold",
                      fontSize: RFValue(14),
                      marginBottom: RFValue(8),
                    },
                  ]}
                >
                  {t("Comment")}
                </Text>
                <Text
                  style={[
                    styles.Text,
                    {
                      color: Colors.textgray,
                      fontStyle: "italic",
                      fontSize: RFValue(12),
                      lineHeight: RFValue(18),
                      backgroundColor: "#F5F5F5",
                      padding: RFValue(10),
                      borderRadius: RFValue(6),
                    },
                  ]}
                >
                  📝 {item?.texi_booking_comment || "_ _"}
                </Text>
              </View>

            </View>
            <View style={[styles.tdview, { marginBottom: 15 }]}>
              {isToday &&
                ((Status?.status ?? item?.status) == 130 ||
                  (Status?.status ?? item?.status) == 138) &&
                // (Status?.status ?? item?.status) == 130 &&
                String(AllPermission?.cancel_booking_taxi_trip?.read) ===
                "1" && (
                  <ButtonComponent
                    onPress={() => {
                      setComplateTEXT("Cancel Booking ?");
                      setCommentModalVisible(1);
                      // setComplateOpen(true);
                    }}
                    marginTop={RFValue(15)}
                    width={RFPercentage(19)}
                    title={t("Annuleren")}
                    backgroundColor={"red"}
                  />
                )}

              {isToday &&
                (Status?.status ?? item?.status) == 130 &&
                String(AllPermission?.complete_booking_taxi_trip?.read) ===
                "1" &&
              
                item?.driver_names?.driver_ids == userdata?.relaties?.id && (
                  <ButtonComponent
                    onPress={() => {
                      if (item?.payment_method == "Cash to the driver") {
                        setDriverComplate(true);
                        // Alert.alert("YES")
                      } else {
                        setCommentModalVisible(1);
                        setComplateTEXT("Complate Booking ?");
                        // setComplateOpen(true);
                      }
                    }}
                    marginTop={RFValue(15)}
                    width={RFPercentage(19)}
                    title={t("Complete")}
                    backgroundColor={"#00AA1C"}
                  // backgroundColor={itemData?.color_code}
                  />
                )}
            </View>
            <View style={styles.Flex}>
              <ButtonComponent
                onPress={() => setCommentModalVisible(1)}
                marginTop={RFValue(15)}
                width={String(AllPermission?.private_notes?.create) ==
                  "1" ? "48%" : '100%'}
                marginBottom={20}
                title={t("Opmerking")}
              // bax
              />
              {
                String(AllPermission?.private_notes?.create) === "1" &&
                Number(item?.status) !== 131 &&
                Number(item?.status) !== 134 &&
                <ButtonComponent
                  onPress={() => setCommentModalVisible(2)}
                  marginTop={RFValue(15)}
                  width={"48%"}
                  marginBottom={20}
                  title={t("Private Comment")}
                  fontSize={14}
                // bax
                />
              }

            </View>

            {item?.Taxi_payment_details?.length > 0 &&
              item?.Taxi_payment_details?.map((el) => (
                <TaxiPaymentDetailsCard key={el?.id} item={el} client_person_info={item?.client_person_info} />
              ))
            }
            <>
              {AllComents?.length > 0 && (
                <Text style={[styles.title, { marginTop: 1 }]}>
                  {t("Opmerkingen")}
                  {" :"}
                </Text>
              )}
              <View style={styles.commentviewset}>
                <FlatList
                  data={AllComents}
                  renderItem={RenderItemCommets}
                  contentContainerStyle={{ marginBottom: 50, marginTop: 10 }}
                  ItemSeparatorComponent={() => {
                    return <View style={styles.line} />;
                  }}
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
            </>

            <View>
              <Modal
                onBackdropPress={() => {
                  setCommentModalVisible(null);
                  setDriverComplate(false);
                }}
                onBackButtonPress={() => {
                  setCommentModalVisible(null);
                  setDriverComplate(false);
                }}
                style={styles.cmodel}
                visible={commentmodalVisible !== null || DriverComplate}
              >
                <View style={styles.commentview}>
                  <Text style={styles.addc}>
                    {commentmodalVisible === 1
                      ? DriverComplate
                        ? t("How much did you receive?")
                        : t("Voeg een notitie toe")
                      : t("Private Comment")}
                  </Text>

                  <TextInput
                    multiline
                    placeholder={
                      commentmodalVisible === 1
                        ? DriverComplate
                          ? "00.00"
                          : "Notitie..."
                        : t("Private Commants")
                    }
                    placeholderTextColor={Colors.textgray}
                    style={[
                      styles.cinput,
                      {
                        fontSize: RFValue(DriverComplate ? 22 : 14),
                        textAlign: DriverComplate ? "center" : "left",
                      },
                      DriverComplate && styles.simpleFlex,
                    ]}
                    value={comment}
                    keyboardType={DriverComplate ? "numeric" : "default"}
                    onChangeText={(txt) => {
                      setComment(txt);
                      setCommenterror("");
                    }}
                  />

                  {DriverComplate && (
                    <TextInput
                      multiline
                      placeholder="Notitie..."
                      placeholderTextColor={Colors.textgray}
                      style={[
                        styles.cinput,
                        {
                          fontSize: RFValue(14),
                          textAlign: "left",
                          height: 80,
                          marginTop: 15,
                        },
                      ]}
                      value={cnote}
                      keyboardType="default"
                      onChangeText={(txt) => {
                        setCnote(txt);
                        setCommenterror("");
                      }}
                    />
                  )}

                  <Text style={styles.commenterror}>{commenterror}</Text>

                  <View style={styles.commentbuttons}>
                    <TouchableOpacity
                      onPress={() =>
                        DriverComplate
                          ? setDriverComplate(false)
                          : setCommentModalVisible(null)
                      }
                      style={[styles.buttonStyle, { backgroundColor: Colors.litegray }]}
                    >
                      <Text style={[styles.txt, { color: Colors.black }]}>
                        {t("Sluiten")}
                      </Text>
                    </TouchableOpacity>

                    {CompateTEXT === "Cancel Booking ?" ? (
                      <TouchableOpacity
                        onPress={() => {
                          if (comment === "") {
                            setCommenterror("Please enter Note");
                          } else {
                            ComplateFunComplte(0);
                            CommentAddFun();
                          }
                        }}
                        style={[styles.buttonStyle, { backgroundColor: Colors.red }]}
                      >
                        <Text style={styles.txt}>{t("Cancel")}</Text>
                      </TouchableOpacity>
                    ) : CompateTEXT === "Complate Booking ?" ? (
                      <TouchableOpacity
                        onPress={() => {
                          if (comment.trim() === "") {
                            setCommenterror("Please enter Note");
                          } else {
                            ComplateFunComplte(1);
                            CommentAddFun();
                          }
                        }}
                        style={[styles.buttonStyle, { backgroundColor: Colors.primary }]}
                      >
                        <Text style={styles.txt}>{t("Complete")}</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        onPress={() => {
                          CommentAddFun();
                        }}
                        style={[styles.buttonStyle, { backgroundColor: Colors.primary }]}
                      >
                        <Text style={styles.txt}>
                          {DriverComplate ? t("Complete") : t("Notitie")}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </Modal>
            </View>
            <View>
              <Modal
                isVisible={CompateOpen}
                onBackdropPress={() => {
                  setComplateOpen(false);
                  setComplateTEXT("");
                }}
                onBackButtonPress={() => {
                  setComplateOpen(false);
                  setComplateTEXT("");
                }}
                backdropColor="transparent"
              >
                <View style={styles.ModalComplateView}>
                  <Text style={styles.ComplateText}>{t(CompateTEXT)}</Text>
                  <TouchableOpacity
                    style={styles.CompateBTN}
                    onPress={() =>
                      ComplateFunComplte(
                        CompateTEXT == "Complate Booking ?" ? 1 : 0
                      )
                    }
                  >
                    <Text
                      style={{
                        fontWeight: "500",
                        color: Colors.white,
                        fontFamily: FONTS.LexendRegular,
                      }}
                    >
                      {t("Ok")}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.CompateBTN1}
                    onPress={() => setComplateOpen(false)}
                  >
                    <Text
                      style={{
                        fontWeight: "500",
                        color: Colors.white,
                        fontFamily: FONTS.LexendRegular,
                        textTransform: "capitalize",
                      }}
                    >
                      {t("Cancel")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </Modal>
            </View>
            <TaxiBookPaymentModal
              visible={PaymentModal}
              isLoading={PaymentTypeLoader}
              onClose={() => setPaymentModal(false)}
              onSubmit={(data) => console.log(data)}
              headerColor={itemData?.color_code || "#1A73E8"}
              modalTitle={t("Booking Payments")}
              step1Title={t("Relaties Datails")}
              step2Title={t("Payment Method")}
              remaining_payment={item?.remaining_payment}
              defaultCurrency={item?.currency_symbol}
              AllCurrencyData={AllCurrencyData}
              relaties={{
                id: ActualRelatiesPaymentDataRelaties?.id || item?.client_person_info?.id,
                display_name: ActualRelatiesPaymentDataRelaties?.display_name || item?.client_person_info?.display_name,
                email_adres: ActualRelatiesPaymentDataRelaties?.email_adres || item?.client_person_info?.email_adres,
                google_maps: ActualRelatiesPaymentDataRelaties?.google_maps || item?.client_person_info?.google_maps,
                mobiel: ActualRelatiesPaymentDataRelaties?.mobiel || item?.client_person_info?.mobiel,
                country_code: ActualRelatiesPaymentDataRelaties?.country_code || item?.client_person_info?.country_code,
                price: item?.remaining_payment,
              }}

              onUpdate={(updatedData) => {
                console.log(updatedData);

                UpdateRelatiesFun(updatedData)
              }}
              onSavePayment={(data) => {


                SavePaymentFun(data);
                setModalVisible(false)
              }}
              payment_methodData={[item?.payment_method_first]}
            />
          </ScrollView>
        )}
      </View>
    </View>
  );
};

export default BookingListDetails;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  vehicle_name: {
    backgroundColor: Colors.yellows,
    paddingVertical: 10,
    borderRadius: 4
  },
  payNowBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  payNowBtnPressed: {
    opacity: 0.82,
    elevation: 1,
  },
  payNowBtnText: {
    color: Colors.white,
    fontSize: 12,
    fontFamily: FONTS.LexendSemiBold,
    letterSpacing: 0.3,
  },
  title: {
    color: Colors.black,
    fontFamily: FONTS.LexendMedium,
    fontSize: 17,
    marginTop: 15,
  },
  fview: {
    borderRadius: 10,
    borderColor: Colors.litegray,
    borderWidth: 1,
    padding: 15,
    marginTop: 10,
    backgroundColor: Colors.white,
  },
  sub: {
    color: Colors.primaryblue,
    fontFamily: FONTS.LexendMedium,
    fontSize: 14,
  },
  sub1: {
    color: Colors.black,
    fontFamily: FONTS.LexendMedium,
    fontSize: 14,
  },
  line: { height: 1, backgroundColor: Colors.litegray, marginVertical: 10 },
  tdview: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  buttonStyle: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: 40,
    backgroundColor: Colors.litegray,
    margin: 20,
    borderRadius: 7,
  },
  txt: { fontSize: 15, fontFamily: FONTS.LexendMedium, color: Colors.white },
  cinput: {
    height: 120,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.litegray,
    marginHorizontal: 20,
    paddingHorizontal: 10,
    fontSize: 15,
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
  },
  simpleFlex: {
    // paddingTop:RFValue(25)
    lineHeight: Platform == "android" ? 120 : 70,
  },
  addc: {
    fontSize: 15,
    fontFamily: FONTS.LexendBold,
    marginTop: 15,
    paddingBottom: 10,
    textAlign: "left",
    color: Colors.black,
    paddingLeft: 20,
  },
  commentview: {
    flex: 1,
    position: "absolute",
    borderRadius: 10,
    backgroundColor: Colors.white,
    width: "100%",
  },
  cmodel: {
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
    margin: 0,
    backgroundColor: Colors.transparant,
  },
  sview: {
    flex: 1,
    position: "absolute",
    borderRadius: 10,
    backgroundColor: Colors.white,
    width: "100%",
  },
  name: {
    fontSize: 14,
    fontFamily: FONTS.LexendBold,
    textAlign: "center",
    color: Colors.black,
  },
  smodel: {
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
    margin: 0,
    backgroundColor: Colors.transparant,
    paddingVertical: 20,
  },
  sbottamview: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 10,
    paddingHorizontal: 15,
    backgroundColor: "transparent",
  },
  input: {
    backgroundColor: Colors.primarylite,
    paddingHorizontal: 10,
    marginHorizontal: 10,
    borderRadius: 8,
    fontSize: 13,
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
    height: heightPercentageToDP(5),
  },
  signature: {
    borderColor: Colors.black,
    borderWidth: 1,
    marginTop: 10,
  },
  buttonStyle: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: 40,
    backgroundColor: Colors.white,
    margin: 10,
    borderRadius: 7,
  },
  headercomponent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderid: {
    color: Colors.primary,
    fontFamily: FONTS.LexendMedium,
    fontSize: 14,
    marginTop: 15,
  },
  signatureimage: {
    height: 150,
    marginTop: 20,
    borderWidth: 1,
    borderRadius: 7,
    borderColor: Colors.litegray,
    resizeMode: "stretch",
    backgroundColor: Colors.white,
  },
  commentviewset: {
    marginTop: 10,
  },
  Flex: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  signaturechange: {
    height: 150,
    width: "90%",
    marginTop: 20,
    borderWidth: 1,
    borderRadius: 7,
    borderColor: Colors.litegray,
    resizeMode: "stretch",
    alignSelf: "center",
  },
  status: {
    textAlign: "center",
    padding: 2,
    paddingHorizontal: 15,
    borderRadius: 4,
    alignSelf: "center",
    marginTop: 2
  },
  commenterror: {
    fontSize: 12,
    fontFamily: FONTS.LexendRegular,
    color: Colors.red,
    paddingBottom: 10,
    marginHorizontal: 20,
  },
  approve: {
    backgroundColor: Colors.primary,
    width: 200,
    height: heightPercentageToDP(5),
    borderRadius: 7,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  approvetext: {
    fontSize: 15,
    fontFamily: FONTS.LexendMedium,
    color: Colors.white,
  },
  commentbuttons: {
    flex: 1,
    flexDirection: "row",
  },
  detailsmainview: {
    flexDirection: "row",
    width: "100%",
    gap: 5,
    justifyContent: "space-between",
  },
  detailssubject: {
    // backgroundColor:'red',
    width: "60%",
    flex: 1,

    alignItems: "flex-end",
    // width: widthPercentageToDP(50),
    // alignItems: "flex-end",
  },
  locationimage: {
    height: 20,
    width: 20,
  },
  locationbg: {
    flexDirection: "row",
  },
  shortdescription: {
    flexDirection: "row",
    marginTop: 5,
  },
  quntitybg: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  timebg: {
    height: 30,
    width: 30,
  },
  commentimage: {
    height: 50,
    width: 50,
    borderRadius: 7,
  },
  aview: {
    position: "absolute",
    right: 10,
    top: 10,
    justifyContent: "space-evenly",
    height: "100%",
    flexDirection: "row",
    alignItems: "center",
  },
  aprooveView: {
    padding: 10,
    margin: 0,
    borderRadius: 5,
    alignItems: "center",
    // marginBottom: 6,
  },
  aprrove: {
    color: Colors.white,
    padding: 0,
    margin: 0,
    fontSize: 12,
    fontFamily: FONTS.LexendRegular,
  },

  date: {
    color: Colors.textgray,
    fontFamily: FONTS.LexendRegular,
    fontSize: 14,
  },
  ModalComplateView: {
    width: "100%",
    height: 200,
    backgroundColor: "#2C2C2C",
    borderRadius: 7,
    alignSelf: "center",
    paddingHorizontal: 15,
    paddingVertical: 30,
  },
  CompateBTN1: {
    width: "60%",
    height: 50,
    backgroundColor: Colors.red,
    borderRadius: 7,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: 15,
    alignSelf: "center",
  },
  CompateBTN: {
    width: "60%",
    height: 50,
    backgroundColor: Colors.primary,
    borderRadius: 7,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: 80,
    alignSelf: "center",
  },
  ComplateText: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.white,
    textAlign: "center",
  },
  BookId: {
    fontSize: 18,
    fontWeight: "500",
    marginHorizontal: 5,
    color: Colors.black,
  },
  Text: {
    color: Colors.white,
    fontSize: RFValue(12),
    fontWeight: "500",
    fontFamily: FONTS.LexendRegular,
  },
});
