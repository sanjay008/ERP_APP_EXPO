import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useTranslation } from "react-i18next";
import { useAppData } from "../context/AppDataContext";
import AppDatePickerSheet from "./AppDatePickerSheet";
import {
  adjustTravelCost,
  calculateDistanceKm,
  fetchCicoSession,
  formatCicoDate,
  formatCicoTime,
  getDeviceCoordinates,
  getTypeOptions,
  performCicoCheckIn,
  performCicoCheckOut,
  resolveDefaultAddress,
  type CicoAddressItem,
  type CicoCoords,
  type CicoSession,
} from "../services/timelineCicoService";
import { getApiErrorMessage } from "../utils/apiError";
import { getKeyboardAvoidBehavior, useScreenInsets } from "../utils/screenInsets";
import { AppColors } from "../utils/theme";
import { FONTS } from "../utils/FONTS";
import { Images } from "../utils/Images";

type Props = {
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
};

type Step =
  | "loading"
  | "summary"
  | "startType"
  | "startAddress"
  | "endType"
  | "endAddress"
  | "travel"
  | "checkoutExtra";

const BREAK_OPTIONS = ["00:00", "00:30", "00:45", "01:00", "01:30"];

function parseYmd(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day);
}

function formatDisplayDate(value: string) {
  return parseYmd(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function parseHm(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  const date = new Date();
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return date;
}

function RadioDot({ selected, color }: { selected: boolean; color: string }) {
  return (
    <View style={[styles.radioOuter, { borderColor: color }]}>
      {selected ? <View style={[styles.radioInner, { backgroundColor: color }]} /> : null}
    </View>
  );
}

export default function TimelineTravelCheckInOutModal({
  visible,
  onClose,
  onComplete,
}: Props) {
  const { t } = useTranslation();
  const { permissions } = useAppData();
  const { modalPadding } = useScreenInsets();
  const isSimple = String(permissions?.simpel_check_in_out?.read) === "1";

  const [step, setStep] = useState<Step>("loading");
  const [session, setSession] = useState<CicoSession | null>(null);
  const [coords, setCoords] = useState<CicoCoords | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [date, setDate] = useState(formatCicoDate());
  const [time, setTime] = useState(formatCicoTime());
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [success, setSuccess] = useState<{ title: string; text: string } | null>(null);
  const [startType, setStartType] = useState("");
  const [endType, setEndType] = useState("");
  const [startAddress, setStartAddress] = useState<CicoAddressItem | null>(null);
  const [endAddress, setEndAddress] = useState<CicoAddressItem | null>(null);
  const [travelEnabled, setTravelEnabled] = useState(true);
  const [distance, setDistance] = useState(0);
  const [tripCost, setTripCost] = useState("0");
  const [breakTime, setBreakTime] = useState("00:00");
  const [description, setDescription] = useState("");
  const [stopTime, setStopTime] = useState(true);
  const [closingDay, setClosingDay] = useState(false);

  const isCheckOut = session?.cicoStatus === "check_out";

  const resetState = useCallback(() => {
    setStep("loading");
    setSession(null);
    setCoords(null);
    setSubmitting(false);
    setTime(formatCicoTime());
    setDate(formatCicoDate());
    setDatePickerOpen(false);
    setTimePickerOpen(false);
    setSuccess(null);
    setStartType("");
    setEndType("");
    setStartAddress(null);
    setEndAddress(null);
    setTravelEnabled(true);
    setDistance(0);
    setTripCost("0");
    setBreakTime("00:00");
    setDescription("");
    setStopTime(true);
    setClosingDay(false);
  }, []);

  const bootstrap = useCallback(async () => {
    setStep("loading");
    try {
      const cico = await fetchCicoSession(formatCicoDate());
      setSession(cico);
      setTravelEnabled(cico.travelCostEnabled);

      const checkingOut = cico.cicoStatus === "check_out";
      let nextStart = checkingOut ? "Office" : "Home";
      let nextEnd = checkingOut ? "Home" : "Office";

      if (checkingOut && cico.openEndPointType) {
        nextStart = cico.openEndPointType;
      }

      const startTypes = getTypeOptions(cico, "start");
      const endTypes = getTypeOptions(cico, "end");
      if (!startTypes.includes(nextStart)) nextStart = startTypes[0] || "";
      if (!endTypes.includes(nextEnd)) nextEnd = endTypes[0] || "";

      setStartType(nextStart);
      setEndType(nextEnd);
      setStartAddress(resolveDefaultAddress(cico.addressBuckets, nextStart));
      setEndAddress(resolveDefaultAddress(cico.addressBuckets, nextEnd));
      setClosingDay(nextEnd === "Home");
      setStep("summary");

      getDeviceCoordinates()
        .then(setCoords)
        .catch(() => setCoords(null));
    } catch (error) {
      Alert.alert(getApiErrorMessage(error, t("Something went wrong")));
      onClose();
    }
  }, [onClose, t]);

  useEffect(() => {
    if (!visible) {
      resetState();
      return;
    }
    bootstrap();
  }, [visible, bootstrap, resetState]);

  useEffect(() => {
    if (endType === "Home") setClosingDay(true);
  }, [endType]);

  const refreshDistanceAndCost = useCallback(async () => {
    if (!session || !travelEnabled) {
      setDistance(0);
      setTripCost("0");
      return;
    }
    const km = await calculateDistanceKm(startAddress?.address, endAddress?.address);
    setDistance(km);
    let cost = (km * Number(session.companyTravelCost || 0)).toFixed(2);
    const officeId =
      startType === "Office"
        ? startAddress?.id
        : endType === "Office"
          ? endAddress?.id
          : null;
    if (officeId != null) {
      try {
        cost = String(await adjustTravelCost(officeId, cost));
      } catch {
        // keep formula cost
      }
    }
    setTripCost(cost);
  }, [session, travelEnabled, startAddress, endAddress, startType, endType]);

  useEffect(() => {
    if (!visible || step === "loading" || step === "summary") return;
    refreshDistanceAndCost();
  }, [visible, step, refreshDistanceAndCost]);

  const startTypes = useMemo(
    () => (session ? getTypeOptions(session, "start") : []),
    [session]
  );
  const endTypes = useMemo(
    () => (session ? getTypeOptions(session, "end") : []),
    [session]
  );
  const startAddresses = session?.addressBuckets?.[startType] || [];
  const endAddresses = session?.addressBuckets?.[endType] || [];

  const submit = async () => {
    if (!session) return;
    if (!startType || !endType) {
      Alert.alert(t("Please select start and destination"));
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        isSimple,
        date,
        time,
        startType,
        startAddress,
        endType,
        endAddress,
        distance,
        tripCost: travelEnabled ? tripCost : 0,
        travelCostEnabled: travelEnabled,
        coords,
        session,
        breakTime,
        description,
        stopTime,
        closingDay: endType === "Home" ? closingDay : false,
      };

      if (isCheckOut) {
        await performCicoCheckOut(payload);
      } else {
        await performCicoCheckIn(payload);
      }

      setSuccess({
        title: isCheckOut ? t("EmployeeCheckOut") : t("EmployeeCheckIn"),
        text: `${date} (${time})\n${startType || "N/A"}  >  ${endType || "N/A"}`,
      });
      onComplete();
    } catch (error) {
      Alert.alert(getApiErrorMessage(error, t("Something went wrong")));
    } finally {
      setSubmitting(false);
    }
  };

  const goNextFromSummary = () => {
    if (isSimple) {
      submit();
      return;
    }
    setStep("startType");
  };

  const afterPickStartType = (type: string) => {
    setStartType(type);
    const list = session?.addressBuckets?.[type] || [];
    const selected = resolveDefaultAddress(session?.addressBuckets || {}, type);
    setStartAddress(selected);
    if (list.length <= 1) {
      setStep("endType");
    } else {
      setStep("startAddress");
    }
  };

  const afterPickEndType = (type: string) => {
    setEndType(type);
    if (type === "Home") setClosingDay(true);
    const list = session?.addressBuckets?.[type] || [];
    const selected = resolveDefaultAddress(session?.addressBuckets || {}, type);
    setEndAddress(selected);
    if (list.length <= 1) {
      setStep("travel");
    } else {
      setStep("endAddress");
    }
  };

  const goBack = () => {
    if (step === "startType") setStep("summary");
    else if (step === "startAddress") setStep("startType");
    else if (step === "endType") {
      setStep(startAddresses.length <= 1 ? "startType" : "startAddress");
    } else if (step === "endAddress") setStep("endType");
    else if (step === "travel") {
      setStep(endAddresses.length <= 1 ? "endType" : "endAddress");
    } else if (step === "checkoutExtra") setStep("travel");
  };

  const submitCheckoutExtra = () => {
    if (!breakTime) {
      Alert.alert(t("Error"), t("Please select break time"));
      return;
    }
    submit();
  };

  const stepHeading =
    step === "startType"
      ? t("Starting Point")
      : step === "startAddress"
        ? startType
        : step === "endType"
          ? t("Select Destination")
          : step === "endAddress"
            ? endType
            : step === "travel"
              ? t("Travel Cost")
              : "";

  const showBack = step !== "loading" && step !== "summary";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={getKeyboardAvoidBehavior()}
      >
        <View style={[styles.backdrop, success ? styles.backdropCenter : null]}>
          {success ? (
            <View style={styles.successCard}>
              <Text style={styles.successTitle}>{success.title}</Text>
              <Text style={styles.successText}>{success.text}</Text>
              <Pressable
                style={styles.successOk}
                onPress={() => {
                  setSuccess(null);
                  onClose();
                }}
              >
                <Text style={styles.successOkText}>{t("Ok")}</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.backdropFill} onPress={onClose}>
              <Pressable
                style={[styles.card, { marginBottom: modalPadding }]}
                onPress={(e) => e.stopPropagation()}
              >
                <View style={styles.topRow}>
                  {showBack ? (
                    <Pressable style={styles.iconBtn} onPress={goBack}>
                      <Image source={Images.BackIcon} style={styles.navIcon} />
                    </Pressable>
                  ) : (
                    <View style={styles.iconBtnSpacer} />
                  )}
                  <Pressable style={styles.iconBtn} onPress={onClose}>
                    <Image source={Images.CloseIcon} style={styles.navIcon} />
                  </Pressable>
                </View>

                <Text style={styles.screenTitle}>
                  {isCheckOut ? t("Check Out") : t("Check In")}
                </Text>

                {step === "loading" || !session ? (
                  <ActivityIndicator color={AppColors.primary} style={{ marginVertical: 24 }} />
                ) : (
                  <ScrollView
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.content}
                  >
                    {showBack && stepHeading ? (
                      <Text style={styles.stepTitle}>{stepHeading}</Text>
                    ) : null}

                    {step === "summary" ? (
                      <>
                        {session.canEditDateTime ? (
                          <>
                            <Text style={styles.fieldLabel}>{t("Date")} :</Text>
                            <Pressable
                              style={styles.dateInput}
                              onPress={() => setDatePickerOpen(true)}
                            >
                              <Text style={styles.dateInputText}>
                                {formatDisplayDate(date)}
                              </Text>
                              <View style={styles.pickerIcon}>
                                <Image source={Images.date} style={styles.pickerIconImage} />
                              </View>
                            </Pressable>

                            <Text style={styles.fieldLabel}>{t("Time")} :</Text>
                            <Pressable
                              style={styles.dateInput}
                              onPress={() => setTimePickerOpen(true)}
                            >
                              <Text style={styles.dateInputText}>{time}</Text>
                              <View style={styles.pickerIcon}>
                                <Image source={Images.date} style={styles.pickerIconImage} />
                              </View>
                            </Pressable>
                          </>
                        ) : (
                          <>
                            <Text style={styles.fieldLabel}>{t("Date")} :</Text>
                            <View style={styles.infoRow}>
                              <Text style={styles.fieldLabel}>{t("Current Date")} :</Text>
                              <Text style={styles.infoValue}>{formatDisplayDate(date)}</Text>
                            </View>
                            <Text style={styles.fieldLabel}>{t("Time")} :</Text>
                            <View style={styles.infoRow}>
                              <Text style={styles.fieldLabel}>{t("Current Time")} :</Text>
                              <Text style={styles.infoValue}>{time}</Text>
                            </View>
                          </>
                        )}

                        {isCheckOut && isSimple ? (
                          <>
                            <Text style={styles.fieldLabel}>{t("BREAK TIME")}</Text>
                            <View style={styles.chipWrap}>
                              {BREAK_OPTIONS.map((item) => {
                                const active = breakTime === item;
                                return (
                                  <Pressable
                                    key={item}
                                    style={[styles.chip, active && styles.chipActive]}
                                    onPress={() => setBreakTime(item)}
                                  >
                                    <RadioDot
                                      selected={active}
                                      color={active ? AppColors.white : AppColors.primary}
                                    />
                                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                                      {item}
                                    </Text>
                                  </Pressable>
                                );
                              })}
                            </View>
                          </>
                        ) : null}

                        <Pressable
                          style={[styles.nextButton, submitting && styles.disabled]}
                          onPress={goNextFromSummary}
                          disabled={submitting}
                        >
                          <Text style={styles.nextButtonText}>
                            {submitting
                              ? t("Loading...")
                              : isSimple
                                ? isCheckOut
                                  ? t("Check Out")
                                  : t("Check In")
                                : t("Next")}
                          </Text>
                        </Pressable>
                      </>
                    ) : null}

                    {step === "startType"
                      ? startTypes.map((type) => (
                          <Pressable
                            key={type}
                            style={[styles.infoRow, styles.startTypeRow]}
                            onPress={() => afterPickStartType(type)}
                          >
                            <RadioDot selected={startType === type} color={AppColors.white} />
                            <Text style={styles.typeRowText}>{type}</Text>
                          </Pressable>
                        ))
                      : null}

                    {step === "startAddress"
                      ? startAddresses.map((item) => (
                          <Pressable
                            key={String(item.id ?? item.address)}
                            style={styles.infoRow}
                            onPress={() => {
                              setStartAddress(item);
                              setStep("endType");
                            }}
                          >
                            <RadioDot
                              selected={startAddress?.id === item.id}
                              color={AppColors.primary}
                            />
                            <View style={styles.addressCopy}>
                              <Text style={styles.addressTitle}>
                                {item.title || item.address || "-"}
                              </Text>
                              {item.address ? (
                                <Text style={styles.addressTitle}>{item.address}</Text>
                              ) : null}
                            </View>
                          </Pressable>
                        ))
                      : null}

                    {step === "endType" ? (
                      <>
                        {endTypes.map((type) => (
                          <Pressable
                            key={type}
                            style={[styles.infoRow, styles.endTypeRow]}
                            onPress={() => afterPickEndType(type)}
                          >
                            <RadioDot selected={endType === type} color={AppColors.white} />
                            <Text style={styles.typeRowText}>{type}</Text>
                          </Pressable>
                        ))}
                        {isCheckOut && endType === "Home" ? (
                          <View style={styles.closingDayRow}>
                            <Text style={styles.closingDayLabel}>{t("Closing Day")}</Text>
                            <Switch
                              value={closingDay}
                              onValueChange={setClosingDay}
                              trackColor={{ false: AppColors.Boxgray, true: AppColors.primary }}
                              thumbColor={AppColors.white}
                            />
                          </View>
                        ) : null}
                      </>
                    ) : null}

                    {step === "endAddress"
                      ? endAddresses.map((item) => (
                          <Pressable
                            key={String(item.id ?? item.address)}
                            style={styles.infoRow}
                            onPress={() => {
                              setEndAddress(item);
                              setStep("travel");
                            }}
                          >
                            <RadioDot
                              selected={endAddress?.id === item.id}
                              color={AppColors.primary}
                            />
                            <View style={styles.addressCopy}>
                              <Text style={styles.addressTitle}>
                                {item.title || item.address || "-"}
                              </Text>
                              {item.address ? (
                                <Text style={styles.addressTitle}>{item.address}</Text>
                              ) : null}
                            </View>
                          </Pressable>
                        ))
                      : null}

                    {step === "travel" ? (
                      <>
                        <View style={styles.travelToggleRow}>
                          <Text style={styles.addressTitle}>{t("Enable Travel Cost")}</Text>
                          <View style={styles.switchBorder}>
                            <Switch
                              value={travelEnabled}
                              onValueChange={setTravelEnabled}
                              trackColor={{ false: AppColors.Boxgray, true: AppColors.primary }}
                              thumbColor={AppColors.white}
                            />
                          </View>
                        </View>
                        <View style={styles.infoRow}>
                          <Text style={styles.fieldLabel}>{t("Distance")} : </Text>
                          <Text style={styles.infoValue}>{distance || 0} Km</Text>
                        </View>
                        <View style={[styles.infoRow, { marginBottom: 20 }]}>
                          <Text style={styles.fieldLabel}>{t("Cost")} : </Text>
                          <Text style={styles.infoValue}>
                            {travelEnabled
                              ? Number(tripCost)
                                ? String(tripCost)
                                : "0.00"
                              : "0.00"}
                          </Text>
                        </View>
                        <Pressable
                          style={[styles.nextButton, submitting && styles.disabled]}
                          onPress={() => {
                            if (isCheckOut) setStep("checkoutExtra");
                            else submit();
                          }}
                          disabled={submitting}
                        >
                          <Text style={styles.nextButtonText}>
                            {submitting
                              ? t("Loading...")
                              : isCheckOut
                                ? t("Next")
                                : t("Check In")}
                          </Text>
                        </Pressable>
                      </>
                    ) : null}

                    {step === "checkoutExtra" ? (
                      <>
                        <Text style={styles.sectionTitle}>{t("BREAK TIME")}*</Text>
                        <View style={styles.chipWrap}>
                          {BREAK_OPTIONS.map((item) => {
                            const active = breakTime === item;
                            return (
                              <Pressable
                                key={item}
                                style={styles.stopOption}
                                onPress={() => setBreakTime(item)}
                              >
                                <RadioDot selected={active} color={AppColors.primary} />
                                <Text style={styles.stopOptionText}>{item}</Text>
                              </Pressable>
                            );
                          })}
                        </View>

                        <Text style={styles.sectionTitle}>{t("STOP TIME")}*</Text>
                        <View style={styles.chipWrap}>
                          {[true, false].map((value) => {
                            const active = stopTime === value;
                            return (
                              <Pressable
                                key={String(value)}
                                style={styles.stopOption}
                                onPress={() => setStopTime(value)}
                              >
                                <RadioDot selected={active} color={AppColors.primary} />
                                <Text style={styles.stopOptionText}>
                                  {value ? t("Yes") : t("No")}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>

                        <Text style={styles.sectionTitle}>{t("DESCRIPTION")}</Text>
                        <TextInput
                          style={styles.descriptionInput}
                          value={description}
                          onChangeText={setDescription}
                          placeholder={t("Enter description...")}
                          placeholderTextColor={AppColors.placeholder}
                          multiline
                        />

                        <Pressable
                          style={[styles.nextButton, submitting && styles.disabled]}
                          onPress={submitCheckoutExtra}
                          disabled={submitting}
                        >
                          <Text style={styles.nextButtonText}>
                            {submitting ? t("Loading...") : t("Check Out")}
                          </Text>
                        </Pressable>
                      </>
                    ) : null}
                  </ScrollView>
                )}
              </Pressable>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>

      <AppDatePickerSheet
        visible={datePickerOpen}
        value={parseYmd(date)}
        onConfirm={(next) => {
          setDate(formatCicoDate(next));
          setDatePickerOpen(false);
        }}
        onClose={() => setDatePickerOpen(false)}
      />

      {timePickerOpen && Platform.OS === "android" ? (
        <DateTimePicker
          value={parseHm(time)}
          mode="time"
          is24Hour
          display="default"
          onChange={(event: DateTimePickerEvent, next?: Date) => {
            setTimePickerOpen(false);
            if (event.type === "dismissed" || !next) return;
            setTime(formatCicoTime(next));
          }}
        />
      ) : null}

      {timePickerOpen && Platform.OS !== "android" ? (
        <Modal
          visible
          transparent
          animationType="fade"
          statusBarTranslucent
          navigationBarTranslucent
          onRequestClose={() => setTimePickerOpen(false)}
        >
          <View style={styles.timeOverlay}>
            <Pressable style={styles.timeBackdrop} onPress={() => setTimePickerOpen(false)} />
            <View style={[styles.timeSheet, { paddingBottom: modalPadding }]}>
              <View style={styles.timeSheetHeader}>
                <Pressable onPress={() => setTimePickerOpen(false)}>
                  <Text style={styles.cancelText}>{t("Cancel")}</Text>
                </Pressable>
                <Text style={styles.screenTitle}>{t("Time")}</Text>
                <Pressable onPress={() => setTimePickerOpen(false)}>
                  <Text style={styles.doneText}>{t("Done")}</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={parseHm(time)}
                mode="time"
                display="spinner"
                is24Hour
                onChange={(_event: DateTimePickerEvent, next?: Date) => {
                  if (next) setTime(formatCicoTime(next));
                }}
              />
            </View>
          </View>
        </Modal>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  backdropCenter: {
    alignItems: "center",
  },
  backdropFill: {
    flex: 1,
    justifyContent: "center",
  },
  card: {
    backgroundColor: AppColors.white,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingTop: 16,
    paddingBottom: 24,
    maxHeight: "90%",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  iconBtn: {
    height: 35,
    width: 35,
    borderWidth: 1,
    borderColor: AppColors.litegray,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnSpacer: {
    height: 35,
    width: 35,
  },
  navIcon: {
    width: 18,
    height: 18,
  },
  screenTitle: {
    alignSelf: "center",
    fontFamily: FONTS.LexendMedium,
    paddingVertical: 10,
    fontSize: 15,
    color: AppColors.black,
  },
  stepTitle: {
    alignSelf: "center",
    fontFamily: FONTS.LexendMedium,
    fontSize: 15,
    color: AppColors.black,
    textAlign: "center",
    marginBottom: 8,
  },
  content: {
    paddingBottom: 8,
  },
  fieldLabel: {
    paddingVertical: 8,
    fontSize: 13,
    fontFamily: FONTS.LexendRegular,
    color: AppColors.black,
  },
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    paddingLeft: 10,
    overflow: "hidden",
  },
  dateInputText: {
    flex: 1,
    color: AppColors.black,
    paddingVertical: 12,
    fontFamily: FONTS.LexendRegular,
  },
  pickerIcon: {
    backgroundColor: AppColors.primary,
    padding: 7,
    borderRadius: 5,
    margin: 4,
  },
  pickerIconImage: {
    width: 20,
    height: 20,
    tintColor: AppColors.white,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderColor: AppColors.litegray,
    marginVertical: 3,
  },
  infoValue: {
    fontSize: 12,
    color: AppColors.placeholder,
    fontFamily: FONTS.LexendRegular,
    flex: 1,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
    marginBottom: 10,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: AppColors.litegray,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: AppColors.white,
  },
  chipActive: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  chipText: {
    fontSize: 14,
    fontFamily: FONTS.LexendRegular,
    color: AppColors.black,
    marginLeft: 6,
  },
  chipTextActive: {
    color: AppColors.white,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  startTypeRow: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  endTypeRow: {
    backgroundColor: AppColors.green,
    borderColor: AppColors.green,
  },
  typeRowText: {
    flex: 1,
    padding: 4,
    color: AppColors.white,
    fontFamily: FONTS.LexendRegular,
  },
  addressCopy: {
    flex: 1,
  },
  addressTitle: {
    flex: 1,
    padding: 4,
    color: AppColors.black,
    fontFamily: FONTS.LexendRegular,
  },
  closingDayRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  closingDayLabel: {
    flex: 1,
    textAlign: "right",
    padding: 4,
    color: AppColors.black,
    fontFamily: FONTS.LexendRegular,
  },
  travelToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  switchBorder: {
    borderColor: AppColors.Boxgray,
    borderWidth: 1,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  nextButton: {
    padding: 10,
    backgroundColor: AppColors.primary,
    borderRadius: 5,
    marginBottom: 10,
    alignItems: "center",
    marginTop: 20,
  },
  nextButtonText: {
    color: AppColors.white,
    fontFamily: FONTS.LexendRegular,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: FONTS.LexendMedium,
    marginVertical: 8,
    color: AppColors.black,
  },
  stopOption: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    marginBottom: 8,
  },
  stopOptionText: {
    fontSize: 14,
    fontFamily: FONTS.LexendRegular,
    color: AppColors.black,
  },
  descriptionInput: {
    height: 100,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: AppColors.black,
    fontFamily: FONTS.LexendRegular,
    marginBottom: 20,
    textAlignVertical: "top",
  },
  successCard: {
    width: "80%",
    backgroundColor: AppColors.white,
    borderRadius: 10,
    paddingTop: 16,
    alignSelf: "center",
    overflow: "hidden",
  },
  successTitle: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 15,
    color: AppColors.black,
    textAlign: "center",
    paddingHorizontal: 16,
  },
  successText: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 15,
    color: AppColors.black,
    lineHeight: 22,
    textAlign: "center",
    marginVertical: 8,
    paddingHorizontal: 16,
  },
  successOk: {
    borderTopWidth: 1,
    borderTopColor: "#9CA3AF",
    paddingVertical: 12,
    marginTop: 8,
  },
  successOkText: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 16,
    color: AppColors.primary,
    textAlign: "center",
  },
  timeOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  timeBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  timeSheet: {
    backgroundColor: AppColors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 24,
  },
  timeSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  cancelText: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 14,
    color: AppColors.primary,
  },
  doneText: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 15,
    color: AppColors.primary,
  },
  disabled: {
    opacity: 0.7,
  },
});
