import React, { useContext, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import ScreenHeader from "../../Components/ScreenHeader";
import { RegisterBackContext } from "../../constants/GoBackContext";
import { createProjectPhotoFolders } from "../../services/projectService";
import { parseApiError } from "../../utils/apiError";
import { useScreenInsets } from "../../utils/screenInsets";
import { AppColors } from "../../utils/theme";
import { FONTS } from "../../utils/FONTS";
import { Colors } from "../../utils/colors";

export default function CreateProjectFolderScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { top, footerPadding } = useScreenInsets();
  const { setToast } = useContext(RegisterBackContext);
  const params = useLocalSearchParams<{ projectId?: string }>();
  const projectId = Array.isArray(params.projectId) ? params.projectId[0] : params.projectId;

  const [folderCount, setFolderCount] = useState("1");
  const [folderName, setFolderName] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ count?: string; name?: string; form?: string }>({});

  const save = async () => {
    if (!projectId || saving) return;
    const count = Number(folderCount);
    const name = folderName.trim();
    const nextErrors: { count?: string; name?: string } = {};
    if (!Number.isInteger(count) || count < 1) nextErrors.count = t("This field is required");
    if (!name) nextErrors.name = t("This field is required");
    if (nextErrors.count || nextErrors.name) {
      setErrors(nextErrors);
      return;
    }

    try {
      setSaving(true);
      setErrors({});
      await createProjectPhotoFolders(projectId, count, name);
      setToast({
        top: 45,
        text: t("Create folder"),
        type: "success",
        visible: true,
      });
      router.back();
    } catch (error) {
      setErrors({ form: parseApiError(error, t("Something went wrong")).message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <ScreenHeader title={t("Create folder")} onBack={() => router.back()} />
      <KeyboardAwareScrollView
        contentContainerStyle={styles.content}
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>{t("How many folders")}</Text>
        <TextInput
          style={[styles.input, errors.count ? styles.inputError : null]}
          value={folderCount}
          onChangeText={(text) => {
            setFolderCount(text.replace(/[^0-9]/g, ""));
            if (errors.count) setErrors((prev) => ({ ...prev, count: "" }));
          }}
          keyboardType="number-pad"
          placeholder="1"
          placeholderTextColor={Colors.placeholder}
          editable={!saving}
        />
        {errors.count ? <Text style={styles.error}>{errors.count}</Text> : null}

        <Text style={styles.label}>{t("Folder name")}</Text>
        <TextInput
          style={[styles.input, errors.name ? styles.inputError : null]}
          value={folderName}
          onChangeText={(text) => {
            setFolderName(text);
            if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
          }}
          placeholder="Koppeling"
          placeholderTextColor={Colors.placeholder}
          editable={!saving}
        />
        {errors.name ? <Text style={styles.error}>{errors.name}</Text> : null}
        {errors.form ? <Text style={styles.error}>{errors.form}</Text> : null}
      </KeyboardAwareScrollView>

      <View style={[styles.footer, { paddingBottom: footerPadding }]}>
        <Pressable style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={() => void save()} disabled={saving}>
          {saving ? (
            <ActivityIndicator color={AppColors.white} />
          ) : (
            <Text style={styles.saveBtnText}>{t("Create folder")}</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.white,
  },
  content: {
    padding: 16,
    gap: 8,
  },
  label: {
    marginTop: 8,
    fontFamily: FONTS.LexendMedium,
    fontSize: 14,
    color: AppColors.black,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#E0E5EA",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontFamily: FONTS.LexendRegular,
    fontSize: 15,
    color: AppColors.black,
    backgroundColor: AppColors.white,
  },
  inputError: {
    borderColor: Colors.dicline,
  },
  error: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 12,
    color: Colors.dicline,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  saveBtn: {
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: AppColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 15,
    color: AppColors.white,
  },
});
