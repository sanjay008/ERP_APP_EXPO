// import {
//   Alert,
//   Dimensions,
//   FlatList,
//   Image,
//   Platform,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import React, { useCallback, useEffect, useState } from "react";
// import { launchCamera, launchImageLibrary } from "react-native-image-picker";
// import { FONTS } from "../constants/fontFamily";
// import { Colors } from "../constants/color";
// import { DocumentPicker, pick, types } from '@react-native-documents/picker';
// import { heightPercentageToDP } from "react-native-responsive-screen";
// import BlueHeader from "../components/BlueHeader";
// import { t } from "i18next";
// import ButtonComponent from "../components/buttonComponent";
// import { RFPercentage, RFValue } from "react-native-responsive-fontsize";
// import { Images } from "../constants/images";
// import Modal from "react-native-modal";
// import { getData } from "../utils/storeData";
// import ApiService from "../utils/Apiservice";
// import apiConstants from "../api/apiConstants";
// import { useFocusEffect, useIsFocused } from "@react-navigation/native";
// import WebView from "react-native-webview";
// import axios from "axios";
// import Loader from "../components/loading";
// import FallbackImage from "../components/FallbackImage";
// const SCREEN_WIDTH = Dimensions.get("window").width;
// const ITEM_WIDTH = SCREEN_WIDTH / 3 - 15; // 3 columns spacing adjust
// const TicketDetails = ({ route, navigation }) => {
//   const { item } = route.params || {};
//   const mainItem = item;
//   console.log("item", item);
//   const [Loading, setDocumentLoading] = useState(false);
//   const Focused = useIsFocused();
//   const [MainItem, setMainItem] = useState(item);
//   const [loading, setLoading] = useState(false);
//   const [commentmodalVisible, setCommentModalVisible] = useState(false);
//   const [comment, setComment] = useState("");
//   const [commenterror, setCommenterror] = useState("");
//   const [notedata, setNoteData] = useState([]);
//   const [CompateTEXT, setComplateTEXT] = useState("");
//   const [selectstuts, setselectstuts] = useState("");
//   const [statusData, setstatusData] = useState([]);
//   const [documents, setDocuments] = useState(data);
//   const [selectedDoc, setSelectedDoc] = useState(null);
//   const [AllPermission, setPermissions] = useState(null);
//   const [showConfirm, setShowConfirm] = useState(false);
//   const [selectedFile, setSelectedFile] = useState(null);
//   const [ImageLoad, setImageLoad] = useState(false);

//   const [AllDocument, setAllDocument] = useState([]);
//   const [NewDocument, setNewDocument] = useState([]);

//   useEffect(() => {
//     const fetchPermission = async () => {
//       try {
//         const getdata = await getData("USERDATA");
//         console.log("Permi userdata", getdata);

//         if (
//           !getdata ||
//           !getdata.data ||
//           !getdata.data.user ||
//           !getdata.data.relaties
//         ) {
//           console.log("Missing required user data:", getdata);
//           return;
//         }

//         const response = await ApiService(apiConstants.permission, {
//           includeToken: true,
//           customData: {
//             relaties_id: getdata.data.relaties.id,
//             user_id: getdata.data.user.id,
//             role: getdata.data.user.role,
//           },
//         });

//         // ✅ Check response.status === 200 or expected code
//         if (response?.data) {
//           setPermissions(response.data);
//           console.log("response.data Permission ==>", response.data);
//         } else {
//           console.log("Unexpected response format or error:", response);
//         }
//       } catch (error) {
//         console.log("Error fetching permission:", error);
//       }
//     };
// if(AllPermission == null){
//   fetchPermission();
// }
//   }, []);
//   const fetchTasklist = async () => {
//     try {
//       const getdata = await getData("USERDATA");
//       const data = await ApiService(apiConstants.get_ticketnotes, {
//         includeToken: true,
//         customData: {
//           relaties_id: getdata.data.relaties.id,
//           user_id: getdata.data.user.id,
//           role: getdata.data.user.role,
//           ticket_id: MainItem.id,
//         },
//       });

//       fetchTasklistData();
//       if (data.status) {
//         setNoteData(data.data);
//       } else {
//         console.log("Failed to fetch connections.");
//       }
//     } catch (err) {
//       console.log("Error fetching connections:", err);
//     }
//   };
//   const fetchTasklistData = async () => {

//     try {
//       const getdata = await getData("USERDATA");

//       const data = await ApiService(apiConstants.get_tickets, {
//         includeToken: true,

//         customData: {
//           relaties_id: getdata.data.relaties.id,

//           user_id: getdata.data.user.id,

//           role: getdata.data.user.role,
//         },
//       });

//       console.log("customData-0-0---00", data.data);

//       if (data.status) {
//         let current = data?.data?.find((el) => el?.id == item?.id);

//         console.log("current", current);

//         setMainItem(current);

//         setAllDocument(current?.ticket_documents || []);
//       } else {
//         console.log("Failed to fetch connections.");
//       }
//     } catch (err) {
//       console.log("Error fetching connections:", err);
//     }

//   };

//   useEffect(() => {
//     get_ticketstatus();

//     setAllDocument(MainItem?.ticket_documents || []);
//   }, [MainItem]);

//   useFocusEffect(
//     useCallback(() => {
//       fetchTasklist();
//       get_ticketstatus();
//       // get_ticketdocuments();
//     }, [])
//   );
//   // const get_ticketdocuments = async () => {
//   //   try {
//   //     const getdata = await getData("USERDATA");
//   //     const data = await ApiService(apiConstants.get_ticketdocuments, {
//   //       includeToken: true,
//   //       customData: {
//   //         relaties_id: getdata.data.relaties.id,
//   //         role: getdata.data.user.role,
//   //         user_id: getdata.data.user.id,
//   //         ticket_id: item.id,
//   //       },
//   //     });
//   //     console.log(data.data, "suv====ueuyeteyetye======");
//   //     if (data.status) {
//   //       setDocuments(data.data);
//   //     } else {
//   //       console.log("False connections");
//   //     }
//   //   } catch (err) {
//   //     console.log("Error fetching connections:", err);
//   //   }
//   // };
//   const getDropboxDirectLink = (url) => {
//     if (!url) return "";
//     let directUrl = url.replace("www.dropbox.com", "dl.dropboxusercontent.com");
//     directUrl = directUrl.replace("?dl=0", "").replace("?dl=1", "");
//     return directUrl;
//   };

//   const get_ticketstatus = async () => {
//     // setDocuments(item.ticket_documents)
//     // setNoteData(item.ticket_documents)
//     try {
//       const getdata = await getData("USERDATA");
//       const data = await ApiService(apiConstants.getstatus, {
//         includeToken: true,
//         customData: {
//           slug: "ticket",
//           relaties_id: getdata.data.relaties.id,
//           role: getdata.data.user.role,
//           user_id: getdata.data.user.id,
//         },
//       });
//       if (data.status) {
//         setstatusData(data.data);
//         // console.log(data.data, "suv==========");
//       } else {
//         console.log("False connections");
//       }
//     } catch (err) {
//       console.log("Error fetching connections:", err);
//     }
//   };
//   const removeHtmlTags = (htmlString) => {
//     return htmlString.replace(/<[^>]*>/g, "");
//   };
//   //
//   const RenderItemCommets = ({ item, index }) => {
//     return (
//       <View
//         style={[
//           {
//             flexDirection: "row",
//             backgroundColor: Colors.white,
//             padding: 10,
//             borderRadius: 10,
//           },
//           {
//             backgroundColor:
//               item?.ticket_status == 153
//                 ? Colors.hold
//                 : item?.ticket_status == 154
//                   ? Colors.closed
//                   : Colors.normal,
//           },
//         ]}
//         key={`${item?.id * index}`}
//       >
//         <View>
//           <FallbackImage
//             source={
//               item?.user?.profile_image
//                 ? { uri: item.user.profile_image }
//                 : Images.userblanck
//             }
//             fallback={Images.userblanck}
//             style={styles.commentimage}
//           />
//         </View>
//         <View style={{ position: 'absolute', right: 8, top: 8 }}>
//           <Image
//             source={item?.ticket_status == 153 ? Images.pause : item?.ticket_status == 154 ? Images.check : null}
//             style={styles.commentimage1}
//           />
//         </View>
//         <View style={{ paddingLeft: 10, marginRight: 5, flex: 1 }}>
//           <View>
//             <Text style={[styles.sub1]}>
//               {item?.user?.username} {item?.ticket_status}
//             </Text>
//           </View>
//           <Text style={[styles.sub1, { color: Colors.textgray, fontSize: 13 }]}>
//             {item.created_at}
//           </Text>
//           <Text style={[styles.sub1, { textAlign: "left" }]}>
//             {removeHtmlTags(item.comment)}
//           </Text>
//         </View>
//       </View>
//     );
//   };
//   const changestuts = async (itemmmm) => {
//     try {
//       const getdata = await getData("USERDATA");
//       console.log("getdataaaa:", getdata);

//       const dataaa = {
//         relaties_id: getdata.data.relaties.id,
//         user_id: getdata.data.user.id,
//         role: getdata.data.user.role,
//         ticket_id: MainItem.id,
//         status: itemmmm,
//         created_at: new Date().toISOString(),
//       };
//       console.log("dataadataaadataaaa:", dataaa);

//       const data = await ApiService(apiConstants.ticket_update, {
//         includeToken: true,
//         customData: dataaa,
//       });
//       // console.log("===dataaadataaa=edddiiittttt===", data);

//       if (data.status) {
//         fetchTasklistData();

//         // navigation.goBack();
//         // setLoding(false);
//         // navigation.navigate("Ticket", item);
//         // console.log("Create task data ", data);
//         // MainItem.fun()
//       } else {
//         // setLoding(false);
//         // console.log("Failed to fetch task list.");
//       }
//     } catch (err) {
//       // setLoding(false);
//       console.log("Error fetching task list:", err);
//     }
//   };

//   const EditTickit = async () => {
//     setDocumentLoading(true);

//     try {
//       const getdata = await getData("USERDATA");

//       if (!getdata?.data?.user || !getdata?.data?.relaties) {
//         throw new Error("Invalid user data");
//       }

//       const formData = new FormData();

//       formData.append("relaties_id", getdata.data.relaties.id);
//       formData.append("user_id", getdata.data.user.id);
//       formData.append("role", getdata.data.user.role);
//       formData.append("ticket_id", MainItem.id);
//       formData.append("token", getdata.data.user.verify_token);

//       NewDocument.forEach((item, index) => {
//         // item = uri string or object
//         const uri = typeof item === "string" ? item : item?.uri;
//         if (!uri) return;

//         // Safe file name
//         let name =
//           item.name ||
//           `upload_${Date.now()}_${index}.${uri.includes(".") ? uri.split(".").pop() : "jpg"}`;

//         // Safe type
//         let type =
//           item.type ||
//           item.mimeType ||
//           (name.endsWith(".pdf")
//             ? "application/pdf"
//             : name.endsWith(".doc") || name.endsWith(".docx")
//               ? "application/msword"
//               : name.endsWith(".png")
//                 ? "image/png"
//                 : "image/jpeg");

//         formData.append("doc[]", {
//           uri,
//           name,
//           type,
//         });
//       });

//       console.log("⬆️ FORM DATA READY:", formData);

//       const response = await axios.post(apiConstants.ticket_update, formData, {
//         headers: {
//           "Content-Type": "multipart/form-data",
//           Accept: "application/json",
//         },
//       });

//       console.log("🔰 Edit Ticket Response:", response.data);

//       if (response.data.status) {
//         setNewDocument([]);
//         await fetchTasklistData();

//         console.log("🎉 Ticket Updated Successfully");
//       }
//     } catch (err) {
//       console.log("❌ Error updating ticket:", err);
//     } finally {
//       setDocumentLoading(false);
//     }
//   };


//   // Dummy item data
//   // const item = {
//   //   id: 1,
//   //   date: null,
//   //   project_name: "Nike",
//   //   project_id: null,
//   //   ticket_title: "Test",
//   //   ticket_description: "Teat",
//   //   image_doc: null,
//   //   pdf_doc: null,
//   //   action_by: "Nike",
//   //   close_date: null,
//   //   status: null,
//   //   created_at: "2025-08-28T11:05:13.000000Z",
//   //   updated_at: "2025-08-28T11:05:13.000000Z",
//   // };
//   const Addcommentapi = async (itemmm) => {
//     try {
//       const getdata = await getData("USERDATA");

//       const data = await ApiService(apiConstants.add_ticketnote, {
//         includeToken: true,

//         customData: {
//           relaties_id: getdata.data.relaties.id,

//           user_id: getdata.data.user.id,

//           role: getdata.data.user.role,

//           ticket_id: item.id,

//           note: `<p>${comment}</p>`,

//           comment_type: "Ticket_note",

//           ticket_status: itemmm,
//         },
//       });

//       if (data) {
//         // console.log("=-=-", data);

//         setCommentModalVisible(false);

//         fetchTasklist();

//         setComment("");

//         if (itemmm) {
//           changestuts(itemmm);
//         }
//       }
//     } catch (err) {
//       console.log("Error fetching connections:98", err);
//     }
//   };
//   const translateDayToDutch = (log = "") => {
//     const dayMap = {
//       Monday: "Maandag",
//       Tuesday: "Dinsdag",
//       Wednesday: "Woensdag",
//       Thursday: "Donderdag",
//       Friday: "Vrijdag",
//       Saturday: "Zaterdag",
//       Sunday: "Zondag",
//     };

//     let translatedLog = log;

//     Object.keys(dayMap).forEach((day) => {
//       if (log.includes(day)) {
//         translatedLog = log.replace(day, dayMap[day]);
//       }
//     });

//     return translatedLog;
//   };

//   const baseData = [
//     {
//       id: 1,
//       name: t("Project"),
//       subject: item?.project_data?.project_name || item?.project_name || "_ _",
//     },
//     {
//       id: 2,
//       name: t("Description"),
//       subject: item?.ticket_description || "_ _",
//     },
//     {
//       id: 3,
//       name: t("type"),
//       subject: item?.type,
//     },
//   ];

//   const dataaaaaaaa = MainItem?.inprogress_log
//     ? [
//       ...baseData,
//       {
//         id: 4,
//         name: t("Date"),
//         subject: translateDayToDutch(MainItem?.inprogress_log),
//         // subject: `${MainItem?.inprogress_log || ""}`,
//       },
//     ]
//     : baseData;
//   const RenderItem = ({ item, index }) => {
//     // console.log("ItemsData=>", item);

//     return (
//       <View style={styles.detailsmainview}>
//         <Text
//           style={[
//             styles.sub,
//             {
//               color: Colors.textgray,
//               textTransform: "capitalize",
//               width: "35%",
//               // flex:0.5,
//               fontSize: 13,
//             },
//           ]}
//         >
//           {item?.name}
//         </Text>
//         <View style={[styles.detailssubject, { }]}>
//           <Text
//             style={[
//               styles.sub,
//               {
//                 width: "95%",
//                 // flex:0.7,
//                 // backgroundColor:'red',
//                 textAlign:
//                   (item?.name == "Description" && item?.subject?.length)
//                     ? "left"
//                     : "right",
//               },
//             ]}
//           >
//             {item?.name == "Description"
//               ? removeHtmlTags(item?.subject)
//               : item?.subject}
//           </Text>
//         </View>
//         {item?.Approved}
//       </View>
//     );
//   };
//   const onEdit = () => {
//     navigation.navigate("CreateTicket", {
//       item: { ...item, typeee: "edit" }, // new key add
//     });
//   };
//   const data = [
//     {
//       id: "1",
//       src: "https://images.unsplash.com/photo-1521791055366-0d553872125f?q=80&w=1169&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
//     },
//     {
//       id: "2",
//       src: "https://plus.unsplash.com/premium_photo-1661313763836-096eb2bd7393?w=2400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
//     },
//     {
//       id: "3",
//       src: "https://images.unsplash.com/photo-1756321444243-de805b2ee484?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
//     },
//     { id: "4", src: "https://i.gzn.jp/img/2021/01/23/pdf-history/00.png" },
//     {
//       id: "5",
//       src: "https://images.unsplash.com/photo-1521791055366-0d553872125f?q=80&w=1169&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
//     },
//     {
//       id: "6",
//       src: "https://plus.unsplash.com/premium_photo-1661313763836-096eb2bd7393?w=2400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
//     },
//   ];

//   const getFileIcon = (ext) => {
//     switch (ext?.toLowerCase()) {
//       case "pdf":
//         return "https://cdn-icons-png.flaticon.com/512/337/337946.png"; // pdf icon
//       case "jpg":
//       case "jpeg":
//       case "png":
//         return "https://cdn-icons-png.flaticon.com/512/136/136524.png"; // image icon
//       case "doc":
//       case "docx":
//         return "https://cdn-icons-png.flaticon.com/512/281/281760.png"; // word icon
//       case "xls":
//       case "xlsx":
//         return "https://cdn-icons-png.flaticon.com/512/281/281759.png"; // excel icon
//       default:
//         return "https://cdn-icons-png.flaticon.com/512/109/109612.png"; // generic file
//     }
//   };

//   <Image
//     source={{ uri: getFileIcon(item.file_extension) }}
//     style={{ width: 50, height: 50 }}
//   />;
//   const handleDeleteFile = async () => {
//     if (!selectedFile) return;
//     console.log("selectedFile:", selectedFile);

//     try {
//       const getdata = await getData("USERDATA");
//       const dataaaa = await ApiService(apiConstants.deleteTicketDocument, {
//         includeToken: true,
//         customData: {
//           relaties_id: getdata.data.relaties.id,
//           role: getdata.data.user.role,
//           user_id: getdata.data.user.id,
//           ticket_id: item.id,
//           id: selectedFile.id,
//         },
//       });
//       console.log(dataaaa, "suv==========");

//       if (dataaaa.status) {
//         item.ticket_documents = item.ticket_documents.filter(
//           (item) => item.id !== selectedFile.id
//         );
//         setShowConfirm(false);
//         setSelectedFile(null);
//         fetchTasklistData();
//       } else {
//         console.log("False connections");
//       }
//     } catch (err) {
//       console.log("Error fetching connections:", err);
//     }
//     // try {
//     //   // 👇 તમારી API call
//     //   await axios.delete(`https://api.example.com/files/${selectedFile.id}`);

//     //   // success પછી list refresh/update
//     //   setData(prev => prev.filter(f => f.id !== selectedFile.id));

//     // } catch (error) {
//     //   console.log("Delete error:", error);
//     // } finally {
//     //   setShowConfirm(false);
//     //   setSelectedFile(null);
//     // }
//   };

//   useEffect(() => {
//     if (NewDocument?.length > 0 && Focused) {
//       console.log("newDocument", NewDocument);
//       EditTickit();
//     }
//   }, [NewDocument]);

//   const getDirectDropboxLink = (sharedLink) => {
//     if (!sharedLink) return "";

//     try {
//       if (sharedLink.includes("dropboxusercontent.com")) {
//         return sharedLink;
//       }

//       if (sharedLink.includes("db.tt")) {
//         return sharedLink.replace("db.tt", "dl.dropboxusercontent.com");
//       }

//       if (sharedLink.includes("dropbox.com")) {
//         let cleaned = sharedLink;

//         cleaned = cleaned.replace(
//           "www.dropbox.com",
//           "dl.dropboxusercontent.com"
//         );

//         cleaned = cleaned.replace("dropbox.com", "dl.dropboxusercontent.com");

//         cleaned = cleaned.replace(/[?&](dl|raw)=[^&]*/g, "");

//         if (cleaned.includes("?")) {
//           cleaned += "&dl=1";
//         } else {
//           cleaned += "?dl=1";
//         }

//         return cleaned;
//       }

//       return sharedLink;
//     } catch (error) {
//       console.log("Invalid Dropbox link:", error);

//       return "";
//     }
//   };

//   const renderItem = ({ item }) => {


//     return (
//       <TouchableOpacity
//         style={{
//           // flex: 1,
//           width: SCREEN_WIDTH * 0.28,
//           height: SCREEN_WIDTH * 0.28,
//           marginBottom: 10,
//           zIndex: 999,

//         }}
//         onPress={() => setSelectedDoc(getDropboxDirectLink(item?.shared_link))}
//       >
//         <Image
//           defaultSource={Images.document}
//           source={
//             item?.file_extension?.includes("pdf")
//               ? Images.pdflogo
//               : { uri: getDropboxDirectLink(item.shared_link) }
//           }
//           style={{
//             height: "100%",
//             width: "100%",
//             resizeMode: "cover",
//             borderRadius: 10,
//             borderWidth: 1,
//             borderColor: Colors.textgray,
//           }}
//         />


//         {String(AllPermission?.project_tickets_view?.update) === "1" && (
//           <TouchableOpacity
//             onPress={() => {
//               setSelectedFile(item);
//               setShowConfirm(true);
//             }}
//             style={{
//               backgroundColor: Colors.red,
//               position: "absolute",
//               top: 5,
//               right: 5,
//               borderRadius: 50,
//               padding: 2,
//               zIndex: 10,
//             }}
//           >
//             <Image
//               source={Images.close}
//               style={{
//                 height: 15,
//                 width: 15,
//                 borderRadius: 5,
//                 tintColor: Colors.white,
//               }}
//             />
//           </TouchableOpacity>

//         )}

//         {/* <Text
//           numberOfLines={1}
//           style={{ paddingHorizontal: 5, color: Colors.black, marginTop: 5 }}
//         >
//           {item.original_uploaded_filename}
//         </Text> */}
//       </TouchableOpacity>
//     );
//   };


//   const handleFileSelection = async () => {
//     Alert.alert(
//       "Select Option",
//       "Choose an option",
//       [
//         { text: "Camera", onPress: openCamera },
//         { text: "Gallery", onPress: openGallery },
//         { text: "Files (PDF/DOC)", onPress: openDocument },
//         { text: "Cancel", style: "cancel" },
//       ],
//       { cancelable: true }
//     );
//   };


//   const openCamera = () => {
//     navigation.navigate("CustomCamera", {
//       setData: (newPhotos) => {
//         console.log("newPhotos Data", newPhotos);

//         setNewDocument(prev => [...prev, ...newPhotos]);
//       }
//     });
//   };
//   const openGallery = () => {
//     const options = { mediaType: "photo", quality: 1, selectionLimit: 0 };
//     launchImageLibrary(options, (response) => {
//       if (!response.didCancel && !response.errorCode) {
//         const formatted = response.assets.map(image => ({
//           uri: image.uri,
//           name: `gallery_${Date.now()}.jpg`,
//           type: image.type || "image/jpeg",
//         }));
//         setNewDocument(prev => [...prev, ...formatted]);
//       }
//     });
//   };
//   const openDocument = async () => {
//     try {
//       // Latest API: pick() function
//       const results = await pick({
//         mode: 'open',
//         allowMultiSelection: true,
//         types: [types.allFiles],
//       });

//       // Format results with unique names/IDs
//       const formatted = results.map(file => ({
//         uri: file.uri,
//         name: `document_${file.name}_${Date.now()}`,   // unique name with timestamp
//         type: file.mimeType ?? file.nativeType ?? 'application/octet-stream', // safe fallback
//         size: file.size ?? 0,                          // optional, fallback 0
//         id: `${file.name}_${Date.now()}`,             // unique ID for FlatList keyExtractor
//       }));

//       // Add to state
//       setNewDocument(prev => [...prev, ...formatted]);

//     } catch (err) {
//       // Cancel or error handling
//       if (err?.name === 'DocumentPickerCancel') {
//         console.log("User cancelled document picker");
//       } else {
//         console.error("Document Picker Error:", err);
//       }
//     }
//   };


//   return (
//     <View style={{ flex: 1 }}>
//       {/* <StatusBar backgroundColor={item.colo} barStyle={"light-content"} /> */}
//       <View>
//         <Modal
//           visible={!!selectedDoc}
//           onRequestClose={() => setSelectedDoc(null)}
//           transparent={false}
//           style={{ margin: 0 }}
//         >
//           <View style={{ flex: 1, backgroundColor: Colors.white }}>
//             {/* Close Button */}
//             <TouchableOpacity
//               style={{
//                 position: "absolute",
//                 top: 40,
//                 right: 20,
//                 zIndex: 10,
//                 backgroundColor: Colors.red,
//                 padding: 8,
//                 borderRadius: 20,
//               }}
//               onPress={() => setSelectedDoc(null)}
//             >
//               <Image
//                 source={Images.close}
//                 style={{ height: 20, width: 20, tintColor: Colors.white }}
//               />
//             </TouchableOpacity>

//             {/* WebView */}
//             <WebView source={{ uri: selectedDoc }} style={{ flex: 1 }} />
//           </View>
//         </Modal>
//       </View>
//       <View>
//         <Modal
//           onBackdropPress={() => {
//             setShowConfirm(false);
//           }}
//           onBackButtonPress={() => {
//             setShowConfirm(false);
//           }}
//           style={styles.cmodel}
//           visible={showConfirm}
//         >
//           <View style={styles.commentview}>
//             <View
//               style={{
//                 backgroundColor: "#fff",
//                 padding: 20,
//                 borderRadius: 10,
//                 width: "100%",
//               }}
//             >
//               <Text
//                 style={{
//                   fontSize: 16,
//                   color: Colors.black,
//                   marginBottom: 15,
//                   fontFamily: FONTS.LexendMedium,
//                 }}
//               >
//                 Are you sure you want to delete this file?
//               </Text>

//               <View style={{ flexDirection: "row", width: "100%" }}>
//                 <TouchableOpacity
//                   onPress={() => setShowConfirm(false)}
//                   style={[
//                     styles.buttonStyle,
//                     { backgroundColor: Colors.textgray },
//                   ]}
//                 >
//                   <Text style={styles.txt}>Cancel</Text>
//                 </TouchableOpacity>

//                 <TouchableOpacity
//                   onPress={handleDeleteFile}
//                   style={[styles.buttonStyle, { backgroundColor: Colors.red }]}
//                 >
//                   <Text style={styles.txt}>Yes, Delete</Text>
//                 </TouchableOpacity>
//               </View>
//             </View>
//           </View>
//         </Modal>
//       </View>
//       <BlueHeader
//         title={t("Ticket Details")}
//         Righticon={Images.edit}
//         sort={true}
//         onPressRight={
//           String(AllPermission?.project_tickets_view?.update) === "1" &&
//             MainItem?.ticket_status_data?.id != 154
//             ? onEdit
//             : null
//         }
//         arrowOnPress={() => { }}
//         bgcolor={item ? item.color_code : "#eba14d"}
//       />
//       <View
//         style={{
//           backgroundColor: Colors.litegray1,
//           height: "100%",
//           marginTop: heightPercentageToDP(-1),
//           borderTopLeftRadius: 10,
//           borderTopRightRadius: 10,
//           flex: 1,
//           padding: 15
//         }}
//       >
//         {loading ? (
//           <Loader />
//         ) : (
//           <ScrollView
//             showsVerticalScrollIndicator={false}
//             style={{ flexGrow: 1 }}
//           // contentContainerStyle={{paddingHorizontal:15}}
//           >
//             <View style={styles.headercomponent}>
//               <Text style={styles.title}>{MainItem.ticket_title}</Text>
//               {/* <View style={styles.aview}> */}
//               <Text
//                 style={[
//                   styles.BookId,
//                   {
//                     marginTop: 15,
//                   },
//                 ]}
//               >
//                 {MainItem.id}
//               </Text>

//               {/* <Text style={styles.date}>{item?.date}</Text>
//               </View> */}
//             </View>
//             <View
//               style={[
//                 styles.aprooveView,
//                 {
//                   // backgroundColor: "red",
//                   backgroundColor:
//                     MainItem?.ticket_status_data?.color !== null
//                       ? MainItem?.ticket_status_data?.color
//                       : "#eba14d",
//                   marginTop: 10,
//                   borderRadius: 5,
//                 },
//               ]}
//             >
//               <Text style={styles.aprrove}>
//                 {MainItem?.ticket_status_data?.status_name
//                   ? t(MainItem.ticket_status_data.status_name)
//                   : "--"}
//               </Text>

//             </View>
//             <View style={styles.fview}>
//               <FlatList
//                 key={({ item }) => item}
//                 data={dataaaaaaaa}
//                 renderItem={RenderItem}
//                 ItemSeparatorComponent={() => {
//                   return <View style={styles.line} />;
//                 }}
//               />
//             </View>
//             {/* {String(AllPermission?.project_tickets_change_status?.update) ===
//               "1" && <View style={[styles.tdview, { marginBottom: 15 }]}>
//                 {statusData
//                   .filter((item) => item.status_name !== "New") // New skip kariyu
//                   .map((item, index) => (
//                     <ButtonComponent
//                       key={index}
//                       onPress={() => {
//                         setComplateTEXT(item.status_name);
//                         setselectstuts(item);
//                         if (item.status_name === "Inprogress") {
//                           changestuts(item.id);
//                         } else {
//                           setCommentModalVisible(true);
//                         }
//                       }}
//                       marginTop={RFValue(15)}
//                       width={RFPercentage(13)}
//                       title={t(item.status_name)}
//                       backgroundColor={item.color}
//                       fontSize={15}
//                     />
//                   ))}

//               </View>} */}
//             {String(AllPermission?.project_tickets_view?.update) === "1" && (
//               <View style={styles.container}>
//                 {statusData
//                   .filter((item) =>
//                     MainItem?.ticket_status_data?.id == 154
//                       ? item?.id !== 153 &&
//                       item?.id !== 152 &&
//                       item.status_name !== "New"
//                       : item.status_name !== "New"
//                   )
//                   .map((item, index) => {
//                     const isSelected =
//                       item.id === MainItem?.ticket_status_data?.id;

//                     return (
//                       <TouchableOpacity
//                         key={index}
//                         disabled={MainItem?.ticket_status_data?.id == 154}
//                         onPress={() => {
//                           setComplateTEXT(item.status_name);
//                           setselectstuts(item);

//                           if (item.status_name === "Inprogress") {
//                             changestuts(item.id);
//                           } else {
//                             setCommentModalVisible(true);
//                           }
//                         }}
//                         style={[
//                           styles.button,
//                           {
//                             backgroundColor: isSelected
//                               ? item.color
//                               : "#ccc",
//                           },
//                         ]}
//                       >
//                         <Text style={styles.text}>
//                           {t(item?.status_name) || ""}
//                         </Text>
//                       </TouchableOpacity>
//                     );
//                   })}
//               </View>
//             )}
//             <View style={[styles.tdview, { marginVertical: 15 }]}>
//               <TouchableOpacity
//                 style={{
//                   width: "45%",
//                   backgroundColor: Colors.primary,
//                   alignItems: "center",
//                   paddingVertical: 10,
//                   borderRadius: 10,
//                 }}
//                 onPress={handleFileSelection}
//               // onPress={() => navigation.navigate("CustomCamera", {
//               //   setData: (newPhotos) => {
//               //     setNewDocument((prev) => [...prev, ...newPhotos]);
//               //   },
//               // })}
//               >
//                 <Image
//                   source={Images.camera}
//                   style={{ height: 22, width: 22, tintColor: Colors.white }}
//                 />
//               </TouchableOpacity>
//               <TouchableOpacity
//                 onPress={() => {
//                   setComplateTEXT("comment");
//                   setCommentModalVisible(true);
//                 }}
//                 style={{
//                   width: "45%",
//                   backgroundColor: Colors.primary,
//                   alignItems: "center",
//                   paddingVertical: 10,
//                   borderRadius: 10,
//                 }}
//               >
//                 <Image source={Images.edit} style={{ height: 22, width: 22 }} />
//               </TouchableOpacity>
//             </View>

//             {/* <TouchableOpacity
//               style={{
//                 backgroundColor: Colors.primary,
//                 marginTop: 15,
//                 // width: "100%",
//                 // marginHorizontal: 18,
//                 alignItems: "center",
//                 paddingVertical: 8,
//                 borderRadius: 10,
//                 flexDirection: "row",
//               }}
//               onPress={() => {
//                 setComplateTEXT("comment");
//                 setCommentModalVisible(true);
//               }}
//             >
//               <Image
//                 source={Images.edit}
//                 style={{ height: 22, width: 22, marginLeft: 15 }}
//               />
//               <Text
//                 style={{
//                   fontSize: 15,
//                   fontFamily: FONTS.LexendSemiBold,
//                   color: Colors.white,
//                   marginLeft: 10,
//                 }}
//               >
//                 {t("Opmerking/Problem")}
//                 {"\n"}
//                 {t("action taken")}
//                 {"\n"}
//                 {t("suggetion/Solution")}
//               </Text>
//             </TouchableOpacity> */}
//             {
//               Loading &&
//               <Loader />

//             }
//             <FlatList
//               data={MainItem?.ticket_documents || []}
//               keyExtractor={(item) => item.id}
//               renderItem={renderItem}
//               columnWrapperStyle={{ justifyContent: 'space-between' }}
//               numColumns={3} // ak row ma 3 images
//               showsVerticalScrollIndicator={false}
//               contentContainerStyle={{ paddingTop: 15 }}
//             />
//             <View>
//               <Modal
//                 onBackdropPress={() => {
//                   setCommentModalVisible(false);
//                 }}
//                 onBackButtonPress={() => {
//                   setCommentModalVisible(false);
//                 }}
//                 style={styles.cmodel}
//                 visible={commentmodalVisible}
//               >
//                 <View style={styles.commentview}>
//                   <Text style={styles.addc}>{t("Voeg een notitie toe")}</Text>
//                   <TextInput
//                     multiline={true}
//                     placeholder="Notitie..."
//                     placeholderTextColor={Colors.textgray}
//                     style={styles.cinput}
//                     value={comment}
//                     onChangeText={(txt) => {
//                       setComment(txt), setCommenterror("");
//                     }}
//                   />
//                   <Text style={styles.commenterror}>{commenterror}</Text>
//                   <View style={styles.commentbuttons}>
//                     <TouchableOpacity
//                       onPress={() => setCommentModalVisible(false)}
//                       style={[
//                         styles.buttonStyle,
//                         { backgroundColor: Colors.litegray },
//                       ]}
//                     >
//                       <Text style={[styles.txt, { color: Colors.black }]}>
//                         {t("Sluiten")}
//                       </Text>
//                     </TouchableOpacity>

//                     <TouchableOpacity
//                       onPress={() => {
//                         if (comment == "") {
//                           setCommenterror(t("Please Enter Note"));
//                         } else if (CompateTEXT === "comment") {
//                           Addcommentapi();
//                         } else if (CompateTEXT === "Closed") {
//                           Addcommentapi(selectstuts.id);
//                           // Addcommentapi("Closed");

//                           // onclose();
//                         } else if (CompateTEXT === "Hold") {
//                           Addcommentapi(selectstuts.id);
//                           // Addcommentapi("Hold");
//                         } else {
//                           // baki case mate code
//                         }
//                       }}
//                       style={[
//                         styles.buttonStyle,
//                         { backgroundColor: Colors.primary },
//                       ]}
//                     >
//                       <Text style={styles.txt}>{t("Save")}</Text>
//                     </TouchableOpacity>
//                   </View>
//                 </View>
//               </Modal>
//             </View>
//             <>
//               {notedata.length > 0 && (
//                 <Text style={[styles.title, { marginTop: 1 }]}>
//                   {t("Opmerkingen")}
//                   {" :"}
//                 </Text>
//               )}
//               <View style={styles.commentviewset}>
//                 <FlatList
//                   data={notedata}
//                   renderItem={RenderItemCommets}
//                   contentContainerStyle={{ marginBottom: 50, marginTop: 10 }}
//                   ItemSeparatorComponent={() => {
//                     return <View style={styles.line} />;
//                   }}
//                 />
//               </View>
//             </>
//           </ScrollView>
//         )}
//       </View>
//     </View>
//   );
// };

// export default TicketDetails;

// const styles = StyleSheet.create({
//   safe: {
//     flex: 1,
//   },
//   container: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     justifyContent: "space-between",
//     marginBottom: 15,
//   },
//   button: {
//     width: "32%", // 👉 3 buttons per row
//     height: 40,
//     borderRadius: 8,
//     justifyContent: "center",
//     alignItems: "center",
//     marginTop: 10,
//   },
//   text: {
//     color: Colors.black,
//     fontSize: 12,
//     textAlign: "center",
//     fontFamily: FONTS.LexendRegular,
//   },
//   title: {
//     color: Colors.black,
//     fontFamily: FONTS.LexendMedium,
//     fontSize: 17,
//     marginTop: 15,
//   },
//   fview: {
//     borderRadius: 10,
//     borderColor: Colors.litegray,
//     borderWidth: 1,
//     padding: 6,
//     marginTop: 10,
//     backgroundColor: Colors.white,
//   },
//   sub: {
//     color: Colors.primaryblue,
//     fontFamily: FONTS.LexendMedium,
//     fontSize: 14,
//   },
//   sub1: {
//     color: Colors.black,
//     fontFamily: FONTS.LexendMedium,
//     fontSize: 14,
//   },
//   line: { height: 1, backgroundColor: Colors.litegray, marginVertical: 10 },
//   tdview: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },
//   buttonStyle: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     height: 40,
//     backgroundColor: Colors.litegray,
//     margin: 20,
//     borderRadius: 7,
//   },
//   txt: { fontSize: 15, fontFamily: FONTS.LexendMedium, color: Colors.white },
//   cinput: {
//     height: 120,
//     borderRadius: 10,
//     borderWidth: 1,
//     borderColor: Colors.litegray,
//     marginHorizontal: 20,
//     paddingHorizontal: 10,
//     fontSize: 15,
//     fontFamily: FONTS.LexendRegular,
//     color: Colors.black,
//   },
//   simpleFlex: {
//     // paddingTop:RFValue(25)
//     lineHeight: Platform == "android" ? 120 : 70,
//   },
//   addc: {
//     fontSize: 15,
//     fontFamily: FONTS.LexendBold,
//     marginTop: 15,
//     paddingBottom: 10,
//     textAlign: "left",
//     color: Colors.black,
//     paddingLeft: 20,
//   },
//   commentview: {
//     flex: 1,
//     position: "absolute",
//     borderRadius: 10,
//     backgroundColor: Colors.white,
//     width: "100%",
//   },
//   cmodel: {
//     paddingHorizontal: 20,
//     justifyContent: "center",
//     alignItems: "center",
//     margin: 0,
//     backgroundColor: Colors.transparant,
//   },
//   sview: {
//     flex: 1,
//     position: "absolute",
//     borderRadius: 10,
//     backgroundColor: Colors.white,
//     width: "100%",
//   },
//   name: {
//     fontSize: 14,
//     fontFamily: FONTS.LexendBold,
//     textAlign: "center",
//     color: Colors.black,
//   },
//   smodel: {
//     paddingHorizontal: 20,
//     justifyContent: "center",
//     alignItems: "center",
//     margin: 0,
//     backgroundColor: Colors.transparant,
//     paddingVertical: 20,
//   },
//   sbottamview: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingTop: 10,
//     paddingHorizontal: 15,
//     backgroundColor: "transparent",
//   },
//   input: {
//     backgroundColor: Colors.primarylite,
//     paddingHorizontal: 10,
//     marginHorizontal: 10,
//     borderRadius: 8,
//     fontSize: 13,
//     fontFamily: FONTS.LexendRegular,
//     color: Colors.black,
//     height: heightPercentageToDP(5),
//   },
//   signature: {
//     borderColor: Colors.black,
//     borderWidth: 1,
//     marginTop: 10,
//   },
//   buttonStyle: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     height: 40,
//     backgroundColor: Colors.white,
//     margin: 10,
//     borderRadius: 7,
//   },
//   headercomponent: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },
//   orderid: {
//     color: Colors.primary,
//     fontFamily: FONTS.LexendMedium,
//     fontSize: 14,
//     marginTop: 15,
//   },
//   signatureimage: {
//     height: 150,
//     marginTop: 20,
//     borderWidth: 1,
//     borderRadius: 7,
//     borderColor: Colors.litegray,
//     resizeMode: "stretch",
//     backgroundColor: Colors.white,
//   },
//   commentviewset: {
//     marginTop: 10,
//   },
//   signaturechange: {
//     height: 150,
//     width: "90%",
//     marginTop: 20,
//     borderWidth: 1,
//     borderRadius: 7,
//     borderColor: Colors.litegray,
//     resizeMode: "stretch",
//     alignSelf: "center",
//   },
//   commenterror: {
//     fontSize: 12,
//     fontFamily: FONTS.LexendRegular,
//     color: Colors.red,
//     paddingBottom: 10,
//     marginHorizontal: 20,
//   },
//   approve: {
//     backgroundColor: Colors.primary,
//     width: 200,
//     height: heightPercentageToDP(5),
//     borderRadius: 7,
//     alignSelf: "center",
//     justifyContent: "center",
//     alignItems: "center",
//     marginBottom: 20,
//   },
//   approvetext: {
//     fontSize: 15,
//     fontFamily: FONTS.LexendMedium,
//     color: Colors.white,
//   },
//   commentbuttons: {
//     flex: 1,
//     flexDirection: "row",
//   },
//   detailsmainview: {
//     flexDirection: "row",
//     width: "100%",
//     gap: 5,
//     justifyContent: "space-between",
//   },
//   detailssubject: {
//     // backgroundColor:'red',
//     width: "60%",
//     flex: 1,

//     alignItems: "flex-end",
//     // width: widthPercentageToDP(50),
//     // alignItems: "flex-end",
//   },
//   locationimage: {
//     height: 20,
//     width: 20,
//   },
//   locationbg: {
//     flexDirection: "row",
//   },
//   shortdescription: {
//     flexDirection: "row",
//     marginTop: 5,
//   },
//   quntitybg: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginTop: 10,
//   },
//   timebg: {
//     height: 30,
//     width: 30,
//   },
//   commentimage: {
//     height: 50,
//     width: 50,
//     borderRadius: 7,

//   },
//   commentimage1: {
//     height: 30,
//     width: 30,

//   },
//   aview: {
//     position: "absolute",
//     right: 10,
//     top: 10,
//     justifyContent: "space-evenly",
//     height: "100%",
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   aprooveView: {
//     padding: 5,
//     margin: 0,
//     borderRadius: 5,
//     alignItems: "center",
//     // marginBottom: 6,
//   },
//   aprrove: {
//     color: Colors.white,
//     padding: 0,
//     margin: 0,
//     fontSize: 12,
//     fontFamily: FONTS.LexendRegular,
//   },

//   date: {
//     color: Colors.textgray,
//     fontFamily: FONTS.LexendRegular,
//     fontSize: 14,
//   },
//   ModalComplateView: {
//     width: "100%",
//     height: 200,
//     backgroundColor: "#2C2C2C",
//     borderRadius: 7,
//     alignSelf: "center",
//     paddingHorizontal: 15,
//     paddingVertical: 30,
//   },
//   CompateBTN1: {
//     width: "60%",
//     height: 50,
//     backgroundColor: Colors.red,
//     borderRadius: 7,
//     justifyContent: "center",
//     alignItems: "center",
//     position: "absolute",
//     bottom: 15,
//     alignSelf: "center",
//   },
//   CompateBTN: {
//     width: "60%",
//     height: 50,
//     backgroundColor: Colors.primary,
//     borderRadius: 7,
//     justifyContent: "center",
//     alignItems: "center",
//     position: "absolute",
//     bottom: 80,
//     alignSelf: "center",
//   },
//   ComplateText: {
//     fontSize: 15,
//     fontWeight: "500",
//     color: Colors.white,
//     textAlign: "center",
//   },
//   BookId: {
//     fontSize: 18,
//     fontWeight: "500",
//     marginHorizontal: 5,
//     color: Colors.black,
//   },
// });
import {
  Alert,
  BackHandler,
  Dimensions,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { launchImageLibrary } from "react-native-image-picker";
import { FONTS } from "../constants/fontFamily";
import { Colors } from "../constants/color";
import { pick, types } from '@react-native-documents/picker';
import { compressImages } from "../utils/imageCompressor";
import { heightPercentageToDP } from "react-native-responsive-screen";
import BlueHeader from "../components/BlueHeader";
import { t } from "i18next";
import ButtonComponent from "../components/buttonComponent";
import { RFPercentage, RFValue } from "react-native-responsive-fontsize";
import { Images } from "../constants/images";
import Modal from "react-native-modal";
import { getData } from "../utils/storeData";
import ApiService from "../utils/Apiservice";
import apiConstants from "../api/apiConstants";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import WebView from "react-native-webview";
import axios from "axios";
import Loader from "../components/loading";
import FallbackImage from "../components/FallbackImage";

const SCREEN_WIDTH = Dimensions.get("window").width;

const removeHtmlTags = (htmlString = "") => htmlString.replace(/<[^>]*>/g, "");

const translateDayToDutch = (log = "") => {
  const dayMap = {
    Monday: "Maandag",
    Tuesday: "Dinsdag",
    Wednesday: "Woensdag",
    Thursday: "Donderdag",
    Friday: "Vrijdag",
    Saturday: "Zaterdag",
    Sunday: "Zondag",
  };
  let translatedLog = log;
  Object.keys(dayMap).forEach((day) => {
    if (log.includes(day)) {
      translatedLog = log.replace(day, dayMap[day]);
    }
  });
  return translatedLog;
};

const getDropboxDirectLink = (url) => {
  if (!url) return "";
  let directUrl = url.replace("www.dropbox.com", "dl.dropboxusercontent.com");
  directUrl = directUrl.replace("?dl=0", "").replace("?dl=1", "");
  return directUrl;
};

const getDirectDropboxLink = (sharedLink) => {
  if (!sharedLink) return "";
  try {
    if (sharedLink.includes("dropboxusercontent.com")) return sharedLink;
    if (sharedLink.includes("db.tt")) return sharedLink.replace("db.tt", "dl.dropboxusercontent.com");
    if (sharedLink.includes("dropbox.com")) {
      let cleaned = sharedLink
        .replace("www.dropbox.com", "dl.dropboxusercontent.com")
        .replace("dropbox.com", "dl.dropboxusercontent.com")
        .replace(/[?&](dl|raw)=[^&]*/g, "");
      cleaned += cleaned.includes("?") ? "&raw=1" : "?raw=1";
      return cleaned;
    }
    return sharedLink;
  } catch {
    return "";
  }
};

const RenderItemCommets = React.memo(({ item, index }) => (
  <View
    style={[
      styles.commentRow,
      {
        backgroundColor:
          item?.ticket_status == 153
            ? Colors.hold
            : item?.ticket_status == 154
              ? Colors.closed
              : Colors.normal,
      },
    ]}
    key={`${item?.id * index}`}
  >
    <View>
      <FallbackImage
        source={item?.user?.profile_image ? { uri: item.user.profile_image } : Images.userblanck}
        fallback={Images.userblanck}
        style={styles.commentimage}
      />
    </View>
    <View style={styles.commentStatusIcon}>
      <Image
        source={item?.ticket_status == 153 ? Images.pause : item?.ticket_status == 154 ? Images.check : null}
        style={styles.commentimage1}
      />
    </View>
    <View style={styles.commentContent}>
      <Text style={styles.sub1}>
        {item?.user?.username} {item?.ticket_status}
      </Text>
      <Text style={[styles.sub1, styles.commentDate]}>{item.created_at}</Text>
      <Text style={[styles.sub1, styles.commentText]}>{removeHtmlTags(item.comment)}</Text>
    </View>
  </View>
));

const RenderItem = React.memo(({ item }) => (
  <View style={styles.detailsmainview}>
    <Text style={[styles.sub, styles.detailsLabel]}>{item?.name}</Text>
    <View style={styles.detailssubject}>
      <Text
        style={[
          styles.sub,
          {
            width: "95%",
            textAlign:
              item?.name === "Description" && item?.subject?.length ? "left" : "right",
          },
        ]}
      >
        {item?.name === "Description" ? removeHtmlTags(item?.subject) : item?.subject}
      </Text>
    </View>
    {item?.Approved}
  </View>
));

const TicketDetails = ({ route, navigation }) => {
  const incomingItem = route?.params?.item ?? {};
  const notificationKey = route?.params?.notificationKey;
  const Focused = useIsFocused();
  const normalizedItem = useMemo(() => {
    const resolvedId = incomingItem?.id ?? incomingItem?.ticket_id;
    const resolvedProjectId = incomingItem?.project_id ?? incomingItem?.project_data?.id;
    const resolvedStatusId =
      incomingItem?.status_id ??
      incomingItem?.status ??
      incomingItem?.ticket_status_data?.id ??
      incomingItem?.ticketstatus?.id;

    const statusData =
      incomingItem?.ticket_status_data ||
      incomingItem?.ticketstatus ||
      (resolvedStatusId
        ? {
            id: resolvedStatusId,
            status_name: incomingItem.status_name || incomingItem.status_to || "",
            color: incomingItem.status_color || incomingItem.color_code,
          }
        : null);

    return {
      ...incomingItem,
      id: resolvedId,
      ticket_id: incomingItem?.ticket_id ?? resolvedId,
      project_id: resolvedProjectId,
      status_id: resolvedStatusId,
      status: incomingItem?.status ?? resolvedStatusId,
      ticket_status_data: statusData,
      ticket_title: incomingItem?.ticket_title || incomingItem?.title || "",
      type: incomingItem?.type ?? "0",
      ticket_documents: incomingItem?.ticket_documents || [],
    };
  }, [incomingItem]);

  const [Loading, setDocumentLoading] = useState(false);
  const [MainItem, setMainItem] = useState(normalizedItem);
  const [loading, setLoading] = useState(false);
  const [commentmodalVisible, setCommentModalVisible] = useState(false);
  const [comment, setComment] = useState("");
  const [commenterror, setCommenterror] = useState("");
  const [notedata, setNoteData] = useState([]);
  const [CompateTEXT, setComplateTEXT] = useState("");
  const [selectstuts, setselectstuts] = useState("");
  const [statusData, setstatusData] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [AllPermission, setPermissions] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [AllDocument, setAllDocument] = useState([]);
  const [NewDocument, setNewDocument] = useState([]);

  const permissionFetchedRef = useRef(false);
  const isUploadingRef = useRef(false);

  const isFromNotification = useMemo(
    () =>
      route.params?.fromNotification === "true" ||
      route.params?.fromNotification === true ||
      incomingItem?.fromNotification === "true" ||
      incomingItem?.fromNotification === true,
    [route.params?.fromNotification, incomingItem?.fromNotification]
  );
  const ticketId =
    normalizedItem?.id ??
    normalizedItem?.ticket_id ??
    MainItem?.id ??
    MainItem?.ticket_id;

  useEffect(() => {
    setMainItem(normalizedItem);
  }, [normalizedItem]);

  useEffect(() => {
    if (permissionFetchedRef.current) return;
    permissionFetchedRef.current = true;

    const fetchPermission = async () => {
      try {
        const getdata = await getData("USERDATA");
        if (!getdata?.data?.user || !getdata?.data?.relaties) return;

        const response = await ApiService(apiConstants.permission, {
          includeToken: true,
          customData: {
            relaties_id: getdata.data.relaties.id,
            user_id: getdata.data.user.id,
            role: getdata.data.user.role,
          },
        });

        if (response?.data) setPermissions(response.data);
      } catch (error) {
        console.log("Error fetching permission:", error);
      }
    };

    fetchPermission();
  }, []);

  const fetchTasklistData = useCallback(async () => {
    if (!ticketId) return;

    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.get_tickets, {
        includeToken: true,
        customData: {
          relaties_id: getdata.data.relaties.id,
          user_id: getdata.data.user.id,
          role: getdata.data.user.role,
        },
      });

      if (data.status) {
        const current = data?.data?.find((el) => String(el?.id) === String(ticketId));
        if (current) {
          setMainItem(current);
          setAllDocument(current?.ticket_documents || []);
        }
      }
    } catch (err) {
      console.log("Error fetching connections:", err);
    }
  }, [ticketId]);

  const fetchTasklist = useCallback(async () => {
    if (!ticketId) return;

    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.get_ticketnotes, {
        includeToken: true,
        customData: {
          relaties_id: getdata.data.relaties.id,
          user_id: getdata.data.user.id,
          role: getdata.data.user.role,
          ticket_id: ticketId,
        },
      });

      fetchTasklistData();
      if (data.status) setNoteData(data.data);
    } catch (err) {
      console.log("Error fetching connections:", err);
    }
  }, [ticketId, fetchTasklistData]);

  useEffect(() => {
    if (!ticketId) {
      return;
    }

    let isActive = true;

    const loadTicketFromServer = async () => {
      setLoading(true);
      try {
        await fetchTasklistData();
        if (isActive) {
          const getdata = await getData("USERDATA");
          if (getdata?.data?.user && getdata?.data?.relaties) {
            const notesResponse = await ApiService(apiConstants.get_ticketnotes, {
              includeToken: true,
              customData: {
                relaties_id: getdata.data.relaties.id,
                user_id: getdata.data.user.id,
                role: getdata.data.user.role,
                ticket_id: ticketId,
              },
            });
            if (isActive && notesResponse.status) {
              setNoteData(notesResponse.data);
            }
          }
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadTicketFromServer();

    return () => {
      isActive = false;
    };
  }, [ticketId, notificationKey, fetchTasklistData]);

  const get_ticketstatus = useCallback(async () => {
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.getstatus, {
        includeToken: true,
        customData: {
          slug: "ticket",
          relaties_id: getdata.data.relaties.id,
          role: getdata.data.user.role,
          user_id: getdata.data.user.id,
        },
      });
      if (data.status) setstatusData(data.data);
    } catch (err) {
      console.log("Error fetching connections:", err);
    }
  }, []);

  useEffect(() => {
    get_ticketstatus();
    setAllDocument(MainItem?.ticket_documents || []);
  }, [MainItem?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchTasklist();
      get_ticketstatus();
    }, [fetchTasklist, get_ticketstatus])
  );

  const changestuts = useCallback(async (itemmmm) => {
    if (!ticketId) return;

    try {
      const getdata = await getData("USERDATA");
      const dataaa = {
        relaties_id: getdata.data.relaties.id,
        user_id: getdata.data.user.id,
        role: getdata.data.user.role,
        ticket_id: ticketId,
        status: itemmmm,
        created_at: new Date().toISOString(),
      };

      const data = await ApiService(apiConstants.ticket_update, {
        includeToken: true,
        customData: dataaa,
      });

      if (data.status) fetchTasklistData();
    } catch (err) {
      console.log("Error fetching task list:", err);
    }
  }, [ticketId, fetchTasklistData]);

  const EditTickit = useCallback(async () => {
    if (!ticketId || isUploadingRef.current || NewDocument.length === 0) return;

    isUploadingRef.current = true;
    setDocumentLoading(true);
    try {
      const getdata = await getData("USERDATA");
      if (!getdata?.data?.user || !getdata?.data?.relaties) throw new Error("Invalid user data");

      const formData = new FormData();
      formData.append("relaties_id", getdata.data.relaties.id);
      formData.append("user_id", getdata.data.user.id);
      formData.append("role", getdata.data.user.role);
      formData.append("ticket_id", ticketId);
      formData.append("token", getdata.data.user.verify_token);

      NewDocument.forEach((docItem, index) => {
        const uri = typeof docItem === "string" ? docItem : docItem?.uri;
        if (!uri) return;

        const name = docItem.name || `upload_${Date.now()}_${index}.${uri.includes(".") ? uri.split(".").pop() : "jpg"}`;
        const type =
          docItem.type ||
          docItem.mimeType ||
          (name.endsWith(".pdf")
            ? "application/pdf"
            : name.endsWith(".doc") || name.endsWith(".docx")
              ? "application/msword"
              : name.endsWith(".png")
                ? "image/png"
                : "image/jpeg");

        formData.append("doc[]", { uri, name, type });
      });

      const response = await axios.post(apiConstants.ticket_update, formData, {
        headers: { "Content-Type": "multipart/form-data", Accept: "application/json" },
      });

      if (response.data.status) {
        setNewDocument([]);
        await fetchTasklistData();
      }
    } catch (err) {
      console.log("Error updating ticket:", err);
    } finally {
      isUploadingRef.current = false;
      setDocumentLoading(false);
    }
  }, [ticketId, NewDocument, fetchTasklistData]);

  const Addcommentapi = useCallback(async (itemmm) => {
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.add_ticketnote, {
        includeToken: true,
        customData: {
          relaties_id: getdata.data.relaties.id,
          user_id: getdata.data.user.id,
          role: getdata.data.user.role,
          ticket_id: ticketId,
          note: `<p>${comment}</p>`,
          comment_type: "Ticket_note",
          ticket_status: itemmm,
        },
      });

      if (data) {
        setCommentModalVisible(false);
        fetchTasklist();
        setComment("");
        if (itemmm) changestuts(itemmm);
      }
    } catch (err) {
      console.log("Error fetching connections:98", err);
    }
  }, [comment, ticketId, fetchTasklist, changestuts]);

  const handleDeleteFile = useCallback(async () => {
    if (!selectedFile || !ticketId) return;
    try {
      const getdata = await getData("USERDATA");
      const dataaaa = await ApiService(apiConstants.deleteTicketDocument, {
        includeToken: true,
        customData: {
          relaties_id: getdata.data.relaties.id,
          role: getdata.data.user.role,
          user_id: getdata.data.user.id,
          ticket_id: ticketId,
          id: selectedFile.id,
        },
      });

      if (dataaaa.status) {
        setShowConfirm(false);
        setSelectedFile(null);
        fetchTasklistData();
      }
    } catch (err) {
      console.log("Error fetching connections:", err);
    }
  }, [selectedFile, ticketId, fetchTasklistData]);

  useEffect(() => {
    if (NewDocument?.length > 0 && Focused) EditTickit();
  }, [NewDocument, Focused, EditTickit]);

  const onEdit = useCallback(() => {
    navigation.navigate("CreateTicket", { item: { ...MainItem, typeee: "edit" } });
  }, [MainItem, navigation]);

  const handleFileSelection = useCallback(() => {
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
  }, []);

  const openCamera = useCallback(() => {
    navigation.navigate("CustomCamera", {
      setData: (newPhotos) => setNewDocument((prev) => [...prev, ...newPhotos]),
    });
  }, [navigation]);

  const openGallery = useCallback(() => {
    launchImageLibrary(
      { mediaType: "photo", quality: 0.2, maxWidth: 1024, maxHeight: 1024, selectionLimit: 0 },
      async (response) => {
        if (!response.didCancel && !response.errorCode) {
          const formatted = response.assets.map((image) => ({
            uri: image.uri,
            name: `gallery_${Date.now()}.jpg`,
            type: image.type || "image/jpeg",
          }));
          const compressed = await compressImages(formatted);
          setNewDocument((prev) => [...prev, ...compressed]);
        }
      }
    );
  }, []);

  const openDocument = useCallback(async () => {
    try {
      const results = await pick({ mode: "open", allowMultiSelection: true, types: [types.allFiles] });
      const formatted = results.map((file) => ({
        uri: file.uri,
        name: `document_${file.name}_${Date.now()}`,
        type: file.mimeType ?? file.nativeType ?? "application/octet-stream",
        size: file.size ?? 0,
        id: `${file.name}_${Date.now()}`,
      }));
      const compressed = await compressImages(formatted);
      setNewDocument((prev) => [...prev, ...compressed]);
    } catch (err) {
      if (err?.name !== "DocumentPickerCancel") console.error("Document Picker Error:", err);
    }
  }, []);

  const handleCloseDoc = useCallback(() => setSelectedDoc(null), []);
  const handleClosConfirm = useCallback(() => setShowConfirm(false), []);
  const handleCloseComment = useCallback(() => setCommentModalVisible(false), []);
  const handleBack = useCallback(() => {
    if (isFromNotification || !navigation.canGoBack()) {
      navigation.reset({
        index: 0,
        routes: [
          {
            name: "BottamScreens1",
            params: { refresh: Date.now() },
          },
        ],
      });
      return;
    }

    navigation.goBack();
  }, [navigation, isFromNotification]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      handleBack();
      return true;
    });

    return () => subscription.remove();
  }, [handleBack]);

  const onCommentChange = useCallback((txt) => {
    setComment(txt);
    setCommenterror("");
  }, []);

  const onCommentSave = useCallback(() => {
    if (comment === "") {
      setCommenterror(t("Please Enter Note"));
    } else if (CompateTEXT === "comment") {
      Addcommentapi();
    } else if (CompateTEXT === "Closed" || CompateTEXT === "Hold") {
      Addcommentapi(selectstuts.id);
    }
  }, [comment, CompateTEXT, selectstuts, Addcommentapi]);

  const baseData = useMemo(() => [
    { id: 1, name: t("Project"), subject: MainItem?.project_data?.project_name || MainItem?.project_name || "_ _" },
    { id: 2, name: t("Description"), subject: MainItem?.ticket_description || "_ _" },
    { id: 3, name: t("type"), subject: MainItem?.type || "_ _" },
  ], [MainItem]);

  const dataaaaaaaa = useMemo(() =>
    MainItem?.inprogress_log
      ? [...baseData, { id: 4, name: t("Date"), subject: translateDayToDutch(MainItem?.inprogress_log) }]
      : baseData,
    [MainItem?.inprogress_log, baseData]
  );

  const filteredStatusData = useMemo(() =>
    statusData.filter((s) =>
      MainItem?.ticket_status_data?.id == 154
        ? s?.id !== 153 && s?.id !== 152 && s.status_name !== "New"
        : s.status_name !== "New"
    ),
    [statusData, MainItem?.ticket_status_data?.id]
  );

  const canUpdate = useMemo(
    () => String(AllPermission?.project_tickets_view?.update) === "1",
    [AllPermission]
  );

  const isClosed = MainItem?.ticket_status_data?.id == 154;

  const renderDocItem = useCallback(({ item: docItem }) => {
    const ext = (docItem?.file_extension || "").toLowerCase();
    const isPdf = ext.includes("pdf");
    const isImage = /(jpe?g|png|webp|gif|heic|heif)/.test(ext);
    const directLink = getDirectDropboxLink(docItem?.shared_link);
    return (
      <TouchableOpacity
        style={styles.docItem}
        onPress={() => setSelectedDoc({ uri: directLink, isImage })}
      >
        <Image
          defaultSource={Images.document}
          source={isPdf ? Images.pdflogo : { uri: directLink }}
          style={styles.docImage}
          resizeMode="cover"
        />
        {canUpdate && (
          <TouchableOpacity
            onPress={() => { setSelectedFile(docItem); setShowConfirm(true); }}
            style={styles.docDeleteBtn}
          >
            <Image source={Images.close} style={styles.docDeleteIcon} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  }, [canUpdate]);

  const docKeyExtractor = useCallback((docItem) => String(docItem.id), []);
  const flatListKeyExtractor = useCallback((listItem) => String(listItem.id), []);
  const renderSeparator = useCallback(() => <View style={styles.line} />, []);

  return (
    <View style={styles.flex1}>
      <View>
        <Modal
          visible={!!selectedDoc}
          onRequestClose={handleCloseDoc}
          transparent={false}
          style={styles.zeroMargin}
        >
          <View style={styles.webviewContainer}>
            <TouchableOpacity style={styles.webviewClose} onPress={handleCloseDoc}>
              <Image source={Images.close} style={styles.closeIcon} />
            </TouchableOpacity>
            {selectedDoc?.isImage ? (
              <Image
                source={{ uri: selectedDoc?.uri }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            ) : (
              <WebView source={{ uri: selectedDoc?.uri }} style={styles.flex1} />
            )}
          </View>
        </Modal>
      </View>

      <View>
        <Modal
          onBackdropPress={handleClosConfirm}
          onBackButtonPress={handleClosConfirm}
          style={styles.cmodel}
          visible={showConfirm}
        >
          <View style={styles.commentview}>
            <View style={styles.confirmInner}>
              <Text style={styles.confirmText}>Are you sure you want to delete this file?</Text>
              <View style={styles.confirmButtons}>
                <TouchableOpacity
                  onPress={handleClosConfirm}
                  style={[styles.buttonStyle, { backgroundColor: Colors.textgray }]}
                >
                  <Text style={styles.txt}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleDeleteFile}
                  style={[styles.buttonStyle, { backgroundColor: Colors.red }]}
                >
                  <Text style={styles.txt}>Yes, Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>

      <BlueHeader
        title={t("Ticket Details")}
        Righticon={Images.edit}
        sort={true}
        onPressRight={canUpdate && !isClosed ? onEdit : null}
        goback={handleBack}
        bgcolor={MainItem?.color_code || "#eba14d"}
      />

      <View style={styles.mainContainer}>
        {loading ? (
          <Loader />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} style={styles.flexGrow}>
            <View style={styles.headercomponent}>
              <Text style={styles.title}>{MainItem?.ticket_title || MainItem?.title || "-"}</Text>
              <Text style={[styles.BookId, styles.bookIdMargin]}>{MainItem?.id || "-"}</Text>
            </View>

            <View
              style={[
                styles.aprooveView,
                {
                  backgroundColor: MainItem?.ticket_status_data?.color || MainItem?.color_code || "#eba14d",
                  marginTop: 10,
                  borderRadius: 5,
                },
              ]}
            >
              <Text style={styles.aprrove}>
                {MainItem?.ticket_status_data?.status_name
                  ? t(MainItem.ticket_status_data?.status_name)
                  : MainItem?.status_name || ""}
              </Text>
            </View>

            <View style={styles.fview}>
              <FlatList
                data={dataaaaaaaa}
                renderItem={({ item: listItem }) => <RenderItem item={listItem} />}
                keyExtractor={flatListKeyExtractor}
                ItemSeparatorComponent={renderSeparator}
                scrollEnabled={false}
              />
            </View>

            {canUpdate && (
              <View style={styles.container}>
                {filteredStatusData.map((statusItem, index) => {
                  const statusId1 = MainItem?.ticket_status_data?.id;
                  const statusId2 = MainItem?.status_id;

                  const isSelected =
                    statusId1 != null && String(statusItem.id) === String(statusId1) ||
                    statusId2 != null && String(statusItem.id) === String(statusId2);
                  return (
                    <TouchableOpacity
                      key={index}
                      disabled={isClosed}
                      onPress={() => {
                        setComplateTEXT(statusItem.status_name);
                        setselectstuts(statusItem);
                        if (statusItem.status_name === "Inprogress") {
                          changestuts(statusItem.id);
                        } else {
                          setCommentModalVisible(true);
                        }
                      }}
                      style={[styles.button, { backgroundColor: isSelected ? statusItem?.color : "#ccc" }]}
                    >
                      <Text style={styles.text}>{t(statusItem?.status_name) || ""}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <View style={[styles.tdview, styles.actionButtonRow]}>
              <TouchableOpacity style={styles.actionBtn} onPress={handleFileSelection}>
                <Image source={Images.camera} style={styles.actionIcon} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setComplateTEXT("comment"); setCommentModalVisible(true); }}
                style={styles.actionBtn}
              >
                <Image source={Images.edit} style={styles.actionIconNoTint} />
              </TouchableOpacity>
            </View>

            {Loading && <Loader />}

            <FlatList
              data={MainItem?.ticket_documents || []}
              keyExtractor={docKeyExtractor}
              renderItem={renderDocItem}
              columnWrapperStyle={styles.docColumnWrapper}
              numColumns={3}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.docListContent}
              scrollEnabled={false}
            />

            <View>
              <Modal
                onBackdropPress={handleCloseComment}
                onBackButtonPress={handleCloseComment}
                style={styles.cmodel}
                visible={commentmodalVisible}
              >
                <View style={styles.commentview}>
                  <Text style={styles.addc}>{t("Voeg een notitie toe")}</Text>
                  <TextInput
                    multiline={true}
                    placeholder="Notitie..."
                    placeholderTextColor={Colors.textgray}
                    style={styles.cinput}
                    value={comment}
                    onChangeText={onCommentChange}
                  />
                  <Text style={styles.commenterror}>{commenterror}</Text>
                  <View style={styles.commentbuttons}>
                    <TouchableOpacity
                      onPress={handleCloseComment}
                      style={[styles.buttonStyle, { backgroundColor: Colors.litegray }]}
                    >
                      <Text style={[styles.txt, { color: Colors.black }]}>{t("Sluiten")}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={onCommentSave}
                      style={[styles.buttonStyle, { backgroundColor: Colors.primary }]}
                    >
                      <Text style={styles.txt}>{t("Save")}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
            </View>

            <>
              {notedata.length > 0 && (
                <Text style={[styles.title, styles.noteTitle]}>{t("Opmerkingen")}{" :"}</Text>
              )}
              <View style={styles.commentviewset}>
                <FlatList
                  data={notedata}
                  renderItem={({ item: noteItem, index }) => <RenderItemCommets item={noteItem} index={index} />}
                  contentContainerStyle={styles.noteListContent}
                  ItemSeparatorComponent={renderSeparator}
                  scrollEnabled={false}
                />
              </View>
            </>
          </ScrollView>
        )}
      </View>
    </View>
  );
};

export default TicketDetails;

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  flexGrow: { flexGrow: 1 },
  zeroMargin: { margin: 0 },

  mainContainer: {
    backgroundColor: Colors.litegray1,
    height: "100%",
    marginTop: heightPercentageToDP(-1),
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    flex: 1,
    padding: 15,
  },

  webviewContainer: { flex: 1, backgroundColor: Colors.black },
  previewImage: { flex: 1, width: "100%", height: "100%" },
  webviewClose: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 10,
    backgroundColor: Colors.red,
    padding: 8,
    borderRadius: 20,
  },
  closeIcon: { height: 20, width: 20, tintColor: Colors.white },

  confirmInner: { backgroundColor: "#fff", padding: 20, borderRadius: 10, width: "100%" },
  confirmText: { fontSize: 16, color: Colors.black, marginBottom: 15, fontFamily: FONTS.LexendMedium },
  confirmButtons: { flexDirection: "row", width: "100%" },

  container: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 15 },
  button: { width: "32%", height: 40, borderRadius: 8, justifyContent: "center", alignItems: "center", marginTop: 10 },
  text: { color: Colors.black, fontSize: 12, textAlign: "center", fontFamily: FONTS.LexendRegular },

  title: { color: Colors.black, fontFamily: FONTS.LexendMedium, fontSize: 17, marginTop: 15 },
  noteTitle: { marginTop: 1 },

  fview: {
    borderRadius: 10,
    borderColor: Colors.litegray,
    borderWidth: 1,
    padding: 6,
    marginTop: 10,
    backgroundColor: Colors.white,
  },
  sub: { color: Colors.primaryblue, fontFamily: FONTS.LexendMedium, fontSize: 14 },
  sub1: { color: Colors.black, fontFamily: FONTS.LexendMedium, fontSize: 14 },
  detailsLabel: { color: Colors.textgray, textTransform: "capitalize", width: "35%", fontSize: 13 },
  commentDate: { color: Colors.textgray, fontSize: 13 },
  commentText: { textAlign: "left" },

  line: { height: 1, backgroundColor: Colors.litegray, marginVertical: 10 },

  tdview: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  actionButtonRow: { marginVertical: 15 },
  actionBtn: {
    width: "45%",
    backgroundColor: Colors.primary,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionIcon: { height: 22, width: 22, tintColor: Colors.white },
  actionIconNoTint: { height: 22, width: 22 },

  buttonStyle: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: 40,
    backgroundColor: Colors.white,
    margin: 10,
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
  commentRow: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    padding: 10,
    borderRadius: 10,
  },
  commentStatusIcon: { position: "absolute", right: 8, top: 8 },
  commentContent: { paddingLeft: 10, marginRight: 5, flex: 1 },
  commentimage: { height: 50, width: 50, borderRadius: 7 },
  commentimage1: { height: 30, width: 30 },
  commentviewset: { marginTop: 10 },
  noteListContent: { marginBottom: 50, marginTop: 10 },
  commenterror: {
    fontSize: 12,
    fontFamily: FONTS.LexendRegular,
    color: Colors.red,
    paddingBottom: 10,
    marginHorizontal: 20,
  },
  commentbuttons: { flex: 1, flexDirection: "row" },

  docItem: {
    width: SCREEN_WIDTH * 0.28,
    height: SCREEN_WIDTH * 0.28,
    marginBottom: 10,
    zIndex: 999,
  },
  docImage: {
    height: "100%",
    width: "100%",
    resizeMode: "cover",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.textgray,
  },
  docDeleteBtn: {
    backgroundColor: Colors.red,
    position: "absolute",
    top: 5,
    right: 5,
    borderRadius: 50,
    padding: 2,
    zIndex: 10,
  },
  docDeleteIcon: { height: 15, width: 15, borderRadius: 5, tintColor: Colors.white },
  docColumnWrapper: { justifyContent: "space-between" },
  docListContent: { paddingTop: 15 },

  headercomponent: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  bookIdMargin: { marginTop: 15 },

  aprooveView: { padding: 5, margin: 0, borderRadius: 5, alignItems: "center" },
  aprrove: { color: Colors.white, padding: 0, margin: 0, fontSize: 12, fontFamily: FONTS.LexendRegular },

  detailsmainview: { flexDirection: "row", width: "100%", gap: 5, justifyContent: "space-between" },
  detailssubject: { width: "60%", flex: 1, alignItems: "flex-end" },

  BookId: { fontSize: 18, fontWeight: "500", marginHorizontal: 5, color: Colors.black },
});