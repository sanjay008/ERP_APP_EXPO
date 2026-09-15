import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import AuthButton from "../../Components/Auth/AuthButton";
import AuthInput from "../../Components/Auth/AuthInput";
import AuthSelect from "../../Components/Auth/AuthSelect";
import SelectionSheet from "../../Components/Auth/SelectionSheet";
import RichDescriptionEditor from "../../Components/RichDescriptionEditor";
import ScreenHeader from "../../Components/ScreenHeader";
import { RegisterBackContext } from "../../constants/GoBackContext";
import {
  createProductFromTemplate,
  fetchProductCategories,
  fetchProductTemplates,
  type ProductCategory,
  type ProductImageAsset,
  type ProductSubCategory,
  type ProductTemplate,
} from "../../services/productService";
import { getApiErrorMessage } from "../../utils/validation";
import { useScreenInsets } from "../../utils/screenInsets";
import { AppColors } from "../../utils/theme";
import { FONTS } from "../../utils/FONTS";
import { LIST_UI } from "../../utils/connectionTheme";
import { listScreenStyles } from "../../utils/listScreenStyles";

export default function CreateProductScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { top, scrollPadding } = useScreenInsets();
  const { setToast } = useContext(RegisterBackContext);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [templates, setTemplates] = useState<ProductTemplate[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);

  const [templateId, setTemplateId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subCategories, setSubCategories] = useState<ProductSubCategory[]>([]);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<ProductImageAsset[]>([]);

  const [templateSheetOpen, setTemplateSheetOpen] = useState(false);
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);
  const [subCategorySheetOpen, setSubCategorySheetOpen] = useState(false);

  const loadOptions = useCallback(async () => {
    setLoading(true);
    try {
      const [templateData, categoryData] = await Promise.all([
        fetchProductTemplates(),
        fetchProductCategories(),
      ]);
      setTemplates(templateData);
      setCategories(categoryData);
    } catch (error) {
      setToast({
        top: 45,
        text: getApiErrorMessage(error, t("Something went wrong")),
        type: "error",
        visible: true,
      });
    } finally {
      setLoading(false);
    }
  }, [setToast, t]);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  const selectedTemplate = templates.find((item) => String(item.id) === templateId);
  const selectedCategory = categories.find((item) => String(item.id) === categoryId);
  const availableSubCategories = selectedCategory?.parentsub ?? [];

  const subCategoryLabel = useMemo(() => {
    if (!subCategories.length) return undefined;
    return subCategories.map((item) => item.sub_category_name).filter(Boolean).join(", ");
  }, [subCategories]);

  const pickImages = async () => {
    Alert.alert(t("Select profile photo"), "", [
      {
        text: t("Camera"),
        onPress: async () => {
          const permission = await ImagePicker.requestCameraPermissionsAsync();
          if (!permission.granted) {
            setToast({
              top: 45,
              text: t("Permission required to access photos"),
              type: "error",
              visible: true,
            });
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            quality: 0.8,
          });
          if (result.canceled || !result.assets?.length) return;
          const next = result.assets.map((asset, index) => ({
            uri: asset.uri,
            type: asset.mimeType || "image/jpeg",
            name: asset.fileName || `product_${Date.now()}_${index}.jpg`,
          }));
          setImages((prev) => [...prev, ...next]);
        },
      },
      {
        text: t("Gallery"),
        onPress: async () => {
          const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!permission.granted) {
            setToast({
              top: 45,
              text: t("Permission required to access photos"),
              type: "error",
              visible: true,
            });
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsMultipleSelection: true,
            quality: 0.8,
          });
          if (result.canceled || !result.assets?.length) return;
          const next = result.assets.map((asset, index) => ({
            uri: asset.uri,
            type: asset.mimeType || "image/jpeg",
            name: asset.fileName || `product_${Date.now()}_${index}.jpg`,
          }));
          setImages((prev) => [...prev, ...next]);
        },
      },
      { text: t("Annuleren"), style: "cancel" },
    ]);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const toggleSubCategory = (item: ProductSubCategory) => {
    setSubCategories((prev) => {
      const exists = prev.some((entry) => String(entry.id) === String(item.id));
      if (exists) return prev.filter((entry) => String(entry.id) !== String(item.id));
      return [...prev, item];
    });
  };

  const handleSubmit = async () => {
    if (!templateId || !categoryId || !title.trim() || !price.trim() || !description.trim()) {
      setToast({
        top: 45,
        text: t("Please fill all required fields"),
        type: "error",
        visible: true,
      });
      return;
    }

    if (availableSubCategories.length > 0 && subCategories.length === 0) {
      setToast({
        top: 45,
        text: t("Please select subcategory"),
        type: "error",
        visible: true,
      });
      return;
    }

    setSubmitting(true);
    try {
      await createProductFromTemplate({
        templateId,
        categoryId,
        title: title.trim(),
        price: price.trim(),
        description,
        subCategoryIds: subCategories.map((item) => item.id ?? ""),
        images,
      });
      setToast({
        top: 45,
        text: t("Product created successfully"),
        type: "success",
        visible: true,
      });
      router.back();
    } catch (error) {
      setToast({
        top: 45,
        text: getApiErrorMessage(error, t("Something went wrong")),
        type: "error",
        visible: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[listScreenStyles.container, styles.centered, { paddingTop: top }]}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </View>
    );
  }

  return (
    <View style={[listScreenStyles.container, { paddingTop: top }]}>
      <ScreenHeader title={t("Add Product")} onBack={() => router.back()} />

      <KeyboardAwareScrollView
        contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}
        keyboardShouldPersistTaps="handled"
      >
        <AuthSelect
          label={t("Template")}
          value={selectedTemplate?.template_name}
          placeholder={t("Select template")}
          onPress={() => setTemplateSheetOpen(true)}
        />
        <AuthSelect
          label={t("Category")}
          value={selectedCategory?.category_name}
          placeholder={t("Select category")}
          onPress={() => setCategorySheetOpen(true)}
        />
        {availableSubCategories.length > 0 ? (
          <AuthSelect
            label={t("Subcategory")}
            value={subCategoryLabel}
            placeholder={t("Select subcategory")}
            onPress={() => setSubCategorySheetOpen(true)}
          />
        ) : null}
        <AuthInput label={t("Title")} value={title} onChangeText={setTitle} required />
        <AuthInput
          label={t("Price")}
          value={price}
          onChangeText={setPrice}
          keyboardType="decimal-pad"
          required
        />

        <Text style={styles.editorLabel}>{t("Description")} *</Text>
        <RichDescriptionEditor value={description} onChange={setDescription} compact />

        <View style={styles.imageHeader}>
          <Text style={styles.editorLabel}>{t("Images")}</Text>
          <Pressable onPress={pickImages} style={styles.addImageBtn}>
            <Ionicons name="images-outline" size={18} color={AppColors.primary} />
            <Text style={styles.addImageText}>{t("Add images")}</Text>
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageRow}>
          {images.map((image, index) => (
            <View key={`${image.uri}-${index}`} style={styles.imageWrap}>
              <Image source={{ uri: image.uri }} style={styles.imagePreview} />
              <Pressable style={styles.removeImageBtn} onPress={() => removeImage(index)}>
                <Ionicons name="close-circle" size={22} color="#EF4444" />
              </Pressable>
            </View>
          ))}
        </ScrollView>

        <AuthButton title={t("Save")} onPress={handleSubmit} disabled={submitting} />
      </KeyboardAwareScrollView>

      <SelectionSheet
        visible={templateSheetOpen}
        title={t("Template")}
        options={templates.map((item) => ({ label: item.template_name || "-", value: String(item.id) }))}
        onClose={() => setTemplateSheetOpen(false)}
        onSelect={(option) => {
          setTemplateId(option.value);
          setTemplateSheetOpen(false);
        }}
      />

      <SelectionSheet
        visible={categorySheetOpen}
        title={t("Category")}
        options={categories.map((item) => ({ label: item.category_name || "-", value: String(item.id) }))}
        onClose={() => setCategorySheetOpen(false)}
        onSelect={(option) => {
          setCategoryId(option.value);
          setSubCategories([]);
          setCategorySheetOpen(false);
        }}
      />

      <SelectionSheet
        visible={subCategorySheetOpen}
        title={t("Subcategory")}
        options={availableSubCategories.map((item) => ({
          label: `${subCategories.some((entry) => String(entry.id) === String(item.id)) ? "✓ " : ""}${item.sub_category_name || "-"}`,
          value: String(item.id),
        }))}
        closeOnSelect={false}
        onClose={() => setSubCategorySheetOpen(false)}
        onSelect={(option) => {
          const item = availableSubCategories.find((entry) => String(entry.id) === option.value);
          if (item) toggleSubCategory(item);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { alignItems: "center", justifyContent: "center" },
  content: { paddingHorizontal: LIST_UI.screenPadding, paddingTop: 16, gap: 12 },
  editorLabel: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 13,
    color: AppColors.black,
    marginBottom: 6,
  },
  imageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  addImageBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  addImageText: { fontFamily: FONTS.LexendMedium, fontSize: 13, color: AppColors.primary },
  imageRow: { gap: 10, paddingVertical: 4 },
  imageWrap: { position: "relative" },
  imagePreview: { width: 88, height: 88, borderRadius: 8, backgroundColor: "#EEF2F7" },
  removeImageBtn: { position: "absolute", top: -8, right: -8 },
});
