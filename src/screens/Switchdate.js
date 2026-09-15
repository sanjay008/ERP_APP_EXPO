import {
  Image,
  // SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useState } from "react";
import Header from "../components/header";
import SelectDropdown from "react-native-select-dropdown";
import { useTranslation } from "react-i18next";
import { Images } from "../constants/images";
import { Colors } from "../constants/color";
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from "react-native-responsive-screen";
import { RFValue } from "react-native-responsive-fontsize";
import { FONTS } from "../constants/fontFamily";
import Input from "../components/input";
import { SafeAreaView } from "react-native-safe-area-context";

const Switchdate = () => {
  const { t } = useTranslation();
  const [selectedItem, setSelectedItem] = useState({});
  const [input, setInput] = useState("");
  const onSubmit = ()=>{
    console.log('---')
  }
  return (
    <SafeAreaView style={styles.container}>
      <Header back title={t("Switch Date")} />
      <Text style={styles.title}>{t("Select Calendar")}</Text>

      <SelectDropdown
        data={[
          { title: t("Begin Datum") },
          { title: t("Eind Datum") },
          { title: t("Contracturen") },
        ]}
        onSelect={() => setSelectedItem(selectedItem)}
        renderButton={(selectedItem, isOpened) => {
          return (
            <View style={[styles.dropdownButtonStyle]}>
              <Text
                style={[
                  styles.dropdownButtonTxtStyle,
                  { color: selectedItem ? Colors.black : Colors.textgray },
                ]}
              >
                {selectedItem && selectedItem.title
                  ? selectedItem.title
                  : t("Select Calendar")}
              </Text>
              <Image
                source={Images.down}
                style={{
                  height: 20,
                  width: 20,
                  tintColor: Colors.textgray,
                }}
              />
            </View>
          );
        }}
        renderItem={(item, index, isSelected) => {
          return (
            <TouchableOpacity
              style={[
                styles.dropdownItemStyle,
                isSelected && { backgroundColor: Colors.white },
              ]}
              onPress={() => {
                console.log("Selected Item ID:", item.id); // Add this log
                // checkinout1(item.id);
              }}
            >
              <Text style={styles.dropdownItemTxtStyle}>{item.title}</Text>
            </TouchableOpacity>
          );
        }}
        showsVerticalScrollIndicator={false}
        dropdownStyle={styles.dropdownMenuStyle}
      />

      <View style={{ marginHorizontal: 20 }}>
        <Input
          // value={service}
          // onChangeText={(txt) => {
          //   setService(txt);
          // }}
          title={t("Select Datum")}
          placeholder="YYYY-MM-DD"
          keyboardType="number-pad"
        />
        <Input
          // value={service}
          // onChangeText={(txt) => {
          //   setService(txt);
          // }}
          title={t("New Datum")}
          placeholder="YYYY-MM-DD"
          keyboardType="number-pad"
        />
      </View>
      {/* <View style={{ marginHorizontal: 20 }}>
        <Input
          // value={service}
          // onChangeText={(txt) => {
          //   setService(txt);
          // }}
          title={t("Burgerservicenummer (BSN)")}
          placeholder="Voer Burgerservicenummer in"
          iconSource={Images.one}
          keyboardType="number-pad"
        />
      </View> */}

      <Text style={styles.title}>{t("Omschrijving")}</Text>
      <View style={styles.input}>
        <TextInput
          value={input}
          placeholder="Type here..."
          placeholderTextColor={Colors.textgray}
          style={{ padding: 10, width: "100%", minHeight: 90 }} // Adjust minHeight as needed
          onChangeText={(txt) => setInput(txt)}
          multiline
          textAlignVertical="top" // This makes the text start from the top
        />
      </View>

      <View style={styles.buttoncontainer}>
        <TouchableOpacity style={styles.borderbutton}>
          <Text
            style={{
              color: Colors.black,
              fontFamily: FONTS.LexendRegular,
              fontSize: RFValue(14),
            }}
          >
            {t("Sluiten")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onSubmit} style={styles.colorbutton}>
          <Text
            style={{
              color: Colors.white,
              fontFamily: FONTS.LexendRegular,
              fontSize: RFValue(14),
            }}
          >
            {t("Verzenden")}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default Switchdate;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  dropdownButtonStyle: {
    width: widthPercentageToDP(90),
    height: heightPercentageToDP(7),
    borderWidth: 1,
    borderColor: Colors.litegray,
    borderRadius: 7,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
    marginTop: RFValue(5),
    marginVertical: 10,
    marginHorizontal: 20,
    // marginBottom: 15,
  },
  dropdownButtonTxtStyle: {
    flex: 1,
    fontSize: 14,
    marginLeft: "3%",
    // fontWeight: "500",
    fontFamily: FONTS.LexendRegular,
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
    paddingVertical: 10,
  },
  dropdownItemTxtStyle: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
  },
  title: {
    fontSize: RFValue(14),
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
    marginTop: 20,
    marginHorizontal: 20,
  },
  input: {
    // height: 120,
    height: heightPercentageToDP(15),
    borderWidth: 1,
    borderColor: Colors.litegray,
    borderRadius: 10,
    marginTop: 4,
    paddingHorizontal: 10,
    marginHorizontal: 20,
  },
  buttoncontainer: {
    flexDirection: "row",
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    justifyContent: "space-between",
  },
  borderbutton: {
    borderColor: Colors.litegray,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    height: heightPercentageToDP(7),
    width: widthPercentageToDP(40),
  },
  colorbutton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    height: heightPercentageToDP(7),
    width: widthPercentageToDP(40),
  },
});
