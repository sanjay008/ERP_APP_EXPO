import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import Modal from "react-native-modal"; // Ensure you have the right modal library
import CheckBox from "react-native-check-box"; // Update with your actual checkbox library
import { Colors } from "../constants/color";
import { FONTS } from "../constants/fontFamily";
import { Images } from "../constants/images";
import ButtonComponent from "./buttonComponent";
import { useTranslation } from "react-i18next";

const Filtersortmodal = ({
  sortModalVisible = true,
  setSortModalVisible,
  handleSortPress,
  filterModalVisible,
  setFilterModalVisible,
  handleCheckboxChange,
  applyFilters,
  statusData,
  selectedStatusIds,
  modalheight,
  data,
}) => {
  const { t } = useTranslation();
  return (
    <>
      {/* Sort Modal */}
      <Modal
        animationType="slide"
        animationOut={"slideInDown"}
        animationIn={"slideInDown"}
        onSwipeComplete={() => setSortModalVisible(false)}
        onBackdropPress={() => setSortModalVisible(false)}
        onBackButtonPress={() => setSortModalVisible(false)}
        swipeDirection="down"
        style={{
          justifyContent: "flex-end",
          margin: 0,
          backgroundColor: Colors.transparant,
        }}
        visible={sortModalVisible}
      >
        <View
          style={{
            flex: 1,
            position: "absolute",
            bottom: 0,
            borderTopRightRadius: 30,
            borderTopLeftRadius: 30,
            backgroundColor: Colors.white,
            width: "100%",
            paddingTop: 20,
            paddingBottom: 20,
          }}
        >
          <FlatList
            data={data}
            ItemSeparatorComponent={() => (
              <View
                style={{
                  height: 1,
                  backgroundColor: Colors.litegray,
                  marginVertical: 5,
                }}
              />
            )}
            contentContainerStyle={{ marginHorizontal: 24 }}
            ListHeaderComponent={() => (
              <Text
                style={{
                  fontFamily: FONTS.LexendSemiBold,
                  fontSize: 24,
                  marginBottom: 10,
                  color: Colors.black,
                }}
              >
                Sort By
              </Text>
            )}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  setSortModalVisible(false);
                  handleSortPress(item.title);
                }}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingVertical: 10,
                }}
              >
                <Text
                  style={{
                    fontFamily: FONTS.LexendRegular,
                    fontSize: 17,
                    color: Colors.black,
                  }}
                >
                  {item.title}
                </Text>
                <View style={styles.up}>
                  <Image
                    source={Images.downArrow}
                    style={{ height: 18, width: 18 }}
                  />
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      {/* Filter Modal */}
      <Modal
        isVisible={filterModalVisible}
        style={{
          justifyContent: "flex-end",
          margin: 0,
          backgroundColor: Colors.transparant,
        }}
        onBackdropPress={() => setFilterModalVisible(false)}
        onBackButtonPress={() => setFilterModalVisible(false)}
      >
        <View
          style={{
            padding: 20,
            backgroundColor: Colors.white,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            height: modalheight,
          }}
        >
          <FlatList
            data={statusData}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => (
              <View
                style={{
                  height: 1,
                  backgroundColor: Colors.litegray,
                  marginVertical: 10,
                }}
              />
            )}
            ListHeaderComponent={() => (
              <Text
                style={{
                  fontFamily: FONTS.LexendSemiBold,
                  fontSize: 24,
                  color: Colors.black,
                  marginVertical: 10,
                }}
              >
                Filter
              </Text>
            )}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginVertical: 5,
                }}
                onPress={() => handleCheckboxChange(item)}
              >
                <CheckBox
                  onClick={() => handleCheckboxChange(item)}
                  isChecked={selectedStatusIds.includes(item.id)}
                  checkBoxColor={Colors.litegray}
                  checkedCheckBoxColor={Colors.primary}
                />
                <Text
                  style={{
                    marginLeft: 10,
                    fontFamily: FONTS.LexendRegular,
                    color: Colors.black,
                  }}
                >
                  {t(item.status_name)}
                </Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id.toString()}
          />
          <ButtonComponent
            title="Apply Filter"
            onPress={applyFilters}
            marginTop={"5%"}
          />
        </View>
      </Modal>
    </>
  );
};

export default Filtersortmodal;

const styles = StyleSheet.create({
  up: {
    borderWidth: 1,
    borderRadius: 7,
    borderColor: Colors.litegray,
    height: 35,
    width: 35,
    justifyContent: "center",
    alignItems: "center",
  },
});
