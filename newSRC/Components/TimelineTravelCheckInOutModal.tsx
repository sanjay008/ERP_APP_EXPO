import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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
import { Ionicons } from "@expo/vector-icons";
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
import { AppColors } from "../utils/theme";
import { FONTS } from "../utils/FONTS";
import { Images } from "../utils/Images";
import { useScreenInsets } from "../utils/screenInsets";

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

const BREAK_OPTIONS = ["00:00", "00:15", "00:30", "00:45", "01:00"];

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
    if (!visible || step === "loading") return;
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
    const list = session?.addressBuckets?.[type] || [];
    const selected = resolveDefaultAddress(session?.addressBuckets || {}, type);
    setEndAddress(selected);
    if (list.length <= 1) {
      setStep("travel");
    } else {
      setStep("endAddress");
    }
  };

  const renderOption = (label: string, active: boolean, onPress: () => void) => (
    <Pressable
      key={label}
      style={[styles.option, active && styles.optionActive]}
      onPress={onPress}
    >
      <Text style={[styles.optionText, active && styles.optionTextActive]}>{label}</Text>
    </Pressable>
  );

  const renderAddressOption = (
    item: CicoAddressItem,
    active: boolean,
    onPress: () => void
  ) => (
    <Pressable
      key={String(item.id ?? item.address)}
      style={[styles.option, active && styles.optionActive]}
      onPress={onPress}
    >
      <Text style={[styles.optionText, active && styles.optionTextActive]}>
        {item.title || item.address || "-"}
      </Text>
      {item.address ? <Text style={styles.optionSub}>{item.address}</Text> : null}
    </Pressable>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
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
        <View style={[styles.sheet, { paddingBottom: modalPadding }]}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {isCheckOut ? t("Check Out") : t("Check In")}
            </Text>
            <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={8}>
              <Image source={Images.CloseIcon} style={styles.closeIcon} />
            </Pressable>
          </View>

          {step === "loading" || !session ? (
            <ActivityIndicator color={AppColors.primary} style={{ marginVertical: 24 }} />
          ) : (
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
              {step === "summary" ? (
                <>
                  {session.canEditDateTime ? (
                    <>
                      <Text style={styles.label}>{t("Date")}</Text>
                      <Pressable style={styles.pickerField} onPress={() => setDatePickerOpen(true)}>
                        <Text style={styles.pickerValue}>{formatDisplayDate(date)}</Text>
                        <View style={styles.pickerIcon}>
                          <Image source={Images.date} style={styles.pickerIconImage} />
                        </View>
                      </Pressable>

                      <Text style={styles.label}>{t("Time")}</Text>
                      <Pressable style={styles.pickerField} onPress={() => setTimePickerOpen(true)}>
                        <Text style={styles.pickerValue}>{time}</Text>
                        <View style={styles.pickerIcon}>
                          <Ionicons name="time-outline" size={18} color={AppColors.white} />
                        </View>
                      </Pressable>
                    </>
                  ) : (
                    <>
                      <Text style={styles.label}>{t("Date")}</Text>
                      <View style={styles.readonlyRow}>
                        <Text style={styles.label}>{t("Current Date")} :</Text>
                        <Text style={styles.value}>{formatDisplayDate(date)}</Text>
                      </View>
                      <Text style={styles.label}>{t("Time")}</Text>
                      <View style={styles.readonlyRow}>
                        <Text style={styles.label}>{t("Current Time")} :</Text>
                        <Text style={styles.value}>{time}</Text>
                      </View>
                    </>
                  )}

                  {isCheckOut && isSimple ? (
                    <>
                      <Text style={styles.label}>{t("Breake")}</Text>
                      <View style={styles.rowWrap}>
                        {BREAK_OPTIONS.map((item) =>
                          renderOption(item, breakTime === item, () => setBreakTime(item))
                        )}
                      </View>
                    </>
                  ) : null}

                  <Pressable
                    style={[styles.primaryBtn, submitting && styles.disabled]}
                    onPress={goNextFromSummary}
                    disabled={submitting}
                  >
                    <Text style={styles.primaryBtnText}>
                      {submitting
                        ? t("Loading...")
                        : isSimple
                          ? isCheckOut
                            ? t("Check Out")
                            : t("Check In")
                          : t("Continue")}
                    </Text>
                  </Pressable>
                </>
              ) : null}

              {step === "startType" ? (
                <>
                  <Text style={styles.label}>{t("Start point")}</Text>
                  {startTypes.map((type) =>
                    renderOption(type, startType === type, () => afterPickStartType(type))
                  )}
                </>
              ) : null}

              {step === "startAddress" ? (
                <>
                  <Text style={styles.label}>{t("Start address")}</Text>
                  {startAddresses.map((item) =>
                    renderAddressOption(item, startAddress?.id === item.id, () => {
                      setStartAddress(item);
                      setStep("endType");
                    })
                  )}
                </>
              ) : null}

              {step === "endType" ? (
                <>
                  <Text style={styles.label}>{t("Destination")}</Text>
                  {endTypes.map((type) =>
                    renderOption(type, endType === type, () => afterPickEndType(type))
                  )}
                </>
              ) : null}

              {step === "endAddress" ? (
                <>
                  <Text style={styles.label}>{t("Destination address")}</Text>
                  {endAddresses.map((item) =>
                    renderAddressOption(item, endAddress?.id === item.id, () => {
                      setEndAddress(item);
                      setStep("travel");
                    })
                  )}
                </>
              ) : null}

              {step === "travel" ? (
                <>
                  <View style={styles.switchRow}>
                    <Text style={styles.label}>{t("Travel cost")}</Text>
                    <Switch
                      value={travelEnabled}
                      onValueChange={setTravelEnabled}
                      trackColor={{ true: AppColors.primary }}
                    />
                  </View>
                  <Text style={styles.value}>
                    {t("Distance")}: {distance} km
                  </Text>
                  <Text style={styles.label}>{t("Cost")}</Text>
                  <TextInput
                    style={styles.input}
                    value={String(tripCost)}
                    onChangeText={setTripCost}
                    keyboardType="decimal-pad"
                    editable={travelEnabled}
                  />

                  {endType === "Home" && isCheckOut ? (
                    <View style={styles.switchRow}>
                      <Text style={styles.label}>{t("Closing Day")}</Text>
                      <Switch
                        value={closingDay}
                        onValueChange={setClosingDay}
                        trackColor={{ true: AppColors.primary }}
                      />
                    </View>
                  ) : null}

                  <Pressable
                    style={[styles.primaryBtn, submitting && styles.disabled]}
                    onPress={() => {
                      if (isCheckOut) setStep("checkoutExtra");
                      else submit();
                    }}
                    disabled={submitting}
                  >
                    <Text style={styles.primaryBtnText}>
                      {submitting
                        ? t("Loading...")
                        : isCheckOut
                          ? t("Continue")
                          : t("Check In")}
                    </Text>
                  </Pressable>
                </>
              ) : null}

              {step === "checkoutExtra" ? (
                <>
                  <Text style={styles.label}>{t("Breake")}</Text>
                  <View style={styles.rowWrap}>
                    {BREAK_OPTIONS.map((item) =>
                      renderOption(item, breakTime === item, () => setBreakTime(item))
                    )}
                  </View>

                  <View style={styles.switchRow}>
                    <Text style={styles.label}>{t("Close day")}</Text>
                    <Switch
                      value={stopTime}
                      onValueChange={setStopTime}
                      trackColor={{ true: AppColors.primary }}
                    />
                  </View>

                  <Pressable
                    style={[styles.primaryBtn, submitting && styles.disabled]}
                    onPress={submit}
                    disabled={submitting}
                  >
                    <Text style={styles.primaryBtnText}>
                      {submitting ? t("Loading...") : t("Check Out")}
                    </Text>
                  </Pressable>
                </>
              ) : null}
            </ScrollView>
          )}
        </View>
        )}
      </View>

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
                <Text style={styles.title}>{t("Time")}</Text>
                <Pressable
                  onPress={() => {
                    setTimePickerOpen(false);
                  }}
                >
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
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  backdropCenter: {
    justifyContent: "center",
    alignItems: "center",
  },
  sheet: {
    backgroundColor: AppColors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "92%",
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 17,
    color: AppColors.black,
  },
  closeBtn: {
    height: 35,
    width: 35,
    borderWidth: 1,
    borderColor: "#E7E7E7",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  closeIcon: {
    width: 18,
    height: 18,
  },
  cancelText: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 14,
    color: AppColors.primary,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 8,
  },
  label: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 13,
    color: AppColors.subtitle,
    marginTop: 8,
  },
  value: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 15,
    color: AppColors.black,
  },
  pickerField: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    paddingLeft: 10,
    overflow: "hidden",
  },
  pickerValue: {
    flex: 1,
    fontFamily: FONTS.LexendRegular,
    fontSize: 14,
    color: AppColors.black,
    paddingVertical: 12,
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
  readonlyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
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
  doneText: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 15,
    color: AppColors.primary,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E5EA",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: FONTS.LexendRegular,
    fontSize: 14,
    color: AppColors.black,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  option: {
    borderWidth: 1,
    borderColor: "#E0E5EA",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 8,
  },
  optionActive: {
    borderColor: AppColors.primary,
    backgroundColor: "#EEF4FF",
  },
  optionText: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 14,
    color: AppColors.black,
  },
  optionTextActive: {
    color: AppColors.primary,
  },
  optionSub: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 12,
    color: AppColors.subtitle,
    marginTop: 4,
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  primaryBtn: {
    marginTop: 16,
    backgroundColor: AppColors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryBtnText: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 15,
    color: AppColors.white,
  },
  disabled: {
    opacity: 0.7,
  },
});
