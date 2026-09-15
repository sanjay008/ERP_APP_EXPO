import { useCallback, useEffect, useRef, useState } from "react";
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { getGoogleMapsApiKey } from "../utils/googleMapsApiKey";
import { authTypography } from "../utils/authTypography";
import { AppColors } from "../utils/theme";

export type GooglePlacePrediction = {
  place_id: string;
  description: string;
};

type GooglePlacesInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSelect?: (item: GooglePlacePrediction) => void;
  placeholder?: string;
  containerStyle?: StyleProp<ViewStyle>;
  inputContainerStyle?: StyleProp<ViewStyle>;
  showIcon?: boolean;
};

export default function GooglePlacesInput({
  value,
  onChangeText,
  onSelect,
  placeholder = "Enter location",
  containerStyle,
  inputContainerStyle,
  showIcon = true,
}: GooglePlacesInputProps) {
  const [apiKey, setApiKey] = useState("");
  const [suggestions, setSuggestions] = useState<GooglePlacePrediction[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getGoogleMapsApiKey().then(setApiKey);
  }, []);

  const fetchSuggestions = useCallback(
    async (text: string) => {
      if (!apiKey || text.length < 3) {
        setSuggestions([]);
        return;
      }

      try {
        const response = await axios.get(
          "https://maps.googleapis.com/maps/api/place/autocomplete/json",
          {
            params: {
              input: text,
              key: apiKey,
            },
          }
        );
        setSuggestions(response.data?.predictions ?? []);
      } catch {
        setSuggestions([]);
      }
    },
    [apiKey]
  );

  const handleChange = (text: string) => {
    onChangeText(text);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(text);
    }, 400);
  };

  const handleSelect = (item: GooglePlacePrediction) => {
    Keyboard.dismiss();
    setSuggestions([]);
    onChangeText(item.description);
    onSelect?.(item);
  };

  return (
    <View style={[styles.wrapper, containerStyle]}>
      <View style={[styles.inputContainer, inputContainerStyle]}>
        {showIcon ? (
          <Ionicons name="location-outline" size={18} color="#9CA3AF" />
        ) : null}
        <TextInput
          value={value}
          onChangeText={handleChange}
          placeholder={placeholder}
          placeholderTextColor={authTypography.placeholder.color}
          style={styles.input}
        />
      </View>

      {suggestions.length > 0 ? (
        <View style={styles.dropdown}>
          <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
            {suggestions.map((item) => (
              <Pressable key={item.place_id} style={styles.item} onPress={() => handleSelect(item)}>
                <Text style={styles.itemText}>{item.description}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

type GooglePlacesFieldProps = GooglePlacesInputProps & {
  label?: string;
  required?: boolean;
  error?: string;
};

export function GooglePlacesField({
  label,
  required,
  error,
  containerStyle,
  ...inputProps
}: GooglePlacesFieldProps) {
  return (
    <View style={[styles.field, containerStyle]}>
      {label ? (
        <Text style={authTypography.label}>
          {label}
          {required ? <Text style={authTypography.required}> *</Text> : null}
        </Text>
      ) : null}
      <GooglePlacesInput {...inputProps} />
      {error ? <Text style={[authTypography.error, styles.errorSpacing]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    zIndex: 20,
  },
  field: {
    marginBottom: 18,
    zIndex: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D8DEE6",
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: AppColors.white,
    minHeight: 48,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: AppColors.black,
    paddingVertical: 10,
  },
  dropdown: {
    marginTop: 4,
    width: "100%",
    maxHeight: 180,
    backgroundColor: AppColors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 30,
  },
  item: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  itemText: {
    fontSize: 13,
    color: "#333",
  },
  errorSpacing: {
    marginTop: 6,
  },
});
