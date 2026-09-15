import React, { useEffect, useState, useRef, useContext } from "react";
import { Animated, Image, StyleSheet, Text, View } from "react-native";
import { FONTS } from "../constants/fontFamily";
import { RegisterBackContext } from "../constants/GoBackContext";
import { Images } from "../constants/images";
import { Colors } from "../constants/color";

export default function ToastMessage({
  top = 45,
  text = "Text Message",
  type = "success",
  visible = false,
  onClose,
}) {
  const [isVisible, setIsVisible] = useState(visible);

  // React Native Animated values
  const translateY = useRef(new Animated.Value(-150)).current;
  const lineWidth = useRef(new Animated.Value(0)).current;

  const { setToast } = useContext(RegisterBackContext);

  useEffect(() => {
    if (visible) {
      setIsVisible(true);

      
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start();

      
      Animated.timing(lineWidth, {
        toValue: 120,
        duration: 5000,
        useNativeDriver: false, 
      }).start();

      const timer = setTimeout(() => {
       
        Animated.timing(translateY, {
          toValue: -150,
          duration: 400,
          useNativeDriver: true,
        }).start();

      
        Animated.timing(lineWidth, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }).start();

        setTimeout(() => {
          setToast({
            visible: false,
            text: "",
            type: "success",
            top: 45,
          });
          setIsVisible(false);
          onClose?.();
        }, 300);
      }, 5000);

      return () => clearTimeout(timer);
    } else {
      Animated.timing(translateY, {
        toValue: -150,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        setIsVisible(false);
      });
    }
  }, [visible]);

  if (!isVisible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.flex}>
        {type === "success" && <Image source={Images.Success} style={styles.icon} />}
        {type === "error" && <Image source={Images.WrongIcon} style={styles.icon} />}
        {type === "info" && <Image source={Images.Info} style={styles.icon} />}

        <Text style={[styles.text, text?.length > 40 && { fontSize: 10 }]}>
          {text}
        </Text>
      </View>

      <Animated.View
        style={[
          styles.line,
          {
            backgroundColor:
              type === "success"
                ? Colors.green
                : type === "error"
                ? Colors.red
                : Colors.litegray1,
            width: lineWidth.interpolate({
              inputRange: [0, 120],
              outputRange: ["0%", "100%"],
            }),
          },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 45,
    alignSelf: "center",
    width: "90%",
    backgroundColor: Colors.white,
    borderRadius: 7,
    padding: 10,
    overflow: "hidden",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 9999,
  },
  flex: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  icon: {
    width: 32,
    height: 32,
  },
  text: {
    fontSize: 15,
    color: Colors.black,
    fontFamily: FONTS.LexendMedium,
    flex: 1,
  },
  line: {
    height: 2.5,
    position: "absolute",
    bottom: 0,
    left: 0,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
});
