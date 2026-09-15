import {
  Alert,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useContext, useEffect, useState } from "react";
import BlueHeader from "../components/BlueHeader";
import { RegisterBackContext } from "../constants/GoBackContext";
import { t } from "i18next";
import { RFValue } from "react-native-responsive-fontsize";
import { Colors } from "../constants/color";
import { FONTS } from "../constants/fontFamily";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";
import { DocumentPicker, pick, types } from '@react-native-documents/picker';
import SelectDropdown from "react-native-select-dropdown";
import { getData } from "../utils/storeData";
import { compressImages } from "../utils/imageCompressor";
import ApiService from "../utils/Apiservice";
import apiConstants from "../api/apiConstants";
import Input from "../components/input";
import { Images } from "../constants/images";
import Loader from "../components/loading";
import axios from "axios";
import moment from "moment";
import Modal from 'react-native-modal'

const newflow = false;

const CreateTicket = ({ route, navigation }) => {
  const { item, typeee } = route.params || {};
  const { setToast } = useContext(RegisterBackContext);

  const showToast = (text, type = "success") => {
    setToast({
      top: 45,
      text,
      type,
      visible: true,
    });
  };

  const getErrorMessage = (error) =>
    axios.isAxiosError(error)
      ? error?.response?.data?.message || error.message
      : error?.message || t("Something went wrong");

  const [selectedrelaties, setSelectedRelaties] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [selectedType, setSelectedType] = useState("");
  const [selectedpriority, setSelectedPriority] = useState("");
  const [taskName, setTaskname] = useState(item?.ticket_title);
  const [taskNameerror, setTasknameerror] = useState("");
  const [discription, setDiscription] = useState(item?.ticket_description);
  const [discriptionerror, setDiscriptionerror] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState(item?.ticket_documents ?? []);
  const [ProjectType, setProjectType] = useState([]);
  const [SelectProjectType, setSelectProjectType] = useState('');
  const [ProjectTypeError, setProjectTypeError] = useState('');
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedFileType, setSelectedFileType] = useState("");
  const [retiesname, setRelatiesName] = useState([
    {
      project_name: item?.project_name,
    },
  ]);
  const [membersname, setMembersName] = useState([]);
  const [retiesnameerror, setRelatiesNameerror] = useState("");
  const [membersnameerror, setMembersNameerror] = useState("");
  const [priority, setPriority] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loding, setLoding] = useState(false);

  useEffect(() => {
    FetchProject();
    if (item) {
      fetchcustomer(item.project_id);
    }
  }, []);

  const validation = () => {
    if (!taskName) {
      setTasknameerror(t("Ticket name is required"));
    } else if (!discription) {
      setDiscriptionerror(t("Description is required"));
    } else if (!selectedrelaties) {
      setRelatiesNameerror(t("Project Name is required"));
    } else if (!SelectProjectType) {
      setProjectTypeError(t("Project Type is required"))
    } else {
      CreateTicket();
    }
  };

  const filtered = (data) => {
    const list = Array.isArray(data) ? data : [];
    if (!search || search.trim() === "") {
      return list;
    }
    return list.filter((member) =>
      member?.display_name?.toLowerCase()?.includes(search.toLowerCase())
    );
  };

  const isMemberSelected = (memberId) =>
    selectedMembers.some((member) => String(member?.id) === String(memberId));

  const toggleMemberSelection = (member) => {
    if (newflow) {
      setSelectedMembers((prev) => {
        const exists = prev.some((item) => String(item?.id) === String(member?.id));
        if (exists) {
          return prev.filter((item) => String(item?.id) !== String(member?.id));
        }
        return [...prev, member];
      });
    } else {
      setSelectedMembers([member]);
      setOpen(false);
    }
    setMembersNameerror("");
  };

  const appendActionByIds = (formData) => {
    if (newflow) {
      selectedMembers.forEach((member) => {
        formData.append("action_by[]", member.id);
      });
    } else {
      formData.append("action_by", selectedMembers[0]?.id ?? "");
    }
  };

  const EditTickit = async () => {
    setLoding(true);
    try {
      const getdata = await getData("USERDATA");

      const formData = new FormData();
      formData.append("relaties_id", getdata.data.relaties.id);
      formData.append("user_id", getdata.data.user.id);
      formData.append("role", getdata.data.user.role);
      formData.append("ticket_id", item.id);
      formData.append("token", getdata.data.user.verify_token);

      if (selectedrelaties) {
        formData.append("project_name", selectedrelaties.project_name);
        formData.append("project_id", selectedrelaties.project_id);
      }

      appendActionByIds(formData);

      if (taskName) {
        formData.append("ticket_title", taskName);
      }

      if (discription) {
        formData.append("ticket_description", discription);
      }

      selectedFiles.forEach((file, index) => {
        formData.append("doc[]", {
          uri: file.uri,
          name: file.name,
          type: file.type,
        });
      });

      const response = await axios.post(apiConstants.ticket_update, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setLoding(false);
      if (response?.data?.status) {
        showToast(response?.data?.message || t("Ticket updated successfully"), "success");
        navigation.navigate("Ticket", item);
      } else {
        showToast(response?.data?.message || t("Something went wrong"), "error");
      }
    } catch (err) {
      setLoding(false);
      showToast(getErrorMessage(err), "error");
      console.log("Error updating ticket:", err);
    }
  };

  const CreateTicket = async () => {
    setLoding(true);
    try {
      const getdata = await getData("USERDATA");

      const formData = new FormData();
      formData.append("relaties_id", getdata.data.relaties.id);
      formData.append("user_id", getdata.data.user.id);
      formData.append("token", getdata.data.user.verify_token);
      formData.append("role", getdata.data.user.role);
      formData.append("project_name", selectedrelaties.project_name);
      formData.append("project_id", selectedrelaties.project_id);
      appendActionByIds(formData);
      formData.append("ticket_title", taskName);
      formData.append("ticket_description", discription);
      formData.append("type", SelectProjectType?.id || "");
      formData.append("date", moment().format("YYYY-MM-DD"));

      selectedFiles.forEach((file, index) => {
        formData.append("doc[]", {
          uri: file.uri,
          name: file.name,
          type: file.type,
        });
      });

      const response = await axios.post(apiConstants.ticket_create, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setLoding(false);
      if (response?.data?.status) {
        showToast(response?.data?.message || t("Ticket created successfully"), "success");
        navigation.goBack();
      } else {
        showToast(response?.data?.message || t("Something went wrong"), "error");
      }
    } catch (err) {
      setLoding(false);
      showToast(getErrorMessage(err), "error");
      console.log("Error creating ticket:", err);
    }
  };

  const fetchcustomer = async (id) => {
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
      const data = await ApiService(apiConstants.get_ticketprojects, {
        includeToken: true,
        customData: {
          relaties_id: getdata?.data.relaties.id,
          role: getdata?.data?.user?.role,
          user_id: getdata?.data?.user?.id,
          project_id: id,
        },
      });

      if (data.status) {
        const members = data?.data?.members || [];
        setMembersName(members);

        if (item?.action_by && selectedMembers.length === 0) {
          const actionByIds = Array.isArray(item.action_by)
            ? item.action_by
            : String(item.action_by).split(",").map((id) => id.trim());

          const preselected = members.filter((member) =>
            actionByIds.some((id) => String(id) === String(member.id))
          );
          if (preselected.length > 0) {
            setSelectedMembers(newflow ? preselected : [preselected[0]]);
          }
        }
      } else {
        console.log("False connections");
      }
    } catch (err) {
      console.log("Error fetching connections:", err);
    }
  };

  const FetchProject = async () => {
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
      const data = await ApiService(apiConstants.getprojectsDetails, {
        includeToken: true,
        customData: {
          relaties_id: getdata?.data?.relaties?.id,
          role: getdata?.data?.user?.role,
          user_id: getdata?.data?.user?.id,
        },
      });

      if (data?.status) {
        setProjectType(data?.logboek_type || []);
        setRelatiesName(data?.data);
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
    navigation.navigate("CustomCamera", {
      quality: 0.4,
      setData: (newPhotos) => {
        setSelectedFiles(prev => [...prev, ...newPhotos]);
      },
    });
  };

  const getDropboxDirectLink = (url) => {
    if (!url) return "";
    try {
      if (url.includes("dropboxusercontent.com")) return url;
      if (url.includes("db.tt")) return url.replace("db.tt", "dl.dropboxusercontent.com");
      if (url.includes("dropbox.com")) {
        let cleaned = url
          .replace("www.dropbox.com", "dl.dropboxusercontent.com")
          .replace("dropbox.com", "dl.dropboxusercontent.com")
          .replace(/[?&](dl|raw)=[^&]*/g, "");
        cleaned += cleaned.includes("?") ? "&dl=1" : "?dl=1";
        return cleaned;
      }
      return url;
    } catch {
      return "";
    }
  };

  const openGallery = () => {
    const options = {
      mediaType: "photo",
      quality: 0.2,
      maxWidth: 1024,
      maxHeight: 1024,
      selectionLimit: 0,
    };
    launchImageLibrary(options, async (response) => {
      if (!response.didCancel && !response.errorCode) {
        const images = response.assets.map((image) => ({
          uri: image.uri,
          name: image.fileName || "gallery.jpg",
          type: image.type || "image/jpeg",
        }));
        const compressed = await compressImages(images);
        setSelectedFiles((prev) => [...prev, ...compressed]);
      }
    });
  };

  const openDocument = async () => {
    try {
      const results = await pick({
        mode: 'open',
        allowMultiSelection: true,
        types: [types.allFiles],
      });

      const formattedFiles = results.map(file => ({
        uri: file.uri,
        name: `${Date.now()}_${file.name}`,
        type: file.type ?? file.nativeType ?? 'unknown',
        size: file.size ?? 0,
        id: `${file.name}_${Date.now()}`,
      }));

      const compressedFiles = await compressImages(formattedFiles);

      setSelectedFiles(prev => [...prev, ...compressedFiles]);
    } catch (err) {
      if (err?.name === 'DocumentPickerCancel') {
        console.log("User cancelled document picker");
      } else {
        console.error("Document picker error: ", err);
      }
    }
  };

  return (
    <>
      <BlueHeader
        title={item?.typeee == "edit" ? t("Edit Ticket") : t("Add Ticket")}
        bgcolor={item ? item.color_code : "#eba14d"}
      />
      {loding && <Loader />}
      <ScrollView
        style={[styles.mcontainer, { paddingHorizontal: 15, marginTop: 15 }]}
      >
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
          {t("Project Name")}
          {retiesname?.project_name}
          <Text style={{ color: Colors.red }}>*</Text>
        </Text>

        <SelectDropdown
          data={retiesname}
          onSelect={(selectedItem) => {
            setSelectedRelaties(selectedItem);
            setRelatiesNameerror("");
            setSelectedMembers([]);
            fetchcustomer(selectedItem?.project_id);
          }}
          renderButton={(itemm) => {
            return (
              <View style={[styles.dropdownButtonStyle]}>
                <Text style={[styles.dropdownButtonTxtStyle]}>
                  {itemm?.project_name
                    ? itemm.project_name
                    : retiesname?.project_name
                      ? retiesname?.project_name
                      : item?.project_name}
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
          renderItem={(itemm, index, isSelected) => {
            return (
              <View
                style={[
                  styles.dropdownItemStyle,
                  isSelected && { backgroundColor: Colors.white },
                ]}
              >
                <Text style={styles.dropdownItemTxtStyle}>
                  {itemm?.project_name || "-"}
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
            {retiesnameerror}
          </Text>
        )}

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
          {t("Project Type")}
          <Text style={{ color: Colors.red }}>*</Text>
        </Text>

        <SelectDropdown
          data={ProjectType}
          onSelect={(selectedItem) => {
            setSelectProjectType(selectedItem);
            setProjectTypeError("");
          }}
          renderButton={(itemm) => {
            return (
              <View style={[styles.dropdownButtonStyle]}>
                <Text style={[styles.dropdownButtonTxtStyle,]}>
                  {SelectProjectType ? SelectProjectType?.type_name : item.type}
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
          renderItem={(itemm, index, isSelected) => {
            return (
              <View
                style={[
                  styles.dropdownItemStyle,
                  isSelected && { backgroundColor: Colors.white },
                ]}
              >
                <Text style={styles.dropdownItemTxtStyle}>
                  {itemm?.type_name|| ""}
                </Text>
              </View>
            );
          }}
          showsVerticalScrollIndicator={false}
          dropdownStyle={styles.dropdownMenuStyle}
          search
          searchPlaceHolder={t("Search")}
          searchInputTxtStyle={{
            color: Colors.black,
            fontFamily: FONTS.LexendMedium,
          }}
        />

        {ProjectTypeError && (
          <Text
            style={{
              color: Colors.red,
              fontSize: RFValue(10),
              fontFamily: FONTS.LexendRegular,
              marginTop: RFValue(1),
            }}
          >
            {ProjectTypeError}
          </Text>
        )}

        <Input
          value={taskName}
          onChangeText={(txt) => {
            setTaskname(txt);
            setTasknameerror("");
          }}
          keyboardType="default"
          required={t("Title")}
          error={taskNameerror}
          backgroundColor={Colors.litegray2}
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
        />

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
          {t("Action By")}
        </Text>

        <TouchableOpacity
          onPress={() => setOpen(true)}
          style={[styles.dropdownButtonStyle]}
        >
          <Text style={[styles.dropdownButtonTxtStyle]} numberOfLines={2}>
            {selectedMembers.length > 0
              ? selectedMembers.map((member) => member?.display_name).join(", ")
              : ""}
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

        <Modal
          isVisible={open}
          style={{ margin: 0 }}
          onBackdropPress={() => setOpen(false)}
          onBackButtonPress={() => setOpen(false)}
          animationIn={"bounceInUp"}
          animationOut={"bounceOutDown"}
        >
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              padding: 20,
            }}
          >
            <View
              style={{
                backgroundColor: Colors.white,
                borderRadius: 10,
                padding: 15,
                minHeight: 200,
                maxHeight: "70%",
              }}
            >
              <TextInput
                placeholder="Search..."
                value={search}
                onChangeText={setSearch}
                style={{
                  borderWidth: 1,
                  borderRadius: 6,
                  marginBottom: 10,
                  padding: 8,
                  borderColor: Colors.Boxgray,
                  fontFamily: FONTS.LexendMedium,
                }}
              />

              <FlatList
                data={filtered(membersname)}
                keyExtractor={(member) => String(member.id)}
                ListEmptyComponent={() => (
                  <View style={styles.flex}>
                    <Text style={styles.dropdownItemTxtStyle}>
                      {selectedrelaties ? t("No Data Found") : t("select project")}
                    </Text>
                  </View>
                )}
                renderItem={({ item: member }) => {
                  const isSelected = isMemberSelected(member?.id);
                  return (
                    <TouchableOpacity
                      onPress={() => toggleMemberSelection(member)}
                      style={[
                        styles.dropdownItemStyle,
                        isSelected && { backgroundColor: Colors.lightprimary },
                      ]}
                    >
                      <Text style={styles.dropdownItemTxtStyle}>
                        {member?.display_name || "-"}
                      </Text>
                      {newflow && isSelected ? (
                        <Text style={[styles.dropdownItemTxtStyle, { color: Colors.primary }]}>
                          ✓
                        </Text>
                      ) : null}
                    </TouchableOpacity>
                  );
                }}
              />

              {newflow ? (
                <TouchableOpacity
                  onPress={() => setOpen(false)}
                  style={[styles.button, { marginTop: 10, marginBottom: 0 }]}
                >
                  <Text style={styles.startbuttonText}>{t("Done")}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </Modal>

        <Text
          style={{
            fontSize: RFValue(13),
            fontFamily: FONTS.LexendMedium,
            color: Colors.black,
            marginTop: 10,
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
          <Text style={styles.dropdownButtonTxtStyle}></Text>
          <Image
            source={Images.gallery}
            style={{ height: 20, width: 20, tintColor: Colors.primary }}
          />
        </TouchableOpacity>

        {selectedFiles?.length > 0 && (
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {selectedFiles?.map((file, index) => (
              <View
                key={index}
                style={{
                  width: "33%",
                  alignItems: "center",
                  marginVertical: 10,
                }}
              >
                {(() => {
                  const type = file?.type?.toLowerCase() || "";
                  const ext = file?.file_extension?.toLowerCase() || "";

                  const isImage =
                    type.includes("image") || ext.includes("image") ||
                    ext === "jpg" || ext === "jpeg" || ext === "png" || ext === "webp";

                  const isPdf =
                    type.includes("pdf") || ext.includes("pdf") || ext === "pdf";

                  if (isImage) {
                    return (
                      <Image
                        source={{
                          uri: file?.uri || getDropboxDirectLink(file?.shared_link),
                        }}
                        style={{ width: 80, height: 80, borderRadius: 8 }}
                      />
                    );
                  }

                  return (
                    <Image
                      source={isPdf ? Images.pdflogo : Images.documentlogo}
                      style={{ width: 60, height: 60 }}
                    />
                  );
                })()}

                <Text
                  numberOfLines={1}
                  style={{ fontSize: 12, marginTop: 5, textAlign: "center" }}
                >
                  {file?.name || file?.original_uploaded_filename}
                </Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          onPress={() => {
            if (item?.typeee == "edit") {
              EditTickit();
            } else {
              validation();
            }
          }}
          style={styles.button}
        >
          <Text style={styles.startbuttonText}>
            {item?.typeee == "edit" ? t("Update Ticket") : t("Create Ticket")}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </>
  );
};

export default CreateTicket;

const styles = StyleSheet.create({
  title: {
    fontSize: RFValue(20),
    fontFamily: FONTS.LexendMedium,
    color: Colors.black,
    marginVertical: 10,
  },
  mcontainer: {},
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
    alignSelf: "flex-start",
    fontFamily: FONTS.LexendRegular,
    marginTop: 15,
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
    left: 20,
  },
  statusbox: {
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
    fontFamily: FONTS.LexendMedium,
    fontSize: 24,
    paddingVertical: 10,
    color: Colors.black,
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
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
  },
  dropdownMenuStyle: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
    paddingVertical: 5,
  },
  flex: {
    flex: 1,
    paddingTop: 15,
    justifyContent: 'center',
    alignItems: 'center',
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
    borderRadius: 10,
  },
  day: {
    fontFamily: FONTS.LexendRegular,
    fontSize: RFValue(13),
    color: Colors.black,
    paddingVertical: 8,
  },
  filePreview: { marginVertical: 10, marginHorizontal: 10 },
  imagePreview: { width: 100, height: 100, borderRadius: 10 },
  fileIcon: { width: 50, height: 50 },
  fileText: { fontSize: 14, color: "black", marginTop: 5 },
  openGalleryText: {
    color: "blue",
    textDecorationLine: "underline",
    marginTop: 5,
  },
});