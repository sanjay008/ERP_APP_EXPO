import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Redirect, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import ScreenHeader from "../../Components/ScreenHeader";
import ApiFeedback from "../../Components/ApiFeedback";
import FallBackImage from "../../Components/FallBackImage";
import SelectionBottomSheet, { type SheetOption } from "../../Components/SelectionBottomSheet";
import { RegisterBackContext } from "../../constants/GoBackContext";
import { useAppData } from "../../context/AppDataContext";
import { useApiErrorState } from "../../hooks/useApiErrorState";
import { hasPermission } from "../../utils/permissionFlags";
import {
  addProjectRelation,
  fetchProjectDetails,
  fetchProjectRelationOptions,
  formatProjectBudget,
  type ProjectActivity,
  type ProjectDetail,
  type ProjectPerson,
  type ProjectRelationRecord,
  type ProjectRelationType,
  type ProjectStatus,
  type ProjectTask,
  type ProjectTicket,
} from "../../services/projectService";
import { parseApiError } from "../../utils/apiError";
import {
  ANDROID_MIN_BOTTOM_INSET,
  useKeyboardHeight,
  useScreenInsets,
} from "../../utils/screenInsets";
import { AppColors } from "../../utils/theme";
import { FONTS } from "../../utils/FONTS";
import { CONNECTION_UI } from "../../utils/connectionTheme";
import { LIST_CARD_SHADOW, listScreenStyles } from "../../utils/listScreenStyles";
import { isOpenableAddress, openMapsAddress } from "../../utils/openMaps";
import { Images } from "../../utils/Images";
import ProjectFilesSections from "./ProjectFilesSections";

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

function SectionTitle({ title, onAdd }: { title: string; onAdd?: () => void }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onAdd ? (
        <Pressable onPress={onAdd} hitSlop={8} style={styles.sectionAddBtn}>
          <FallBackImage source={Images.plusIcon} style={styles.sectionAddIcon} resizeMode="contain" />
        </Pressable>
      ) : null}
    </View>
  );
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

function TicketCard({
  ticket,
  onPress,
}: {
  ticket: ProjectTicket;
  onPress?: () => void;
}) {
  return (
    <Pressable
      style={styles.ticketCard}
      onPress={onPress}
      disabled={!onPress}
    >
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
        <Pressable
          onPress={(event) => {
            event.stopPropagation?.();
            openMapsAddress(ticket.gmaps_working_address);
          }}
        >
          <Text style={styles.ticketAddressLink}>{ticket.gmaps_working_address}</Text>
        </Pressable>
      ) : null}
    </Pressable>
  );
}

export default function ProjectDetailsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { permissions } = useAppData();
  const { top, bottom } = useScreenInsets();
  const keyboardHeight = useKeyboardHeight();
  // KASV often ignores content paddingBottom on Android — pad the screen shell instead.
  const safeBottom =
    Platform.OS === "android"
      ? Math.max(bottom, ANDROID_MIN_BOTTOM_INSET)
      : Math.max(bottom, 16);
  const { setToast } = useContext(RegisterBackContext);
  const params = useLocalSearchParams<{ id: string; color?: string; title?: string }>();
  const skipNextFocusLoad = React.useRef(true);

  const canReadProjects = hasPermission(permissions, "project_mobile", "read");
  const canUpdateProject = hasPermission(permissions, "project_mobile", "update");
  const canReadTasks = hasPermission(permissions, "tasks_mobile", "read");
  const canReadTickets = hasPermission(permissions, "project_ticket_mobile", "read");

  const [data, setData] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [optionType, setOptionType] = useState<ProjectRelationType | null>(null);
  const [optionRecords, setOptionRecords] = useState<ProjectRelationRecord[]>([]);
  const [optionsBusy, setOptionsBusy] = useState(false);
  const { apiError, clearApiError, captureApiError } = useApiErrorState();

  const loadDetails = useCallback(async (silent = false) => {
    if (!params.id) return;
    try {
      if (!silent) setLoading(true);
      clearApiError();
      const response = await fetchProjectDetails(params.id);
      if (response?.status && Array.isArray(response.data) && response.data[0]) {
        setData(response.data[0]);
      }
    } catch (error) {
      captureApiError(error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [params.id, clearApiError, captureApiError]);

  useEffect(() => {
    void loadDetails();
  }, [loadDetails]);

  useFocusEffect(
    useCallback(() => {
      if (skipNextFocusLoad.current) {
        skipNextFocusLoad.current = false;
        return;
      }
      void loadDetails(true);
    }, [loadDetails])
  );

  const openRelationOptions = async (type: ProjectRelationType) => {
    if (!params.id || optionsBusy) return;
    try {
      setOptionsBusy(true);
      const records = await fetchProjectRelationOptions(params.id, type);
      setOptionRecords(records);
      setOptionType(type);
    } catch (error) {
      setToast({
        top: 45,
        text: parseApiError(error, t("Something went wrong")).message,
        type: "error",
        visible: true,
      });
    } finally {
      setOptionsBusy(false);
    }
  };

  const addRelation = async (record: ProjectRelationRecord) => {
    if (!params.id || !optionType) return;
    const type = optionType;
    setOptionType(null);
    try {
      await addProjectRelation(params.id, type, record.id);
      await loadDetails(true);
    } catch (error) {
      setToast({
        top: 45,
        text: parseApiError(error, t("Something went wrong")).message,
        type: "error",
        visible: true,
      });
    }
  };

  const optionSheetOptions: SheetOption[] = optionRecords.map((item) => ({
    id: item.id,
    label: item.name,
    raw: item,
  }));

  const headerTitle = data?.project_name || params.title || t("Projects");

  if (!canReadProjects) {
    return <Redirect href="/(app)/(tabs)/menu" />;
  }

  return (
    <View style={[styles.container, { paddingTop: top, paddingBottom: safeBottom }]}>
      <ScreenHeader
        title={headerTitle}
        editOnPress={
          canUpdateProject
            ? () =>
                router.push({
                  pathname: "/(app)/projects/edit",
                  params: { id: String(params.id || data?.id || "") },
                })
            : undefined
        }
      />

      {loading && !data ? (
        <ApiFeedback loading />
      ) : apiError && !data ? (
        <ApiFeedback error={apiError} onRetry={loadDetails} />
      ) : (
        <KeyboardAwareScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: 24 + keyboardHeight },
          ]}
          enableOnAndroid
          enableAutomaticScroll
          extraHeight={Platform.OS === "ios" ? 60 : 140}
          extraScrollHeight={Platform.OS === "ios" ? 120 : 200}
          keyboardShouldPersistTaps="handled"
          keyboardOpeningTime={180}
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
              <View style={styles.summaryMain}>
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
                <Text style={styles.summaryBudget}>
                  {formatProjectBudget(data?.budject, data?.budject_currency_data) || "--"}
                </Text>
              </View>
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

          <SectionTitle title={t("Customer")} onAdd={canUpdateProject ? () => void openRelationOptions("owner") : undefined} />
          <SectionCard>
            {data?.relaties_owners?.length ? (
              data.relaties_owners.map((person, index) => (
                <PersonRow key={`owner-${index}`} person={person} />
              ))
            ) : (
              <Text style={styles.emptyMeta}>--</Text>
            )}
          </SectionCard>

          <SectionTitle title={t("Contact")} onAdd={canUpdateProject ? () => void openRelationOptions("contact") : undefined} />
          <SectionCard>
            {data?.connected_relaties?.length ? (
              data.connected_relaties.map((person, index) => (
                <PersonRow key={`contact-${index}`} person={person} />
              ))
            ) : (
              <Text style={styles.emptyMeta}>--</Text>
            )}
          </SectionCard>

          <SectionTitle title={t("Executor")} onAdd={canUpdateProject ? () => void openRelationOptions("member") : undefined} />
          <SectionCard>
            {data?.relaties_members?.length ? (
              data.relaties_members.map((person, index) => (
                <PersonRow key={`member-${index}`} person={person} />
              ))
            ) : (
              <Text style={styles.emptyMeta}>--</Text>
            )}
          </SectionCard>

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

          {canReadTasks ? (
            <>
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
            </>
          ) : null}

          {canReadTickets ? (
            <>
              <SectionTitle title={t("Ticket")} />
              <SectionCard>
                {data?.ticket_data?.length ? (
                  data.ticket_data.map((ticket, index) => (
                    <TicketCard
                      key={`ticket-${ticket.id ?? index}`}
                      ticket={ticket}
                      onPress={
                        ticket.id != null
                          ? () =>
                              router.push({
                                pathname: "/(app)/tickets/[id]",
                                params: {
                                  id: String(ticket.id),
                                  item: JSON.stringify(ticket),
                                },
                              })
                          : undefined
                      }
                    />
                  ))
                ) : (
                  <Text style={styles.emptyMeta}>--</Text>
                )}
              </SectionCard>
            </>
          ) : null}

          <ProjectFilesSections projectId={params.id || data?.id} />
          <View style={styles.bottomSpacer} />
        </KeyboardAwareScrollView>
      )}

      <SelectionBottomSheet
        visible={Boolean(optionType)}
        title={
          optionType === "contact"
            ? t("Select contact")
            : optionType === "member"
              ? t("Select executor")
              : t("Select customer")
        }
        searchPlaceholder={t("Search")}
        confirmText={t("Done")}
        options={optionSheetOptions}
        selectedIds={[]}
        onClose={() => setOptionType(null)}
        onConfirm={(selected) => {
          const record = selected[0]?.raw as ProjectRelationRecord | undefined;
          if (record) void addRelation(record);
          else setOptionType(null);
        }}
      />
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
  bottomSpacer: {
    height: 24,
  },
  loaderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    marginBottom: 10,
    gap: 10,
  },
  sectionTitle: {
    flex: 1,
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 16,
    color: AppColors.black,
  },
  sectionAddBtn: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: AppColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionAddIcon: {
    width: 14,
    height: 14,
    tintColor: AppColors.white,
  },
  sectionCard: {
    backgroundColor: AppColors.white,
    borderRadius: 7,
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
  summaryMain: {
    flex: 1,
    gap: 8,
  },
  summaryBudget: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 15,
    color: AppColors.black,
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
    borderRadius: 4,
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
    borderRadius: 7,
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
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  grayTagText: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 12,
    color: AppColors.black,
  },
  scheduleTag: {
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  scheduleTagText: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 12,
  },
  dayTag: {
    backgroundColor: "#F3F4F6",
    borderRadius: 4,
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
    borderRadius: 7,
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
    borderRadius: 7,
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
    borderRadius: 4,
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
