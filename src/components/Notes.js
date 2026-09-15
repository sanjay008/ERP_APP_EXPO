import { Image, StyleSheet, Text, View } from "react-native";
import React from "react";
import { FONTS } from "../constants/fontFamily";
import { Images } from "../constants/images";
import { Colors } from "../constants/color";

const Notes = ({ title, name, time, dis }) => {
  return (
    <View>
      <View style={{ marginHorizontal: 20 }}>
        <Text style={styles.title}>{title}</Text>

        <View style={{ flexDirection: "row" }}>
          <Text style={styles.lasttitle}>{name}</Text>
          <Image source={Images.star} style={styles.image} />
          <View style={styles.timebg}>
            <Text style={styles.time}>{time}</Text>
          </View>
        </View>

        <View style={styles.lastbox}>
          <Text style={styles.discription}>{dis}</Text>
        </View>
      </View>
    </View>
  );
};

export default Notes;

const styles = StyleSheet.create({
  lastbox: {
    borderColor: Colors.primary,
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
    backgroundColor: Colors.lightprimary,
  },
  lasttitle: {
    color: Colors.black,
    fontFamily: FONTS.LexendRegular,
  },
  time: {
    fontFamily: FONTS.LexendRegular,
    color: Colors.textgray,
  },
  image: {
    height: 20,
    width: 21,
    marginLeft: 10,
  },
  title: {
    fontFamily: FONTS.LexendRegular,
    color: Colors.primary,
    marginVertical: 10,
  },
  timebg: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  discription: {
    color: Colors.black,
    fontFamily: FONTS.LexendRegular,
  },
});
