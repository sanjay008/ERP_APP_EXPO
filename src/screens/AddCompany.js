import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import { RFValue } from "react-native-responsive-fontsize";
import { heightPercentageToDP } from "react-native-responsive-screen";
import { launchImageLibrary } from "react-native-image-picker";

import Input from "../components/input";
import BlueHeader from "../components/BlueHeader";
import Loader from "../components/loading";
import { Colors } from "../constants/color";
import { FONTS } from "../constants/fontFamily";
import apiConstants from "../api/apiConstants";
import ApiService from "../utils/Apiservice";
import { getData } from "../utils/storeData";
import { useTranslation } from "react-i18next";
import CountryPicker from "rn-country-picker";
import { Images } from "../constants/images";
import axios from "axios";
import SelectDropdown from "react-native-select-dropdown";

const VendorDetailScreen = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { id, item, dataaa } = route?.params || {};
  const companyDetails = dataaa?.ecommerce_businesses?.[0];

  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [removedImages, setRemovedImages] = useState([]);


  // Form fields
  const [title, setTitle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [companyProfile, setCompanyProfile] = useState("");
  const [business, setBusiness] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [country, setCountry] = useState("India");
  const [countryCode, setCountryCode] = useState("+31");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [kvk, setKvk] = useState("");
  const [btw, setBtw] = useState("");
  const [website, setWebsite] = useState("");
  const [facebook, setFacebook] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [youtube, setYoutube] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappCountryCode, setWhatsappCountryCode] = useState("+91");
  const [googleMaps, setGoogleMaps] = useState("");

  // Business tags
  const [businessTags, setBusinessTags] = useState([]);
  const [tagInput, setTagInput] = useState("");

  // Images
  const [logo, setLogo] = useState(null);
  const [gallery, setGallery] = useState([]);

  // Errors
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [displayNameError, setDisplayNameError] = useState("");
  const [titleError, setTitleError] = useState("");
  const [companyProfileError, setCompanyProfileError] = useState("");
  const [businessError, setBusinessError] = useState("");
  const [websiteError, setWebsiteError] = useState("");
  const [facebookError, setFacebookError] = useState("");
  const [linkedinError, setLinkedinError] = useState("");
  const [youtubeError, setYoutubeError] = useState("");
  const [instagramError, setInstagramError] = useState("");
  const [tiktokError, setTiktokError] = useState("");
  const [serviceList, setServiceList] = useState([]);
  const [companybusiness, setCompanybusinessList] = useState([]);

  const GetServiceList = async () => {
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.serviceList, {
        includeToken: true,
        customData: {
          relaties_id: getdata.data.relaties.id,
          role: getdata.data.user.role,
          user_id: getdata.data.user.id,
        },
      });
      // console.log(data, "suvdfdf==========");
      if (data.status) {
        setServiceList(data.data || []);
      } else {
        console.log("False connections");
      }
    } catch (err) {
      console.log("Error fetching connections:", err);
    }
  };
  const deletecompanyimage = async (imageData) => {
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.delete_company_image, { // Update API endpoint name
        includeToken: true,
        customData: {
          vendor_id: imageData.vendor_id,
          field: imageData.field
        },
      });

      if (data.status) {
        console.log("Image deleted successfully");
      } else {
        console.log("Failed to delete image");
      }
    } catch (err) {
      console.log("Error deleting image:", err);
    }
  };

  const getcompanybusiness = async () => {
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.get_company_business, {
        includeToken: true,
        customData: {
          relaties_id: getdata.data.relaties.id,
          role: getdata.data.user.role,
          user_id: getdata.data.user.id,
        },
      });
      // console.log(data, "suvdfdf==========");
      if (data.status) {
        setCompanybusinessList(data.data || []);
      } else {
        console.log("False connections");
      }
    } catch (err) {
      console.log("Error fetching connections:", err);
    }
  };
  useEffect(() => {
    if (companyDetails?.business_tag && serviceList?.length > 0) {
      try {
        // 1️⃣ String ne split kari number array bana
        const tagIds = companyDetails.business_tag
          .split(",")
          .map((id) => parseInt(id.trim()));

        // 2️⃣ serviceList mathi match thata service find kar
        const matchedServices = serviceList.filter((service) =>
          tagIds.includes(service.id)
        );

        // 3️⃣ Only names extract kar
        const serviceNames = matchedServices.map((service) => service.name);

        // 4️⃣ Store karvanu (example: setBusinessTags)
        setBusinessTags(serviceNames);

        console.log(serviceNames, "serviceNames");
      } catch (err) {
        console.log("Error parsing business tags:", err);
        setBusinessTags([]);
      }
    }
  }, [companyDetails, serviceList]);


  useEffect(() => {
    GetServiceList();
    getcompanybusiness();
  }, []);

  const getDirectDropboxLink = (sharedLink) => {
    if (!sharedLink) return "";

    try {
      if (sharedLink.includes("dropboxusercontent.com")) {
        return sharedLink;
      }

      if (sharedLink.includes("db.tt")) {
        return sharedLink.replace("db.tt", "dl.dropboxusercontent.com");
      }

      if (sharedLink.includes("dropbox.com")) {
        let cleaned = sharedLink;

        cleaned = cleaned.replace(
          "www.dropbox.com",
          "dl.dropboxusercontent.com"
        );

        cleaned = cleaned.replace("dropbox.com", "dl.dropboxusercontent.com");

        cleaned = cleaned.replace(/[?&](dl|raw)=[^&]*/g, "");

        if (cleaned.includes("?")) {
          cleaned += "&dl=1";
        } else {
          cleaned += "?dl=1";
        }

        return cleaned;
      }

      return sharedLink;
    } catch (error) {
      console.log("Invalid Dropbox link:", error);

      return "";
    }
  };
  // Load data from route params
  useEffect(() => {
    if (dataaa) {
      // From main relation data
      setDisplayName(dataaa?.display_name || "");
      setEmail(dataaa?.email_adres?.includes("@dummy.com") ? "" : dataaa?.email_adres  || "");
      setPhone(dataaa?.telefoon || "");
      setCountryCode(dataaa?.telefoon_country_code || "+31");
      setKvk(dataaa?.kvk_nr || "");
      setBtw(dataaa?.btw_nr || "");
      setAddress(dataaa?.adres || "");
      setCity(dataaa?.city || "");
      setRegion(dataaa?.region || "");
      setCountry(dataaa?.country || "India");
      setGoogleMaps(dataaa?.google_maps || "");

    }
    if (companyDetails) {
      // From ecommerce_businesses
      setTitle(companyDetails?.title || "");
      setCompanyProfile(companyDetails?.ec_company_profile || "");
      setBusiness(companyDetails?.ec_business || "");
      setWebsite(companyDetails?.website || "");
      setFacebook(companyDetails?.facebook || "");
      setLinkedin(companyDetails?.linkedin || "");
      setYoutube(companyDetails?.youtube || "");
      setInstagram(companyDetails?.instagram || "");
      setTiktok(companyDetails?.tiktok || "");
      setWhatsappNumber(companyDetails?.whatsapp_number || "");
      setWhatsappCountryCode(
        companyDetails?.country_code_wh?.toString() || "+91"
      );

      if (companyDetails?.vendor_business_imgs) {
        try {
          setGallery(companyDetails?.vendor_business_imgs);
        } catch {
          setGallery([]);
        }
      }
      // Parse business tags if exists
      // if (companyDetails.business_tag) {
      //   try {
      //     const tags = JSON.parse(companyDetails.business_tag);
      //     setBusinessTags(Array.isArray(tags) ? tags : []);
      //   } catch {
      //     setBusinessTags([]);
      //   }
      // }

      // Set logo if available
      if (companyDetails?.business_dropbox_shared_link) {
        setLogo({ uri: companyDetails.business_dropbox_shared_link });
      }

    }
  }, [dataaa, companyDetails]);

  const selectedValue = (value) => {
    setCountryCode(value?.callingCode || countryCode);
    setCountry(value?.name || country);
  };

  const handlePhoneChange = (text) => {
    const numeric = text.replace(/[^0-9]/g, "");
    setPhone(numeric);
  };

  const handleWhatsappChange = (text) => {
    const numeric = text.replace(/[^0-9]/g, "");
    setWhatsappNumber(numeric);
  };

  const addTag = (name) => {
    const tag = name ? name : tagInput.trim();
    // if (!tag) return;
    if (!businessTags.includes(tag)) {
      setBusinessTags((prev) => [...prev, tag]);
    }
    setTagInput("");
  };

  const removeTag = (tag) => {
    setBusinessTags((prev) => prev.filter((t) => t !== tag));
  };

  const pickImageFromLibrary = async (type = "logo") => {
    const remaining = 4 - gallery.length;

    const options = {
      mediaType: "photo",
      quality: 0.8,
      selectionLimit: type === "gallery" ? remaining : 1,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) return;
      if (response.errorCode) {
        console.log("ImagePicker error:", response.errorMessage);
        return;
      }

      if (type === "gallery") {
        // Multiple images for gallery
        const assets = response.assets || [];
        const newImages = assets.map((asset) => ({
          uri: asset.uri,
          type: asset.type || "image/jpeg",
          name: asset.fileName || `gallery_${Date.now()}_${Math.random()}.jpg`,
        }));
        setGallery((prev) => [...prev, ...newImages]);
      } else {
        // Single logo image
        const asset = response.assets?.[0];
        if (!asset) return;

        const file = {
          uri: asset.uri,
          type: asset.type || "image/jpeg",
          name: asset.fileName || `logo_${Date.now()}.jpg`,
        };
        setLogo(file);
      }
    });
  };

  const removeLogo = () => setLogo(null);


  const removeGalleryAt = (idx) => {
    const removedImage = gallery[idx];

    // Only track for deletion if it's an existing image (has vendor_id or id)
    if (removedImage.id || companyDetails?.id) {
      const imageData = {
        vendor_id: companyDetails.id,
        field: `ec_image_${idx + 1}` // Field name based on index
      };

      // Add to removed images list
      setRemovedImages(prev => [...prev, imageData]);
    }

    // Remove from gallery
    setGallery((prev) => prev.filter((_, i) => i !== idx));
  };

  // const removeGalleryAt = (idx) =>
  //   setGallery((prev) => prev.filter((_, i) => i !== idx));

  const validate = () => {
    let valid = true;

    if (!displayName.trim()) {
      setDisplayNameError("Please enter display name");
      valid = false;
    } else {
      setDisplayNameError("");
    }

    if (!title.trim()) {
      setTitleError("Title is required");
      valid = false;
    } else {
      setTitleError("");
    }

    if (!companyProfile.trim()) {
      setCompanyProfileError("Company profile is required");
      valid = false;
    } else {
      setCompanyProfileError("");
    }

    if (!business.trim()) {
      setBusinessError("Business type is required");
      valid = false;
    } else {
      setBusinessError("");
    }

    // if (!website.trim()) {
    //   setWebsiteError("Website is required");
    //   valid = false;
    // } else {
    //   setWebsiteError("");
    // }

    // if (!facebook.trim()) {
    //   setFacebookError("Facebook is required");
    //   valid = false;
    // } else {
    //   setFacebookError("");
    // }

    // if (!linkedin.trim()) {
    //   setLinkedinError("LinkedIn is required");
    //   valid = false;
    // } else {
    //   setLinkedinError("");
    // }

    // if (!youtube.trim()) {
    //   setYoutubeError("YouTube is required");
    //   valid = false;
    // } else {
    //   setYoutubeError("");
    // }

    // if (!instagram.trim()) {
    //   setInstagramError("Instagram is required");
    //   valid = false;
    // } else {
    //   setInstagramError("");
    // }

    // if (!tiktok.trim()) {
    //   setTiktokError("TikTok is required");
    //   valid = false;
    // } else {
    //   setTiktokError("");
    // }

    if (!email.trim()) {
      setEmailError("Please enter email");
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Please enter a valid email");
      valid = false;
    } else {
      setEmailError("");
    }

    if (!phone.trim()) {
      setPhoneError("Please enter phone number");
      valid = false;
    } else if (phone.length < 6) {
      setPhoneError("Phone number too short");
      valid = false;
    } else {
      setPhoneError("");
    }

    return valid;
  };

  const updateVendor = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      const getdata = await getData("USERDATA");
      if (!getdata) {
        Alert.alert("Error", "User data not found");
        return;
      }
      if (removedImages.length > 0) {
        for (const imageData of removedImages) {
          await deletecompanyimage(imageData);
        }
        // Clear the removed images list after deletion
        setRemovedImages([]);
      }
      const formData = new FormData();

      // Auth & IDs
      formData.append("token", getdata.data.user.verify_token);
      formData.append("relaties_id", dataaa?.id);
      formData.append("user_id", getdata.data.user?.id);
      formData.append("role", getdata.data.user.role);
      if (companyDetails?.id) {
        formData.append("id", companyDetails?.id);
      }
      // formData.append("id", companyDetails?.id);

      // Main fields
      formData.append("title", title);
      formData.append("ec_company_profile", companyProfile);
      formData.append("ec_business", business);
      formData.append("website", website);
      formData.append("facebook", facebook);
      formData.append("linkedin", linkedin);
      formData.append("youtube", youtube);
      formData.append("instagram", instagram);
      formData.append("tiktok", tiktok);
      formData.append("enable_title", "1");

      // Display name & contact
      formData.append("display_name", displayName);
      formData.append("google_maps", googleMaps);
      formData.append("contact_telefoon", phone);
      formData.append("contact_telefoon_country_code", countryCode);
      formData.append("email_adres", email);
      formData.append("kvk_nr", kvk);
      formData.append("btw_nr", btw);

      // Location
      formData.append("country", country);
      formData.append("region", region);
      formData.append("city", city);

      // Business tags
      businessTags.forEach((tag) => {
        formData.append("business_tag[]", tag);
      });

      // WhatsApp
      formData.append("whatsapp_number", whatsappNumber);
      formData.append("country_code_wh", whatsappCountryCode);

      // Company IDs (if available)
      if (dataaa.company) {
        formData.append("company_id", dataaa.company);
      }
      // if (dataaa.bedrijf_relaties) {
      formData.append("company_relaties_id", dataaa?.id);
      // }

      // Logo image
      if (logo && logo.uri && logo.name) {
        formData.append("business_company_logo", {
          uri:
            Platform.OS === "android"
              ? logo.uri
              : logo.uri.replace("file://", ""),
          type: logo.type || "image/jpeg",
          name: logo.name,
        });
      }

      // Gallery images (ec_image_2)
      gallery.forEach((img, idx) => {
        if ((img && img.uri) || img.shared_link) {
          formData.append(`ec_image_${idx + 1}`, {
            uri:
              Platform.OS === "android"
                ? img.uri || img.shared_link
                : img.uri.replace("file://", "") || img.shared_link,
            type: img.type || "image/jpeg",
            name: img.name || `gallery_${idx + 1}.jpg`,
          });
        }
      });
      for (var pair of formData._parts) {
        console.log(pair[0], "=>", pair[1]);
      }

      console.log("formData", formData);

      // API call - adjust endpoint as needed
      const response = await axios.post(
        apiConstants.busines_company_update, // your API endpoint
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log("response", response.data);

      if (response?.status) {
        Alert.alert("Success", "Vendor updated successfully");
        setEditMode(false);
        // Optionally refresh or navigate back
        // navigation.goBack();
      } else {
        Alert.alert("Failed", response?.message || "Failed to update");
      }
    } catch (err) {
      console.log("updateVendor error:", err);
      Alert.alert("Error", "Network or server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <StatusBar
        backgroundColor={item?.color_code || Colors.primary}
        barStyle="light-content"
      />
      <BlueHeader
        bgcolor={item?.color_code || Colors.primary}
        title={t("Vendor Detail")}
      />
      {loading && <Loader />}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.background}
      >
        {/* Header with Edit button */}
        <View style={styles.headerRow}>
          <Text style={styles.sectionTitle}>{t("Vendor Information")}</Text>
          <TouchableOpacity
            onPress={() => setEditMode((prev) => !prev)}
            style={[
              styles.editBtn,
              { backgroundColor: editMode ? Colors.red : Colors.primary },
            ]}
          >
            <Text style={styles.editBtnText}>
              {editMode ? t("Cancel") : t("Edit")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Logo */}
        <View style={{ marginTop: 12 }}>
          <Text style={styles.label}>{t("Company Logo")}</Text>
          <View
            style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}
          >
            {logo ? (
              <>
                <Image
                  source={{ uri: getDirectDropboxLink(logo.uri) || logo.uri }}
                  style={styles.logoPreview}
                />
                {editMode && (
                  <TouchableOpacity
                    style={styles.smallBtn}
                    onPress={removeLogo}
                  >
                    <Text style={{ color: "#fff" }}>{t("Remove")}</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <View
                style={[
                  styles.logoPreview,
                  { alignItems: "center", justifyContent: "center" },
                ]}
              >
                <Text style={{ color: Colors.textgray }}>{t("No Logo")}</Text>
              </View>
            )}

            {editMode && (
              <TouchableOpacity
                style={[styles.smallBtn, { marginLeft: 10 }]}
                onPress={() => pickImageFromLibrary("logo")}
              >
                <Text style={{ color: "#fff" }}>{t("Choose Logo")}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Gallery Images */}
        <View style={{ marginTop: 12 }}>
          {gallery.length > 0 && (
            <Text style={styles.label}>{t("Gallery Images")}</Text>
          )}
          <View
            style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8 }}
          >
            {gallery.map((g, idx) => (
              <View key={idx} style={styles.imageThumbWrapper}>
                <Image
                  source={{ uri: getDirectDropboxLink(g.shared_link) || g.uri }}
                  style={styles.imageThumb}
                />
                {editMode && (
                  <TouchableOpacity
                    style={styles.removeImageBtn}
                    onPress={() => removeGalleryAt(idx)}
                  >
                    <Text style={{ color: "#fff", fontSize: 12 }}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {editMode && gallery.length < 4 && (
              <TouchableOpacity
                style={styles.addImageBtn}
                onPress={() => pickImageFromLibrary("gallery")}
              >
                <Text style={{ color: Colors.primary }}>+ Add image</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Display Name */}
        <Input
          title={t("Bussiness Company Name")}
          placeholder="Enter display name"
          value={displayName}
          onChangeText={setDisplayName}
          backgroundColor={Colors.litegray1}
          editable={editMode}
          error={displayNameError}
        />

        {/* Title */}
        <Input
          title={t("Title") + " *"}
          // placeholder="E.g. SBL"
          value={title}
          onChangeText={setTitle}
          backgroundColor={Colors.litegray1}
          editable={editMode}
          error={titleError}
        />

        {/* Company Profile */}
        <Input
          title={t("Company Profile") + " *"}
          placeholder="About the company"
          value={companyProfile}
          onChangeText={setCompanyProfile}
          backgroundColor={Colors.litegray1}
          multiline
          numberOfLines={4}
          editable={editMode}
          error={companyProfileError}
        />
        <Text style={[styles.label, { marginTop: 10 }]}>
          {t("Business Company Name")}
        </Text>

        <SelectDropdown
          data={companybusiness || []}
          defaultButtonText="Select Business Company"
          onSelect={(selectedItem) => {
            setBusiness(selectedItem.status);
          }}
          buttonTextAfterSelection={(selectedItem) => selectedItem.company_name}
          rowTextForSelection={(item) => item.company_name}
          renderButton={(item, isOpened) => {
            return (
              <View style={[styles.dropdownButtonStyle, { flex: 1 }]}>
                <Text style={[styles.dropdownButtonTxtStyle]}>
                  {business ? business : "Select Service"}
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
                <Text style={styles.dropdownItemTxtStyle}>{item.status}</Text>
              </View>
            );
          }}
          disabled={!editMode}
        />

        {/* Business Type */}
        <Input
          title={t("Business Type") + " *"}
          placeholder="E.g. IT Services"
          value={business}
          onChangeText={setBusiness}
          backgroundColor={Colors.litegray1}
          editable={editMode}
          error={businessError}
        />

        {/* Address */}
        <Input
          title={t("Address")}
          placeholder="Enter address"
          value={address}
          onChangeText={setAddress}
          backgroundColor={Colors.litegray1}
          editable={editMode}
        />

        {/* City */}
        <Input
          title={t("City")}
          placeholder="Enter city"
          value={city}
          onChangeText={setCity}
          backgroundColor={Colors.litegray1}
          editable={editMode}
        />

        {/* Region */}
        {/* <Input
          title={t("Region/State")}
          placeholder="E.g. Gujarat"
          value={region}
          onChangeText={setRegion}
          backgroundColor={Colors.litegray1}
          editable={editMode}
        /> */}

        {/* Country */}
        <Text style={styles.label}>{t("Country")}</Text>
        <View style={{ marginTop: 6 }}>
          <CountryPicker
            countryFlagStyle={{ height: 20, width: 28, marginRight: 6 }}
            disable={!editMode}
            animationType="slide"
            language="en"
            pickerContainerStyle={styles.pickerStyle}
            dropDownIcon={Images.down}
            selectedCountryTextStyle={styles.selectedCountryTextStyle}
            dropDownIconStyle={{ tintColor: Colors.black }}
            countryNameTextStyle={styles.countryNameTextStyle}
            searchBarPlaceHolder={t("Select Country")}
            hideCountryFlag={false}
            hideCountryCode={false}
            countryCode={countryCode}
            selectedValue={selectedValue}
          />
        </View>

        {/* Phone */}
        <Text style={[styles.label, { marginTop: 10 }]}>
          {t("Phone Number")}
        </Text>
        <View style={styles.country}>
          <CountryPicker
            countryFlagStyle={{ height: 20, width: 28, marginRight: 6 }}
            disable={!editMode}
            animationType="slide"
            language="en"
            pickerContainerStyle={[styles.pickerStyle, { width: 120 }]}
            hideCountryFlag={false}
            hideCountryCode={false}
            countryCode={countryCode}
            selectedValue={selectedValue}
          />
          <TextInput
            value={phone}
            onChangeText={handlePhoneChange}
            placeholderTextColor={Colors.textgray}
            keyboardType="number-pad"
            style={[styles.input, { marginLeft: 8 }]}
            editable={editMode}
          />
        </View>
        {phoneError ? <Text style={styles.error}>{phoneError}</Text> : null}

        {/* Email */}
        <Input
          title={t("Email")}
          placeholder="Enter email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          backgroundColor={Colors.litegray1}
          editable={editMode}
          error={emailError}
        />

        {/* KVK */}
        <Input
          title={t("KVK Number")}
          placeholder="Enter KVK"
          value={kvk}
          onChangeText={setKvk}
          backgroundColor={Colors.litegray1}
          editable={editMode}
        />

        {/* BTW */}
        <Input
          title={t("BTW Number")}
          placeholder="Enter BTW"
          value={btw}
          onChangeText={setBtw}
          backgroundColor={Colors.litegray1}
          editable={editMode}
        />

        {/* Google Maps */}
        <Input
          title={t("Google Maps Link")}
          placeholder="https://maps.google.com/..."
          value={googleMaps}
          onChangeText={setGoogleMaps}
          backgroundColor={Colors.litegray1}
          editable={editMode}
        />

        {/* Social Links */}
        <Text
          style={[
            styles.label,
            {
              marginTop: 10,
              color: Colors.primary,
              fontFamily: FONTS.LexendBold,
              fontSize: RFValue(14),
            },
          ]}
        >
          {t("Social Links")}
        </Text>
        <Input
          title={t("Website") + " *"}
          placeholder="https://"
          value={website}
          onChangeText={setWebsite}
          backgroundColor={Colors.litegray1}
          editable={editMode}
          error={websiteError}
        />
        <Input
          title={t("Facebook") + " *"}
          placeholder="https://facebook.com/..."
          value={facebook}
          onChangeText={setFacebook}
          backgroundColor={Colors.litegray1}
          editable={editMode}
          error={facebookError}
        />
        <Input
          title={t("LinkedIn") + " *"}
          placeholder="https://linkedin.com/..."
          value={linkedin}
          onChangeText={setLinkedin}
          backgroundColor={Colors.litegray1}
          editable={editMode}
          error={linkedinError}
        />
        <Input
          title={t("YouTube") + " *"}
          placeholder="YouTube URL"
          value={youtube}
          onChangeText={setYoutube}
          backgroundColor={Colors.litegray1}
          editable={editMode}
          error={youtubeError}
        />
        <Input
          title={t("Instagram") + " *"}
          placeholder="Instagram URL"
          value={instagram}
          onChangeText={setInstagram}
          backgroundColor={Colors.litegray1}
          editable={editMode}
          error={instagramError}
        />
        <Input
          title={t("TikTok") + " *"}
          placeholder="TikTok URL"
          value={tiktok}
          onChangeText={setTiktok}
          backgroundColor={Colors.litegray1}
          editable={editMode}
          error={tiktokError}
        />

        {/* WhatsApp */}
        <Text style={[styles.label, { marginTop: 10 }]}>
          {t("WhatsApp Number")}
        </Text>
        <View style={[styles.country, { marginTop: 6 }]}>
          <CountryPicker
            countryFlagStyle={{ height: 20, width: 28, marginRight: 6 }}
            disable={!editMode}
            animationType="slide"
            language="en"
            pickerContainerStyle={[styles.pickerStyle, { width: 120 }]}
            hideCountryFlag={false}
            hideCountryCode={false}
            countryCode={whatsappCountryCode}
            selectedValue={(value) =>
              setWhatsappCountryCode(value?.callingCode || whatsappCountryCode)
            }
          />
          <TextInput
            value={whatsappNumber}
            onChangeText={handleWhatsappChange}
            placeholderTextColor={Colors.textgray}
            keyboardType="number-pad"
            style={[styles.input, { marginLeft: 8 }]}
            editable={editMode}
          />
        </View>

        {/* Business Tags */}
        <Text style={[styles.label, { marginTop: 10 }]}>
          {t("Business Tags")}
        </Text>
        {editMode && <View
          style={{ flexDirection: "row", marginTop: 8, alignItems: "center" }}
        >
          <TextInput
            value={tagInput}
            onChangeText={setTagInput}
            placeholder="Add a tag"
            style={styles.serviceInput}
            placeholderTextColor={Colors.gray}
            editable={editMode}
          />
          <TouchableOpacity style={styles.addServiceBtn} onPress={() => addTag(tagInput)}>
            <Text style={{ color: "#fff" }}>{t("Add")}</Text>
          </TouchableOpacity>
        </View>
        }

        {editMode &&
          <View
            style={{ flexDirection: "row", marginTop: 8, alignItems: "center" }}
          >
            <SelectDropdown
              data={serviceList || []}
              defaultButtonText="Select Service"
              onSelect={(selectedItem) => {
                setTagInput(selectedItem.name);
                if (editMode) {
                  addTag(selectedItem.name); // dropdown select થાય એટલે સીધું addTag() ચાલશે
                }
              }}
              buttonTextAfterSelection={(selectedItem) => selectedItem.name}
              rowTextForSelection={(item) => item.name}
              renderButton={(item, isOpened) => {
                return (
                  <View style={[styles.dropdownButtonStyle, { flex: 1 }]}>
                    <Text style={[styles.dropdownButtonTxtStyle]}>
                      {tagInput ? tagInput : "Select Service"}
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
                    <Text style={styles.dropdownItemTxtStyle}>{item.name}</Text>
                  </View>
                );
              }}
              disabled={!editMode}
            />

          </View>}

        <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8 }}>
          {businessTags.map((tag, idx) => (
            <View style={styles.serviceChip} key={idx}>
              <Text style={{ color: "#333" }}>{tag}</Text>
              {editMode && (
                <TouchableOpacity
                  onPress={() => removeTag(tag)}
                  style={{ marginLeft: 6 }}
                >
                  <Text style={{ color: "#777" }}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Save Button */}
        {editMode && (
          <TouchableOpacity style={styles.buttonbg} onPress={updateVendor}>
            <Text style={styles.buttontext}>{t("Update Vendor")}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </>
  );
};

export default VendorDetailScreen;

const styles = StyleSheet.create({
  background: {
    backgroundColor: Colors.white,
    marginTop: heightPercentageToDP(-1),
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    padding: 16,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: RFValue(15),
    fontFamily: FONTS.LexendSemiBold,
    color: Colors.black,
  },
  editBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editBtnText: {
    color: Colors.white,
    fontFamily: FONTS.LexendSemiBold,
  },
  label: {
    fontSize: RFValue(13),
    fontFamily: FONTS.LexendMedium,
    color: Colors.black,
    marginTop: RFValue(5),
  },
  country: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.litegray1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginTop: 5,
    height: RFValue(45),
    backgroundColor: Colors.litegray1,
  },
  input: {
    flex: 1,
    fontSize: RFValue(13),
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
    paddingHorizontal: 10,
  },
  error: {
    color: Colors.red,
    fontSize: RFValue(10),
    fontFamily: FONTS.LexendRegular,
    marginTop: 3,
    marginLeft: 5,
  },
  pickerStyle: {
    height: heightPercentageToDP(6),
    borderColor: Colors.litegray1,
    alignItems: "center",
    backgroundColor: Colors.litegray1,
    borderRadius: 10,
    fontSize: 16,
    color: Colors.black,
    fontFamily: FONTS.LexendRegular,
  },
  selectedCountryTextStyle: {
    paddingLeft: 5,
    textAlign: "right",
    color: Colors.black,
    fontFamily: FONTS.LexendRegular,
    fontSize: RFValue(12),
  },
  countryNameTextStyle: {
    paddingLeft: 10,
    textAlign: "right",
    color: Colors.black,
    fontFamily: FONTS.LexendRegular,
  },
  imageThumbWrapper: {
    width: 90,
    height: 90,
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.litegray1,
  },
  imageThumb: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  removeImageBtn: {
    position: "absolute",
    bottom: 4,
    left: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  addImageBtn: {
    width: 90,
    height: 90,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.litegray1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoPreview: {
    width: 90,
    height: 90,
    resizeMode: "cover",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.litegray1,
  },
  smallBtn: {
    marginLeft: 10,
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
  },
  serviceInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.litegray1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontFamily: FONTS.LexendRegular,
    marginRight: 8,
    backgroundColor: Colors.litegray1,
    color: Colors.black,
  },
  addServiceBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  serviceChip: {
    backgroundColor: Colors.litegray1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
  },
  buttonbg: {
    backgroundColor: Colors.primary,
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    marginVertical: heightPercentageToDP(2),
    width: "100%",
  },
  buttontext: {
    color: Colors.white,
    fontSize: RFValue(16),
    fontFamily: FONTS.LexendSemiBold,
  },
  addServiceBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 10,
  },
  serviceChip: {
    backgroundColor: "#eee",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
    margin: 4,
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
    fontSize: 14,
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
  },
});
