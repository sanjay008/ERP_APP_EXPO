import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import BlueHeader from "../components/BlueHeader";
import { t } from "i18next";
import { RFValue } from "react-native-responsive-fontsize";
import { Colors } from "../constants/color";
import { FONTS } from "../constants/fontFamily";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";
import { DocumentPicker, types } from '@react-native-documents/picker';
import SelectDropdown from "react-native-select-dropdown";
import { getData } from "../utils/storeData";
import ApiService from "../utils/Apiservice";
import apiConstants from "../api/apiConstants";
import Input from "../components/input";
import { Images } from "../constants/images";
import Loader from "../components/loading";

const AddNweTask = ({ route, navigation }) => {
  const { color } = route.params;
  const [selectedrelaties, setSelectedRelaties] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedpriority, setSelectedPriority] = useState("");
  const [taskName, setTaskname] = useState(null);
  const [taskNameerror, setTasknameerror] = useState("");
  const [discription, setDiscription] = useState(null);
  const [discriptionerror, setDiscriptionerror] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  const [selectedFileType, setSelectedFileType] = useState("");
  const [retiesname, setRelatiesName] = useState([]);
  const [retiesnameerror, setRelatiesNameerror] = useState("");
  const [priority, setPriority] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loding, setLoding] = useState(false);

  useEffect(() => {
    fetchcustomer();
    fetchpriority();
  }, []);
  const validation = () => {
    if (!taskName) {
      setTasknameerror(t("Task name is required"));
    } else if (!discription) {
      setDiscriptionerror(t("Description is required"));
    } else if (!selectedrelaties) {
      setRelatiesNameerror(t("Relaties selection is required"));
    } else {
      Createtask();
    }
  };

  const Createtask = async () => {
    setLoding(true);
    try {
      const getdata = await getData("USERDATA");
      const dataaaaa = {
        relaties_id: getdata.data.relaties.id,
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
      };
      const data = await ApiService(apiConstants.store_normal_task, {
        includeToken: true,
        customData: {
          relaties_id: getdata.data.relaties.id,
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
      console.log("====", dataaaaa);
      console.log("====", data);

      if (data.status) {
        setLoding(false);
        navigation.goBack();
        console.log("Create task data ", data.message);
      } else {
        setLoding(false);
        console.log("Failed to fetch task list.");
      }
    } catch (err) {
      setLoding(false);
      console.log("Error fetching task list:", err);
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

      console.log("udhciu======", data);
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
      // types ko import karke use kar rahe hain
      type: [types.pdf, types.doc],
      allowMultiSelection: false, // agar single file chahiye
    });

    const file = res[0]; // pehli file
    setSelectedFile({
      uri: file.uri,
      name: file.name,
      type: file.mimeType, // yaha thoda change ho gaya hai, type ki jagah mimeType
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

  return (
    <>
      <BlueHeader title={t("Add Task")} bgcolor={color} />
      {loding && <Loader />}
      <ScrollView
        style={[styles.mcontainer, { paddingHorizontal: 15, marginTop: 15 }]}
      >
        {/* <Text style={[styles.title]}>{t("Add Task")}</Text> */}

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
          <Text style={{ color: Colors.red }}>*</Text>
        </Text>
        <SelectDropdown
          data={retiesname}
          onSelect={(selectedItem) => {
            setSelectedRelaties(selectedItem);
            setRelatiesNameerror("");
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

        {retiesnameerror && (
          <Text
            style={{
              color: Colors.red,
              fontSize: RFValue(10),
              fontFamily: FONTS.LexendRegular,
              marginTop: RFValue(1),
            }}
          >
            {" "}
            {retiesnameerror}{" "}
          </Text>
        )}
        <Input
          value={taskName}
          onChangeText={(txt) => {
            setTaskname(txt);
            setTasknameerror("");
          }}
          keyboardType="default"
          required={t("Task Name")}
          error={taskNameerror}
          backgroundColor={Colors.litegray2}
          // placeholder={"Enter Task Name"}
        />
        <Input
          value={discription}
          onChangeText={(txt) => {
            setDiscription(txt);
            setDiscriptionerror("");
          }}
          keyboardType="default"
          required={t("Omschrijving")}
          error={discriptionerror}
          backgroundColor={Colors.litegray2}
          multiline={true}
          // height={100}
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
              <View style={[styles.dropdownButtonStyle, { marginBottom: 10 }]}>
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

        <TouchableOpacity onPress={() => validation()} style={styles.button}>
          <Text style={styles.startbuttonText}>{t("Create Task")}</Text>
        </TouchableOpacity>
      </ScrollView>

    </>
  );
};

export default AddNweTask;

const styles = StyleSheet.create({
  title: {
    fontSize: RFValue(20),
    fontFamily: FONTS.LexendMedium,
    color: Colors.black,
    marginVertical: 10,
  },

  mcontainer: {
    // flex: 1,
    // position: "absolute",
    // borderRadius: 10,
    // backgroundColor: Colors.white,
    // width: "100%",
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
    paddingHorizontal: 20,
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
    // marginVertical: 10,
    borderRadius: 10,
    height: 40,
    // backgroundColor:'red'
  },
  day: {
    fontFamily: FONTS.LexendRegular,
    fontSize: RFValue(13),
    color: Colors.black,
    paddingVertical: 8,
  },
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
});
