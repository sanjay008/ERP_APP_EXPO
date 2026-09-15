import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import ScreenHeader from "../../Components/ScreenHeader";
import ApiFeedback from "../../Components/ApiFeedback";
import NoteCard from "../../Components/NoteCard";
import { useApiErrorState } from "../../hooks/useApiErrorState";
import { useScreenInsets } from "../../utils/screenInsets";
import {
  fetchTenantContractDetails,
  formatContractDate,
  getContractStreet,
  type TenantContractDetail,
} from "../../services/tenantContractService";
import { AppColors } from "../../utils/theme";
import { FONTS } from "../../utils/FONTS";
import { LIST_UI } from "../../utils/connectionTheme";
import { listScreenStyles } from "../../utils/listScreenStyles";

function DetailCard({
  title,
  rows,
}: {
  title?: string;
  rows: { label: string; value: string }[];
}) {
  return (
    <View style={styles.card}>
      {title ? <Text style={styles.cardTitle}>{title}</Text> : null}
      {rows.map((row, index) => (
        <View
          key={row.label}
          style={[styles.row, index === rows.length - 1 && styles.rowLast]}
        >
          <Text style={styles.label}>{row.label}</Text>
          <Text style={styles.value}>{row.value}</Text>
        </View>
      ))}
    </View>
  );
}

export default function TenantContractDetailsScreen() {
  const { t } = useTranslation();
  const { top, scrollPadding } = useScreenInsets();
  const params = useLocalSearchParams<{ id: string; color?: string; title?: string }>();

  const [data, setData] = useState<TenantContractDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const { apiError, clearApiError, captureApiError } = useApiErrorState();

  const loadDetails = useCallback(async () => {
    if (!params.id) return;
    try {
      setLoading(true);
      clearApiError();
      const response = await fetchTenantContractDetails(params.id);
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
  }, [loadDetails]);

  const mainRows = useMemo(
    () => [
      { label: t("Debiteurennummer"), value: data?.debtor_number || "-" },
      {
        label: t("Rent Pr."),
        value: `${data?.currency_data?.symbol || ""} ${data?.rent_price ?? "-"}`,
      },
      {
        label: t("Brog"),
        value: `${data?.deposit_currencys?.symbol || ""} ${data?.deposit ?? "-"}`,
      },
      { label: t("Van"), value: formatContractDate(data?.from) },
      { label: t("Einde"), value: formatContractDate(data?.end) },
      { label: t("Straat"), value: data ? getContractStreet(data) : "-" },
      {
        label: t("Postcode"),
        value:
          data?.postcode ??
          data?.object_data?.postcode ??
          "-",
      },
      { label: t("Stad"), value: data?.city || "-" },
      { label: t("Land"), value: data?.object_data?.country || "-" },
    ],
    [data, t]
  );

  const tenantRows = useMemo(
    () => [
      {
        label: t("Verhuurder"),
        value: data?.landlord_data?.display_name || "-",
      },
      { label: t("IBAN"), value: data?.landlord_data?.iban || "-" },
      { label: t("Banknaam"), value: data?.bank_data?.bank_name || "-" },
    ],
    [data, t]
  );

  const peopleRows = useMemo(
    () =>
      [
        { key: "relatie", name: data?.relatie_data?.display_name },
        { key: "tenant_two", name: data?.tenant_two?.display_name },
        { key: "guarantor", name: data?.guarantor?.display_name },
      ].filter((row): row is { key: string; name: string } => Boolean(row.name)),
    [data]
  );

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <ScreenHeader title={t("Tenant Contracts Details")} />

      {loading && !data ? (
        <ApiFeedback loading />
      ) : apiError && !data ? (
        <ApiFeedback error={apiError} onRetry={loadDetails} />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerCard}>
            <Text style={styles.headerTitle}>
              {data?.object_data?.display_name || params.title || "-"}
            </Text>
            {data?.status ? (
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: data.status.color || AppColors.primary },
                ]}
              >
                <Text style={styles.statusText}>{t(data.status.status_name)}</Text>
              </View>
            ) : null}
          </View>

          <DetailCard rows={mainRows} />

          <DetailCard title={t("Huurder")} rows={tenantRows} />

          {peopleRows.length ? (
            <View style={styles.peopleCard}>
              {peopleRows.map((person) => (
                <View key={person.key} style={styles.peopleRow}>
                  <Text style={styles.peopleName}>{person.name}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {data?.notes?.length ? (
            <View style={styles.notesSection}>
              {data.notes.map((note, index) => (
                <NoteCard
                  key={note.id}
                  heading={index === 0 ? t("Notes") : undefined}
                  author={note.user?.username}
                  time={note.created_at}
                  text={note.comment}
                />
              ))}
            </View>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: listScreenStyles.container,
  content: listScreenStyles.detailContent,
  headerCard: {
    ...listScreenStyles.detailCard,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: LIST_UI.iconTextGap,
  },
  headerTitle: {
    flex: 1,
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 16,
    color: AppColors.black,
  },
  statusBadge: listScreenStyles.statusBadge,
  statusText: listScreenStyles.statusBadgeText,
  card: {
    ...listScreenStyles.detailCard,
    paddingHorizontal: LIST_UI.cardPadding,
  },
  cardTitle: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 15,
    color: AppColors.black,
    paddingTop: 14,
    paddingBottom: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: LIST_UI.cardBorder,
    borderStyle: "dotted",
    gap: 12,
  },
  rowLast: { borderBottomWidth: 0 },
  label: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 13,
    color: AppColors.subtitle,
    flex: 1,
  },
  value: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 13,
    color: AppColors.black,
    flex: 1,
    textAlign: "right",
  },
  peopleCard: {
    ...listScreenStyles.detailCard,
    overflow: "hidden",
    padding: 0,
  },
  peopleRow: {
    paddingVertical: LIST_UI.cardPadding,
    paddingHorizontal: LIST_UI.cardPadding,
    borderBottomWidth: 1,
    borderBottomColor: LIST_UI.cardBorder,
  },
  peopleName: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 14,
    color: AppColors.black,
  },
  notesSection: { marginBottom: 8 },
  loaderWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
});
