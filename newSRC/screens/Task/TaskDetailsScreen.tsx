import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import ScreenHeader from "../../Components/ScreenHeader";
import ApiFeedback from "../../Components/ApiFeedback";
import HtmlContent from "../../Components/HtmlContent";
import FallBackImage from "../../Components/FallBackImage";
import AuthButton from "../../Components/Auth/AuthButton";
import FormModal from "../../Components/FormModal";
import NoteCard from "../../Components/NoteCard";
import { useApiErrorState } from "../../hooks/useApiErrorState";
import { useScreenInsets } from "../../utils/screenInsets";
import {
  addTaskComment,
  fetchTaskDetails,
  type TaskDetail,
} from "../../services/taskService";
import { AppColors } from "../../utils/theme";
import { FONTS } from "../../utils/FONTS";
import { LIST_UI } from "../../utils/connectionTheme";
import { listScreenStyles } from "../../utils/listScreenStyles";
import { getData } from "../../utils/storeData";
import { isOpenableAddress, openMapsAddress } from "../../utils/openMaps";
import DocumentPreviewModal from "../Documents/DocumentPreviewModal";
import { resolveDocumentFileType } from "../Documents/types";
import { Images } from "../../utils/Images";

export default function TaskDetailsScreen() {
  const { t } = useTranslation();
  const { top, scrollPadding } = useScreenInsets();
  const params = useLocalSearchParams<{ id: string; color?: string }>();

  const [data, setData] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentVisible, setCommentVisible] = useState(false);
  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const { apiError, clearApiError, captureApiError } = useApiErrorState();

  const loadDetails = useCallback(async () => {
    if (!params.id) return;
    try {
      setLoading(true);
      clearApiError();
      const response = await fetchTaskDetails(params.id);
      if (response?.status && response.data) {
        setData(response.data);
      }
    } catch (error) {
      captureApiError(error);
    } finally {
      setLoading(false);
    }
  }, [params.id, clearApiError, captureApiError]);

  useEffect(() => {
    loadDetails();
    getData("COMPANYLOGO").then(setCompanyLogo);
    getData("COMPANYLOGIN").then(setCompanyName);
  }, [loadDetails]);

  const detailRows = useMemo(
    () => [
      { label: t("Termijn"), value: data?.deadline || "-", isMap: false },
      { label: t("Priorities"), value: data?.priority || "-", isMap: false },
      {
        label: t("Aantal"),
        value:
          data?.quantity == null || !data?.quantity_type
            ? "-"
            : `${data.quantity} ${data.quantity_type}`,
        isMap: false,
      },
      {
        label: t("Address"),
        value: data?.relatie_data?.adres || "-",
        isMap: isOpenableAddress(data?.relatie_data?.adres),
      },
      { label: t("deadline"), value: data?.deadline || "-", isMap: false },
      {
        label: t("Service Time"),
        value: data?.service_time_tasktype || "-",
        isMap: false,
      },
    ],
    [data, t]
  );

  const documentUri =
    data?.view_url || data?.shared_link || data?.file_path || "";
  const documentFileType = resolveDocumentFileType({
    file_type: data?.file_type,
    file_extension: data?.file_extension,
    view_url: documentUri,
    filename: data?.file_path,
  });

  const submitComment = async () => {
    if (!comment.trim()) {
      setCommentError(t("Please enter comment"));
      return;
    }
    try {
      setSubmitting(true);
      await addTaskComment(params.id, comment.trim());
      setComment("");
      setCommentError("");
      setCommentVisible(false);
      await loadDetails();
    } catch (error) {
      console.log("Error adding comment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <ScreenHeader title={t("Tasks/Complaints Details")} />

      {loading && !data ? (
        <ApiFeedback loading />
      ) : apiError && !data ? (
        <ApiFeedback error={apiError} onRetry={loadDetails} />
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: scrollPadding },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.mainCard}>
            <View style={styles.headerTop}>
              <View style={styles.idBox}>
                <Text style={styles.idText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
                  {data?.id}
                </Text>
              </View>
              <Text style={styles.title}>{data?.title ? t(data.title) : t("-")}</Text>
              {data?.task_status_data ? (
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        data.task_status_data.color || AppColors.primary,
                    },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {t(data.task_status_data.status_name)}
                  </Text>
                </View>
              ) : null}
            </View>

            {detailRows.map((row, index) => (
              <View
                key={row.label}
                style={[
                  styles.detailRow,
                  index === detailRows.length - 1 && styles.detailRowLast,
                ]}
              >
                <Text style={styles.detailLabel}>{row.label}</Text>
                {row.isMap ? (
                  <Pressable
                    style={styles.detailValuePressable}
                    onPress={() => openMapsAddress(row.value)}
                  >
                    <Text style={styles.detailLink}>{row.value}</Text>
                  </Pressable>
                ) : (
                  <Text style={styles.detailValue}>{row.value}</Text>
                )}
              </View>
            ))}
          </View>

          {documentUri ? (
            <Pressable style={styles.docCard} onPress={() => setPreviewOpen(true)}>
              {documentFileType === "image" ? (
                <Image
                  source={{ uri: documentUri }}
                  style={styles.docImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.docFileWrap}>
                  <Image
                    source={
                      documentFileType === "pdf" ? Images.PdfLogo : Images.documentlogo
                    }
                    style={styles.docFileIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.docFileText}>{t("Document")}</Text>
                </View>
              )}
            </Pressable>
          ) : null}

          {data?.short_description ? (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>{t("Omschrijving")}</Text>
              <HtmlContent html={data.short_description} variant="description" />
            </View>
          ) : null}

          {data?.notes?.length ? (
            <View style={styles.notesSection}>
              <Text style={styles.notesHeading}>{t("Notes")}</Text>
              {data.notes.map((note) => (
                <NoteCard
                  key={note.id}
                  author={note.user?.username || t("User")}
                  text={note.comment}
                  time={note.created_at}
                />
              ))}
            </View>
          ) : null}

          <View style={styles.companyCard}>
            <FallBackImage
              source={
                data?.relatie_data?.profile_image?.file_path
                  ? { uri: data.relatie_data.profile_image.file_path }
                  : companyLogo
                    ? { uri: companyLogo }
                    : undefined
              }
              style={styles.companyAvatar}
              resizeMode="cover"
            />
            <Text style={styles.companyName}>
              {data?.relatie_data?.display_name || companyName || "DreamzWorld"}
            </Text>
          </View>

          <View style={styles.commentWrap}>
            <AuthButton
              title={t("Comment")}
              onPress={() => setCommentVisible(true)}
            />
          </View>
        </ScrollView>
      )}

      <FormModal visible={commentVisible} onClose={() => setCommentVisible(false)} scrollable>
        <Text style={styles.modalTitle}>{t("Comment")}</Text>
        <TextInput
          style={styles.commentInput}
          value={comment}
          onChangeText={(text) => {
            setComment(text);
            if (commentError) setCommentError("");
          }}
          placeholder={t("Enter comment")}
          placeholderTextColor={AppColors.subtitle}
          multiline
        />
        {commentError ? (
          <Text style={styles.errorText}>{commentError}</Text>
        ) : null}
        <View style={styles.modalActions}>
          <Pressable
            style={styles.cancelBtn}
            onPress={() => setCommentVisible(false)}
          >
            <Text style={styles.cancelText}>{t("Annuleren")}</Text>
          </Pressable>
          <Pressable
            style={styles.submitBtn}
            onPress={submitComment}
            disabled={submitting}
          >
            <Text style={styles.submitText}>
              {submitting ? t("Loading...") : t("Submit")}
            </Text>
          </Pressable>
        </View>
      </FormModal>

      <DocumentPreviewModal
        visible={previewOpen}
        title={t("Document")}
        imageUri={documentUri}
        downloadUrl={data?.download_url || documentUri}
        fileType={documentFileType}
        onClose={() => setPreviewOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: listScreenStyles.container,
  content: listScreenStyles.detailContent,
  mainCard: {
    ...listScreenStyles.detailCard,
    paddingHorizontal: LIST_UI.cardPadding,
    paddingTop: LIST_UI.cardPadding,
    marginBottom: LIST_UI.cardGap,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: LIST_UI.iconTextGap,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: LIST_UI.cardBorder,
    borderStyle: "dashed",
  },
  idBox: listScreenStyles.idBox,
  idText: listScreenStyles.idText,
  title: {
    flex: 1,
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 16,
    color: AppColors.black,
  },
  statusBadge: listScreenStyles.statusBadge,
  statusText: listScreenStyles.statusBadgeText,
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: LIST_UI.cardBorder,
    borderStyle: "dotted",
  },
  detailRowLast: {
    borderBottomWidth: 0,
  },
  detailLabel: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 13,
    color: AppColors.subtitle,
    flex: 1,
  },
  detailValue: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 13,
    color: AppColors.black,
    flex: 1,
    textAlign: "right",
  },
  detailValuePressable: {
    flex: 1,
  },
  detailLink: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 13,
    color: AppColors.primary,
    textAlign: "right",
    textDecorationLine: "underline",
  },
  sectionCard: listScreenStyles.detailCard,
  sectionTitle: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 15,
    color: AppColors.black,
    marginBottom: 10,
  },
  notesSection: {
    marginBottom: 14,
  },
  notesHeading: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 15,
    color: AppColors.black,
    marginBottom: 10,
  },
  companyCard: {
    flexDirection: "row",
    alignItems: "center",
    ...listScreenStyles.detailCard,
    gap: LIST_UI.iconTextGap,
  },
  companyAvatar: {
    width: LIST_UI.iconSize,
    height: LIST_UI.iconSize,
    borderRadius: LIST_UI.iconRadius,
    borderWidth: 1,
    borderColor: AppColors.primary,
  },
  companyName: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 16,
    color: AppColors.black,
  },
  commentWrap: {
    marginBottom: 8,
  },
  docCard: {
    ...listScreenStyles.detailCard,
    marginBottom: LIST_UI.cardGap,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 180,
  },
  docImage: {
    width: "100%",
    height: 200,
    backgroundColor: "#F8FAFC",
  },
  docFileWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
    gap: 8,
  },
  docFileIcon: {
    width: 48,
    height: 48,
  },
  docFileText: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 13,
    color: AppColors.black,
  },
  loaderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 18,
    color: AppColors.black,
    marginBottom: 12,
  },
  commentInput: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: "#E0E5EA",
    borderRadius: 10,
    padding: 12,
    textAlignVertical: "top",
    fontFamily: FONTS.LexendRegular,
    fontSize: 14,
    color: AppColors.black,
  },
  errorText: {
    marginTop: 6,
    fontFamily: FONTS.LexendRegular,
    fontSize: 12,
    color: "#D14343",
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E0E5EA",
    alignItems: "center",
  },
  cancelText: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 14,
    color: AppColors.black,
  },
  submitBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: AppColors.primary,
    alignItems: "center",
  },
  submitText: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 14,
    color: AppColors.white,
  },
});
