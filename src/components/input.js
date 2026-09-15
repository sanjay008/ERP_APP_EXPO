import React, { useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors } from "../constants/color";
import { FONTS } from "../constants/fontFamily";
import { RFValue } from "react-native-responsive-fontsize";

const Input = ({
  placeholder,
  onChangeText,
  value,
  iconSource,
  title,
  style,
  rightIcon,
  onPress,
  error,
  maxLength,
  keyboardType,
  required,
  backgroundColor,
  height,
  multiline,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  return (
    <View>
      {title && <Text style={styles.title}>{title}</Text>}
      {required && (
        <Text style={[styles.title, { marginTop: 0 }]}>
          {required}
          <Text style={{ color: Colors.red }}>*</Text>
        </Text>
      )}
      <View style={[styles.container, style, isFocused && styles.focused, { backgroundColor: backgroundColor, height: multiline ? 100 : RFValue(45) }]}>
        {iconSource && (
          <Image
            source={iconSource}
            style={[
              styles.img,
              { tintColor: isFocused ? Colors.primary : Colors.textgray },
            ]}
          />
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          maxLength={maxLength}
          placeholderTextColor={Colors.textgray}
          keyboardType={keyboardType}
          placeholder={placeholder}
          style={[styles.input,rightIcon && {width:'80%'},multiline&& { height: multiline && 100 }]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          textAlignVertical={multiline ? "top" :'center'}
          multiline={multiline}
          {...rest}
        />
        {rightIcon && (
          <TouchableOpacity onPress={onPress}>
            <Image
              source={rightIcon}
              style={[
                styles.img,
                { tintColor: isFocused ? Colors.primary : Colors.textgray },
              ]}
            />
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.error}>{error}</Text>
    </View>
  );
};

export default Input;

const styles = StyleSheet.create({
  container: {
    height: RFValue(45),
    borderWidth: 1,
    borderColor: Colors.litegray,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    marginTop: RFValue(5),
    
    
  },
  focused: {
    backgroundColor: Colors.primaryopacity,
    borderColor: Colors.primary,
  },
  input: {
    // flex: 1
    width: "90%",
    color: Colors.black,
    fontFamily: FONTS.LexendRegular,
    fontSize: RFValue(12),
  },
  title: {
    fontSize: RFValue(13),
    fontFamily: FONTS.LexendMedium,
    color: Colors.black,
    marginTop: RFValue(5),
  },
  img: {
    height: RFValue(20),
    width: RFValue(20),
    marginRight: 10,
  },
  error: {
    color: Colors.red,
    fontSize: RFValue(10),
    fontFamily: FONTS.LexendRegular,
    marginTop: RFValue(1),
  },
});
