import {
    View,
    StyleSheet,
    StatusBar,
    TouchableOpacity,
    Text,
    FlatList,
    Image,
} from "react-native";
import React, { useEffect, useState } from "react";
import BlueHeader from "../components/BlueHeader";
import { useIsFocused } from "@react-navigation/native";
import { t } from "i18next";
import { Images } from "../constants/images";
import { getData } from "../utils/storeData";
import ApiService from "../utils/Apiservice";
import apiConstants from "../api/apiConstants";
import { Colors } from "../constants/color";
import { FONTS } from "../constants/fontFamily";
import Loader from "../components/loading";

export default function MyCompany({ navigation, route }) {
    const { item } = route.params || {};
    const itemdata = item;
    const isFocused = useIsFocused();
    const [companyList, setCompanyList] = useState([]);
    const [searchText, setSearchText] = useState("");
    const [filteredCompanyList, setFilteredCompanyList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = async () => {
        setRefreshing(true);
        await GetCompany();
        setRefreshing(false);
    };

    const handleSearch = (text) => {
        setSearchText(text);

        if (!text) {
            setFilteredCompanyList(companyList);
            return;
        }

        const filtered = companyList.filter((company) =>
            (company.display_name || "").toLowerCase().includes(text.toLowerCase()) ||
            (company.city || "").toLowerCase().includes(text.toLowerCase()) ||
            (company.email_adres || "").toLowerCase().includes(text.toLowerCase())
        );

        setFilteredCompanyList(filtered);
    };

    const GetCompany = async () => {
        setLoading(true);
        try {
            const getdata = await getData("USERDATA");
            const data = await ApiService(apiConstants.get_business_company, {
                includeToken: true,
                customData: {
                    relaties_id: getdata.data.relaties.id,
                    role: getdata.data.user.role,
                    user_id: getdata.data.user.id,
                },
            });
            // console.log(data, "suvdfdf==========");
            if (data.status) {
                setLoading(false);
                setCompanyList(data.data || []);
                setFilteredCompanyList(data.data || []);


            } else {
                setLoading(false);
                console.log("False connections");
            }
        } catch (err) {
            setLoading(false);
            console.log("Error fetching connections:", err);
        }
    };

    useEffect(() => {
        GetCompany();
    }, [isFocused]);

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={1}
            // onPress={() => {
            //     navigation.navigate("AddCompany", { companyData: item });
            // }}
        >

            <Text style={styles.companyName}>{item.display_name || "No Name"}</Text>
            {/* {item.bedrijfsnaam ? (
                <Text style={styles.subText}>{item.bedrijfsnaam}</Text>
            ) : null} */}
            {item.city && <View style={styles.row}>

                <Image source={Images.location} style={styles.image} />
                {item.city ? <Text style={styles.subText}>{item.city}</Text> : null}
            </View>}
            <View style={styles.row}>

                <Image source={Images.mail} style={styles.image} />


                {item.email_adres ? (
                    <Text style={styles.subText}>{item.email_adres}</Text>
                ) : null}
            </View>
            <View style={styles.btncontainer1}>

                <TouchableOpacity
                    onPress={() => {
                        navigation.navigate("Connectiondetails", {
                            id: item.id,
                            color: item?.color_code || "#d980ae",
                        });
                    }}
                    style={styles.button}
                >
                    <Text style={styles.startbuttonText}>{t("Profile")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => {
                        navigation.navigate("AddCompany", {
                            item: itemdata,
                            bgcolor: item?.color_code || "#d980ae",
                            id: item.id,
                            dataaa: item,
                        });
                    }}
                    style={styles.button}
                >
                    <Text style={styles.startbuttonText}>{t("Business Page")}</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar backgroundColor={"transparent"} translucent={true} />
            <BlueHeader
                bgcolor={item?.color_code || "#d980ae"}
                title={item?.item_title ? t(`${item?.item_title}`) : t("My Company")}
                SearchBarInput
                value={searchText}
                onChangeText={handleSearch}
                onPressfilter={{}}
                Righticon={Images.refresh}
                filterButtonShow={false}
                onPressRight={GetCompany}
            />

            {loading && <Loader color={item?.color_code || "#d980ae"} />}


            <FlatList
                data={filteredCompanyList}
                ListHeaderComponent={() => (
                    <View style={styles.btncontainer}>
                        <TouchableOpacity
                            onPress={() => {
                                navigation.navigate("AddRelations", {
                                    item: item,
                                    bgcolor: item?.color_code || "#d980ae",
                                });
                            }}
                            style={styles.button}
                        >
                            <Text style={styles.startbuttonText}>{t("+Add Company")}</Text>
                        </TouchableOpacity>
                    </View>
                )}
                keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                renderItem={renderItem}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 50 }}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>{t("No Companies Found")}</Text>
                }
                refreshing={refreshing}
                onRefresh={onRefresh}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    btncontainer: {
        flexDirection: "row",
        width: "100%",
        alignSelf: "center",
        // paddingHorizontal: 20,
    },
    btncontainer1: {
        flexDirection: "row",
        width: "100%",
    },
    button: {
        backgroundColor: Colors.primary,
        padding: 10,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
        marginVertical: 20,
    },
    startbuttonText: {
        color: Colors.white,
        fontFamily: FONTS.LexendRegular,
    },
    card: {
        backgroundColor: "#f8f8f8",
        borderRadius: 10,
        padding: 15,
        marginBottom: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    companyName: {
        fontFamily: FONTS.LexendMedium,
        fontSize: 18,
        color: Colors.black,
    },
    subText: {
        fontFamily: FONTS.LexendRegular,
        fontSize: 14,
        color: Colors.gray, paddingLeft: 5
    },
    emptyText: {
        textAlign: "center",
        color: Colors.gray,
        fontFamily: FONTS.LexendRegular,
        marginTop: 30,
    }, image: {
        width: 18,
        height: 18
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 5
    }
});
