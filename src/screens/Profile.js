import {
  FlatList,
  Image,
  RefreshControl,
  // SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Linking,
  Button,
  StatusBar,
  Alert,
} from "react-native";
import React, { useCallback, useContext, useEffect, useState } from "react";
import Header from "../components/header";
import Modal from "react-native-modal";
import { Colors } from "../constants/color";
import { FONTS } from "../constants/fontFamily";
import { clearAllData, getData, storeData } from "../utils/storeData";
import { Images } from "../constants/images";
import { RFValue } from "react-native-responsive-fontsize";
import Input from "../components/input";
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from "react-native-responsive-screen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { selectregister } from "../redux/Action";
import apiConstants from "../api/apiConstants";
import { SafeAreaView } from "react-native-safe-area-context";
import ApiService from "../utils/Apiservice";
import BlueHeader from "../components/BlueHeader";
import { RegisterBackContext } from "../constants/GoBackContext";
const Profile = ({ navigation }) => {
  const { RegisterBack, setRegisterBack } = useContext(RegisterBackContext)

  const { t } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const [logo, setLogo] = useState(null);
  const [data, setData] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [role, setRole] = useState();

  const handleLinkPress = (url) => {
    Linking.openURL(url).catch((err) =>
      console.error("Failed to open URL:", err)
    );
  };

  const reset = async () => {
    navigation.navigate("CompanyLogin");
    // navigation.navigate("Login");
  };

  const DATA = [
    {
      id: 1,
      title: t("Naam"),
      dis: data ? data?.data?.relaties?.display_name : "",
      img: Images.name,
      header: "Personalia",
    },
    {
      id: 3,
      title: t("E-mailadres"),
      dis: data ? data?.data?.relaties?.email_adres : "",
      img: Images.mail,
    },
    {
      id: 4,
      title: t("Prive E-mailadres"),
      dis: data ? data?.data?.relaties?.email_adres_private : "",
      img: Images.mail,
    },
    {
      id: 5,
      title: t("Wachtwoord"),
      dis: "***********",
      img: Images.lock,
    },
    {
      id: 6,
      title: t("WhatsApp-nummer"),
      dis: data?.data?.relaties?.country_code && data?.data?.relaties?.mobiel
        ? `+${data.data.relaties.country_code} ${data.data.relaties.mobiel}`
        : "",
      img: Images.wp,
    },
    {
      id: 7,
      title: t("Telefoon"),
      dis:
        data?.data?.relaties?.contact_telefoon_country_code !== null &&
          data?.data?.relaties?.contact_telefoon_country_code !== undefined &&
          data?.data?.relaties?.telefoon !== null &&
          data?.data?.relaties?.telefoon !== undefined
          ? "+" +
          data.data.relaties.contact_telefoon_country_code +
          " " +
          data.data.relaties.telefoon
          : "",
      img: Images.phone,
    },
    {
      id: 8,
      title: t("Adres"),
      dis: data ? data?.data?.relaties?.google_maps : "",
      img: Images.location,
    },
    {
      id: 9,
      title: t("Geboortedatum"),
      dis: data ? data?.data?.relaties?.birth_date : "",
      img: Images.date,
    },
    {
      id: 10,
      title: t("Geboorteplaats"),
      dis: data ? data?.data?.relaties?.birth_place : "",
      img: Images.location,
    },
    {
      id: 11,
      title: t("Nationaliteit"),
      dis: data?.data?.relaties?.country_data ? `${data?.data?.relaties?.country_data?.name}` : "",
      img: Images.nationality,
    },

    {
      id: 12,
      title: t("IBAN"),
      dis: data ? data?.data?.relaties?.iban : "",
      img: Images.bank,
      header: "Financieel",
    },
    {
      id: 13,
      title: t("Burgerlijke staat"),
      dis: data ? data?.data?.relaties?.marital_status : "",
      img: Images.stuts,
    },
    {
      id: 14,
      title: t("Burgerservicenummer (BSN) "),
      dis: data ? data?.data?.relaties?.bsn_nr : "",
      img: Images.one,
    },
    {
      id: 15,
      title: t("Document nr (ID/Paspoort)"),
      dis: data ? data?.data?.relaties?.document_nr : "",
      img: Images.document,
    },
  ];

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBackgroundColor(Colors.white);
      StatusBar.setBarStyle("dark-content");
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        const userdata = await getData("USERDATA");
        // console.log("userData",userdata);

        setData(userdata);
        setRole(userdata.data.user.role);

        const companylogo = await getData("COMPANYLOGO");
        setLogo(companylogo);
      };
      
        fetchData();
      
      // fetchDataaa();
    }, [])
  );


  const RemoveAllKeys = async () => {
    try {

      const userLanguage = await AsyncStorage.getItem("userLanguage");
      const selectValue = await AsyncStorage.getItem("SELECT");

      await AsyncStorage.clear();

      if (userLanguage !== null) {
        await AsyncStorage.setItem("userLanguage", userLanguage);
      }

      if (selectValue !== null) {
        await AsyncStorage.setItem("SELECT", selectValue);
      }


      setModalVisible(false);



      navigation.reset({
        index: 0,
        routes: [{ name: "CompanyLogin" }],
      });

    } catch (error) {
      console.log("Storage clear error:", error);
    }
  };


  const RenderItem = ({ item, index }) => {
    return (
      <View style={styles.main}>
        {item.header && (
          <>
            <Text style={[styles.title, { marginTop: 20 }]}>{item.header}</Text>
          </>
        )}
        <View style={{ flexDirection: "row", marginTop: 20 }}>
          <View style={styles.icon}>
            <Image source={item.img} style={styles.img} />
          </View>
          <View
            style={[
              styles.text,
              { justifyContent: item.dis == "" ? "center" : "space-between" },
            ]}
          >
            <Text style={styles.text1}>{item.title}</Text>
            {item.link ? (
              <TouchableOpacity onPress={() => handleLinkPress(item.link)}>
                <Text style={{ color: Colors.primary }}>{item.dis}</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.text2}>{item.dis}</Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  const fetchDataaa = async () => {
    try {
      const getdata = await getData("USERDATA");
      setRole(getdata.data.user.role);
      const data = await ApiService(apiConstants.relatiesdata, {
        includeToken: true,
        customData: {
          id: getdata.data.relaties.id,
          role: getdata.data.user.role,
          user_id: getdata.data.user.id,
        },
      });
      if (data) {
        setData(data);
        console.log(data, 'dfhyjsuikcghbd====');
      } else {
        console.log("false");
      }
    } catch (err) {
      console.log("Error fetching connections:", err);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    // fetchDataaa();
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const HeaderComponents = useCallback(() => {
    const profileImage = data?.data?.user?.profile_image;
    return (
      <View style={styles.headerbg}>
        <Image
          defaultSource={Images.userblanck}
          source={profileImage ? { uri: profileImage } : Images.userblanck}
          style={[
            styles.headerimage,
            !profileImage && styles.defaultImageStyle,
          ]}
        />

        <TouchableOpacity
          onPress={() => navigation.navigate("EditProfile")}
          style={styles.editbtnbg}
        >
          <Image source={Images.edit} style={{ height: 20, width: 20 }} />
        </TouchableOpacity>
      </View>
    );
  }, [data, navigation]);

  return (
    // <SafeAreaView style={styles.container}>
    <>
      <StatusBar backgroundColor={Colors.primary} barStyle={"light-content"} />
      <BlueHeader
        bgcolor={Colors.primary}
        title={`${t("Profile")}\n${role ? role : ""}`}
        Righticon={Images.logout}
        onPressRight={() => setModalVisible(true)}
        goback={() => {
          if (RegisterBack) {
            navigation.navigate('BottamScreens1')
            setRegisterBack(false)
            // Alert.alert('hi')
          } else {
            navigation.goBack();
            setRegisterBack(false);
            // Alert.alert('hi3612456')
          }
        }}
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
        {/* <Header
        lefticon={Images.back}
        lefticonclick={() => navigation.goBack()}
        source={{ uri: logo }}
        tintColor={Colors.primary}
        rightIcon={Images.logout}
        rightIconClick={() => setModalVisible(true)}
      /> */}
        <Modal
          onBackdropPress={() => {
            setModalVisible(false);
          }}
          onBackButtonPress={() => {
            setModalVisible(false);
          }}
          style={styles.mview}
          visible={modalVisible}
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
              {t("Uitloggen?")}
            </Text>
            <Text style={styles.logout}>
              {t("Weet u zeker dat u wilt uitloggen?")}
            </Text>
            <View style={styles.bottmModal}>
              <TouchableOpacity
                style={styles.mdlbutton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.no}>
                  {t("Annuleren")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => RemoveAllKeys()}
                style={[styles.mdlbutton, { backgroundColor: Colors.primary }]}
              >
                <Text style={[styles.no, { color: Colors.white }]}>
                  {t("Uitloggen")}

                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <FlatList
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
          data={DATA}
          renderItem={RenderItem}
          ListHeaderComponent={HeaderComponents}
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
    // </SafeAreaView>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
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
  no: {
    color: Colors.black,
    fontSize: 18,
    fontFamily: FONTS.LexendRegular,
    paddingHorizontal: 20,
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
  mcontainer: {
    flex: 1,
    position: "absolute",
    borderRadius: 10,
    backgroundColor: Colors.white,
    width: "100%",
  },
  name: {
    fontSize: RFValue(15),
    fontFamily: FONTS.LexendMedium,
    color: Colors.black,
    marginTop: 15,
    alignSelf: "center",
  },
  email: {
    fontSize: RFValue(13),
    fontFamily: FONTS.LexendMedium,
    color: Colors.textgray,
    marginTop: 10,
    alignSelf: "center",
  },
  title: {
    fontSize: RFValue(14),
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
    marginTop: RFValue(5),
  },
  logoutButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: RFValue(25),
    height: 50,
    paddingBottom: 4,
  },
  input: {
    color: Colors.black,
    fontFamily: FONTS.LexendRegular,
  },
  main: {
    flex: 1,
  },
  icon: {
    backgroundColor: Colors.iconbg,
    height: 40,
    width: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 7,
  },
  img: {
    height: 22,
    width: 22,
    tintColor: Colors.primary,
  },
  text: {
    paddingLeft: 20,
  },
  text1: {
    color: Colors.black,
    fontFamily: FONTS.LexendRegular,
    fontSize: 14,
  },
  text2: {
    color: Colors.textgray,
    fontFamily: FONTS.LexendRegular,
    fontSize: 14,
    marginRight: 50,
  },
  editbtnbg: {
    height: 40,
    width: 40,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    alignSelf: "center",
    top: 70,
    right: widthPercentageToDP(28),
  },
  headerimage: {
    height: 100,
    width: 90,
    alignSelf: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.litegray,
  },
  headerbg: {
    paddingHorizontal: 24,
    marginTop: 24,
    borderRadius: 7,
    alignItems: "center",
    paddingBottom: 40,
  },
});
