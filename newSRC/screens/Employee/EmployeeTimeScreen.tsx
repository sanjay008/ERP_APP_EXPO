import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import TimeRegistrationTableScreen from "../../Components/TimeRegistrationTableScreen";
import { fetchEmployeeTimeRegistration } from "../../services/timeRegistrationService";

export default function EmployeeTimeScreen() {
  const { t } = useTranslation();

  const loadRows = useCallback(
    (year: number, month: string) => fetchEmployeeTimeRegistration(year, month),
    []
  );

  return (
    <TimeRegistrationTableScreen
      title={t("Timesheet")}
      loadRows={loadRows}
      scheduleMode="employee"
      overtimeMode="employee"
    />
  );
}
