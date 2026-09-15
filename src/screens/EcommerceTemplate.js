import {
    View,
    Text,
    StyleSheet,
    Image,
    FlatList,
    TouchableOpacity,
    Alert,
    ScrollView,
    Keyboard,
} from "react-native";
import React, { useContext, useEffect, useRef, useState } from "react";
import BlueHeader from "../components/BlueHeader";
import { Colors } from "../constants/color";
import { Dropdown } from "react-native-element-dropdown";
import { Images } from "../constants/images";
import { FONTS } from "../constants/fontFamily";
import { RFValue } from "react-native-responsive-fontsize";
import { useTranslation } from "react-i18next";
import { getData } from "../utils/storeData";
import ApiService from "../utils/Apiservice";
import apiConstants from "../api/apiConstants";
import { RegisterBackContext } from "../constants/GoBackContext";
import { useIsFocused } from "@react-navigation/native";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";
import { DocumentPicker, types } from '@react-native-documents/picker';
import {
    heightPercentageToDP,
    widthPercentageToDP,
} from "react-native-responsive-screen";
import Loader from "../components/loading";
import Input from "../components/input";
import { get } from "react-native/Libraries/TurboModule/TurboModuleRegistry";
import {
    RichEditor,
    RichToolbar,
    actions,
} from "react-native-pell-rich-editor";
import axios from "axios";

export default function EcommerceTemplate({ navigation, route }) {
    const { color } = route.params;
    const [AllDropTemplateData, setAllDropTemplateData] = useState([]);
    const [SelectDropTemplate, setSelectDropTemplate] = useState(null);
    const [TemplateError, setTemplateError] = useState("");

    const [GetCategorysData, setGetCategorysData] = useState([]);
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const { t } = useTranslation();
    const { setToast } = useContext(RegisterBackContext);
    const Focused = useIsFocused();
    const [isFocus, setIsFocus] = useState(false);
    const [isFocus1, setIsFocus1] = useState(false);
    const [isFocus2, setIsFocus2] = useState(false);
    const [AllSelectImage, setAllSelectImage] = useState([]);
    const [DropDataLoader, setDropDataLoader] = useState(false);
    const [SelectDropLoader, setSelectDropLoader] = useState(false);
    // Value From Input
    const [Title, setTitle] = useState("");
    const [TitleError, setTitleError] = useState("");
    const [Price, setPrice] = useState("");
    const [PriceError, setPriceError] = useState("");
    const [Categorys, setCategorys] = useState("");
    const [CategorysError, setCategorysError] = useState("");
    // const [SubCategory, setSubCategory] = useState("");
    const [SubCategoryError, setSubCategoryError] = useState("");
    const [Description, setDescription] = useState("");
    const [DescriptionError, setDescriptionError] = useState("");
    const richTextRef = useRef();
    const [IsLoading, setIsLoading] = useState(false);
    const [SubCategory, setSubCategory] = useState([]); // multiple

    const GetAllDropTemplateFun = async () => {
        const getdata = await getData("USERDATA");

        try {
            const res = await ApiService(apiConstants.get_all_templates, {
                customData: {
                    token: getdata.data?.user.verify_token,
                },
            });
            console.log("GetAll", res);
            if (res?.status) {
                setAllDropTemplateData(res?.data || []);
            } else {
                setToast({
                    top: 45,
                    text: res?.message,
                    type: "error",
                    visible: true,
                });
            }
        } catch (error) {
            console.log("GetAllDropTemplateFun Error:-", error);
            setToast({
                top: 45,
                text: error?.message,
                type: "error",
                visible: true,
            });
        }
    };

    const GetCategoryDataFun = async () => {
        const getdata = await getData("USERDATA");

        try {
            const res = await ApiService(apiConstants.get_all_templates_categorys, {
                customData: {
                    token: getdata.data?.user.verify_token,
                },
            });
            console.log("GetCategoryDataFun", res.data);
            if (res?.status) {
                setGetCategorysData(res?.data || []);
            } else {
                setToast({
                    top: 45,
                    text: res?.message,
                    type: "error",
                    visible: true,
                });
            }
        } catch (error) {
            console.log("GetCategoryDataFun Error:-", error);
            setToast({
                top: 45,
                text: error?.message,
                type: "error",
                visible: true,
            });
        }
    };

    const openCamera = () => {
        navigation.navigate("CustomCamera", {
            setData: (newPhotos) => {
                setAllSelectImage((prev) => [...prev, ...newPhotos]);
            },
        });
    };

    const getFileImageSource = (file) => {
        if (!file) return null;

        if (typeof file === "string") {
            return { uri: file };
        }

        if (file.uri) {
            return { uri: file.uri };
        }

        if (file.shared_link) {
            return { uri: getDropboxDirectLink(file.shared_link) };
        }

        const type = (file.type || "").toLowerCase();
        const ext = (file.file_extension || "").toLowerCase();

        const imageExt = ["jpg", "jpeg", "png", "webp", "gif"];
        const isImage = type.includes("image") || imageExt.includes(ext);
        const isPdf = type.includes("pdf") || ext === "pdf";

        if (isImage) {
            return file.uri ? { uri: file.uri } : null;
        } else if (isPdf) {
            return Images.pdflogo;
        } else {
            return Images.documentlogo;
        }
    };

    const OnSave = async () => {
        if (!SelectDropTemplate) {
            setTemplateError(t("Please select template"));
            return;
        }

        if (Categorys?.parentsub?.length > 0 && !SubCategory?.id) {
            setSubCategoryError(t("Please select subcategory"));
            return;
        }
        if (Title.trim() === "") {
            setTitleError(t("Please enter title"));
            return;
        }
        if (Price.trim() === "") {
            setPriceError(t("Please enter price"));
            return;
        }
        if (Categorys?.category_name?.trim() === "") {
            setCategorysError(t("Please select category"));
            return;
        }
        if (Description.trim() === "") {
            setDescriptionError(t("Please enter description"));
            return;
        }
        setIsLoading(true);
        const getdata = await getData("USERDATA");
        const formData = new FormData();

        formData.append("token", getdata.data?.user.verify_token);
        formData.append("template_id", SelectDropTemplate?.id);
        formData.append("name", Title);
        formData.append("price", Price);
        // Use subcategory ID if selected, otherwise use main category ID
        formData.append("category_id", Categorys?.id);
        formData.append(
            "sub_category_id",
            SubCategory.map((item) => item.id).join(",")
        );
        // formData.append("sub_category_id", SubCategory?.id);
        formData.append("description", Description);

        AllSelectImage?.forEach((img, index) => {
            const ext = img.type?.split("/")[1] || "jpg";
            const uniqueName = `img_${Date.now()}_${index}.${ext}`;

            formData.append("images[]", {
                uri: img.uri,
                type: img.type,
                name: uniqueName,
            });
        });

        console.log("formData", formData);

        try {
            const res = await axios.post(
                apiConstants.create_from_template,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );
            console.log(res, "res");

            if (res?.status) {
                setToast({
                    top: 45,
                    text: res?.data?.message,
                    type: "success",
                    visible: true,
                });
                setDescription("");
                setTitle("");
                setPrice("");
                setCategorys("");
                setSubCategory("");
                setAllSelectImage([]);
                setSelectDropTemplate(null);
                richTextRef.current?.setContentHTML("");
            } else {
                setToast({
                    top: 45,
                    text: res?.data?.message,
                    type: "error",
                    visible: true,
                });
            }
        } catch (error) {
            setToast({
                top: 45,
                text: error?.message,
                type: "error",
                visible: true,
            });
            console.log("ECommerce Template OnSave Error:-", error);
        } finally {
            setIsLoading(false);
        }
    };

    const getDropboxDirectLink = (url) => {
        if (!url) return "";
        let directUrl = url.replace("www.dropbox.com", "dl.dropboxusercontent.com");
        directUrl = directUrl.replace("?dl=0", "").replace("?dl=1", "");
        return directUrl;
    };

    const openGallery = () => {
        const options = {
            mediaType: "photo",
            quality: 1,
            selectionLimit: 0,
        };

        launchImageLibrary(options, (response) => {
            if (response.didCancel || response.errorCode) return;

            const images = response.assets.map((image, index) => {
                // Fix for iOS: remove double "file://" issue
                const cleanUri =
                    Platform.OS === "ios" ? image.uri?.replace("file://", "") : image.uri;

                // Extract extension
                const ext =
                    image.fileName?.split(".").pop() ||
                    (image.type === "image/png" ? "png" : "jpg");

                const fileName =
                    image.fileName || `gallery_${Date.now()}_${index}.${ext}`;

                return {
                    uri: cleanUri,
                    name: fileName,
                    type: image.type || `image/${ext}`,
                };
            });

            setAllSelectImage((prev) => [...prev, ...images]);
        });
    };

  const openDocument = async () => {
  try {
    const result = await DocumentPicker.pick({
      type: [types.allFiles], // pehle DocumentPicker.types.allFiles
      allowMultiSelection: true, // multiple files
    });

    // result array ko state me map karke store kar rahe hain
    setAllSelectImage((prev) => [
      ...prev,
      ...result.map(file => ({
        uri: file.uri,
        name: file.name,
        type: file.mimeType, // file.type -> file.mimeType
      }))
    ]);

  } catch (err) {
    if (DocumentPicker.isCancel(err)) {
      console.log("User cancelled document picker");
    } else {
      console.log("Document picker error: ", err);
    }
  }
};


    const handleFileSelection = async () => {
        Alert.alert(
            t("Select Option"),
            t("Choose an option"),
            [
                { text: t("Camera"), onPress: openCamera },
                { text: t("Gallery"), onPress: openGallery },
                // { text: t("Files (PDF/DOC)"), onPress: openDocument },
                { text: t("Cancel"), style: "cancel" },
            ],
            { cancelable: true }
        );
    };

    useEffect(() => {
        if (AllDropTemplateData?.length == 0 && Focused) {
            GetAllDropTemplateFun();
        }
        if (GetCategorysData?.length == 0 && Focused) {
            GetCategoryDataFun();
        }
        const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
            setKeyboardVisible(true);
        });

        const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
            setKeyboardVisible(false);
        });

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);

    const getSelectedSubCategoryNames = () => {
        if (!SubCategory?.length) return "";

        // SubCategory is already an array of objects, just extract names
        return SubCategory.map((item) => item.category_name).join(", ");
    };
    // console.log(getSelectedSubCategoryNames(), "getSelectedSubCategoryNames");

    return (
        <View style={styles.container}>
            <BlueHeader
                Righticon={Images.refresh}
                onPressRight={GetAllDropTemplateFun}
                title={t("Ecommerce Template")}
                bgcolor={color ? color : Colors.primary}
            />
            {DropDataLoader ? (
                <Loader />
            ) : (
                <ScrollView
                    style={styles.WrapperContainer}
                    contentContainerStyle={{
                        paddingBottom: keyboardVisible ? heightPercentageToDP(40) : 110,
                    }}
                >
                    <View style={[styles.SimpleFlex, { marginBottom: 5 }]}>
                        <Text style={styles.Text}>{t("Select Template")}</Text>
                        <Text style={{ color: Colors.red }}>*</Text>
                    </View>

                    <Dropdown
                        style={[
                            styles.dropdown,
                            isFocus && { borderColor: Colors.primary },
                        ]}
                        placeholderStyle={styles.placeholderStyle}
                        selectedTextStyle={styles.selectedTextStyle}
                        inputSearchStyle={styles.searchInput}
                        iconStyle={styles.iconStyle}
                        search
                        data={AllDropTemplateData}
                        maxHeight={300}
                        labelField="product_name"
                        valueField="product_name"
                        placeholder={SelectDropTemplate ? "" : t("Select Template")}
                        searchPlaceholder="Search..."
                        value={SelectDropTemplate}
                        onFocus={() => setIsFocus(true)}
                        onBlur={() => setIsFocus(false)}
                        onChange={(item) => {
                            setSelectDropTemplate(item);

                            // CATEGORY AUTO SELECT
                            const categoryObj = GetCategorysData?.find(
                                (el) => Number(el.id) === Number(item?.product_parent)
                            );
                            setCategorys(categoryObj || "");

                            // SUB CATEGORY IDS → ARRAY
                            const subCategoryIds = item?.sub_category
                                ? item.sub_category.split(",").map((id) => Number(id))
                                : [];

                            if (
                                categoryObj?.parentsub?.length > 0 &&
                                subCategoryIds.length > 0
                            ) {
                                const matchedSubs = categoryObj.parentsub.filter((sub) =>
                                    subCategoryIds.includes(Number(sub.id))
                                );
                                setSubCategory(matchedSubs); // ✅ Array of objects
                            } else {
                                setSubCategory([]); // ✅ Empty array, NOT empty string
                            }

                            // DESCRIPTION
                            richTextRef.current?.setContentHTML(
                                item?.product_discription || ""
                            );
                            setDescription(item?.product_discription || "");
                            setIsFocus(false);
                        }}
                        // onChange={(item) => {
                        //     setSelectDropTemplate(item);

                        //     // CATEGORY AUTO SELECT
                        //     const categoryObj = GetCategorysData?.find(
                        //         el => Number(el.id) === Number(item?.product_parent)
                        //     );
                        //     setCategorys(categoryObj || "");

                        //     // SUB CATEGORY IDS → ARRAY
                        //     const subCategoryIds = item?.sub_category
                        //         ? item.sub_category.split(",").map(id => Number(id))
                        //         : [];

                        //     if (categoryObj?.parentsub?.length > 0 && subCategoryIds.length > 0) {
                        //         const matchedSubs = categoryObj.parentsub.filter(sub =>
                        //             subCategoryIds.includes(Number(sub.id))
                        //         );
                        //         setSubCategory(matchedSubs); // ✅ This sets array of objects
                        //     } else {
                        //         setSubCategory([]);
                        //     }

                        //     // DESCRIPTION
                        //     richTextRef.current?.setContentHTML(
                        //         item?.product_discription || ""
                        //     );
                        //     setDescription(item?.product_discription || "");
                        // }
                        // }
                        // onChange={(item) => {
                        //     setSelectDropTemplate(item);

                        //     // category auto set
                        //     const categoryObj = GetCategorysData?.find(
                        //         el => Number(el.id) === Number(item?.product_parent)
                        //     );
                        //     setCategorys(categoryObj || "");

                        //     // sub_category ids array
                        //     const subCategoryIds = item?.sub_category
                        //         ? item.sub_category.split(",").map(id => Number(id))
                        //         : [];

                        //     if (categoryObj?.parentsub?.length > 0 && subCategoryIds.length > 0) {
                        //         // single select (first matched)
                        //         const matchedSub = categoryObj.parentsub.find(
                        //             sub => subCategoryIds.includes(Number(sub.id))
                        //         );
                        //         setSubCategory(matchedSub || "");
                        //     } else {
                        //         setSubCategory("");
                        //     }

                        //     // description
                        //     richTextRef.current?.setContentHTML(
                        //         item?.product_discription || ""
                        //     );
                        //     setDescription(item?.product_discription || "");

                        //     setIsFocus(false);
                        // }}

                        renderRightIcon={() => (
                            <Image
                                source={Images.down}
                                style={{ height: 18, width: 18, tintColor: Colors.black }}
                            />
                        )}
                        renderItem={(item) => (
                            <View style={styles.item}>
                                <Text style={styles.itemText}>{item?.product_name || "-"}</Text>
                            </View>
                        )}
                    />
                    {TemplateError ? (
                        <Text
                            style={{
                                color: Colors.red,
                                fontSize: RFValue(10),
                                fontFamily: FONTS.LexendRegular,
                                marginTop: RFValue(1),
                            }}
                        >
                            {TemplateError}
                        </Text>
                    ) : null}

                    <View style={[styles.SimpleFlex, { marginTop: 10 }]}>
                        <Text style={[styles.Text, { marginVertical: 5 }]}>
                            {t("Select Category")}
                        </Text>
                        <Text style={{ color: Colors.red }}>*</Text>
                    </View>
                    <Dropdown
                        style={[
                            styles.dropdown,
                            isFocus1 && { borderColor: Colors.primary },
                        ]}
                        placeholderStyle={styles.placeholderStyle}
                        selectedTextStyle={styles.selectedTextStyle}
                        inputSearchStyle={styles.searchInput}
                        iconStyle={styles.iconStyle}
                        search
                        data={GetCategorysData}
                        maxHeight={300}
                        labelField="category_name"
                        valueField="category_name"
                        placeholder={Categorys ? "" : t("Select Category")}
                        searchPlaceholder="Search..."
                        value={Categorys}
                        onFocus={() => setIsFocus1(true)}
                        onBlur={() => setIsFocus1(false)}
                        onChange={(item) => {
                            setCategorys(item || "");
                            setSubCategory([]); // ✅ Reset to empty array, not empty string
                            setIsFocus1(false);
                        }}
                        renderRightIcon={() => (
                            <Image
                                source={Images.down}
                                style={{ height: 18, width: 18, tintColor: Colors.black }}
                            />
                        )}
                        renderItem={(item) => (
                            <View style={styles.item}>
                                <Text style={styles.itemText}>
                                    {item?.category_name || "-"}
                                </Text>
                            </View>
                        )}
                    />

                    {/* Subcategory Dropdown - Only show if category has subcategories */}
                    {Categorys &&
                        Categorys?.parentsub &&
                        Categorys?.parentsub?.length > 0 && (
                            <>
                                <View style={[styles.SimpleFlex, { marginTop: 10 }]}>
                                    <Text style={[styles.Text, { marginVertical: 5 }]}>
                                        {t("Select Subcategory")}
                                    </Text>
                                </View>
                                <Dropdown
                                    style={[
                                        styles.dropdown,
                                        isFocus2 && { borderColor: Colors.primary },
                                    ]}
                                    multiple
                                    placeholderStyle={[
                                        styles.placeholderStyle,
                                        {
                                            color:
                                                SubCategory?.length > 0 ? Colors.black : Colors.gray,
                                        },
                                    ]}
                                    selectedTextStyle={styles.selectedTextStyle}
                                    inputSearchStyle={styles.searchInput}
                                    iconStyle={styles.iconStyle}
                                    search
                                    data={Categorys?.parentsub || []}
                                    maxHeight={300}
                                    labelField="category_name"
                                    valueField="id"
                                    placeholder={
                                        SubCategory?.length > 0
                                            ? getSelectedSubCategoryNames()
                                            : t("Select Subcategory")
                                    }
                                    searchPlaceholder="Search..."
                                    value={SubCategory}
                                    onFocus={() => setIsFocus2(true)}
                                    onBlur={() => setIsFocus2(false)}
                                    onChange={(selectedItems) => {
                                        const newItems = Array.isArray(selectedItems)
                                            ? selectedItems
                                            : selectedItems
                                                ? [selectedItems]
                                                : [];

                                        setSubCategory((prev) => {
                                            const prevItems = Array.isArray(prev) ? prev : [];

                                            let updated = [...prevItems];

                                            newItems.forEach((item) => {
                                                const exists = updated.find((p) => p.id === item.id);

                                                if (exists) {
                                                    // already selected → REMOVE
                                                    updated = updated.filter((p) => p.id !== item.id);
                                                } else {
                                                    // not selected → ADD
                                                    updated.push(item);
                                                }
                                            });

                                            return updated;
                                        });

                                        setSubCategoryError("");
                                    }}


                                    renderRightIcon={() => (
                                        <Image
                                            source={Images.down}
                                            style={{ height: 18, width: 18, tintColor: Colors.black }}
                                        />
                                    )}
                                    renderItem={(item) => {
                                        const isSelected =
                                            Array.isArray(SubCategory) &&
                                            SubCategory.some((sub) => sub.id === item.id);
                                        return (
                                            <View
                                                style={[
                                                    styles.item,
                                                    {
                                                        flexDirection: "row",
                                                        alignItems: "center",
                                                        justifyContent: "space-between",
                                                    },
                                                ]}
                                            >
                                                <Text style={styles.itemText}>
                                                    {item?.category_name || "-"}
                                                </Text>
                                                {isSelected && (
                                                    <Text style={{ color: Colors.primary, fontSize: 16 }}>
                                                        ✓
                                                    </Text>
                                                )}
                                            </View>
                                        );
                                    }}
                                />
                            </>
                        )}

                    <View style={{ marginTop: 20, gap: 10 }}>
                        <Input
                            value={Title}
                            onChangeText={(txt) => {
                                setTitle(txt);
                                setTitleError("");
                            }}
                            keyboardType="default"
                            required={t("Title")}
                            error={TitleError}
                            backgroundColor={Colors.white}
                            placeholder={"Title"}
                        />

                        <Input
                            value={Price}
                            onChangeText={(txt) => {
                                if (!isNaN(txt)) {
                                    setPrice(txt);
                                    setPriceError("");
                                } else {
                                    setPriceError(t("Please enter a valid price"));
                                }
                            }}
                            keyboardType="numeric"
                            required={t("Price")}
                            error={PriceError}
                            backgroundColor={Colors.white}
                            placeholder={"Enter Price"}
                        />
                        <View style={{}}>
                            <View style={[styles.SimpleFlex1, { marginTop: 10 }]}>
                                <View style={[styles.SimpleFlex, { marginBottom: 5, gap: 0 }]}>
                                    <Text style={styles.Text}>{t("Description")}</Text>
                                    <Text style={{ color: Colors.red }}>*</Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => {
                                        setDescription(""); // state clear
                                        richTextRef.current?.setContentHTML(""); // editor maathi html pan clear
                                    }}
                                >
                                    <Image
                                        source={Images.trash}
                                        style={{ height: 20, width: 20, tintColor: Colors.black }}
                                    />
                                </TouchableOpacity>
                            </View>
                            <RichEditor
                                scrollEnabled={false}
                                ref={richTextRef}
                                androidHardwareAccelerationDisabled={false}
                                initialContentHTML={Description}
                                onChange={(html) => {
                                    setDescription(html);
                                    setDescriptionError("");
                                }}
                                placeholder="Enter Description"
                                editorStyle={{
                                    color: Colors.black,
                                    placeholderColor: Colors.gray,
                                    contentCSSText: `
                                            font-size: 14px;
                                            height:120px;
                                            padding: 10px;
                                        `,
                                }}
                                style={{
                                    borderWidth: 1,
                                    borderColor: DescriptionError ? Colors.red : Colors.litegray,
                                    borderRadius: 8,
                                    backgroundColor: Colors.white,
                                }}
                            />

                            {/* --- TOOLBAR / FORMATTING BUTTONS --- */}
                            <RichToolbar
                                editor={richTextRef}
                                selectedIconTint={Colors.primary}
                                iconTint={Colors.black}
                                actions={[
                                    actions.setBold,
                                    actions.setItalic,
                                    actions.setUnderline,
                                    actions.heading1,
                                    actions.heading2,
                                    actions.insertBulletsList,
                                    actions.insertOrderedList,
                                    actions.undo,
                                    actions.redo,
                                ]}
                                style={{
                                    borderWidth: 1,
                                    borderColor: Colors.litegray,
                                    marginTop: 10,
                                    borderRadius: 8,
                                }}
                            />
                        </View>
                    </View>

                    {AllSelectImage?.length > 0 && (
                        <FlatList
                            data={AllSelectImage}
                            numColumns={3}
                            columnWrapperStyle={{ gap: 15, marginBottom: 10 }}
                            keyExtractor={(item, index) =>
                                item?.id?.toString() || index.toString()
                            }
                            contentContainerStyle={styles.ImageContainer}
                            renderItem={({ item, index }) => (
                                <View style={styles.Image}>
                                    <Image
                                        source={getFileImageSource(item)}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                        }}
                                    />
                                    <TouchableOpacity
                                        style={styles.CloseBtn}
                                        onPress={() => {
                                            setAllSelectImage((prev) =>
                                                prev.filter((_, i) => i !== index)
                                            );
                                        }}
                                    >
                                        <Image
                                            source={Images.close}
                                            style={{ width: "70%", height: "70%" }}
                                            tintColor={Colors.white}
                                        />
                                    </TouchableOpacity>
                                </View>
                            )}
                        />
                    )}

                    <TouchableOpacity
                        onPress={handleFileSelection}
                        style={[styles.Button, { marginTop: 20 }]}
                    >
                        <Text style={styles.ButtonText}>{t("Upload Photos")}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={OnSave}
                        style={styles.Button}
                        disabled={IsLoading}
                    >
                        <Text style={styles.ButtonText}>{t("Submit")}</Text>
                    </TouchableOpacity>
                </ScrollView>
            )}
            {IsLoading && <Loader />}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    WrapperContainer: {
        padding: 15,
    },
    dropdown: {
        height: 50,
        borderColor: Colors.litegray,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        backgroundColor: Colors.white,
    },
    placeholderStyle: {
        fontSize: 14,
        color: Colors.gray,
        fontFamily: FONTS.LexendMedium,
    },
    selectedTextStyle: {
        fontSize: 14,
        color: Colors.black,
        fontFamily: FONTS.LexendMedium,
    },
    iconStyle: {
        width: 20,
        height: 20,
    },
    searchInput: {
        height: 45,
        fontSize: 14,
        color: Colors.black,
        fontFamily: FONTS.LexendMedium,
    },
    item: {
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderBottomWidth: 0.6,
        borderBottomColor: Colors.litegray,
    },
    itemText: {
        fontSize: 14,
        color: Colors.black,
        fontFamily: FONTS.LexendMedium,
    },
    SimpleFlex: {
        flexDirection: "row",
        gap: 10,
        alignItems: "center",
    },
    SimpleFlex1: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    Text: {
        fontSize: 14,
        fontFamily: FONTS.LexendMedium,
        color: Colors.black,
    },
    Image: {
        width: widthPercentageToDP(28),
        height: widthPercentageToDP(28),
        borderRadius: 8,
        overflow: "hidden",
        backgroundColor: "#f0f0f0",
    },
    ImageContainer: {
        paddingVertical: 15,
        gap: 15,
    },
    Button: {
        backgroundColor: Colors.primary,
        height: 48,
        borderRadius: 10,
        paddingHorizontal: 16,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        marginTop: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    ButtonText: {
        color: Colors.white,
        fontFamily: FONTS.LexendMedium,
        fontSize: 14,
        letterSpacing: 0.2,
    },
    ButtonIcon: {
        marginRight: 8,
    },
    CloseBtn: {
        position: "absolute",
        top: 5,
        right: 5,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Colors.red,
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
    },
});

// import {
//     View,
//     Text,
//     StyleSheet,
//     Image,
//     FlatList,
//     TouchableOpacity,
//     Alert,
//     ScrollView,
//     Keyboard,
// } from "react-native";
// import React, { useContext, useEffect, useRef, useState } from "react";
// import BlueHeader from "../components/BlueHeader";
// import { Colors } from "../constants/color";
// import { Dropdown } from "react-native-element-dropdown";
// import { Images } from "../constants/images";
// import { FONTS } from "../constants/fontFamily";
// import { RFValue } from "react-native-responsive-fontsize";
// import { useTranslation } from "react-i18next";
// import { getData } from "../utils/storeData";
// import ApiService from "../utils/Apiservice";
// import apiConstants from "../api/apiConstants";
// import { RegisterBackContext } from "../constants/GoBackContext";
// import { useIsFocused } from "@react-navigation/native";
// import { launchCamera, launchImageLibrary } from "react-native-image-picker";
// import DocumentPicker from "react-native-document-picker";
// import {
//     heightPercentageToDP,
//     widthPercentageToDP,
// } from "react-native-responsive-screen";
// import Loader from "../components/loading";
// import Input from "../components/input";
// import { get } from "react-native/Libraries/TurboModule/TurboModuleRegistry";
// import {
//     RichEditor,
//     RichToolbar,
//     actions,
// } from "react-native-pell-rich-editor";
// import axios from "axios";

// export default function EcommerceTemplate({ navigation, route }) {
//     const { color } = route.params
//     const [AllDropTemplateData, setAllDropTemplateData] = useState([]);
//     const [SelectDropTemplate, setSelectDropTemplate] = useState(null);
//     const [GetCategorysData, setGetCategorysData] = useState([]);
//     const [keyboardVisible, setKeyboardVisible] = useState(false);
//     const { t } = useTranslation();
//     const { setToast } = useContext(RegisterBackContext);
//     const Focused = useIsFocused();
//     const [isFocus, setIsFocus] = useState(false);
//     const [isFocus1, setIsFocus1] = useState(false);
//     const [AllSelectImage, setAllSelectImage] = useState([]);
//     const [DropDataLoader, setDropDataLoader] = useState(false);
//     const [SelectDropLoader, setSelectDropLoader] = useState(false);
//     // Value From Input
//     const [Title, setTitle] = useState("");
//     const [TitleError, setTitleError] = useState("");
//     const [Price, setPrice] = useState("");
//     const [PriceError, setPriceError] = useState("");
//     const [Categorys, setCategorys] = useState("");
//     const [CategorysError, setCategorysError] = useState("");
//     const [Description, setDescription] = useState("");
//     const [DescriptionError, setDescriptionError] = useState("");
//     const richTextRef = useRef();
//     const [IsLoading, setIsLoading] = useState(false);

//     const GetAllDropTemplateFun = async () => {
//         const getdata = await getData("USERDATA");

//         try {
//             const res = await ApiService(apiConstants.get_all_templates, {
//                 customData: {
//                     token: getdata.data?.user.verify_token,
//                 },
//             });
//             console.log("GetAll", res);
//             if (res?.status) {
//                 setAllDropTemplateData(res?.data || []);
//             } else {
//                 setToast({
//                     top: 45,
//                     text: res?.message,
//                     type: "error",
//                     visible: true,
//                 });
//             }
//         } catch (error) {
//             console.log("GetAllDropTemplateFun Error:-", error);
//             setToast({
//                 top: 45,
//                 text: error?.message,
//                 type: "error",
//                 visible: true,
//             });
//         }
//     };

//     const GetCategoryDataFun = async () => {
//         const getdata = await getData("USERDATA");

//         try {
//             const res = await ApiService(apiConstants.get_all_templates_categorys, {
//                 customData: {
//                     token: getdata.data?.user.verify_token,
//                 },
//             });
//             console.log("GetCategoryDataFun", res.data);
//             if (res?.status) {
//                 setGetCategorysData(res?.data || []);
//             } else {
//                 setToast({
//                     top: 45,
//                     text: res?.message,
//                     type: "error",
//                     visible: true,
//                 });
//             }
//         } catch (error) {
//             console.log("GetCategoryDataFun Error:-", error);
//             setToast({
//                 top: 45,
//                 text: error?.message,
//                 type: "error",
//                 visible: true,
//             });
//         }
//     };

//     const openCamera = () => {
//         navigation.navigate("CustomCamera", {
//             setData: (newPhotos) => {
//                 setAllSelectImage((prev) => [...prev, ...newPhotos]);
//             },
//         });
//     };

//     const getFileImageSource = (file) => {
//         if (!file) return null;

//         if (typeof file === "string") {
//             return { uri: file };
//         }

//         if (file.uri) {
//             return { uri: file.uri };
//         }

//         if (file.shared_link) {
//             return { uri: getDropboxDirectLink(file.shared_link) };
//         }

//         const type = (file.type || "").toLowerCase();
//         const ext = (file.file_extension || "").toLowerCase();

//         const imageExt = ["jpg", "jpeg", "png", "webp", "gif"];
//         const isImage = type.includes("image") || imageExt.includes(ext);
//         const isPdf = type.includes("pdf") || ext === "pdf";

//         if (isImage) {
//             return file.uri ? { uri: file.uri } : null;
//         } else if (isPdf) {
//             return Images.pdflogo;
//         } else {
//             return Images.documentlogo;
//         }
//     };

//     const OnSave = async () => {
//         if (Title.trim() === "") {
//             setTitleError(t("Please enter title"));
//             return;
//         }
//         if (Price.trim() === "") {
//             setPriceError(t("Please enter price"));
//             return;
//         }
//         if (Categorys?.category_name?.trim() === "") {
//             setCategorysError(t("Please select category"));
//             return;
//         }
//         if (Description.trim() === "") {
//             setDescriptionError(t("Please enter description"));
//             return;
//         }
//         setIsLoading(true);
//         const getdata = await getData("USERDATA");
//         const formData = new FormData();

//         formData.append("token", getdata.data?.user.verify_token);
//         formData.append("template_id", SelectDropTemplate?.id);
//         formData.append("name", Title);
//         formData.append("price", Price);
//         formData.append("category_id", Categorys?.id);
//         formData.append("description", Description);

//         AllSelectImage?.forEach((img, index) => {
//             const ext = img.type?.split("/")[1] || "jpg";
//             const uniqueName = `img_${Date.now()}_${index}.${ext}`;

//             formData.append("images[]", {
//                 uri: img.uri,
//                 type: img.type,
//                 name: uniqueName,
//             });
//         });

//         console.log("formData", formData);

//         try {
//             const res = await axios.post(
//                 apiConstants.create_from_template,
//                 formData,
//                 {
//                     headers: {
//                         "Content-Type": "multipart/form-data",
//                     },
//                 }
//             );
//             console.log(res, "res");

//             if (res?.status) {
//                 setToast({
//                     top: 45,
//                     text: res?.data?.message,
//                     type: "success",
//                     visible: true,
//                 });
//                 setDescription("");
//                 setTitle("");
//                 setPrice("");
//                 setCategorys("");
//                 setAllSelectImage([]);
//                 setSelectDropTemplate(null);
//                 richTextRef.current?.setContentHTML("");
//             } else {
//                 setToast({
//                     top: 45,
//                     text: res?.data?.message,
//                     type: "error",
//                     visible: true,
//                 });
//             }
//         } catch (error) {
//             setToast({
//                 top: 45,
//                 text: error?.message,
//                 type: "error",
//                 visible: true,
//             });
//             console.log("ECommerce Template OnSave Error:-", error);
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     const getDropboxDirectLink = (url) => {
//         if (!url) return "";
//         let directUrl = url.replace("www.dropbox.com", "dl.dropboxusercontent.com");
//         directUrl = directUrl.replace("?dl=0", "").replace("?dl=1", "");
//         return directUrl;
//     };

//     const openGallery = () => {
//         const options = {
//             mediaType: "photo",
//             quality: 1,
//             selectionLimit: 0,
//         };

//         launchImageLibrary(options, (response) => {
//             if (response.didCancel || response.errorCode) return;

//             const images = response.assets.map((image, index) => {
//                 // Fix for iOS: remove double "file://" issue
//                 const cleanUri =
//                     Platform.OS === "ios" ? image.uri?.replace("file://", "") : image.uri;

//                 // Extract extension
//                 const ext =
//                     image.fileName?.split(".").pop() ||
//                     (image.type === "image/png" ? "png" : "jpg");

//                 const fileName =
//                     image.fileName || `gallery_${Date.now()}_${index}.${ext}`;

//                 return {
//                     uri: cleanUri,
//                     name: fileName,
//                     type: image.type || `image/${ext}`,
//                 };
//             });

//             setAllSelectImage((prev) => [...prev, ...images]);
//         });
//     };

//     const openDocument = async () => {
//         try {
//             const result = await DocumentPicker.pick({
//                 type: [DocumentPicker.types.allFiles],
//                 allowMultiSelection: true,
//             });

//             // result array return करेगा
//             setAllSelectImage((prev) => [...prev, ...result]);
//         } catch (err) {
//             if (DocumentPicker.isCancel(err)) {
//                 console.log("User cancelled document picker");
//             } else {
//                 console.log("Document picker error: ", err);
//             }
//         }
//     };

//     const handleFileSelection = async () => {
//         Alert.alert(
//             t("Select Option"),
//             t("Choose an option"),
//             [
//                 // { text: t("Camera"), onPress: openCamera },
//                 { text: t("Gallery"), onPress: openGallery },
//                 // { text: t("Files (PDF/DOC)"), onPress: openDocument },
//                 { text: t("Cancel"), style: "cancel" },
//             ],
//             { cancelable: true }
//         );
//     };

//     useEffect(() => {
//         if (AllDropTemplateData?.length == 0 && Focused) {
//             GetAllDropTemplateFun();
//         }
//         if (GetCategorysData?.length == 0 && Focused) {
//             GetCategoryDataFun();
//         }
//         const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
//             setKeyboardVisible(true);
//         });

//         const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
//             setKeyboardVisible(false);
//         });

//         return () => {
//             showSubscription.remove();
//             hideSubscription.remove();
//         };
//     }, []);
//     return (
//         <View style={styles.container}>
//             <BlueHeader
//                 Righticon={Images.refresh}
//                 onPressRight={GetAllDropTemplateFun}
//                 title={t("Ecommerce Template")}
//                 bgcolor={color ? color : Colors.primary}
//             />
//             {DropDataLoader ? (
//                 <Loader />
//             ) : (
//                 <ScrollView
//                     style={styles.WrapperContainer}
//                     contentContainerStyle={{
//                         paddingBottom: keyboardVisible ? heightPercentageToDP(40) : 110,
//                     }}
//                 >
//                     <View style={[styles.SimpleFlex, { marginBottom: 5 }]}>
//                         <Text style={styles.Text}>{t("Select Template")}</Text>
//                         <Text style={{ color: Colors.red }}>*</Text>
//                     </View>

//                     <Dropdown
//                         style={[
//                             styles.dropdown,
//                             isFocus && { borderColor: Colors.primary },
//                         ]}
//                         placeholderStyle={styles.placeholderStyle}
//                         selectedTextStyle={styles.selectedTextStyle}
//                         inputSearchStyle={styles.searchInput}
//                         iconStyle={styles.iconStyle}
//                         search
//                         data={AllDropTemplateData}
//                         maxHeight={300}
//                         labelField="product_name"
//                         valueField="product_name"
//                         placeholder={SelectDropTemplate ? "" : t("Select Template")}
//                         searchPlaceholder="Search..."
//                         value={SelectDropTemplate}
//                         onFocus={() => setIsFocus(true)}
//                         onBlur={() => setIsFocus(false)}
//                         onChange={(item) => {
//                             setSelectDropTemplate(item);
//                             // setTitle(item?.product_name || "");
//                             let priceString =
//                                 item?.product_stocks
//                                     ?.find((el) => el?.qty_type == "Single")
//                                     ?.unit_price?.toString() || null;
//                             if (!priceString) {
//                                 priceString =
//                                     item?.product_stocks?.[0]?.unit_price?.toString() || "";
//                             }

//                             setPrice(priceString);
//                             console.log(
//                                 "GetCategorysData",
//                                 GetCategorysData,
//                                 item?.product_parent
//                             );

//                             let categoryName = GetCategorysData?.find(
//                                 (el) => el?.id == item?.product_parent
//                             );
//                             setCategorys(categoryName || "");
//                             richTextRef.current?.setContentHTML(
//                                 item?.product_discription || ""
//                             );
//                             setDescription(item?.product_discription || "");
//                             setIsFocus(false);
//                         }}
//                         renderRightIcon={() => (
//                             <Image
//                                 source={Images.down}
//                                 style={{ height: 18, width: 18, tintColor: Colors.black }}
//                             />
//                         )}
//                         renderItem={(item) => (
//                             <View style={styles.item}>
//                                 <Text style={styles.itemText}>{item?.product_name || "-"}</Text>
//                             </View>
//                         )}
//                     />

//                     <View style={[styles.SimpleFlex, { marginTop: 10 }]}>
//                         <Text style={[styles.Text, { marginVertical: 5 }]}>
//                             {t("Select Category")}
//                         </Text>
//                         <Text style={{ color: Colors.red }}>*</Text>
//                     </View>
//                     <Dropdown
//                         style={[
//                             styles.dropdown,
//                             isFocus1 && { borderColor: Colors.primary },
//                         ]}
//                         placeholderStyle={styles.placeholderStyle}
//                         selectedTextStyle={styles.selectedTextStyle}
//                         inputSearchStyle={styles.searchInput}
//                         iconStyle={styles.iconStyle}
//                         search
//                         data={GetCategorysData}
//                         maxHeight={300}
//                         labelField="category_name"
//                         valueField="category_name"
//                         placeholder={Categorys ? "" : t("Select Category")}
//                         searchPlaceholder="Search..."
//                         value={Categorys}
//                         onFocus={() => setIsFocus1(true)}
//                         onBlur={() => setIsFocus1(false)}
//                         onChange={(item) => {
//                             setCategorys(item || "");
//                         }}
//                         renderRightIcon={() => (
//                             <Image
//                                 source={Images.down}
//                                 style={{ height: 18, width: 18, tintColor: Colors.black }}
//                             />
//                         )}
//                         renderItem={(item) => (
//                             <View style={styles.item}>
//                                 <Text style={styles.itemText}>
//                                     {item?.category_name || "-"}
//                                 </Text>
//                             </View>
//                         )}
//                     />

//                     <View style={{ marginTop: 20, gap: 10 }}>
//                         <Input
//                             value={Title}
//                             onChangeText={(txt) => {
//                                 setTitle(txt);
//                                 setTitleError("");
//                             }}
//                             keyboardType="default"
//                             required={t("Title")}
//                             error={TitleError}
//                             backgroundColor={Colors.white}
//                             placeholder={"Title"}
//                         />

//                         <Input
//                             value={Price}
//                             onChangeText={(txt) => {
//                                 if (!isNaN(txt)) {
//                                     setPrice(txt);
//                                     setPriceError("");
//                                 } else {
//                                     setPriceError(t("Please enter a valid price"));
//                                 }
//                             }}
//                             keyboardType="numeric"
//                             required={t("Price")}
//                             error={PriceError}
//                             backgroundColor={Colors.white}
//                             placeholder={"Enter Price"}
//                         />
//                         <View style={{}}>
//                             <View style={[styles.SimpleFlex, { marginBottom: 5, gap: 0 }]}>
//                                 <Text style={styles.Text}>{t("Description")}</Text>
//                                 <Text style={{ color: Colors.red }}>*</Text>
//                             </View>
//                             <RichEditor
//                                 scrollEnabled={false}
//                                 ref={richTextRef}
//                                 androidHardwareAccelerationDisabled={false}
//                                 initialContentHTML={Description}
//                                 onChange={(html) => {
//                                     setDescription(html);
//                                     setDescriptionError("");
//                                 }}
//                                 placeholder="Enter Description"
//                                 editorStyle={{
//                                     color: Colors.black,
//                                     placeholderColor: Colors.gray,
//                                     contentCSSText: `
//                                             font-size: 14px;
//                                             height:120px;
//                                             padding: 10px;
//                                         `,
//                                 }}
//                                 style={{
//                                     borderWidth: 1,
//                                     borderColor: DescriptionError ? Colors.red : Colors.litegray,
//                                     borderRadius: 8,
//                                     backgroundColor: Colors.white,
//                                 }}
//                             />

//                             {/* --- TOOLBAR / FORMATTING BUTTONS --- */}
//                             <RichToolbar
//                                 editor={richTextRef}
//                                 selectedIconTint={Colors.primary}
//                                 iconTint={Colors.black}
//                                 actions={[
//                                     actions.setBold,
//                                     actions.setItalic,
//                                     actions.setUnderline,
//                                     actions.heading1,
//                                     actions.heading2,
//                                     actions.insertBulletsList,
//                                     actions.insertOrderedList,
//                                     actions.undo,
//                                     actions.redo,
//                                 ]}
//                                 style={{
//                                     borderWidth: 1,
//                                     borderColor: Colors.litegray,
//                                     marginTop: 10,
//                                     borderRadius: 8,
//                                 }}
//                             />
//                         </View>
//                     </View>

//                     {AllSelectImage?.length > 0 && (
//                         <FlatList
//                             data={AllSelectImage}
//                             numColumns={3}
//                             columnWrapperStyle={{ gap: 15, marginBottom: 10 }}
//                             keyExtractor={(item, index) =>
//                                 item?.id?.toString() || index.toString()
//                             }
//                             contentContainerStyle={styles.ImageContainer}
//                             renderItem={({ item, index }) => (
//                                 <View style={styles.Image}>
//                                     <Image
//                                         source={getFileImageSource(item)}
//                                         style={{
//                                             width: "100%",
//                                             height: "100%",
//                                         }}
//                                     />
//                                     <TouchableOpacity
//                                         style={styles.CloseBtn}
//                                         onPress={() => {
//                                             setAllSelectImage((prev) =>
//                                                 prev.filter((_, i) => i !== index)
//                                             );
//                                         }}
//                                     >
//                                         <Image
//                                             source={Images.close}
//                                             style={{ width: "70%", height: "70%" }}
//                                             tintColor={Colors.white}
//                                         />
//                                     </TouchableOpacity>
//                                 </View>
//                             )}
//                         />
//                     )}

//                     <TouchableOpacity
//                         onPress={handleFileSelection}
//                         style={[styles.Button, { marginTop: 20 }]}
//                     >
//                         <Text style={styles.ButtonText}>{t("Upload Photos")}</Text>
//                     </TouchableOpacity>

//                     <TouchableOpacity
//                         onPress={OnSave}
//                         style={styles.Button}
//                         disabled={IsLoading}
//                     >
//                         <Text style={styles.ButtonText}>{t("Submit")}</Text>
//                     </TouchableOpacity>
//                 </ScrollView>
//             )}
//             {IsLoading && <Loader />}
//         </View>
//     );
// }

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//     },
//     WrapperContainer: {
//         padding: 15,
//     },
//     dropdown: {
//         height: 50,
//         borderColor: Colors.litegray,
//         borderWidth: 1,
//         borderRadius: 8,
//         paddingHorizontal: 10,
//         backgroundColor: Colors.white,
//     },
//     placeholderStyle: {
//         fontSize: 14,
//         color: Colors.gray,
//         fontFamily: FONTS.LexendMedium,
//     },
//     selectedTextStyle: {
//         fontSize: 14,
//         color: Colors.black,
//         fontFamily: FONTS.LexendMedium,
//     },
//     iconStyle: {
//         width: 20,
//         height: 20,
//     },
//     searchInput: {
//         height: 45,
//         fontSize: 14,
//         color: Colors.black,
//         fontFamily: FONTS.LexendMedium,
//     },
//     item: {
//         paddingVertical: 12,
//         paddingHorizontal: 10,
//         borderBottomWidth: 0.6,
//         borderBottomColor: Colors.litegray,
//     },
//     itemText: {
//         fontSize: 14,
//         color: Colors.black,
//         fontFamily: FONTS.LexendMedium,
//     },
//     SimpleFlex: {
//         flexDirection: "row",
//         gap: 10,
//         alignItems: "center",
//     },
//     Text: {
//         fontSize: 14,
//         fontFamily: FONTS.LexendMedium,
//         color: Colors.black,
//     },
//     Image: {
//         width: widthPercentageToDP(28),
//         height: widthPercentageToDP(28),
//         borderRadius: 8,
//         overflow: "hidden",
//         backgroundColor: "#f0f0f0",
//     },
//     ImageContainer: {
//         paddingVertical: 15,
//         gap: 15,
//     },
//     Button: {
//         backgroundColor: Colors.primary,
//         height: 48,
//         borderRadius: 10,
//         paddingHorizontal: 16,
//         alignItems: "center",
//         justifyContent: "center",
//         flexDirection: "row",
//         marginTop: 12,
//         shadowColor: "#000",
//         shadowOffset: { width: 0, height: 6 },
//         shadowOpacity: 0.08,
//         shadowRadius: 8,
//         elevation: 4,
//     },
//     ButtonText: {
//         color: Colors.white,
//         fontFamily: FONTS.LexendMedium,
//         fontSize: 14,
//         letterSpacing: 0.2,
//     },
//     ButtonIcon: {
//         marginRight: 8,
//     },
//     CloseBtn: {
//         position: "absolute",
//         top: 5,
//         right: 5,
//         width: 24,
//         height: 24,
//         borderRadius: 12,
//         backgroundColor: Colors.red,
//         alignItems: "center",
//         justifyContent: "center",
//         zIndex: 50,
//     },
// });
