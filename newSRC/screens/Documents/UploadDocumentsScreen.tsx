import React, { useCallback, useContext, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import ScreenHeader from "../../Components/ScreenHeader";
import { RegisterBackContext } from "../../constants/GoBackContext";
import { getApiErrorMessage } from "../../utils/validation";
import { useScreenInsets } from "../../utils/screenInsets";
import { Images } from "../../utils/Images";
import DocumentPreviewModal from "./DocumentPreviewModal";
import { styles } from "./styles";
import {
  buildTypeSubtitle,
  resolveDocumentFileType,
  type QuickUploadType,
  type RelatieDocument,
} from "./types";
import {
  extractDocumentApiError,
  fetchDocumentDetails,
  fetchQuickUploadTypes,
  fetchRelatieDocuments,
  isApiSuccess,
  loadDocumentAuthUser,
  parseDocumentDetails,
  parseQuickUploadTypes,
  parseRelatieDocuments,
} from "./uploadDocumentsApi";

export default function UploadDocumentsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { top, scrollPadding } = useScreenInsets();
  const { setToast } = useContext(RegisterBackContext);

  const [types, setTypes] = useState<QuickUploadType[]>([]);
  const [documents, setDocuments] = useState<RelatieDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [openingDoc, setOpeningDoc] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<RelatieDocument | null>(null);

  const setToastRef = useRef(setToast);
  const tRef = useRef(t);
  const inFlightRef = useRef(false);
  const openingRef = useRef(false);

  setToastRef.current = setToast;
  tRef.current = t;

  const load = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setLoading(true);
    setErrorText("");
    try {
      const userData = await loadDocumentAuthUser();
      const [typesRes, docsRes] = await Promise.all([
        fetchQuickUploadTypes(userData, true),
        fetchRelatieDocuments(userData),
      ]);

      if (isApiSuccess(typesRes)) {
        setTypes(parseQuickUploadTypes(typesRes));
      } else {
        const msg =
          extractDocumentApiError(typesRes) ||
          typesRes?.message ||
          tRef.current("Something went wrong. Please try again.");
        setErrorText(msg);
        setToastRef.current({
          visible: true,
          text: msg,
          type: "error",
          top: 45,
        });
      }

      if (isApiSuccess(docsRes)) {
        setDocuments(parseRelatieDocuments(docsRes));
      }
    } catch (error: any) {
      const apiMsg =
        extractDocumentApiError(error?.response?.data) ||
        getApiErrorMessage(error, tRef.current("Something went wrong. Please try again."));
      setErrorText(apiMsg);
      setToastRef.current({
        visible: true,
        text: apiMsg,
        type: "error",
        top: 45,
      });
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const openDocument = useCallback(async (doc: RelatieDocument) => {
    if (openingRef.current || doc?.id == null) return;
    openingRef.current = true;
    setOpeningDoc(true);
    try {
      const userData = await loadDocumentAuthUser();
      const res = await fetchDocumentDetails(userData, doc.id);
      if (!isApiSuccess(res)) {
        const msg =
          extractDocumentApiError(res) ||
          res?.message ||
          tRef.current("Something went wrong. Please try again.");
        setToastRef.current({
          visible: true,
          text: msg,
          type: "error",
          top: 45,
        });
        return;
      }

      const details = parseDocumentDetails(res) || doc;
      const viewUrl = details.view_url || details.shared_link || "";
      if (!viewUrl) {
        setToastRef.current({
          visible: true,
          text: tRef.current("Document not found."),
          type: "error",
          top: 45,
        });
        return;
      }

      setPreviewDoc({ ...details, view_url: viewUrl });
      setPreviewVisible(true);
    } catch (error: any) {
      const apiMsg =
        extractDocumentApiError(error?.response?.data) ||
        getApiErrorMessage(error, tRef.current("Something went wrong. Please try again."));
      setToastRef.current({
        visible: true,
        text: apiMsg,
        type: "error",
        top: 45,
      });
    } finally {
      openingRef.current = false;
      setOpeningDoc(false);
    }
  }, []);

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <ScreenHeader title={t("Upload Documents")} onBack={() => router.back()} />
      <View style={styles.background}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.introCard}>
            <Text style={styles.introTitle}>{t("Upload your documents")}</Text>
            <Text style={styles.introText}>
              {t(
                "Select a document type and upload clear photos. Driving licence requires front, back and expiry date.",
              )}
            </Text>
          </View>

          {errorText && !types.length ? (
            <View style={styles.sectionCard}>
              <Text style={styles.emptyText}>{errorText}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={load}>
                <Text style={styles.retryBtnText}>{t("Retry")}</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {types.map((item) => (
            <TouchableOpacity
              key={item.slug || item.type}
              style={styles.typeCard}
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: "/(app)/documents/upload",
                  params: { documentType: JSON.stringify(item) },
                })
              }
            >
              <View style={styles.typeCardLeft}>
                <View style={styles.typeIconBox}>
                  <Image source={Images.documentlogo} style={styles.typeIcon} />
                </View>
                <View style={styles.typeTexts}>
                  <Text style={styles.typeTitle}>{t(item.type)}</Text>
                  <Text style={styles.typeSubtitle}>{t(buildTypeSubtitle(item))}</Text>
                </View>
              </View>
              <Image source={Images.RightIcon} style={styles.rightIcon} />
            </TouchableOpacity>
          ))}

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{t("Uploaded Documents")}</Text>
            {documents.length === 0 ? (
              <Text style={styles.emptyText}>{t("No documents uploaded yet.")}</Text>
            ) : (
              documents.map((doc) => (
                <TouchableOpacity
                  key={String(doc.id)}
                  style={styles.docCard}
                  activeOpacity={0.85}
                  onPress={() => openDocument(doc)}
                >
                  <View style={styles.docCardRow}>
                    <View style={styles.docCardTexts}>
                      <Text style={styles.docTitle}>
                        {doc.filename || doc.type || t("Document")}
                      </Text>
                      {doc.type ? <Text style={styles.docMeta}>{t(doc.type)}</Text> : null}
                      {doc.expire_date ? (
                        <Text style={styles.docMeta}>
                          {`${t("Expiry Date")}: ${doc.expire_date}`}
                        </Text>
                      ) : null}
                      {doc.status_name ? (
                        <Text style={styles.docMeta}>{doc.status_name}</Text>
                      ) : null}
                    </View>
                    <Image source={Images.RightIcon} style={styles.rightIcon} />
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      </View>

      {loading || openingDoc ? (
        <View style={styles.loadingOverlay} pointerEvents="auto">
          <ActivityIndicator size="large" color="#4E83E7" />
        </View>
      ) : null}

      <DocumentPreviewModal
        visible={previewVisible}
        title={previewDoc?.filename || previewDoc?.type || t("Document")}
        imageUri={previewDoc?.view_url || previewDoc?.shared_link}
        downloadUrl={previewDoc?.download_url}
        fileType={resolveDocumentFileType(previewDoc)}
        onClose={() => {
          setPreviewVisible(false);
          setPreviewDoc(null);
        }}
      />
    </View>
  );
}
