import {
  Alert,
  FlatList,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import Input from "../components/input";
import { Images } from "../constants/images";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../constants/color";
import { heightPercentageToDP } from "react-native-responsive-screen";
import { RFValue } from "react-native-responsive-fontsize";
import { FONTS } from "../constants/fontFamily";
import BlueHeader from "../components/BlueHeader";
import Loader from "../components/loading";
import { getData } from "../utils/storeData";
import apiConstants from "../api/apiConstants";
import ApiService from "../utils/Apiservice";
import SelectDropdown from "react-native-select-dropdown";
import Modal from "react-native-modal";
import { useTranslation } from "react-i18next";
import axios from "axios";
// import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

// added this inside three screens task house , task child , task user  manage in one 10 / 12 / 24
const AddTask = ({ route, navigation }) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [disc1, setDisc1] = useState("");
  const [titleError, setTitleError] = useState("");
  const [descriptionError, setDescriptionError] = useState("");
  const { item } = route.params;
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [relaties, setRelaties] = useState([]);
  const [searchdata, setSearchData] = useState("");
  const [clickmodal, setClickModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [filtereddata, setFilteredData] = useState([]);
  const [autoselect, setAutoSelected] = useState("");

  useEffect(() => {
    if (searchdata === "") {
      setFilteredData(relaties);
    } else {
      const filtered = relaties.filter(
        (item) =>
          item.display_name &&
          item.display_name.toLowerCase().includes(searchdata.toLowerCase())
      );
      setFilteredData(filtered);
    }
  }, [searchdata, relaties]);

  const handleMaritalStatus = () => {
    setClickModal(false);
  };

  const fetchcustomer = async () => {
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.customer, {
        includeToken: true,
        customData: {
          relaties_id: getdata.data.relaties.id,
          role: getdata.data.user.role,
          user_id: getdata.data.user.id,
        },
      });
      if (data.status) {
        setRelaties(data.data);
        const matchedItem = data.data.find(
          (item) => item.id === getdata.data.relaties.id
        );
        if (matchedItem) {
          setAutoSelected(matchedItem); // Set the matched item as selected
        }
        // console.log("udhciu======", data?.data[2]?.profile_image?.file_path);
      } else {
        console.log("False connections");
      }
    } catch (err) {
      console.log("Error fetching connections:", err);
    }
  };

  useEffect(() => {
    fetchcustomer();
    setAutoSelected();  
  }, []);

  const validateFields = () => {
    let isValid = true;

    if (!title) {
      setTitleError("Title is required.");
      isValid = false;
    } else {
      setTitleError("");
    }

    if (!disc1) {
      setDescriptionError("Description is required.");
      isValid = false;
    } else {
      setDescriptionError("");
    }

    return isValid;
  };

  const CreateTaskforHome = async () => {
    if (!validateFields()) return; // Stop if validation fails

    setLoading(true);
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.Task_house, {
        includeToken: true,
        customData: {
          relaties_id: getdata.data.relaties.id,
          role: getdata.data.user.role,
          user_id: getdata.data.user.id,
          short_description: disc1,
          title: title,
          type: item.link_to,
          selected_relaties_id: selectedItem
            ? selectedItem.id
            : autoselect
              ? autoselect.id
              : "",
        },
      });
      if (data.status) {
        setLoading(false);
        console.log("successfullllllll", data);
      } else {
        setLoading(false);
        console.log("Failed to create task");
      }
    } catch (err) {
      setLoading(false);
      console.log("Error creating task:", err);
    }
  };

  return (
    <>
      <StatusBar backgroundColor={item.color_code} barStyle={"light-content"} />
      {loading && <Loader color={Colors.primary} />}
      <BlueHeader
        bgcolor={item.color_code}
        title={
          item.link_to === "task_house"
            ? "Add Task For Home"
            : item.link_to === "task_child"
              ? "Add Task For Child"
              : "Add Task For User"
        }
      />

      <View style={styles.background}>
        {/* <KeyboardAwareScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          enableOnAndroid
          extraScrollHeight={70}
          keyboardShouldPersistTaps="handled"
          style={styles.searchBarStyle}
        > */}
        <Input
          value={title}
          onChangeText={(txt) => {
            setTitle(txt), setTitleError("");
          }}
          title={"Title"}
          placeholder={"Add title....."}
          error={titleError}
        />

        <Text style={styles.disc}>{t("Relaties")}</Text>
        {/* <SelectDropdown
          data={relaties}
          // onSelect={handleSelectItem}
          renderButton={(item, isOpened, selectedItem) => {
            return (
              <View style={[styles.dropdownButtonStyle]}>
                <Text style={[styles.dropdownButtonTxtStyle]}>
                  {selectedItem ? selectedItem.title : "dkij"}
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
                <Text style={styles.dropdownItemTxtStyle}>{item.title}</Text>
              </View>
            );
          }}
          showsVerticalScrollIndicator={false}
          dropdownStyle={styles.dropdownMenuStyle}
        /> */}

        <TouchableOpacity
          style={[styles.dropdownButtonStyle]}
          onPress={() =>
            item.link_to !== "task_user" ? setClickModal(!clickmodal) : ""
          }
        >
          <Text style={styles.dropdownButtonTxtStyle}>
            {selectedItem
              ? selectedItem.display_name
              : autoselect
                ? autoselect.display_name
                : "Select Relatie..."}
          </Text>
          {item.link_to !== "task_user" && (
            <Image
              source={Images.down}
              style={{
                height: 20,
                width: 20,
                tintColor: Colors.black,
              }}
            />
          )}
        </TouchableOpacity>
        {clickmodal ? (
          <Modal
            animationType="fade"
            transparent={true}
            visible={clickmodal}
            backdropOpacity={0.5}
            onBackdropPress={() => {
              setClickModal(false);
            }}
            onBackButtonPress={() => {
              setClickModal(false);
            }}
          >
            <TouchableWithoutFeedback onPress={handleMaritalStatus}>
              <View style={styles.modalbg}>
                <TouchableWithoutFeedback>
                  <View style={styles.maritalstatusmodal}>
                    <TextInput
                      style={[styles.searchInput, { marginBottom: 10 }]}
                      placeholder={t("Search.......")}
                      placeholderTextColor={"gray"}
                      value={searchdata}
                      onChangeText={(text) => setSearchData(text)}
                    />
                    <FlatList
                      data={filtereddata}
                      keyExtractor={(item) => item.id}
                      renderItem={({ item }) => (
                        <ScrollView scrollEnabled={false}>
                          <TouchableOpacity
                            style={styles.dropdownItemStyle}
                            onPress={() => {
                              setSelectedItem(item);
                              setClickModal(false);
                            }}
                          >
                            <Text style={styles.dropdownItemTxtStyle}>
                              {item.display_name}
                            </Text>
                          </TouchableOpacity>
                        </ScrollView>
                      )}
                      style={{ flexGrow: 0 }}
                    />
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        ) : null}

        <Text style={styles.disc}>{t("Description")}</Text>
        <View
          style={[
            styles.input,
            {
              borderColor: isFocused ? Colors.primary : Colors.litegray,
            },
          ]}
        >
          <TextInput
            value={disc1}
            placeholder="Type here..."
            placeholderTextColor={Colors.textgray}
            style={styles.discriptiontext}
            onChangeText={(txt) => {
              setDisc1(txt), setDescriptionError("");
            }}
            multiline
            textAlignVertical="top"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        </View>
        {descriptionError ? (
          <Text style={styles.errorText}>{descriptionError}</Text>
        ) : null}

        <TouchableOpacity
          style={styles.buttonbg}
          onPress={() => {
            CreateTaskforHome();
            navigation.navigate("BottamScreens");
          }}
        >
          <Text style={styles.buttontext}>{t("Add Task")}</Text>
        </TouchableOpacity>
        {/* </KeyboardAwareScrollView> */}
      </View>
    </>
  );
};

export default AddTask;

const styles = StyleSheet.create({
  maritalstatusmodal: {
    width: "95%",
    height: 300,
    backgroundColor: Colors.white,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 5,
    elevation: 5,
    borderRadius: 10,
    flexDirection: "column",
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
  input: {
    height: heightPercentageToDP(20),
    borderWidth: 1,
    // borderColor: Colors.litegray,
    borderRadius: 10,
    marginVertical: 10,
    // paddingHorizontal: 10,
    // marginHorizontal: 20,
  },
  background: {
    // backgroundColor: Colors.black,
    backgroundColor: Colors.litegray1,
    // height: "100%",
    marginTop: heightPercentageToDP(-1),
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    flex: 1,
    padding: 20,
  },
  discriptiontext: {
    padding: 10,
    width: "100%",
    minHeight: '100%',
    fontFamily: FONTS.LexendRegular,
    fontSize: RFValue(12),
    color: Colors.black,
  },
  disc: {
    fontSize: RFValue(13),
    fontFamily: FONTS.LexendMedium,
    marginTop: 10,
    color: Colors.black,
  },
  buttonbg: {
    backgroundColor: Colors.primary,
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    position: "absolute",
    bottom: heightPercentageToDP(2),
    alignSelf: "center",
    width: "100%",
  },
  buttontext: {
    color: Colors.white,
    fontSize: RFValue(16),
    fontFamily: FONTS.LexendSemiBold,
  },
  errorText: {
    color: Colors.red,
    fontSize: RFValue(10),
    fontFamily: FONTS.LexendRegular,
    marginTop: RFValue(2),
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
    fontSize: RFValue(13),
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
  },
});
