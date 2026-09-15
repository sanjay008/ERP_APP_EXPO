import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import React from "react";
import LinearGradient from "react-native-linear-gradient";

import { Colors } from "../constants/color";
import { Images } from "../constants/images";
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from "react-native-responsive-screen";
import { FONTS } from "../constants/fontFamily";

const NoInternet = () => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <StatusBar
        backgroundColor={Colors.white}
        translucent={false}
        barStyle={"dark-content"}
      />
      <LinearGradient
        colors={[Colors.white, Colors.primary]}
        style={styles.container}
      >
        <View
          style={{
            marginTop: 300,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Image
            tintColor={Colors.primary}
            source={Images.net}
            style={{
              height: heightPercentageToDP(7),
              width: widthPercentageToDP(20),
            }}
          />
          <Text style={styles.txt}>No Internet Connection</Text>
          <TouchableOpacity>
            <Text style={styles.txt1}>Please try again.</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    // flex: 1,
    // justifyContent: "space-between",
    width: widthPercentageToDP(100),
    height: heightPercentageToDP(100),
  },
  txt: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: "500",
    alignSelf: "center",
    marginHorizontal: 58,
    textAlign: "center",
    fontFamily: FONTS.LexendMedium,
    margin: 10,
  },
  txt1: {
    color: Colors.gray1,
    fontSize: 13,
    fontWeight: "600",
    alignSelf: "center",
    marginHorizontal: 58,
    textAlign: "center",
    fontFamily: FONTS.LexendRegular,
  },
});
export default NoInternet;
