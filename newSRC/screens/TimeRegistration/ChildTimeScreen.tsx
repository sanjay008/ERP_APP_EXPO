import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import TimeRegistrationTableScreen from "../../Components/TimeRegistrationTableScreen";
import { fetchChildTimeRegistration } from "../../services/timeRegistrationService";

export default function ChildTimeScreen() {
  const { t } = useTranslation();

  const loadRows = useCallback(
    (year: number, month: string) => fetchChildTimeRegistration(year, month),
    []
  );

  return (
    <TimeRegistrationTableScreen
      title={t("Child Time")}
      loadRows={loadRows}
      scheduleMode="employee"
      overtimeMode="employee"
    />
  );
}
