import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {Colors} from '../constants/color';
import {FONTS} from '../constants/fontFamily';
import {RFValue} from 'react-native-responsive-fontsize';

const Approved = ({stuts, backgroundColor,color}) => {
  return (
    <View style={[styles.aprooveView, {backgroundColor: backgroundColor}]}>
      <Text style={[styles.aprrove,{color:color}]}>{stuts}</Text>
    </View>
  );
};

export default Approved;

const styles = StyleSheet.create({
  aprooveView: {
    paddingVertical: 7,

    borderRadius: 5,
    alignItems: 'center',
    width: RFValue(68),
  },
  aprrove: { fontSize: 12, fontFamily: FONTS.LexendRegular},
});
