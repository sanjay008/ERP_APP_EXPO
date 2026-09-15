import {
  StyleSheet,
  Text,
  View,
  // SafeAreaView,
  FlatList,
  Image,
  ScrollView,
  Alert,
} from "react-native";
import React, { useEffect, useState } from "react";
import Header from "../components/header";
import { Colors } from "../constants/color";
import { FONTS } from "../constants/fontFamily";
import { RFValue } from "react-native-responsive-fontsize";
import { Images } from "../constants/images";
import { useTranslation } from "react-i18next";
import Notes from "../components/Notes";
import apiConstants from "../api/apiConstants";
import { getData } from "../utils/storeData";
import ApiService from "../utils/Apiservice";
import BlueHeader from "../components/BlueHeader";
import Footer from "../components/Footer";
import { SafeAreaView } from "react-native-safe-area-context";
import { heightPercentageToDP } from "react-native-responsive-screen";

const Contractdetails = ({ route }) => {
  const { t } = useTranslation();
  const { id, color } = route.params;
  const [contractdetails, setContractDetails] = useState([]);
  const [status, setStatus] = useState("");
  const [message, setMessage] = useState("");

  const removeHtmlTags = (htmlString) => {
    return htmlString.replace(/<[^>]*>/g, "");
  };

  const TenantContractdetails = async () => {
    try {
      const getdata = await getData("USERDATA");
      const data = await ApiService(apiConstants.tenantcontractdetail, {
        includeToken: true,
        customData: {
          relaties_id: getdata.data.relaties.id,
          role: getdata.data.user.role,
          user_id: getdata.data.user.id,
          contract_id: id,
        },
      });
      setStatus(data.status);
      if (data.status) {
        setContractDetails(data.data);
      } else {
        console.log("false Contract");
        setMessage(data.message);
      }
    } catch (err) {
      console.log("Error fetching connections:", err);
    }
  };

  useEffect(() => {
    TenantContractdetails();
  }, []);

  const DATA = [
    {
      id: 1,
      title: t("Debiteurennummer"),
      value: contractdetails.debtor_number,
    },
    {
      id: 2,
      title: t("Rent Pr."),
      value:
        contractdetails?.currency_data?.symbol +
          " " +
          contractdetails.rent_price || "-",
    },
    {
      id: 2,
      title: t("Brog"),
      value:
        contractdetails?.deposit_currencys?.symbol +
          " " +
          contractdetails.deposit || "-",
    },
    { id: 3, title: t("Van"), value: contractdetails.from || "-" },
    { id: 4, title: t("Einde"), value: contractdetails.end || "-" },
    {
      id: 5,
      title: t("Straat"),
      value:
        (contractdetails.street !== undefined && contractdetails.street !== null
          ? contractdetails.street
          : contractdetails?.object_data?.street || "- ") +
        " | " +
        (contractdetails.house_nr !== undefined &&
        contractdetails.house_nr !== null
          ? contractdetails.house_nr
          : contractdetails?.object_data?.house_nr || "- "),
    },
    {
      id: 6,
      title: t("Postcode"),
      value:
        contractdetails.postcode !== null &&
        contractdetails.postcode !== undefined
          ? contractdetails.postcode
          : contractdetails?.object_data?.postcode || "-",
    },
    { id: 7, title: t("Stad"), value: contractdetails.city || "-" },
    {
      id: 8,
      title: t("Land"),
      value: contractdetails.object_data?.country || "-",
    },
  ];

  const DATA1 = [
    {
      id: 1,
      title: t("Verhuurder"),
      value: contractdetails?.landlord_data?.display_name || "-",
    },
    {
      id: 2,
      title: t("IBAN"),
      value: contractdetails?.landlord_data?.iban || "-",
    },
    {
      id: 3,
      title: t("Banknaam"),
      value: contractdetails?.bank_data?.bank_name || "-",
    },
  ];

  const DATA2 = [
    {
      id: 1,
      title: contractdetails?.relatie_data?.display_name || "-",
    },
    {
      id: 2,
      title: contractdetails?.tenant_two?.display_name || "-",
    },
    {
      id: 3,
      title: contractdetails?.guarantor?.display_name || "-",
    },
  ];

  const renderItem = ({ item }) => {
    return (
      <View>
        <View style={styles.row}>
          <Text style={styles.label}>{item.title}</Text>
          <Text style={styles.value}>{item.value}</Text>
        </View>
      </View>
    );
  };

  return (
    // <SafeAreaView style={[styles.container, { backgroundColor: color }]}>
    <>
      {/* <Header back title={t("Huur Overeenkomst")} /> */}
      <BlueHeader title={t("Details")} bgcolor={color} />
      <View
        style={{
          backgroundColor: Colors.litegray1,
          height: "100%",
          marginTop: heightPercentageToDP(-1),
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
          flex: 1,
          // paddingTop: 10,
        }}
      >
        {status ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: 20, // Adds bottom padding to the content
            }}
          >
            <View style={styles.headerview}>
              <Text style={styles.title}>
                {contractdetails?.object_data?.display_name}
              </Text>

              <View style={styles.statusbg}>
                <View
                  style={[
                    styles.statusbox,
                    {
                      backgroundColor:
                        contractdetails?.status?.color || Colors.primary,
                    },
                  ]}
                >
                  <Text style={styles.statusname}>
                    {contractdetails?.status?.status_name}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.box}>
              <FlatList
                data={DATA}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                ItemSeparatorComponent={() => <View style={styles.line}></View>}
              />
            </View>

            <View style={styles.secondheader}>
              <Text style={styles.title}>{t("Huurder")}</Text>
            </View>

            <View style={styles.box}>
              <FlatList
                data={DATA1}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                ItemSeparatorComponent={() => <View style={styles.line}></View>}
              />
            </View>
            <View style={styles.box}>
              <FlatList
                data={DATA2}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                ItemSeparatorComponent={() => <View style={styles.line}></View>}
              />
            </View>

            {contractdetails?.notes?.map((note) => (
              <Notes
                key={note.id}
                title={t("Notes")}
                name={note?.user?.username}
                time={note.created_at}
                dis={removeHtmlTags(note.comment)}
              />
            ))}
          </ScrollView>
        ) : (
          <View>
            <Text style={styles.fallbackText}>{message}</Text>
          </View>
        )}
      </View>
      {/* <Footer /> */}
    </>
    // </SafeAreaView>
  );
};

export default Contractdetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  boxcontainer: {
    flex: 1,
    justifyContent: "flex-end",
    flexDirection: "row",
  },
  box: {
    marginHorizontal: 15,
    borderColor: Colors.litegray,
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
    backgroundColor: Colors.white,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 5,
  },
  label: {
    fontFamily: FONTS.LexendMedium,
    fontSize: RFValue(12),
    color: Colors.textgray,
  },
  value: {
    fontFamily: FONTS.LexendRegular,
    fontSize: RFValue(12),
    color: Colors.black,
    textAlign: "right",
    flexWrap: "wrap",
    width: "55%",
  },
  line: {
    height: 1,
    backgroundColor: Colors.litegray,
    marginVertical: 6,
  },
  title: {
    color: Colors.black,
    fontFamily: FONTS.LexendMedium,
    fontSize: RFValue(14),
    flex: 6,
  },
  lastbox: {
    borderColor: Colors.primary,
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
    backgroundColor: Colors.lightprimary,
  },
  headerview: {
    flexDirection: "row",
    marginTop: RFValue(10),
    marginHorizontal: 20,
  },
  statusbg: {
    flexDirection: "row",
    flex: 4,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  statusbox: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    width: "80%",
    alignItems: "center",
  },
  statusname: {
    fontFamily: FONTS.LexendRegular,
    color: Colors.white,
  },
  secondheader: {
    marginHorizontal: 20,
  },
  fallbackText: {
    color: Colors.textgray,
    alignSelf: "center",
    marginVertical: 10,
  },
});
