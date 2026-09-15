import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    View,
    TextInput,
    FlatList,
    Pressable,
    Text,
    StyleSheet,
    Keyboard,
    Image,
} from "react-native";
import axios from "axios";


const GooglePlacesInput = ({
  apiKey,
  value,
  onChangeText,
  onSelect,
  placeholder = "Enter location",
  Icon,
  iconStyle,       
  InputStyle,   // ✅ NEW PROP
}) => {
    const [suggestions, setSuggestions] = useState([]);
    const debounceRef = useRef(null);

    const fetchSuggestions = async (text) => {
        if (text.length < 3) {
            setSuggestions([]);
            return;
        }

        try {
            const res = await axios.get(
                "https://maps.googleapis.com/maps/api/place/autocomplete/json",
                {
                    params: {
                        input: text,
                        key: apiKey,
                    },
                }
            );

            setSuggestions(res.data?.predictions || []);
        } catch (err) {
            console.warn("Autocomplete Error", err);
        }
    };

    const handleChange = (text) => {
        onChangeText(text);

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            fetchSuggestions(text);
        }, 400);
    };

    const handleSelect = (item) => {
        Keyboard.dismiss();
        setSuggestions([]);
        onSelect(item);
    };

    return (
        <View style={styles.wrapper}>
            {/* Input */}
            <View style={[styles.inputContainer,InputStyle]}>
                {Icon && (
  <Image
    source={Icon}
    style={[styles.IconStyle, iconStyle]} // ✅ merge styles
    resizeMode="contain"
  />
)}
                <TextInput
                    value={value}
                    onChangeText={handleChange}
                    placeholder={placeholder}
                    style={styles.input}
                    placeholderTextColor="#999"
                />
            </View>

            {/* Dropdown */}
            {suggestions.length > 0 && (
                <View style={styles.dropdown}>
                    <FlatList
                        keyboardShouldPersistTaps="handled"
                        data={suggestions}
                        keyExtractor={(item) => item.place_id}
                        renderItem={({ item }) => (
                            <Pressable
                                style={styles.item}
                                onPress={() => handleSelect(item)}
                            >
                                <Text style={styles.text}>{item.description}</Text>
                            </Pressable>
                        )}
                    />
                </View>
            )}
        </View>
    );
};

export default GooglePlacesInput;

const styles = StyleSheet.create({
    wrapper: {
        width: "100%",
        zIndex: 999,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        paddingHorizontal: 10,
        backgroundColor: "#fff",
        height: 48,
    },
    input: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
        color: "#000",
    },
    dropdown: {
        position: "absolute",
        top: 52,
        width: "100%",
        maxHeight: 180,
        backgroundColor: "#fff",
        borderRadius: 8,
        elevation: 6,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 4,
        zIndex:9999,
    },
    item: {
        padding: 12,
        borderBottomWidth: 0.5,
        borderColor: "#FFFFFF",
    },
    text: {
        fontSize: 13,
        color: "#333",
    },
 IconStyle: {
  width: 20,
  height: 20,
  tintColor: "#999",
  marginRight: 6,
},
});
