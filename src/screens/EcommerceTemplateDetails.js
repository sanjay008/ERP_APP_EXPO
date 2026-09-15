import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, StatusBar } from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import BlueHeader from '../components/BlueHeader';
import { Images } from '../constants/images';
import { getData } from '../utils/storeData';
import ApiService from '../utils/Apiservice';
import apiConstants from '../api/apiConstants';
import FallbackImage from '../components/FallbackImage';
import { RegisterBackContext } from '../constants/GoBackContext';
import { useTranslation } from 'react-i18next';
import { Colors } from '../constants/color';
import { FONTS } from '../constants/fontFamily';
import Loader from '../components/loading';
import { heightPercentageToDP } from 'react-native-responsive-screen';
import { useIsFocused } from '@react-navigation/native';

export default function EcommerceTemplateDetails({ navigation, route }) {
    const [AllProducts, setAllProducts] = useState([]);
    const [IsLoading, setIsLoading] = useState(false);
    const { setToast } = useContext(RegisterBackContext);
    const IsFocused = useIsFocused();
    const { t } = useTranslation();
    const { bgcolor } = route.params;


    const GetAllProfuctsFun = async () => {
        setIsLoading(true);
        const getdata = await getData("USERDATA");
        try {
            const res = await ApiService(apiConstants.product_list, {
                customData: {
                    token: getdata.data?.user.verify_token,
                }
            });
            console.log("GetAll", res.data);
            if (res?.status) {
                setAllProducts(res?.data || []);
            } else {
                setToast({
                    top: 45,
                    text: res?.message,
                    type: "error",
                    visible: true,
                });


            }
        } catch (error) {
            console.log("GetAllDropTemplateFun Error:-", error);
            setToast({
                top: 45,
                text: error?.message,
                type: "error",
                visible: true,
            });

        }
        finally {
            setIsLoading(false);
        }
    }
    useEffect(() => {
        // if (AllProducts?.length === 0 && IsFocused) {
        GetAllProfuctsFun()
        // }
    }, [IsFocused])
    return (
        <View style={styles.container}>
            <StatusBar backgroundColor={bgcolor} barStyle={"light-content"} />

            <BlueHeader Righticon={Images.refresh}
                onPressRight={GetAllProfuctsFun}
                title={t("Ecommerce Product")} bgcolor={bgcolor ? bgcolor : Colors.primary} />
            <View style={styles.Flex}>
                <View />
                <TouchableOpacity style={[styles.Button]} onPress={() => navigation.navigate("EcommerceTemplate", { color: bgcolor })}>
                    <Image
                        source={Images.plus}
                        style={{ width: 20, height: 20 }}
                    />
                    <Text style={[styles.productName, { color: Colors.white, }]}>{t("Add Product")}</Text>
                </TouchableOpacity>
            </View>
            {
                IsLoading ?
                    <Loader /> :
                    <FlatList
                        data={AllProducts}
                        numColumns={3}
                        columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 10 }}
                        contentContainerStyle={styles.WrapperContainer}
                        keyExtractor={(item, index) => index.toString()}
                        ListEmptyComponent={() => (
                            <View style={{ width: '100%', height: heightPercentageToDP(70), justifyContent: 'center', alignItems: 'center', marginTop: 10 }}>
                                <Text style={[styles.productName, { width: "100%", }]}>
                                    {t("No more products")}
                                </Text>
                            </View>
                        )}
                        renderItem={({ item, index }) => {
                            return (
                                <View style={styles.productBox}>
                                    <FallbackImage
                                        source={{ uri: item?.image_product || "" }}
                                        fallback={Images.defaultImage}
                                        style={styles.productImage}
                                    />

                                    <Text
                                        style={[styles.productName, { width: "100%" }]}
                                        numberOfLines={1}
                                        ellipsizeMode="tail"
                                    >
                                        {item?.product_name || ""}
                                    </Text>
                                </View>
                            )
                        }}
                    />
            }
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    WrapperContainer: {
        padding: 15,
        paddingBottom: 30,
    },
    productBox: {
        backgroundColor: Colors.white,
        width: '31%',
        borderRadius: 8,
        padding: 8,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Colors.black,
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },

    productImage: {
        width: 70,
        height: 70,
        resizeMode: "contain",
        marginBottom: 6,
    },

    productName: {
        fontSize: 13,
        color: Colors,
        fontFamily: FONTS.LexendMedium,
        textAlign: 'center',

    },
    Flex: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
    Button: {
        backgroundColor: Colors.primary,
        paddingVertical: 10,
        paddingHorizontal: 15,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderRadius: 7


    },

});