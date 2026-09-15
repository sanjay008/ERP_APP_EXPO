import React, { useCallback } from "react";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import TimeRegistrationTableScreen from "../../Components/TimeRegistrationTableScreen";
import { fetchProjectTimeRegistration } from "../../services/timeRegistrationService";

export default function ProjectTimeDetailsScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ id?: string; projectName?: string }>();
  const projectId = params.id ?? "";

  const loadRows = useCallback(
    (year: number, month: string) => fetchProjectTimeRegistration(projectId, year, month),
    [projectId]
  );

  return (
    <TimeRegistrationTableScreen
      title={params.projectName || t("Project Time Registration")}
      loadRows={loadRows}
      scheduleMode="project"
      overtimeMode="project"
    />
  );
}
