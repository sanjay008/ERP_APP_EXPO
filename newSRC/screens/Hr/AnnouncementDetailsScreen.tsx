import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import ScreenHeader from "../../Components/ScreenHeader";
import ApiFeedback from "../../Components/ApiFeedback";
import HtmlContent from "../../Components/HtmlContent";
import {
  fetchAnnouncementDetails,
  formatHrDate,
  type AnnouncementItem,
} from "../../services/hrPortalService";
import { useApiErrorState } from "../../hooks/useApiErrorState";
import { useScreenInsets } from "../../utils/screenInsets";
import { AppColors } from "../../utils/theme";
import { FONTS } from "../../utils/FONTS";
import { LIST_UI } from "../../utils/connectionTheme";
import { listScreenStyles } from "../../utils/listScreenStyles";

export default function AnnouncementDetailsScreen() {
  const { t } = useTranslation();
  const { top, scrollPadding } = useScreenInsets();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ id: string; title?: string }>();
  const htmlWidth = width - LIST_UI.screenPadding * 2 - LIST_UI.cardPadding * 2;

  const [data, setData] = useState<AnnouncementItem | null>(null);
  const [loading, setLoading] = useState(true);
  const { apiError, clearApiError, captureApiError } = useApiErrorState();

  const loadDetails = useCallback(async () => {
    if (!params.id) return;
    try {
      setLoading(true);
      clearApiError();
      setData(await fetchAnnouncementDetails(params.id));
    } catch (error) {
      captureApiError(error);
    } finally {
      setLoading(false);
    }
  }, [params.id, clearApiError, captureApiError]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <ScreenHeader title={data?.title || params.title || t("Announcements")} />
      {loading || apiError || !data ? (
        <ApiFeedback
          loading={loading}
          error={apiError}
          isEmpty={!data}
          emptyMessage={t("Announcement not found.")}
          onRetry={loadDetails}
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}
        >
          <View style={styles.card}>
            <Text style={styles.title}>{data.title || t("Announcements")}</Text>
            <Text style={styles.meta}>{formatHrDate(data.created_at)}</Text>
            <HtmlContent
              html={data.description}
              variant="description"
              contentWidth={htmlWidth}
            />
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: listScreenStyles.container,
  content: listScreenStyles.detailContent,
  card: {
    ...listScreenStyles.detailCard,
    overflow: "visible",
    elevation: 0,
    shadowOpacity: 0,
  },
  title: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 18,
    color: AppColors.black,
    marginBottom: 6,
  },
  meta: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 12,
    color: AppColors.subtitle,
    marginBottom: 12,
  },
});
