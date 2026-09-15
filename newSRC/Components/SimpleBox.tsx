import { View, Text, StyleSheet, Image, ImageSourcePropType, Pressable, StyleProp, ViewStyle, ImageStyle } from 'react-native'
import React from 'react'
import { Colors } from '../utils/colors';
import FallBackImage from './FallBackImage';

type Props = {
    onPress?: () => void;
    Icon?: ImageSourcePropType | string;
    style?:StyleProp<ViewStyle>;
    IconStyle?:ImageStyle
}

export default function SimpleBox({ Icon, onPress,IconStyle,style }: Props) {
    return (
        <Pressable style={[styles.container,style]} onPress={onPress}>
            <FallBackImage
                source={Icon}
                style={[styles.IconStyle,IconStyle]}
                resizeMode='contain'
            />
        </Pressable>
    )
}

const styles = StyleSheet.create({
    container: {
        width: 40,
        height: 40,
        borderRadius: 4,
        backgroundColor: Colors.SquareBtnBG,
        borderColor: Colors.border,
        justifyContent:"center",
        alignItems:"center"
    },
    IconStyle:{
        width:20,
        height:20
    }
});