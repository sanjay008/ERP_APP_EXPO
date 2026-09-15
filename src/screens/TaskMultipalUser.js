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
import Modal from "react-native-modal";
import { useTranslation } from "react-i18next";
import SelectDropdown from "react-native-select-dropdown";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

const TaskMultipalUser = ({ route, navigation }) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [disc1, setDisc1] = useState("");
  const [titleError, setTitleError] = useState("");
  const [descriptionError, setDescriptionError] = useState("");
  const { item } = route.params;
  const [loading, setLoading] = useState(false);
  const [relaties, setRelaties] = useState([]);
  const [searchDataCustomer, setSearchDataCustomer] = useState(""); // Customer search data
  const [searchDataTemplate, setSearchDataTemplate] = useState(""); // Template search data
  const [clickmodal1, setClickModal1] = useState(false);
  const [clickmodal2, setClickModal2] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItem1, setSelectedItem1] = useState(null);
  const [filtereddata, setFilteredData] = useState([]);
  const [filtereddatatemp, setFilteredDataTemp] = useState([]);
  const [relaties_id, setRelaties_id] = useState("");
  const [template, setTemplate] = useState([]);
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [Tax, setTax] = useState([]);
  const [Priority, setPriority] = useState([]);
  const [selectpriority, setselectedpriority] = useState(null);
  const [selecttax, setselecttax] = useState(null);
  const [autoselect, setAutoSelected] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [task, setTask] = useState([]);
  const [Currency, setCurrency] = useState([]);
  const [selectcurrency, setselectCurrency] = useState(null);

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
      } else {
        console.log("False connections");
      }
    } catch (err) {
      console.log("Error fetching connections:", err);
    }
  };

  useEffect(() => {
    // Filter for customer search
    if (searchDataCustomer === "") {
      setFilteredData(relaties);
    } else {
      const filtered = relaties.filter(
        (item) =>
          item.display_name &&
          item.display_name
            .toLowerCase()
            .includes(searchDataCustomer.toLowerCase())
      );
      setFilteredData(filtered);
    }
  }, [searchDataCustomer, relaties]);

  useEffect(() => {
    // Filter for template search
    if (searchDataTemplate === "") {
      setFilteredDataTemp(template);
    } else {
      const filtered = template.filter(
        (item) =>
          item.title &&
          item.title.toLowerCase().includes(searchDataTemplate.toLowerCase())
      );
      setFilteredDataTemp(filtered);
    }
  }, [searchDataTemplate, template]);

  useEffect(() => {
    const fetchData = async () => {
      const getdata = await getData("USERDATA");
      setRelaties_id(getdata.data.relaties.id);
      fetchcustomer();
      fetchtemplate();
      fetchpriority();
      fetchtax();
      fetchcurrency();
    };
    fetchData();
  }, []);

  const fetchpriority = async () => {
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.Priority, {
        includeToken: true,
        customData: {
          relaties_id: getdata.data.relaties.id,
          user_id: getdata.data.user.id,
          role: getdata.data.user.role,
        },
      });
      if (data.status) {
        setPriority(data.data);
      } else {
        console.log("Failed to fetch task list.");
      }
    } catch (err) {
      console.log("Error fetching task list:", err);
    }
  };

  const fetchtax = async () => {
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.tax, {
        includeToken: true,
        customData: {
          relaties_id: getdata.data.relaties.id,
          user_id: getdata.data.user.id,
          role: getdata.data.user.role,
        },
      });
      if (data.status) {
        setTax(data.data);
        console.log("sujkdhvnks", data.data);
      } else {
        console.log("Failed to fetch task list.");
      }
    } catch (err) {
      console.log("Error fetching task list:", err);
    }
  };

  const fetchcurrency = async () => {
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.companycurrency, {
        includeToken: true,
        customData: {
          relaties_id: getdata.data.relaties.id,
          user_id: getdata.data.user.id,
          role: getdata.data.user.role,
        },
      });
      if (data.status) {
        setCurrency(data.data);
        console.log("ajksdnclaks", data.data);
      } else {
        console.log("Failed to fetch task list.");
      }
    } catch (err) {
      console.log("Error fetching task listrwfcerfver:", err);
    }
  };

  const fetchtemplate = async () => {
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.task_template, {
        includeToken: true,
        customData: {
          relaties_id: getdata.data.relaties.id,
          user_id: getdata.data.user.id,
          role: getdata.data.user.role,
        },
      });
      if (data.status) {
        setTemplate(data.data);
      } else {
        console.log("Failed to fetch task list.");
      }
    } catch (err) {
      console.log("Error fetching task list:", err);
    }
  };

  const handleModalClose = (modalNumber) => {
    if (modalNumber === 1) setClickModal1(false);
    if (modalNumber === 2) setClickModal2(false);
  };

  //   const validateFields = () => {
  //     let isValid = true;

  //     if (!title) {
  //       setTitleError("Title is required.");
  //       isValid = false;
  //     } else {
  //       setTitleError("");
  //     }

  //     if (!disc1) {
  //       setDescriptionError("Description is required.");
  //       isValid = false;
  //     } else {
  //       setDescriptionError("");
  //     }

  //     return isValid;
  //   };

  // const CreateTaskforHome = async () => {
  //   // if (!validateFields()) return; // Stop if validation fails

  //   setLoading(true);
  //   try {
  //     const getdata = await getData("USERDATA");
  //     const data = await ApiService(apiConstants.Task_house, {
  //       includeToken: true,
  //       customData: {
  //         relaties_id: getdata.data.relaties.id,
  //         role: getdata.data.user.role,
  //         user_id: getdata.data.user.id,
  //         short_description: disc1,
  //         title: title,
  //         type: item.link_to,
  //         priority: selectpriority
  //           ? selectpriority.value
  //           : selectpriority.value,
  //         selected_relaties_id: selectedItem
  //           ? selectedItem.id
  //           : autoselect
  //           ? autoselect.id
  //           : "",
  //         // template: selectedItem1 ? selectedItem1.id : selectedItem1.id,
  //         quantity: qty,
  //         price: price,
  //         tax: selecttax ? selecttax.value : selecttax.value,
  //       },
  //     });
  //     if (data.status) {
  //       setLoading(false);
  //       setTask(data)
  //       navigation.navigate("Home");
  //       console.log("Task creation successful", data);
  //     } else {
  //       setLoading(false);
  //       console.log("Failed to create task", data.errors.priority);
  //       Alert.alert("Error", data.errors.priority);
  //     }
  //   } catch (err) {
  //     setLoading(false);
  //     console.log("Error creating task:", err);
  //     Alert.alert("Error", task.errors);
  //   }
  // };

  const CreateTaskforHome = async () => {
    setLoading(true);

    try {
      // Fetch user data
      const getdata = await getData("USERDATA");

      // Prepare API request
      const data = await ApiService(apiConstants.Task_house, {
        includeToken: true,
        customData: {
          relaties_id: getdata.data.relaties.id,
          role: getdata.data.user.role,
          user_id: getdata.data.user.id,
          short_description: disc1,
          title: title,
          type: item.link_to,
          priority: selectpriority?.value || "",
          selected_relaties_id: selectedItem?.id || autoselect?.id || "",
          task_template: selectedItem1 ? selectedItem1.id : "",
          quantity: qty,
          price: price,
          currency: selectcurrency?.code || "",
          tax: selecttax?.value || "",
        },
      });

      // Handle successful response
      if (data.status) {
        setLoading(false);
        navigation.navigate("BottamScreens");
        console.log("Task creation successful", data);
        setTitle("");
        setDisc1(""); // Assuming you have a description field
        setQty(""); // Reset quantity
        setPrice(""); // Reset price
        setselecttax(null); // Reset priority (assuming it's an object)
        setselectedpriority(null); // Reset tax (assuming it's an object)
        setSelectedItem(null);
        setSelectedItem1(null);
        setselectCurrency(null);
      } else {
        setLoading(false);
        console.log("Failed to create task", data.errors);
      }
    } catch (err) {
      setLoading(false);
      console.log("Error creating task:", err);

      // Check if error is due to validation (422 status)
      if (err.response && err.response.status === 422) {
        const errors = err.response.data.errors;

        // Handle backend-provided errors one by one based on priority
        if (errors.title) {
          Alert.alert("Validation Error", errors.title.join("\n"));
          return;
        }
        if (errors.type) {
          Alert.alert("Validation Error", errors.type.join("\n"));
          return;
        }
        if (errors.task_template) {
          Alert.alert("Validation Error", errors.task_template.join("\n"));
          return;
        }
        if (errors.priority) {
          Alert.alert("Validation Error", errors.priority.join("\n"));
          return;
        }
        if (errors.quantity) {
          Alert.alert("Validation Error", errors.quantity.join("\n"));
          return;
        }
        if (errors.price) {
          Alert.alert("Validation Error", errors.price.join("\n"));
          return;
        }
        if (errors.tax) {
          Alert.alert("Validation Error", errors.tax.join("\n"));
          return;
        }

        // If there are unhandled errors, show them all
        const errorMessages = Object.values(errors).flat().join("\n");
        Alert.alert("Validation Errors", errorMessages);
      } else {
        // Fallback for unexpected errors
        Alert.alert("Error", "An unexpected error occurred. Please try again.");
      }
    }
  };

  const handleTextChange = (input) => {
    // Ensure input is defined before replacing
    const filteredText = input ? input.replace(/,/g, "") : "";
    setPrice(filteredText);
    // setPrice(input);
    setTitleError("");
  };

  // const handleKeyPress = (e) => {
  //   // Log the key pressed for debugging
  //   console.log("Key pressed: ", e.nativeEvent.key);

  //   // If the comma key (keyCode 188) is pressed, prevent its action
  //   if (e.nativeEvent.key === ',') {
  //     e.preventDefault(); // Prevent the comma from being entered into the input
  //     console.log("Comma key disabled!");
  //   }
  // };

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
        <KeyboardAwareScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          enableOnAndroid
          extraScrollHeight={70}
          keyboardShouldPersistTaps="handled"
          style={styles.searchBarStyle}
        >
          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 10, paddingBottom: 50 }}
          >
            <Input
              value={title}
              onChangeText={(txt) => {
                setTitle(txt);
                // setTitleError("");
              }}
              title={"Title"}
              placeholder={"Add title....."}
              // error={titleError}
            />
            <Text style={[styles.disc, { marginTop: 0 }]}>{t("Relaties")}</Text>
            <TouchableOpacity
              style={styles.dropdownButtonStyle}
              onPress={() => setClickModal1(!clickmodal1)}
            >
              <Text style={styles.dropdownButtonTxtStyle}>
                {selectedItem
                  ? selectedItem.display_name
                  : autoselect.display_name || "Select Relatie..."}
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

            {clickmodal1 && (
              <Modal
                animationType="fade"
                transparent={true}
                visible={clickmodal1}
                backdropOpacity={0.5}
                onBackdropPress={() => handleModalClose(1)}
                onBackButtonPress={() => handleModalClose(1)}
              >
                <TouchableWithoutFeedback onPress={() => handleModalClose(1)}>
                  <View style={styles.modalbg}>
                    <TouchableWithoutFeedback>
                      <View style={styles.maritalstatusmodal}>
                        <TextInput
                          style={[styles.searchInput, { marginBottom: 10 }]}
                          placeholder={t("Search...")}
                          placeholderTextColor={"gray"}
                          value={searchDataCustomer}
                          onChangeText={(text) => setSearchDataCustomer(text)} // Update customer search
                        />
                        <FlatList
                          data={filtereddata}
                          keyExtractor={(item) => item.id}
                          renderItem={({ item }) => (
                            <TouchableOpacity
                              style={styles.dropdownItemStyle}
                              onPress={() => {
                                setSelectedItem(item);
                                handleModalClose(1);
                              }}
                            >
                              <Text style={styles.dropdownItemTxtStyle}>
                                {item.display_name}
                              </Text>
                            </TouchableOpacity>
                          )}
                        />
                      </View>
                    </TouchableWithoutFeedback>
                  </View>
                </TouchableWithoutFeedback>
              </Modal>
            )}

            {/* Modal 2 Dropdown Button */}
            <Text style={styles.disc}>{t("Template")}</Text>

            <TouchableOpacity
              style={styles.dropdownButtonStyle}
              onPress={() => setClickModal2(!clickmodal2)}
            >
              <Text style={styles.dropdownButtonTxtStyle}>
                {selectedItem1 ? selectedItem1.title : "Select Template"}
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

            {clickmodal2 && (
              <Modal
                animationType="fade"
                transparent={true}
                visible={clickmodal2}
                backdropOpacity={0.5}
                onBackdropPress={() => handleModalClose(2)}
                onBackButtonPress={() => handleModalClose(2)}
              >
                <TouchableWithoutFeedback onPress={() => handleModalClose(2)}>
                  <View style={styles.modalbg}>
                    <TouchableWithoutFeedback>
                      <View style={styles.maritalstatusmodal}>
                        <TextInput
                          style={[styles.searchInput, { marginBottom: 10 }]}
                          placeholder={t("Search...")}
                          placeholderTextColor={"gray"}
                          value={searchDataTemplate}
                          onChangeText={(text) => setSearchDataTemplate(text)} // Update template search
                        />
                        <FlatList
                          data={filtereddatatemp}
                          keyExtractor={(item) => item.id}
                          renderItem={({ item }) => (
                            <TouchableOpacity
                              style={styles.dropdownItemStyle}
                              onPress={() => {
                                setSelectedItem1(item);
                                handleModalClose(2);
                              }}
                            >
                              <Text style={styles.dropdownItemTxtStyle}>
                                {item.title}
                              </Text>
                            </TouchableOpacity>
                          )}
                        />
                      </View>
                    </TouchableWithoutFeedback>
                  </View>
                </TouchableWithoutFeedback>
              </Modal>
            )}

            <Text style={styles.disc}>{t("Priority")}</Text>
            <SelectDropdown
              data={Priority}
              onSelect={(selectpriority) => setselectedpriority(selectpriority)}
              renderButton={(item, isOpened, selectedItem) => {
                return (
                  <View style={[styles.dropdownButtonStyle]}>
                    <Text style={[styles.dropdownButtonTxtStyle]}>
                      {selectpriority
                        ? selectpriority.value
                        : "Select Priority"}
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
                      {item.value}
                    </Text>
                  </View>
                );
              }}
              showsVerticalScrollIndicator={false}
              dropdownStyle={styles.dropdownMenuStyle}
            />

            <Input
              value={qty}
              onChangeText={(txt) => {
                setQty(txt), setTitleError("");
              }}
              title={"Qty"}
              placeholder={"Add Qty....."}
              keyboardType={"numeric"}
              //   error={titleError}
            />

            {/* <Input
              value={price}
              onChangeText={(txt) => {
                setPrice(txt), setTitleError("");
              }}
              // onChangeText={handleTextChange}
              title={"Price"}
              placeholder={"Add Price....."}
              keyboardType={"numeric"}
              //   error={titleError}
            /> */}

            <Text style={[styles.disc, { marginTop: 0 }]}>{t("Price")}</Text>
            <View
              style={{
                flexDirection: "row",
                marginTop: 20,
                justifyContent: "space-between",
              }}
            >
              <SelectDropdown
                data={Currency}
                onSelect={(selectcurrency) => setselectCurrency(selectcurrency)}
                renderButton={(item, isOpened, selectedItem) => {
                  return (
                    <View style={[styles.dropdownButtonStyle1]}>
                      <Text style={[styles.dropdownButtonTxtStyle1]}>
                        {selectcurrency ? selectcurrency.symbol : "Curr.."}
                      </Text>
                      <Image
                        source={Images.down}
                        style={{
                          height: 12,
                          width: 12,
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
                        {
                          paddingHorizontal: 5,
                        },
                        isSelected && { backgroundColor: Colors.white },
                      ]}
                    >
                      <Text
                        style={[
                          styles.dropdownItemTxtStyle,
                          { fontSize: RFValue(10) },
                        ]}
                      >
                        {item.symbol}
                      </Text>
                    </View>
                  );
                }}
                showsVerticalScrollIndicator={false}
                dropdownStyle={styles.dropdownMenuStyle}
              />
              <View
                style={[
                  styles.input,
                  {
                    borderColor: Colors.litegray,
                    height: RFValue(45),
                    width: "80%",
                    alignSelf: "flex-end",
                    marginTop: 0,
                  },
                ]}
              >
                {/* <TextInput
                  value={price}
                  onChangeText={handleTextChange} // Handle text change
                  placeholder="Type something"
                  placeholderTextColor="gray"
                  keyboardType="default" // Use default keyboard
                  onKeyPress={handleKeyPress} // Detect key press events
                  returnKeyType="done" // Change the return key to 'Done'
                /> */}
                <TextInput
                  value={price}
                  placeholder="Add price..."
                  placeholderTextColor={Colors.textgray}
                  // style={{
                  //   fontFamily: FONTS.LexendRegular,
                  //   fontSize: RFValue(12),
                  //   color: Colors.black,
                  //   padding:10
                  // }}
                  keyboardType="numeric"
                  style={[styles.discriptiontext, { minHeight: 0 }]}
                  onChangeText={(txt) => handleTextChange(txt)}
                />
              </View>
            </View>

            <Text style={[styles.disc, { marginTop: 0 }]}>{t("Tax")}</Text>
            <SelectDropdown
              data={Tax}
              onSelect={(selecttax) => setselecttax(selecttax)}
              renderButton={(item, isOpened, selectedItem) => {
                return (
                  <View style={[styles.dropdownButtonStyle]}>
                    <Text style={[styles.dropdownButtonTxtStyle]}>
                      {selecttax ? selecttax.label : "Select Tax"}
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
                      {item.label}
                    </Text>
                  </View>
                );
              }}
              showsVerticalScrollIndicator={false}
              dropdownStyle={styles.dropdownMenuStyle}
            />
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

            {/* <Input
            value={Tax}
            onChangeText={(txt) => {
              setTax(txt), setTitleError("");
            }}
            title={"Tax"}
            placeholder={"Add Tax....."}
            //   error={titleError}
          /> */}
            <TouchableOpacity
              style={styles.buttonbg}
              onPress={() => {
                CreateTaskforHome();
                // navigation.navigate("Home");
              }}
            >
              <Text style={styles.buttontext}>{t("Add Task")}</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAwareScrollView>
      </View>
    </>
  );
};

export default TaskMultipalUser;

const styles = StyleSheet.create({
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
    fontSize: RFValue(13),
    marginLeft: "3%",
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
  },
  dropdownButtonStyle1: {
    height: RFValue(45),
    borderWidth: 1,
    borderColor: Colors.litegray,
    width: "18%",
    borderRadius: 7,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
    // marginTop: RFValue(5),
  },
  dropdownButtonTxtStyle1: {
    flex: 1,
    fontSize: RFValue(11),
    marginLeft: "3%",
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
  },
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
  dropdownItemStyle1: {
    width: "100%",
    flexDirection: "row",
    paddingHorizontal: 12,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
  },
  dropdownItemTxtStyle1: {
    flex: 1,
    fontSize: RFValue(13),
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
  },
  input: {
    height: heightPercentageToDP(15),
    borderWidth: 1,
    // borderColor: Colors.litegray,
    borderRadius: 10,
    marginTop: 10,
    // paddingHorizontal: 10,
    // marginHorizontal: 20,
    marginBottom: 30,
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
    minHeight: 90,
    fontFamily: FONTS.LexendRegular,
    fontSize: RFValue(14),
    color: Colors.black,
  },
  disc: {
    fontSize: RFValue(13),
    fontFamily: FONTS.LexendMedium,
    marginTop: 20,
    color: Colors.black,
  },
  buttonbg: {
    backgroundColor: Colors.primary,
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    position: "absolute",
    bottom: 10,
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
});
