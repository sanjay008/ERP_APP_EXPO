import {
  Dimensions,
  Image,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import { FONTS } from "../constants/fontFamily";
import { RFValue } from "react-native-responsive-fontsize";
import { Colors } from "../constants/color";
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from "react-native-responsive-screen";
import { useNavigation } from "@react-navigation/native";
import { Images } from "../constants/images";
import { t } from "i18next";
import SearchBar from "./searchBar";
import { getData } from "../utils/storeData";
import { SafeAreaView } from "react-native-safe-area-context";
const { height } = Dimensions.get("window");
const BlueHeader = ({
  title,
  Righticon,
  onPressRight,
  onPressfilter,
  value,
  arrowOnPress,
  onChangeText,
  SearchBarInput,
  style,
  logoshow,
  sort,
  bgcolor,
  goback,
  filterButtonShow = true
}) => {
  const navigation = useNavigation();
  const [logo, setLogo] = useState(null);
  const { width } = Dimensions.get("screen");
  const companylogo = async () => {
    const companylogo = await getData("COMPANYLOGO");
    setLogo(companylogo);
  };
  useEffect(() => {
    companylogo();
  }, []);

  return (
    <SafeAreaView style={{ backgroundColor: bgcolor || Colors.gray }}>
      <View
        style={[
          onPressRight ? styles.iconbg : styles.headerbackground,
          {
            marginBottom: !SearchBarInput
              ? Platform.OS === "android"
                ? RFValue(25) // Android-specific margin
                : height < 700
                  ? RFValue(35) // iOS-specific margin for height < 700
                  : RFValue(0) // iOS default margin
              : RFValue(0), // If SearchBarInput is true
          },
        ]}
      >
        {/* <StatusBar backgroundColor={backgroundColor} barStyle={"light-content"} /> */}
        <View
          style={{
            // justifyContent:onPressRight&& "space-between",
            flexDirection: "row",
            // justifyContent: onPressRight && "space-between",
            justifyContent: "center",
            alignItems: "center",
            // backgroundColor: Colors.red
          }}
        >
          {/* <TouchableOpacity
            onPress={() => (goback ? goback : navigation.goBack())}
            style={styles.backbtn}
          >
            <Image source={Images.back} style={styles.backimage} />
          </TouchableOpacity> */}
          <TouchableOpacity
            onPress={() => {
              // Check if goback is provided, then execute the conditional logic for back
              if (goback) {
                goback();
              } else {
                navigation.goBack();
              }
            }}
            style={styles.backbtn}
          >
            <Image source={Images.back} style={styles.backimage} />
          </TouchableOpacity>

          {logoshow ? (
            <Image
              resizeMode="contain"
              source={{ uri: logo }}
              style={[style, { width: width * 0.5, height: RFValue(30) }]}
            // style={style}
            />
          ) : (
            <Text
              style={[
                styles.header,

                // { left: !onPressRight && widthPercentageToDP("18%") },
              ]}
            >
              {title}
            </Text>
          )}

          {onPressRight && (
            <TouchableOpacity style={[styles.icon]} onPress={onPressRight}>
              <Image
                source={Righticon}
                style={styles.searchicon}
                tintColor={Colors.white}
              />
            </TouchableOpacity>
          )}
        </View>
        <View>
          {SearchBarInput && (
            <SearchBar
              arrowOnPress={arrowOnPress}
              value={value}
              onChangeText={onChangeText}
              onPressfilter={onPressfilter}
              sort={sort}
              filterButtonShow={filterButtonShow}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default BlueHeader;

const styles = StyleSheet.create({
  headerbackground: {
    // flexDirection: "row",
    // marginHorizontal: 20,
    paddingHorizontal: 20,
    marginTop: "5%",
    // marginVertical:heightPercentageToDP(4)
  },
  header: {
    fontSize: RFValue(16),
    fontFamily: FONTS.LexendMedium,
    color: Colors.white,
    alignSelf: "center",
    textAlign: "center",
  },
  backimage: {
    height: RFValue(20),
    width: RFValue(20),
    tintColor: Colors.white,
  },
  backbtn: {
    borderWidth: 1,
    borderRadius: 7,
    borderColor: Colors.litegray,
    height: 38,
    width: 38,
    // padding: 8,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    left: 0,
  },
  icon: {
    borderWidth: 1,
    borderRadius: 7,
    borderColor: Colors.litegray,
    height: 38,
    width: 38,
    // padding: 8,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    right: 0,
  },
  searchicon: {
    height: RFValue(15),
    width: RFValue(15),
  },
  iconbg: {
    // marginHorizontal: 20,
    paddingHorizontal: 20,
    marginTop: "5%",
  },
});
