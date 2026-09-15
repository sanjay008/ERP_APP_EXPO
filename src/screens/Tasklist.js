import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Platform,
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
import React, { useCallback, useEffect, useState } from "react";
import Header from "../components/header";
import { Images } from "../constants/images";
import { getData, storeData } from "../utils/storeData";
import { Colors } from "../constants/color";
import { RFValue } from "react-native-responsive-fontsize";
import { FONTS } from "../constants/fontFamily";
import apiConstants from "../api/apiConstants";
import { useTranslation } from "react-i18next";
import Modal from "react-native-modal";
import CheckBox from "react-native-check-box";
import ButtonComponent from "../components/buttonComponent";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Loader from "../components/loading";
import { heightPercentageToDP } from "react-native-responsive-screen";
import ApiService from "../utils/Apiservice";
import BlueHeader from "../components/BlueHeader";
import Footer from "../components/Footer";
import Filtersortmodal from "../components/Filtersortmodal";
import { SafeAreaView } from "react-native-safe-area-context";
import SelectDropdown from "react-native-select-dropdown";
import Input from "../components/input";
import { DocumentPicker, types } from '@react-native-documents/picker';
import { launchCamera, launchImageLibrary } from "react-native-image-picker";
import { useFocusEffect } from "@react-navigation/native";

const Tasklist = ({ navigation, route }) => {
  const { bgcolor } = route.params;
  const { title } = route.params;
  const [logo, setLogo] = useState(null);
  const { width } = Dimensions.get("screen");
  const { height } = Dimensions.get("window");
  const [tasklist, setTasklist] = useState([]);
  const [filteredTasklist, setFilteredTasklist] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterModalvisible, setFilterModalVisible] = useState(false);
  const [modalOptionsVisible, setModalOptionsVisible] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [logmodalVisible, setLogModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const [selectedStatusIds, setSelectedStatusIds] = useState([]);
  const [statusdata, setStatusData] = useState([]);
  const [sortmodalVisible, setSortModalVisible] = useState(false);
  const [sortOrder, setSortOrder] = useState("asc");
  const [addTaskmodal, setAddTaskModal] = useState(false);
  const [retiesname, setRelatiesName] = useState([]);
  const [priority, setPriority] = useState([]);
  const [selectedrelaties, setSelectedRelaties] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedpriority, setSelectedPriority] = useState("");
  const [taskName, setTaskname] = useState(null);
  const [discription, setDiscription] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFileType, setSelectedFileType] = useState("");
  console.log("selected imagegegegeegeg-=-=-", selectedFile);

  const StusSearch = async () => {
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.getstatus, {
        includeToken: true,
        customData: {
          slug: "task_n_order",
          relaties_id: getdata.data.relaties.id,
          role: getdata.data.user.role,
          user_id: getdata.data.user.id,
        },
      });
      // console.log(data, "suv==========");
      if (data.status) {
        setStatusData(data.data);
      } else {
        console.log("False connections");
      }
    } catch (err) {
      console.log("Error fetching connections:", err);
    }
  };

  const fetchTasklist = async () => {
    if (!refreshing) {
      setRefreshing(true);
      setTimeout(() => {
        setRefreshing(false);
      }, 1000);
    } else {
      setRefreshing(false);
    }
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.tasklist, {
        includeToken: true,
        customData: {
          relaties_id: getdata.data.relaties.id,
          user_id: getdata.data.user.id,
          role: getdata.data.user.role,
        },
      });
      // console.log('customData-0-0---00',data.data);
      if (data.status) {
        setTasklist(data.data);
      } else {
        console.log("Failed to fetch connections.");
      }
    } catch (err) {
      console.log("Error fetching connections:", err);
    }
  };

  const fetchcustomer = async () => {
    // setLoading(true);
    if (!refreshing) {
      setRefreshing(true);
      setTimeout(() => {
        setRefreshing(false);
      }, 1000);
    } else {
      setRefreshing(false);
    }
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.customer, {
        includeToken: true,
        customData: {
          relaties_id: getdata.data.relaties.id,
          role: getdata.data.user.role,
          user_id: getdata.data.user.id,
          // soort_relatie: "opdrachtgever", ////customer type ==> client
        },
      });
      if (data.status) {
        setRelatiesName(data.data);
        // console.log("udhciu======", data.data);
      } else {
        console.log("False connections");
      }
    } catch (err) {
      console.log("Error fetching connections:", err);
    }
  };

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

  const Createtask = async () => {
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.store_normal_task, {
        includeToken: true,
        customData: {
          selected_relaties_id: selectedrelaties?.id,
          user_id: getdata.data.user.id,
          role: getdata.data.user.role,
          title: taskName,
          short_description: discription,
          priority: selectedpriority?.value,
          document: selectedFile
            ? {
              uri: selectedFile.uri,
              name: selectedFile.name,
              type: selectedFile.type,
            }
            : "",
        },
      });
      if (data.status) {
        setAddTaskModal(false);
        console.log("Create task data ", data.message);
      } else {
        console.log("Failed to fetch task list.");
      }
    } catch (err) {
      console.log("Error fetching task list:", err);
    }
  };

  const companylogo = async () => {
    const companylogo = await getData("COMPANYLOGO");
    setLogo(companylogo);
  };
  useFocusEffect(
    useCallback(() => {
      companylogo();
      fetchTasklist();
      StusSearch();
      fetchcustomer();
      fetchpriority();
    }, [])
  );

  useEffect(() => {
    setFilteredTasklist(tasklist);
  }, [tasklist]);

  useEffect(() => {
    const filterBySearchQuery = (task) =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase());

    const filterBySelectedStatus = (task) => {
      if (selectedItems.length === 0) return true;
      return selectedItems.includes(task?.task_status_data?.id);
    };

    const filtered = tasklist
      .filter(filterBySearchQuery)
      .filter(filterBySelectedStatus);
    setFilteredTasklist(filtered);
  }, [searchQuery, tasklist, selectedItems]);

  const handleCheckboxChange = (item) => {
    const newSelectedIds = [...selectedStatusIds];
    if (newSelectedIds.includes(item.id)) {
      newSelectedIds.splice(newSelectedIds.indexOf(item.id), 1);
    } else {
      newSelectedIds.push(item.id);
    }
    setSelectedStatusIds(newSelectedIds);
  };

  const applyFilters = () => {
    setFilterModalVisible(false);
    const filtered = tasklist.filter((task) => {
      const filterBySearchQuery = task.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const filterBySelectedStatus =
        selectedStatusIds.length === 0 ||
        selectedStatusIds.includes(task?.task_status_data?.id);
      return filterBySearchQuery && filterBySelectedStatus;
    });
    setFilteredTasklist(filtered);
  };

  const RemoveAllKeys = async () => {
    await AsyncStorage.clear();
    setModalOptionsVisible(!modalOptionsVisible);
    navigation.navigate("CompanyLogin");
    // navigation.navigate("Login");
    await storeData("SELECT", true);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setSearchQuery("");
    setSelectedItems([]);
    fetchTasklist();
    console.log("task refresh ==========");
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const renderItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.box}
        onPress={() =>
          navigation.navigate("Taskdetails", { id: item.id, color: bgcolor })
        }
      >
        <View style={styles.firstline}>
          <Text style={styles.firstlineid}>{item.id}</Text>
          <Text style={[styles.firstlinetitle]}>{item.title}</Text>

          {item?.task_status_data && (
            <View style={{ flex: 1, alignItems: "flex-end" }}>
              <View
                style={[
                  styles.statusbox,
                  {
                    backgroundColor:
                      item.task_status_data.color || Colors.primary,
                  },
                ]}
              >
                <Text style={styles.statuname}>
                  {item.task_status_data.status_name}
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.secondlinebg}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Image source={Images.time} style={styles.timebg} />
            <Text style={styles.secondline}>
              {item.quantity} {item.quantity_type}
            </Text>
          </View>
          <Text style={styles.secondline}>{item.deadline}</Text>
          {/* {item.hrs_price && (
            <Text style={styles.secondline}>
              {item.currency_data.symbol} {item.hrs_price}
            </Text>
          )} */}
        </View>
      </TouchableOpacity>
    );
  };

  const arrowOnPress = (text) => {
    console.log("sorting data ", text);
    const sortedData = [...tasklist];

    // Toggle sort order
    const newSortOrder = sortOrder === t("asc") ? t("desc") : t("asc");
    setSortOrder(newSortOrder);

    sortedData.sort((a, b) => {
      // Determine values to compare
      const aValue =
        text === "Name"
          ? getSortValuename(a) || ""
          : text === "Status"
            ? getSortValuestuts(a) || ""
            : text === "Id"
              ? getSortValueid(a) || ""
              : text === "Date"
                ? getSortValuedate(a) || ""
                : "";
      const bValue =
        text === "Name"
          ? getSortValuename(b) || ""
          : text === "Status"
            ? getSortValuestuts(b) || ""
            : text === "Id"
              ? getSortValueid(b) || ""
              : text === "Date"
                ? getSortValuedate(b) || ""
                : "";

      // Perform string comparison
      if (text === "Id") {
        // Numeric comparison for id
        return newSortOrder === t("asc") ? aValue - bValue : bValue - aValue;
      } else {
        // String comparison for other fields
        return newSortOrder === t("asc")
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      // if (newSortOrder === t("asc")) {
      //   return aValue.localeCompare(bValue);
      // } else {
      //   return bValue.localeCompare(aValue);
      // }
    });

    // Update data
    setTasklist(sortedData);
  };

  const getSortValuename = (item) => {
    // Determine the value to sort based on the current sorting order
    switch (sortOrder) {
      case t("asc"):
        return item.title.toLowerCase();
      case t("desc"):
        return item.title.toLowerCase();
      default:
        return item.title.toLowerCase();
    }
  };
  const getSortValuestuts = (item) => {
    // Determine the value to sort based on the current sorting order
    switch (sortOrder) {
      case t("asc"):
        return item?.task_status_data?.status_name.toLowerCase();
      case t("desc"):
        return item?.task_status_data?.status_name.toLowerCase();
      default:
        return item?.task_status_data?.status_name.toLowerCase();
    }
  };
  const getSortValueid = (item) => {
    // Ensure id is treated as a string
    const id = item.id ? Number(item.id) : ""; // Convert to string if not null or undefined
    return id;
    // switch (sortOrder) {
    //   case t("asc"):
    //     return id.toLowerCase();
    //   case t("desc"):
    //     return id.toLowerCase();
    //   default:
    //     return id.toLowerCase();
    // }
  };

  const getSortValuedate = (item) => {
    // Determine the value to sort based on the current sorting order
    switch (sortOrder) {
      case t("asc"):
        return item.deadline.toLowerCase();
      case t("desc"):
        return item.deadline.toLowerCase();
      default:
        return item.deadline.toLowerCase();
    }
  };

  const handleFileSelection = async () => {
    Alert.alert(
      "Select Option",
      "Choose an option",
      [
        { text: "Camera", onPress: openCamera },
        { text: "Gallery", onPress: openGallery },
        { text: "Files (PDF/DOC)", onPress: openDocument },
        { text: "Cancel", style: "cancel" },
      ],
      { cancelable: true }
    );
  };

  const openCamera = () => {
    const options = { mediaType: "photo", quality: 1 };
    launchCamera(options, (response) => {
      if (!response.didCancel && !response.errorCode) {
        const image = response.assets[0];

        // Log the temporary URI to verify
        console.log("Captured Image URI:", image.uri);

        setSelectedFile({
          uri: image.uri, // Temporary URI path
          name: image.fileName || "photo.jpg",
          type: image.type || "image/jpeg",
        });
        setSelectedFileType("image");
      }
    });
  };

  const openGallery = () => {
    const options = { mediaType: "photo", quality: 1 };
    launchImageLibrary(options, (response) => {
      if (!response.didCancel && !response.errorCode) {
        const image = response.assets[0];
        setSelectedFile({
          uri: image.uri,
          name: image.fileName || "gallery.jpg",
          type: image.type || "image/jpeg",
        });
        setSelectedFileType("image");
        // console.log('selected imagegegegeegeg-=-=-' ,selectedFile);
      }
    });
  };

const openDocument = async () => {
  try {
    const res = await DocumentPicker.pick({
      type: [types.pdf, types.doc], // pehle DocumentPicker.types.pdf/doc
      allowMultiSelection: false, // single file
    });

    const file = res[0];
    setSelectedFile({
      uri: file.uri,
      name: file.name,
      type: file.mimeType, // type -> mimeType
    });

    setSelectedFileType(file.mimeType.includes("pdf") ? "pdf" : "document");

  } catch (err) {
    if (DocumentPicker.isCancel(err)) {
      console.log("User canceled document picker");
    } else {
      console.error("Document Picker Error:", err);
    }
  }
};

  return (
    // <SafeAreaView style={[styles.container, { backgroundColor: bgcolor }]}>
    <>
      <StatusBar backgroundColor={bgcolor} barStyle={"light-content"} />
      {/* <Header
        source={{ uri: logo }}
        // justifyContent={"flex-start"}
        // style={{ width: width * 0.5, height: RFValue(30), right: 70 }}
        rightIcon={Images.dots}
        rightIconClick={() => setModalOptionsVisible(true)}
        back
      /> */}

      <BlueHeader
        bgcolor={bgcolor}
        title={title}
        onPressfilter={() => setFilterModalVisible(true)}
        SearchBarInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        Righticon={Images.refresh}
        onPressRight={onRefresh}
        arrowOnPress={() => setSortModalVisible(!sortmodalVisible)}
      />
      {loading && <Loader color={Colors.primary} />}

      <Modal
        animationIn={"fadeIn"}
        transparent={true}
        visible={modalOptionsVisible}
        onRequestClose={() => {
          setModalOptionsVisible(false);
        }}
        onSwipeComplete={() => {
          setModalOptionsVisible(false);
        }}
        onBackdropPress={() => {
          setModalOptionsVisible(false);
        }}
        onBackButtonPress={() => {
          setModalOptionsVisible(false);
        }}
      >
        <View
          style={[
            styles.modalOptionsContainer,
            {
              top:
                Platform.OS === "ios"
                  ? height > 800
                    ? 90 // iOS devices with large height
                    : 50 // iOS devices with small height
                  : Platform.OS === "android"
                    ? height > 800
                      ? 40 // Android devices with large height
                      : 30 // Android devices with small height
                    : 50, // Default fallback (if neither iOS nor Android)
            },
          ]}
        >
          <TouchableOpacity
            style={styles.option}
            onPress={() => {
              setModalOptionsVisible(false);
              navigation.navigate("AboutApp");
            }}
          >
            <Text
              style={{ color: Colors.black, fontFamily: FONTS.LexendRegular }}
            >
              {t("Over app")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.option}
            onPress={() => {
              setModalOptionsVisible(true);
              setLogModalVisible(true);
            }}
          >
            <Text
              style={{ color: Colors.black, fontFamily: FONTS.LexendRegular }}
            >
              {t("Uitloggen")}
            </Text>
          </TouchableOpacity>
          <Modal
            onBackdropPress={() => {
              setLogModalVisible(false);
            }}
            onBackButtonPress={() => {
              setLogModalVisible(false);
            }}
            style={styles.mview}
            visible={logmodalVisible}
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
                {t("Uitloggen")} ?
              </Text>
              <Text style={styles.logout}>
                {t("Weet u zeker dat u wilt uitloggen?")}
              </Text>
              <View style={styles.bottmModal}>
                <TouchableOpacity
                  style={styles.mdlbutton}
                  onPress={() => setLogModalVisible(false)}
                >
                  <Text style={styles.no}>{t("Annuleren")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={async () => RemoveAllKeys()}
                  style={[
                    styles.mdlbutton,
                    { backgroundColor: Colors.primary },
                  ]}
                >
                  <Text style={[styles.no, { color: Colors.white }]}>
                    {t("Uitloggen")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
      </Modal>

      <View
        style={{
          backgroundColor: Colors.litegray1,
          height: "100%",
          marginTop: heightPercentageToDP(-1),
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
          paddingHorizontal: 20,
          paddingTop: 10,
          flex: 1,
        }}
      >

        <View style={styles.btncontainer}>
          <TouchableOpacity
            onPress={() => {
              navigation.navigate("AddNweTask", { color: bgcolor });
              // setAddTaskModal(true);
              // setTaskname(null);
              // setDiscription(null);
              // setSelectedFile(null);
            }}
            style={styles.button}
          >
            <Text style={styles.startbuttonText}>{t("+Add")}</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          showsVerticalScrollIndicator={false}
          data={filteredTasklist}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={
            <Text style={styles.emptyText}>{t("No Tasks Found.")}</Text>
          }
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary, "#F048C6"]}
              tintColor={Colors.primary}
            />
          }
          contentContainerStyle={{
            paddingBottom: 20, // Adds bottom padding to the content
          }}
        />
      </View>

      <Filtersortmodal
        sortModalVisible={sortmodalVisible}
        setSortModalVisible={setSortModalVisible}
        handleSortPress={arrowOnPress}
        filterModalVisible={filterModalvisible}
        setFilterModalVisible={setFilterModalVisible}
        handleCheckboxChange={handleCheckboxChange}
        applyFilters={applyFilters}
        statusData={statusdata}
        selectedStatusIds={selectedStatusIds}
        modalheight={"90%"}
        data={[
          { id: "1", title: "Id" },
          { id: "2", title: "Name" },
          { id: "3", title: "Status" },
          { id: "4", title: "Date" },
        ]}
      />

      <Modal
        onBackdropPress={() => {
          setAddTaskModal(false);
        }}
        onBackButtonPress={() => {
          setAddTaskModal(false);
        }}
        style={[styles.mview]}
        visible={addTaskmodal}
      >
        <ScrollView style={[styles.mcontainer, { padding: 10, height: "80%" }]}>
          <Text style={[styles.title]}>{t("Add Task")}</Text>

          <View style={{ alignItems: "flex-end", flex: 1 }}>
            <View
              style={[
                styles.statusbox,
                {
                  backgroundColor: "#858585",
                  width: "40%",
                },
              ]}
            >
              <Text style={styles.statuname}>{t("Concept")}</Text>
            </View>
          </View>

          <Text
            style={[
              styles.day,
              {
                marginTop: 5,
                fontSize: RFValue(13),
                fontFamily: FONTS.LexendMedium,
                color: Colors.black,
              },
            ]}
          >
            {t("Relaties")}
          </Text>
          <SelectDropdown
            data={retiesname}
            onSelect={(selectedItem) => {
              setSelectedRelaties(selectedItem);
            }}
            renderButton={(item) => {
              return (
                <View style={[styles.dropdownButtonStyle]}>
                  <Text style={[styles.dropdownButtonTxtStyle]}>
                    {item?.display_name ? item?.display_name : ""}
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
                    {item.display_name || "-"}
                  </Text>
                </View>
              );
            }}
            showsVerticalScrollIndicator={false}
            dropdownStyle={styles.dropdownMenuStyle}
            search
            searchInputStyle={styles.dropdownsearchstyle}
            searchInputTxtStyle={{
              color: Colors.black,
              fontFamily: FONTS.LexendMedium,
            }}
          />
          {/* <Text style={[styles.day, { marginTop: 5 }]}>{t("Select Type")}</Text>
          <SelectDropdown
            data={[{ id: 1, Type: "Normal" }]}
            onSelect={(selectedItem) => {
              setSelectedType(selectedItem);
            }}
            renderButton={(item) => {
              return (
                <View
                  style={[styles.dropdownButtonStyle, { marginBottom: 10 }]}
                >
                  <Text style={[styles.dropdownButtonTxtStyle]}>
                    {item?.Type ? item?.Type : t("Select Type")}
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
                    {item.Type || "-"}
                  </Text>
                </View>
              );
            }}
            showsVerticalScrollIndicator={false}
            dropdownStyle={styles.dropdownMenuStyle}
            search
            searchInputStyle={styles.dropdownsearchstyle}
            searchInputTxtStyle={{
              color: Colors.black,
              fontFamily: FONTS.LexendMedium,
            }}
          /> */}

          <Input
            value={taskName}
            onChangeText={(txt) => {
              setTaskname(txt);
            }}
            keyboardType="default"
            required={t("Task Name")}
          // placeholder={"Enter Task Name"}
          />
          <Input
            value={discription}
            onChangeText={(txt) => {
              setDiscription(txt);
            }}
            keyboardType="default"
            required={t("Omschrijving")}
          // placeholder={"Enter Discription"}
          />

          <Text
            style={[
              styles.day,
              {
                fontSize: RFValue(13),
                fontFamily: FONTS.LexendMedium,
                color: Colors.black,
              },
            ]}
          >
            {t("Priority")}
          </Text>
          <SelectDropdown
            data={priority}
            onSelect={(selectedItem) => {
              setSelectedPriority(selectedItem);
            }}
            renderButton={(item) => {
              return (
                <View
                  style={[styles.dropdownButtonStyle, { marginBottom: 10 }]}
                >
                  <Text style={[styles.dropdownButtonTxtStyle]}>
                    {item?.value ? item?.value : ""}
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
                  <Text style={styles.dropdownItemTxtStyle}>{item.value}</Text>
                </View>
              );
            }}
            showsVerticalScrollIndicator={false}
            dropdownStyle={styles.dropdownMenuStyle}
          // search
          // searchInputStyle={styles.dropdownsearchstyle}
          // searchInputTxtStyle={{
          //   color: Colors.black,
          //   fontFamily: FONTS.LexendMedium,
          // }}
          />

          <Text
            style={{
              fontSize: RFValue(13),
              fontFamily: FONTS.LexendMedium,
              color: Colors.black,
            }}
          >
            {t("Document")}
          </Text>
          <TouchableOpacity
            style={[
              styles.dropdownButtonStyle,
              { justifyContent: "space-between" },
            ]}
            onPress={handleFileSelection}
          >
            <Text style={styles.dropdownButtonTxtStyle}>
              {/* Select Your Document */}
            </Text>
            <Image
              source={Images.gallery}
              style={{ height: 20, width: 20, tintColor: Colors.primary }}
            />
          </TouchableOpacity>

          {selectedFile && (
            <View style={styles.filePreview}>
              {selectedFileType === "image" ? (
                <Image
                  source={{ uri: selectedFile.uri }}
                  style={styles.imagePreview}
                />
              ) : (
                <Image
                  source={
                    selectedFileType === "pdf"
                      ? Images.pdflogo // Replace with your PDF icon
                      : Images.documentlogo // Replace with your DOC icon
                  }
                  style={styles.fileIcon}
                />
              )}
              {/* <Text style={styles.fileText}>{selectedFile.name}</Text> */}
            </View>
          )}

          <TouchableOpacity onPress={() => Createtask()} style={styles.button}>
            <Text style={styles.startbuttonText}>{t("Create Task")}</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>

      {/* <Footer /> */}
    </>
    // </SafeAreaView>
  );
};

export default Tasklist;

const styles = StyleSheet.create({
  filePreview: { marginVertical: 10 },
  imagePreview: { width: 100, height: 100, borderRadius: 10 },
  fileIcon: { width: 50, height: 50 }, // Adjust size for PDF & DOC icons
  fileText: { fontSize: 14, color: "black", marginTop: 5 },
  openGalleryText: {
    color: "blue",
    textDecorationLine: "underline",
    marginTop: 5,
  },
  openGalleryText: {
    color: "blue",
    textDecorationLine: "underline",
    marginTop: 5,
  },
  container: {
    flex: 1,
  },
  title: {
    fontSize: RFValue(20),
    fontFamily: FONTS.LexendMedium,
    color: Colors.black,
    marginVertical: 10,
  },
  filterbg: {
    height: RFValue(35),
    width: RFValue(35),
    backgroundColor: Colors.primary,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    height: RFValue(40),
    width: "100%",
    borderWidth: 1,
    borderColor: Colors.litegray,
    borderRadius: 5,
    justifyContent: "center",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    marginTop: "1%",
    marginBottom: "2%",
  },
  searchIcon: {
    width: 20,
    height: 20,
    tintColor: Colors.textgray,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: RFValue(14),
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
  },
  box: {
    borderColor: Colors.litegray,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginVertical: 8,
    backgroundColor: Colors.white,
  },
  secondlinebg: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    // paddingLeft: RFValue(40),
    alignItems: "center",
  },
  secondline: {
    color: Colors.textgray,
    fontFamily: FONTS.LexendRegular,
    paddingLeft: 5,
  },
  menutext: {
    fontFamily: FONTS.LexendMedium,
    color: Colors.primary,
    fontSize: RFValue(14),
    padding: 10,
  },
  emptyText: {
    textAlign: "center",
    color: Colors.textgray,
    fontFamily: FONTS.LexendRegular,
    marginTop: 20,
  },
  modal: {
    flex: 1,
    position: "absolute",
    bottom: 0,
    borderTopRightRadius: 30,
    borderTopLeftRadius: 30,
    backgroundColor: Colors.white,
    width: "100%",
    paddingTop: 20,
    paddingBottom: 35,
    paddingHorizontal: 20,
    height: heightPercentageToDP("90%"),
  },
  checkView: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: RFValue(12),
  },
  modalOptionsContainer: {
    position: "absolute",
    // top: 50,
    // top: heightPercentageToDP("9%"),
    right: 4,
    backgroundColor: "white",
    borderRadius: 10,
    justifyContent: "space-around",
    elevation: 5,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  option: {
    padding: 10,
    color: Colors.black,
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
  mdlbutton: {
    height: 45,
    backgroundColor: Colors.litegray,
    justifyContent: "center",
    marginBottom: 32,
    borderRadius: 4,
  },
  bottmModal: {
    flexDirection: "row",
    marginTop: 34,
    justifyContent: "space-evenly",
    marginHorizontal: 24,
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
  no: {
    color: Colors.black,
    fontSize: 18,
    fontFamily: FONTS.LexendRegular,
    paddingHorizontal: 20,
  },
  line: { height: 1, backgroundColor: Colors.litegray },
  firstline: {
    flexDirection: "row",
    // justifyContent: "space-between",
  },
  firstlineid: {
    color: Colors.black,
    fontFamily: FONTS.LexendRegular,
    textAlign: "left",
  },
  firstlinetitle: {
    color: Colors.black,
    fontFamily: FONTS.LexendRegular,
    width: "50%",
    // textAlign: "center",
    left: 20,
  },
  statusbox: {
    // height: 40,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    width: "70%",
  },
  statuname: {
    fontFamily: FONTS.LexendRegular,
    color: Colors.white,
    textAlign: "center",
  },
  filtertext: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 24,
    paddingVertical: 10,
    color: Colors.black,
    fontFamily: FONTS.LexendMedium,
  },
  taskbarbg: {
    height: 40,
    backgroundColor: Colors.lightprimary,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 30,
    alignItems: "center",
    marginVertical: 10,
    borderRadius: 5,
  },
  headerbg: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timebg: {
    height: 30,
    width: 30,
  },
  up: {
    borderWidth: 1,
    borderRadius: 7,
    borderColor: Colors.litegray,
    height: 35,
    width: 35,
    justifyContent: "center",
    alignItems: "center",
  },

  name: { color: Colors.black, fontFamily: FONTS.LexendMedium, fontSize: 15 },
  button: {
    backgroundColor: Colors.primary,
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    marginVertical: 20,
  },
  startbuttonText: {
    color: Colors.white,
    fontFamily: FONTS.LexendRegular,
  },
  btncontainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
    alignSelf: "center",
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
    marginTop: RFValue(2),
    marginBottom: RFValue(10),
    backgroundColor: Colors.litegray2,
  },
  dropdownButtonTxtStyle: {
    flex: 1,
    fontSize: 14,
    // marginLeft: "3%",
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
    paddingVertical: 12,
  },
  dropdownItemTxtStyle: {
    fontSize: 14,
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
    marginRight: 10,
  },
  dropdownsearchstyle: {
    borderWidth: 1,
    borderColor: Colors.litegray,
    width: "95%",
    alignSelf: "center",
    marginVertical: 10,
    borderRadius: 10,
    height: 40,
  },
  day: {
    fontFamily: FONTS.LexendRegular,
    fontSize: RFValue(13),
    color: Colors.black,
    paddingVertical: 8,
  },

});
