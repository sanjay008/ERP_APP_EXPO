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
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import ScreenHeader from "../../Components/ScreenHeader";
import ApiFeedback from "../../Components/ApiFeedback";
import NoteCard from "../../Components/NoteCard";
import FormModal from "../../Components/FormModal";
import WorkOrderSignatureModal from "../../Components/WorkOrderSignatureModal";
import { useApiErrorState } from "../../hooks/useApiErrorState";
import { useScreenInsets } from "../../utils/screenInsets";
import {
  addWorkOrderComment,
  fetchWorkOrderDetails,
  updateWorkOrderStatus,
  type WorkOrderDetail,
} from "../../services/workOrderService";
import { AppColors } from "../../utils/theme";
import { FONTS } from "../../utils/FONTS";
import { LIST_UI } from "../../utils/connectionTheme";
import { listScreenStyles } from "../../utils/listScreenStyles";
import { openMapsAddress } from "../../utils/openMaps";

function stripHtml(html?: string | null) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").trim();
}

const APPROVED_STATUS_ID = 64;

export default function WorkOrderDetailsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { top, scrollPadding } = useScreenInsets();
  const params = useLocalSearchParams<{ id: string; color?: string; title?: string }>();

  const [data, setData] = useState<WorkOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentVisible, setCommentVisible] = useState(false);
  const [signatureVisible, setSignatureVisible] = useState(false);
  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [submittingApproval, setSubmittingApproval] = useState(false);
  const { apiError, clearApiError, captureApiError } = useApiErrorState();

  const loadDetails = useCallback(async () => {
    if (!params.id) return;
    try {
      setLoading(true);
      clearApiError();
      const response = await fetchWorkOrderDetails(params.id);
      if (response?.data) setData(response.data);
    } catch (error) {
      captureApiError(error);
    } finally {
      setLoading(false);
    }
  }, [params.id, clearApiError, captureApiError]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const headerTitle = params.title
    ? `${params.title} ${t("Details")}`
    : t("Work Orders Details");

  const isApproved = Number(data?.workorder_status?.id) === APPROVED_STATUS_ID;

  const detailRows = useMemo(
    () => [
      {
        label: t("Klant"),
        value: data?.relaties_customer?.display_name || "-",
      },
      {
        label: t("Werk Adres"),
        value: data?.gmaps_working_address || "-",
        link: data?.gmaps_working_address,
      },
      { label: t("Uitvoerdatum"), value: data?.execution_date || "-" },
      {
        label: t("Uitvoerder"),
        value:
          data?.executor_relaties
            ?.map((e) => e.display_name)
            .filter(Boolean)
            .join(", ") || "-",
      },
      {
        label: t("Status"),
        value: data?.workorder_status?.status_name
          ? t(data.workorder_status.status_name)
          : t("-"),
      },
    ],
    [data, t]
  );

  const openMaps = async (address?: string) => {
    await openMapsAddress(address);
  };

  const submitComment = async () => {
    if (!comment.trim()) {
      setCommentError(t("Please enter comment"));
      return;
    }
    try {
      setSubmittingComment(true);
      await addWorkOrderComment({
        id: params.id,
        customer_relationship_id: data?.customer_relationship_id,
        comment: comment.trim(),
      });
      setComment("");
      setCommentError("");
      setCommentVisible(false);
      await loadDetails();
    } catch (error) {
      console.log("Error adding comment:", error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleSignatureApprove = async (payload: {
    signName: string;
    signature: string;
  }) => {
    try {
      setSubmittingApproval(true);
      await updateWorkOrderStatus({
        id: params.id,
        status_id: APPROVED_STATUS_ID,
        sign_name: payload.signName,
        signature: payload.signature,
      });
      setSignatureVisible(false);
      await loadDetails();
    } catch (error) {
      console.log("Error approving work order:", error);
    } finally {
      setSubmittingApproval(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <ScreenHeader title={headerTitle} />

      {loading && !data ? (
        <ApiFeedback loading />
      ) : apiError && !data ? (
        <ApiFeedback error={apiError} onRetry={loadDetails} />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.mainCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardHeaderTitle}>
                {data?.order_id || data?.id} {t("Work Order")}
              </Text>
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
                {row.link ? (
                  <Pressable onPress={() => openMaps(row.link)}>
                    <Text style={[styles.detailValue, styles.linkValue]}>
                      {row.value}
                    </Text>
                  </Pressable>
                ) : (
                  <Text style={styles.detailValue}>{row.value}</Text>
                )}
              </View>
            ))}
          </View>

          {data?.tasks?.length ? (
            <View style={styles.mainCard}>
              <Text style={styles.sectionTitle}>{t("To - Do")}</Text>
              {data.tasks.map((task, index) => (
                <Pressable
                  key={task.id}
                  style={[
                    styles.todoRow,
                    index === (data.tasks?.length || 0) - 1 && styles.detailRowLast,
                  ]}
                  onPress={() =>
                    router.push({
                      pathname: "/(app)/tasks/[id]",
                      params: { id: String(task.id), color: params.color || "" },
                    })
                  }
                >
                  <View style={styles.todoTop}>
                    <Text style={styles.todoTitle}>
                      {task.id} - {task.title}
                    </Text>
                    {task.priority ? (
                      <View
                        style={[
                          styles.priorityBadge,
                          {
                            backgroundColor:
                              task.priority_background_color || "#E8F0FD",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.priorityText,
                            { color: task.priority_color || AppColors.primary },
                          ]}
                        >
                          {task.priority}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  {task.short_description ? (
                    <Text style={styles.todoDesc} numberOfLines={2}>
                      {stripHtml(task.short_description)}
                    </Text>
                  ) : null}
                  <Text style={styles.todoMeta}>
                    {task.quantity} {task.quantity_type} · {task.deadline || "-"}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          {!isApproved ? (
            <View style={styles.actionRow}>
              <Pressable
                style={[styles.actionBtn, styles.commentBtn]}
                onPress={() => setCommentVisible(true)}
              >
                <Text style={styles.commentBtnText}>{t("Opmerking")}</Text>
              </Pressable>
              <Pressable
                style={[styles.actionBtn, styles.approveBtn]}
                onPress={() => setSignatureVisible(true)}
              >
                <Text style={styles.approveBtnText}>{t("Goedkeuren")}</Text>
              </Pressable>
            </View>
          ) : null}

          {data?.signature_image ? (
            <View style={styles.signatureSection}>
              <Text style={styles.signatureTitle}>
                {t("Handtekening klant voor akkoord")}
              </Text>
              <Image
                source={{ uri: data.signature_image }}
                style={styles.signatureImage}
                resizeMode="contain"
              />
              {data.sign_name ? (
                <Text style={styles.signatureName}>{data.sign_name}</Text>
              ) : null}
            </View>
          ) : null}

          {data?.comments?.length ? (
            <View style={styles.notesSection}>
              <Text style={styles.commentsHeading}>{t("Opmerkingen")}</Text>
              {data.comments.map((note, index) => (
                <NoteCard
                  key={note.id || index}
                  author={note.username || note.user?.username}
                  time={note.created_at}
                  text={note.comment}
                />
              ))}
            </View>
          ) : null}
        </ScrollView>
      )}

      <WorkOrderSignatureModal
        visible={signatureVisible}
        existingSignature={data?.signature_image}
        initialName={data?.sign_name || ""}
        submitting={submittingApproval}
        onClose={() => setSignatureVisible(false)}
        onApprove={handleSignatureApprove}
      />

      <FormModal visible={commentVisible} onClose={() => setCommentVisible(false)} scrollable>
        <Text style={styles.modalTitle}>{t("Voeg een notitie toe")}</Text>
        <TextInput
          style={styles.commentInput}
          value={comment}
          onChangeText={(text) => {
            setComment(text);
            if (commentError) setCommentError("");
          }}
          placeholder={t("Notitie...")}
          placeholderTextColor={AppColors.subtitle}
          multiline
        />
        {commentError ? <Text style={styles.errorText}>{commentError}</Text> : null}
        <View style={styles.modalActions}>
          <Pressable style={styles.cancelBtn} onPress={() => setCommentVisible(false)}>
            <Text style={styles.cancelText}>{t("Sluiten")}</Text>
          </Pressable>
          <Pressable
            style={styles.submitBtn}
            onPress={submitComment}
            disabled={submittingComment}
          >
            <Text style={styles.submitText}>
              {submittingComment ? t("Loading...") : t("Notitie")}
            </Text>
          </Pressable>
        </View>
      </FormModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: listScreenStyles.container,
  content: listScreenStyles.detailContent,
  mainCard: {
    ...listScreenStyles.detailCard,
    paddingHorizontal: LIST_UI.cardPadding,
    paddingBottom: 4,
  },
  cardHeader: {
    paddingVertical: LIST_UI.cardPadding,
    borderBottomWidth: 1,
    borderBottomColor: LIST_UI.cardBorder,
    borderStyle: "dashed",
  },
  cardHeaderTitle: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 16,
    color: AppColors.black,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: LIST_UI.cardBorder,
    borderStyle: "dotted",
    gap: 12,
  },
  detailRowLast: { borderBottomWidth: 0 },
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
  linkValue: { color: AppColors.primary },
  sectionTitle: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 15,
    color: AppColors.black,
    paddingTop: 14,
    paddingBottom: 8,
  },
  todoRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: LIST_UI.cardBorder,
    borderStyle: "dotted",
  },
  todoTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  todoTitle: {
    flex: 1,
    fontFamily: FONTS.LexendMedium,
    fontSize: 14,
    color: AppColors.black,
  },
  priorityBadge: listScreenStyles.statusBadge,
  priorityText: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 11,
  },
  todoDesc: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 12,
    color: AppColors.subtitle,
    marginTop: 6,
  },
  todoMeta: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 12,
    color: AppColors.subtitle,
    marginTop: 6,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  commentBtn: {
    backgroundColor: "#E8F0FD",
    borderWidth: 1,
    borderColor: "#DCE6FA",
  },
  commentBtnText: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 14,
    color: AppColors.primary,
  },
  approveBtn: { backgroundColor: AppColors.primary },
  approveBtnText: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 14,
    color: AppColors.white,
  },
  signatureSection: listScreenStyles.detailCard,
  signatureTitle: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 15,
    color: AppColors.black,
    marginBottom: 10,
  },
  signatureImage: {
    width: "100%",
    height: 160,
    borderRadius: 10,
    backgroundColor: "#F7F9FB",
  },
  signatureName: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 14,
    color: AppColors.black,
    marginTop: 10,
  },
  notesSection: { marginBottom: 8 },
  commentsHeading: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 15,
    color: AppColors.black,
    marginBottom: 10,
  },
  loaderWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
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
  modalActions: { flexDirection: "row", gap: 10, marginTop: 16 },
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
