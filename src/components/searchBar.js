import {
  Image,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  View,
  Dimensions,
  Platform,
} from "react-native";
import React from "react";
import { Images } from "../constants/images";
import { RFValue } from "react-native-responsive-fontsize";
import { Colors } from "../constants/color";
import { FONTS } from "../constants/fontFamily";
import { t } from "i18next";
import { heightPercentageToDP } from "react-native-responsive-screen";
const { height } = Dimensions.get("window");

const SearchBar = ({
  onPressfilter,
  onChangeText,
  value,
  ref,
  arrowOnPress,
  sort,
  filterButtonShow
}) => {
  return (
    <View
      style={[
        styles.container,
        {
          marginBottom:
            Platform.OS === "android"
              ? RFValue(20) // Android-specific margin
              : height < 700
              ? RFValue(20) // iOS-specific margin for height < 700
              : RFValue(0), // Default for iOS
        },
      ]}
    >
      <View style={[styles.searchView,{width: !filterButtonShow ? '100%' : '82%'}]}>
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          scrollEnabled={true}
          placeholder={t("Zoeken")}
          placeholderTextColor={Colors.textgray}
          style={styles.textinput}
        />
        {arrowOnPress && (
          <TouchableOpacity
            style={{ position: "absolute", right: 12 }}
            onPress={arrowOnPress}
          >
            <Image
              tintColor={Colors.textgray}
              source={Images.arrow}
              style={styles.searchicon}
            />
          </TouchableOpacity>
        )}
      </View>
      {
        filterButtonShow && 
      <TouchableOpacity onPress={onPressfilter} style={styles.imgview}>
        <Image
          tintColor={Colors.textgray}
          source={sort ? sort : Images.filter}
          style={styles.img}
        />
      </TouchableOpacity>
      }
    </View>
  );
};

export default SearchBar;

const styles = StyleSheet.create({
  searchicon: {
    height: RFValue(20),
    width: RFValue(20),
  },
  searchView: {
    height: RFValue(40),
    width: "82%",
    // borderWidth: 1,
    backgroundColor: Colors.white,
    borderRadius: 5,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  container: {
    flexDirection: "row",
    // marginHorizontal: RFValue(24),
    justifyContent: "space-between",
    marginTop: RFValue(25),
    // marginBottom: RFValue(20),
    // marginBottom: heightPercentageToDP(3),
    borderRadius: 5,
  },
  textinput: {
    fontSize: RFValue(14),
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
    height: RFValue(40),
    marginRight: 30,
  },
  imgview: {
    height: RFValue(40),
    width: RFValue(40),
    backgroundColor: Colors.white,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  img: {
    height: RFValue(20),
    width: RFValue(20),
  },
});
