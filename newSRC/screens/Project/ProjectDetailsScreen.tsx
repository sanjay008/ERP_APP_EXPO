import React, { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import ScreenHeader from "../../Components/ScreenHeader";
import ApiFeedback from "../../Components/ApiFeedback";
import FallBackImage from "../../Components/FallBackImage";
import { useApiErrorState } from "../../hooks/useApiErrorState";
import {
  fetchProjectDetails,
  type ProjectActivity,
  type ProjectDetail,
  type ProjectPerson,
  type ProjectStatus,
  type ProjectTask,
  type ProjectTicket,
} from "../../services/projectService";
import { useScreenInsets } from "../../utils/screenInsets";
import { AppColors } from "../../utils/theme";
import { FONTS } from "../../utils/FONTS";
import { CONNECTION_UI } from "../../utils/connectionTheme";
import { LIST_CARD_SHADOW, listScreenStyles } from "../../utils/listScreenStyles";
import { isOpenableAddress, openMapsAddress } from "../../utils/openMaps";

function formatDisplayDate(dateString?: string) {
  if (!dateString) return "--";
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const [year, month, day] = dateString.split("-");
  if (!year || !month || !day) return dateString;
  return `${parseInt(day, 10)} ${months[parseInt(month, 10) - 1]} ${year}`;
}

function getScheduleStyle(schedule?: string) {
  if (!schedule) {
    return { backgroundColor: "#F3F4F6", color: AppColors.black };
  }
  if (["daily", "monthly", "half_year"].includes(schedule)) {
    return { backgroundColor: "#004700", color: AppColors.white };
  }
  if (schedule === "weekly") {
    return { backgroundColor: "#660066", color: AppColors.white };
  }
  if (["quarterly", "yearly"].includes(schedule)) {
    return { backgroundColor: "#003a66", color: AppColors.white };
  }
  return { backgroundColor: "#F3F4F6", color: AppColors.black };
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.sectionCard}>{children}</View>;
}

function PersonRow({ person }: { person: ProjectPerson }) {
  return (
    <View style={styles.personRow}>
      <View style={styles.personAvatarFrame}>
        <FallBackImage
          source={person.profile_img ? { uri: person.profile_img } : undefined}
          style={styles.personAvatar}
          resizeMode="cover"
        />
      </View>
      <View style={styles.personText}>
        <Text style={styles.personName}>{person.display_name || "-"}</Text>
        <Text style={styles.personPhone}>{person.telefoon || "-"}</Text>
      </View>
    </View>
  );
}

function StatusBadge({ status }: { status?: ProjectStatus }) {
  const { t } = useTranslation();
  if (!status?.status_name) return null;
  return (
    <View style={[styles.badge, { backgroundColor: status.color || AppColors.primary }]}>
      <Text style={styles.badgeText}>{t(status.status_name)}</Text>
    </View>
  );
}

function ActivityCard({ activity }: { activity: ProjectActivity }) {
  const category = activity.activity_data?.activity_category_data?.activities_category_name;
  const activityName = activity.activity_data?.activity_name;
  const scheduleStyle = getScheduleStyle(activity.working_schedule);
  const days = activity.working_schedule_days?.split(",").filter(Boolean) ?? [];

  return (
    <View style={styles.activityCard}>
      <View style={styles.tagRow}>
        {category ? (
          <View style={styles.grayTag}>
            <Text style={styles.grayTagText}>{category}</Text>
          </View>
        ) : null}
        {activityName ? (
          <View style={styles.grayTag}>
            <Text style={styles.grayTagText}>{activityName}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.tagRow}>
        {activity.working_schedule ? (
          <View style={[styles.scheduleTag, { backgroundColor: scheduleStyle.backgroundColor }]}>
            <Text style={[styles.scheduleTagText, { color: scheduleStyle.color }]}>
              {activity.working_schedule}
            </Text>
          </View>
        ) : null}
        {days.map((day) => (
          <View key={day} style={styles.dayTag}>
            <Text style={styles.dayTagText}>{day.trim() === "2" ? "2X" : day.trim()}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function TaskCard({ task }: { task: ProjectTask }) {
  return (
    <View style={styles.taskCard}>
      <View style={styles.taskRow}>
        <Text style={styles.taskLabel}>{task.title || "-"}</Text>
        <StatusBadge status={task.task_status_data} />
      </View>
      {task.relatie_data?.display_name ? (
        <Text style={styles.taskMeta}>{task.relatie_data.display_name}</Text>
      ) : null}
      {task.deadline ? (
        <Text style={styles.taskMeta}>{formatDisplayDate(task.deadline)}</Text>
      ) : null}
    </View>
  );
}

function TicketCard({ ticket }: { ticket: ProjectTicket }) {
  return (
    <View style={styles.ticketCard}>
      <View style={styles.ticketTopRow}>
        <View style={styles.ticketIdBox}>
          <Text style={styles.ticketId}>{ticket.id ?? "-"}</Text>
        </View>
        <Text style={styles.ticketTitle} numberOfLines={1}>
          {ticket.ticket_title || ticket.project_name || "-"}
        </Text>
        <StatusBadge status={ticket.ticketstatus} />
      </View>
      {ticket.action_relatie_data?.display_name ? (
        <Text style={styles.ticketMeta}>{ticket.action_relatie_data.display_name}</Text>
      ) : null}
      {ticket.gmaps_working_address ? (
        <Pressable onPress={() => openMapsAddress(ticket.gmaps_working_address)}>
          <Text style={styles.ticketAddressLink}>{ticket.gmaps_working_address}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default function ProjectDetailsScreen() {
  const { t } = useTranslation();
  const { top, scrollPadding } = useScreenInsets();
  const params = useLocalSearchParams<{ id: string; color?: string; title?: string }>();

  const [data, setData] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const { apiError, clearApiError, captureApiError } = useApiErrorState();

  const loadDetails = useCallback(async () => {
    if (!params.id) return;
    try {
      setLoading(true);
      clearApiError();
      const response = await fetchProjectDetails(params.id);
      if (response?.status && Array.isArray(response.data) && response.data[0]) {
        setData(response.data[0]);
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

  const headerTitle = data?.project_name || params.title || t("Projects");

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <ScreenHeader title={headerTitle} />

      {loading && !data ? (
        <ApiFeedback loading />
      ) : apiError && !data ? (
        <ApiFeedback error={apiError} onRetry={loadDetails} />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}
          showsVerticalScrollIndicator={false}
        >
          <SectionCard>
            <View style={styles.summaryRow}>
              <View style={styles.summaryAvatarFrame}>
                <FallBackImage
                  source={data?.project_image ? { uri: data.project_image } : undefined}
                  style={styles.summaryAvatar}
                  resizeMode="cover"
                />
              </View>
              <Pressable
                style={styles.summaryAddressPressable}
                disabled={!isOpenableAddress(data?.gmaps_working_address)}
                onPress={() => openMapsAddress(data?.gmaps_working_address)}
              >
                <Text
                  style={
                    isOpenableAddress(data?.gmaps_working_address)
                      ? styles.summaryAddressLink
                      : styles.summaryAddress
                  }
                >
                  {data?.gmaps_working_address || "--"}
                </Text>
              </Pressable>
            </View>

            <View style={styles.summaryFooter}>
              <View style={styles.labelWrap}>
                {data?.project_labels_data_api?.length ? (
                  data.project_labels_data_api.map((label, index) => (
                    <View
                      key={`${label.labels}-${index}`}
                      style={[
                        styles.labelChip,
                        { backgroundColor: label.color_code || "#E7F7E8" },
                      ]}
                    >
                      <Text style={styles.labelChipText}>{label.labels || "--"}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyMeta}>--</Text>
                )}
              </View>
              <Text style={styles.summaryDate}>{formatDisplayDate(data?.deadline)}</Text>
            </View>
          </SectionCard>

          {data?.relaties_owners?.length ? (
            <>
              <SectionTitle title={t("Customer")} />
              <SectionCard>
                {data.relaties_owners.map((person, index) => (
                  <PersonRow key={`owner-${index}`} person={person} />
                ))}
              </SectionCard>
            </>
          ) : null}

          {data?.connected_relaties?.length ? (
            <>
              <SectionTitle title={t("Contact")} />
              <SectionCard>
                {data.connected_relaties.map((person, index) => (
                  <PersonRow key={`contact-${index}`} person={person} />
                ))}
              </SectionCard>
            </>
          ) : null}

          {data?.relaties_members?.length ? (
            <>
              <SectionTitle title={t("Executor")} />
              <SectionCard>
                {data.relaties_members.map((person, index) => (
                  <PersonRow key={`member-${index}`} person={person} />
                ))}
              </SectionCard>
            </>
          ) : null}

          {data?.project_activity?.length ? (
            <>
              <SectionTitle title={t("Project Activity")} />
              <SectionCard>
                {data.project_activity.map((activity, index) => (
                  <ActivityCard key={`activity-${index}`} activity={activity} />
                ))}
              </SectionCard>
            </>
          ) : null}

          <SectionTitle title={t("Tasks")} />
          <SectionCard>
            {data?.task_data?.length ? (
              data.task_data.map((task, index) => (
                <TaskCard key={`task-${index}`} task={task} />
              ))
            ) : (
              <Text style={styles.emptyMeta}>--</Text>
            )}
          </SectionCard>

          <SectionTitle title={t("Ticket")} />
          <SectionCard>
            {data?.ticket_data?.length ? (
              data.ticket_data.map((ticket, index) => (
                <TicketCard key={`ticket-${index}`} ticket={ticket} />
              ))
            ) : (
              <Text style={styles.emptyMeta}>--</Text>
            )}
          </SectionCard>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CONNECTION_UI.pageBackground,
  },
  scroll: {
    flex: 1,
    backgroundColor: CONNECTION_UI.pageBackground,
  },
  content: {
    paddingHorizontal: CONNECTION_UI.screenPadding,
    paddingTop: CONNECTION_UI.listTop,
  },
  loaderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 16,
    color: AppColors.black,
    marginTop: 16,
    marginBottom: 10,
  },
  sectionCard: {
    backgroundColor: AppColors.white,
    borderRadius: CONNECTION_UI.cardRadius,
    borderWidth: 1,
    borderColor: CONNECTION_UI.cardBorder,
    padding: CONNECTION_UI.cardPadding,
    marginBottom: CONNECTION_UI.cardGap,
    ...LIST_CARD_SHADOW,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  summaryAvatarFrame: {
    width: 56,
    height: 56,
    borderRadius: CONNECTION_UI.radiusAvatar,
    overflow: "hidden",
    backgroundColor: CONNECTION_UI.surface,
  },
  summaryAvatar: {
    width: "100%",
    height: "100%",
  },
  summaryAddress: {
    flex: 1,
    fontFamily: FONTS.LexendRegular,
    fontSize: 14,
    lineHeight: 20,
    color: AppColors.black,
  },
  summaryAddressPressable: {
    flex: 1,
  },
  summaryAddressLink: {
    flex: 1,
    fontFamily: FONTS.LexendRegular,
    fontSize: 14,
    lineHeight: 20,
    color: AppColors.primary,
    textDecorationLine: "underline",
  },
  summaryFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    gap: 12,
  },
  labelWrap: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  labelChip: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  labelChipText: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 12,
    color: AppColors.black,
  },
  summaryDate: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 13,
    color: AppColors.subtitle,
  },
  emptyMeta: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 14,
    color: AppColors.subtitle,
  },
  personRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF1F5",
  },
  personAvatarFrame: {
    width: 48,
    height: 48,
    borderRadius: CONNECTION_UI.radiusAvatar,
    overflow: "hidden",
    backgroundColor: CONNECTION_UI.surface,
  },
  personAvatar: {
    width: "100%",
    height: "100%",
  },
  personText: {
    flex: 1,
    gap: 4,
  },
  personName: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 15,
    color: AppColors.black,
  },
  personPhone: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 13,
    color: AppColors.subtitle,
  },
  activityCard: {
    borderWidth: 1,
    borderColor: CONNECTION_UI.borderCard,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    gap: 10,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  grayTag: {
    backgroundColor: "#EEF1F5",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  grayTagText: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 12,
    color: AppColors.black,
  },
  scheduleTag: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  scheduleTagText: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 12,
  },
  dayTag: {
    backgroundColor: "#F3F4F6",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dayTagText: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 12,
    color: AppColors.black,
  },
  taskCard: {
    borderWidth: 1,
    borderColor: CONNECTION_UI.borderCard,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    gap: 6,
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  taskLabel: {
    flex: 1,
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 14,
    color: AppColors.black,
  },
  taskMeta: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 13,
    color: AppColors.subtitle,
  },
  ticketCard: {
    borderWidth: 1,
    borderColor: CONNECTION_UI.borderCard,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    gap: 6,
  },
  ticketTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  ticketIdBox: {
    minWidth: 42,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#EEF1F5",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  ticketId: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 14,
    color: AppColors.black,
  },
  ticketTitle: {
    flex: 1,
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 15,
    color: AppColors.black,
  },
  ticketMeta: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 13,
    color: AppColors.subtitle,
  },
  ticketAddress: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 13,
    lineHeight: 18,
    color: AppColors.subtitle,
  },
  ticketAddressLink: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 13,
    lineHeight: 18,
    color: AppColors.primary,
    textDecorationLine: "underline",
  },
  badge: listScreenStyles.statusBadge,
  badgeText: listScreenStyles.statusBadgeText,
});
