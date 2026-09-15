import {
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  Modal,
  // SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import React, { useState, useEffect } from "react";
import { FONTS } from "../constants/fontFamily";
import { Images } from "../constants/images";
import { Colors } from "../constants/color";
import { RFValue } from "react-native-responsive-fontsize";
import ButtonComponent from "../components/buttonComponent";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Loader from "../components/loading";
import { getData } from "../utils/storeData";
import apiConstants from "../api/apiConstants";
import { useTranslation } from "react-i18next";
import ApiService from "../utils/Apiservice";
import { SafeAreaView } from "react-native-safe-area-context";

const Selection = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { width } = Dimensions.get("screen");
  const { logo } = route.params;
  const { userId } = route.params;
  const { verify_token } = route.params;
  const [loading, setLoding] = useState(false);
  const [selectedItem, setSelectedItem] = useState({});
  const [data, setData] = useState([]);
  const [click, setClick] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selecterror, setselecterror] = useState("");

  useEffect(() => {
    getrelationship();
  }, []);

  // const getrelationship = async () => {
  //   const requestData = new FormData();
  //   console.log("request data ", requestData);

  //   const token = await getData("USERDATA");
  //   requestData.append("token", token.data.verify_token);
  //   console.log("token", token.data.verify_token);

  //   axios({
  //     method: "POST",
  //     url: apiConstants.relationship,
  //     data: requestData,
  //     headers: {
  //       "Content-Type": "multipart/form-data",
  //     },
  //   })
  //     .then((res) => {
  //       console.log("status", res.data);
  //       if (res.data.status) {
  //         setData(res.data.data);
  //         console.log("selection", res.data.data);
  //       } else {
  //         console.log("false");
  //         setData([]);
  //         console.log("data :", data);
  //       }
  //     })
  //     .catch((err) => console.log("status", err));
  // };

  const getrelationship = async () => {
    try {
      const getdata = await getData("USERDATA");
      console.log(getdata, "========");
      const data = await ApiService(apiConstants.relationship, {
        includeToken: true,
      });
      if (data.status) {
        setData(data.data);
        console.log("selection", data.data);
      } else {
        console.log("false");
        setData([]);
        console.log("data :", data);
      }
    } catch (err) {
      console.log("Error fetching connections:", err);
    }
  };

  const filteredData = data.filter((item) =>
    item.relation_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const Selection = () => {
    if (!selectedItem || !selectedItem.relation_name) {
      console.log("bhndx");
      setselecterror(t("Select any one"));
    } else {
      setLoding(true);
      setTimeout(() => {
        setLoding(false);
        navigation.navigate("Staff", {
          logo: logo,
          userId: userId,
          type: "medewerker",
          typeId: 3,
          verify_token: verify_token,
          category_id: 2,
        });
      }, 1000);
    }
  };
  const abc = selectedItem.bedrijf_particulier;
  const toggleModal = () => setClick(!click);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor={Colors.white} barStyle={"dark-content"} />
      {loading && <Loader color={Colors.pink} />}
      <KeyboardAwareScrollView
        bounces={false}
        enableOnAndroid
        extraScrollHeight={70}
        keyboardShouldPersistTaps="handled"
        style={styles.subContainer}
      >
        <Image
          resizeMode="contain"
          source={logo ? { uri: logo } : Images.logo}
          style={[
            styles.logo,
            {
              width: logo ? width * 0.7 : 260,
              height: logo ? RFValue(50) : 25,
            },
          ]}
        />
        <View style={styles.container}>
          <Text style={styles.wellcome}>{t("Welkom bij ERP Portaal")}</Text>
          <Text style={styles.dis}>
            {t("Smart Solutions for Modern Businesses")}
          </Text>

          <Text style={styles.dropdownButtonTxtStyle}>
            {t("Maak een keuze")}
          </Text>

          <TouchableOpacity
            style={[styles.dropdownButtonStyle]}
            onPress={toggleModal}
          >
            <Text style={[styles.dropdownButtonTxtStyle]}>
              {selectedItem.relation_name || t("Maak een keuze")}
            </Text>
            <Image
              source={Images.down}
              style={{
                height: 20,
                width: 20,
                tintColor: Colors.black,
              }}
            />
          </TouchableOpacity>
          {click ? (
            <Modal
              animationType="fade"
              transparent={true}
              visible={click}
              onRequestClose={toggleModal}
            >
              <TouchableWithoutFeedback onPress={toggleModal}>
                <View
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                  }}
                >
                  <View
                    style={{
                      marginTop: 10,
                      width: "90%",
                      height: 200,
                      backgroundColor: "#fff",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.25,
                      shadowRadius: 3.5,
                      elevation: 5,
                      borderRadius: 10,
                    }}
                  >
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search......."
                      placeholderTextColor={"gray"}
                      value={searchTerm}
                      onChangeText={(text) => setSearchTerm(text)}
                    />
                    <FlatList
                      data={filteredData}
                      keyExtractor={(item) => item.id.toString()}
                      renderItem={({ item, index }) => {
                        return (
                          <TouchableOpacity
                            style={styles.dropdownItemStyle}
                            onPress={() => {
                              setSelectedItem(item);
                              setselecterror(""), setClick(false);
                            }}
                          >
                            <Text style={styles.dropdownItemTxtStyle}>
                              {item.relation_name}
                            </Text>
                          </TouchableOpacity>
                        );
                      }}
                    />
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </Modal>
          ) : null}
          <Text style={styles.error}>{selecterror}</Text>

          <ButtonComponent
            title={t("Continue")}
            marginTop={RFValue(50)}
            onPress={Selection}
          />
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

export default Selection;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  wellcome: {
    fontSize: RFValue(17),
    fontFamily: FONTS.LexendSemiBold,
    color: Colors.black,
    marginTop: 40,
  },
  dis: {
    fontSize: RFValue(14),
    fontFamily: FONTS.LexendRegular,
    color: Colors.textgray,
    marginTop: 8,
    marginBottom: 15,
  },
  logo: {
    alignSelf: "center",
    marginTop: RFValue(40),
  },
  container: {
    paddingHorizontal: 24,
  },
  subContainer: {
    flex: 1,
  },
  title: {
    fontSize: RFValue(14),
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
    marginTop: RFValue(5),
  },
  error: {
    color: Colors.red,
    fontSize: RFValue(10),
    fontFamily: FONTS.LexendRegular,
    marginTop: RFValue(1),
  },
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
  },
  dropdownButtonTxtStyle: {
    flex: 1,
    fontSize: 14,
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
  searchInput: {
    height: RFValue(40),
    borderColor: Colors.litegray,
    borderWidth: 1,
    borderRadius: 5,
    margin: RFValue(10),
    paddingHorizontal: RFValue(10),
    fontSize: RFValue(14),
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
  },
});
