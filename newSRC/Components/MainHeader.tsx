import { View, Text, StyleSheet } from 'react-native'
import React from 'react'
import BoxIcon from './BoxIcon';
import { Images } from '../utils/Images';
import { Colors } from '../utils/colors';
import { SimpleStyle } from '../utils/SimpleStyle';
import { useRouter } from "expo-router";
import { FONTS } from '../utils/FONTS';

type Props = {
    Title?: string;
    FilterBtn?: boolean,
    RefreshBtn?: boolean;
    RefreshOnPress?: () => void;
    FilterBtnOnPress?: () => void;
}

export default function MainHeader({ FilterBtn, FilterBtnOnPress, RefreshBtn, RefreshOnPress, Title }: Props) {
    const router = useRouter();
    const onBackPress = () => {
        if (router.canGoBack()) {
            router.back();
        }
    }

    return (
        <View style={styles.container}>
            <View style={SimpleStyle.SimpleGapFlex}>
                <BoxIcon
                    Icon={Images.BackIcon}
                    onPress={onBackPress}
                />
                <Text style={styles.title}>{Title}</Text>
            </View>
            <View style={SimpleStyle.SimpleGapFlex}>
                <BoxIcon
                    Icon={Images.FilterIcon}
                    style={styles.IconBG}
                    onPress={FilterBtnOnPress}
                />
                <BoxIcon
                    Icon={Images.RefreshIcon}
                    style={styles.IconBG}
                    onPress={RefreshOnPress}
                />
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 15,
        backgroundColor: Colors.white,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        borderBottomWidth: 0.5,
        borderColor: Colors.border
    },
    title: {
        fontSize: 16,
        fontFamily: FONTS.OutfitMedium,
        color: Colors.black
    },
    IconBG: {
        backgroundColor: Colors.primary
    }
});