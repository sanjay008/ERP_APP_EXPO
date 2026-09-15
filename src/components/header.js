import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React from "react";
import { Images } from "../constants/images";
import { Colors } from "../constants/color";
import { RFValue } from "react-native-responsive-fontsize";
import { useNavigation } from "@react-navigation/native";
import { FONTS } from "../constants/fontFamily";
import { heightPercentageToDP } from "react-native-responsive-screen";

const Header = ({
  rightIcon,
  rightIconClick,
  source,
  back,
  tintColor,
  title,
  dots,
  dotsClick,
  justifyContent,
  lefticon,
  lefticonclick,
  style,
  rightbutton,
  rightbuttonclick,
}) => {
  const navigation = useNavigation();
  const { width } = Dimensions.get("screen");

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: 15,
          marginTop: 10,
          // justifyContent: justifyContent ? justifyContent : "center",
          // height:heightPercentageToDP('7%')
        },
      ]}
    >
      {back && (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            position: "absolute",
            left: 24,
            borderWidth: 1,
            borderRadius: 7,
            borderColor: Colors.litegray,
            height: 35,
            width: 35,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Image
            source={Images.back}
            style={{
              height: 24,
              width: 24,
            }}
          />
        </TouchableOpacity>
      )}
      <Text
        style={{
          position: "absolute",
          alignSelf: "center",
          color: Colors.black,
          fontSize: RFValue(15),
          fontFamily: FONTS.LexendMedium,
          top: 5,
        }}
      >
        {title}
      </Text>
      <Image
        resizeMode="contain"
        source={source}
        style={[style, { width: width * 0.5, height: RFValue(30)}]}
        // style={style}
      />

      {dots && (
        <TouchableOpacity
          onPress={dotsClick}
          style={{
            position: "absolute",
            right: 75,
            borderWidth: 1,
            borderRadius: 7,
            borderColor: Colors.litegray,
            height: 35,
            width: 35,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Image
            source={dots}
            style={{
              height: 20,
              width: 20,
              tintColor: tintColor,
            }}
          />
        </TouchableOpacity>
      )}
      {rightIcon && (
        <TouchableOpacity
          onPress={rightIconClick}
          style={{
            position: "absolute",
            right: 24,
            borderWidth: 1,
            borderRadius: 7,
            borderColor: Colors.litegray,
            height: 35,
            width: 35,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Image
            source={rightIcon}
            style={{
              height: 20,
              width: 20,
              tintColor: tintColor,
            }}
          />
        </TouchableOpacity>
      )}
      {lefticon && (
        <TouchableOpacity
          onPress={lefticonclick}
          style={{
            position: "absolute",
            // right:24,
            left: 24,
            borderWidth: 1,
            borderRadius: 7,
            borderColor: Colors.litegray,
            height: 35,
            width: 35,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Image
            source={lefticon}
            style={{
              height: 20,
              width: 20,
              tintColor: tintColor,
            }}
          />
        </TouchableOpacity>
      )}
      {rightbutton && (
        <TouchableOpacity
          onPress={rightbuttonclick}
          style={{
            position: "absolute",
            right: 24,
            backgroundColor: Colors.primary,
            // borderWidth: 1,
            borderRadius: 7,
            // borderColor: Colors.litegray,
            height: 35,
            width: 35,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Image
            source={rightbutton}
            style={{
              height: 20,
              width: 20,
              tintColor: tintColor,
            }}
          />
        </TouchableOpacity>
      )}

      {/* {refresh && (
        <TouchableOpacity
          onPress={refreshIconClick}
          style={{
            position: 'absolute',
            right: 24,
            borderWidth: 1,
            borderRadius: 7,
            borderColor: Colors.litegray,
            height: 35,
            width: 35,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <Image
            source={Images.refresh}
            style={{
              height: 20,
              width: 20,
            }}
          />
        </TouchableOpacity>
      )} */}
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    borderBottomWidth: 1.5,
    borderBottomColor: Colors.litegray,
    flexDirection: "row",
    // alignItems: 'center',
    // backgroundColor:Colors.primaryopacity
  },
  logo: {
    height: RFValue(30),
    // width:RFValue(15),
    // alignSelf: "center",
  },
});
