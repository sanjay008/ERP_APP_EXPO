import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useAppData } from "../context/AppDataContext";
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

export default function TimelineTravelCheckInOutModal({
  visible,
  onClose,
  onComplete,
}: Props) {
  const { t } = useTranslation();
  const { permissions } = useAppData();
  const isSimple = String(permissions?.simpel_check_in_out?.read) === "1";

  const [step, setStep] = useState<Step>("loading");
  const [session, setSession] = useState<CicoSession | null>(null);
  const [coords, setCoords] = useState<CicoCoords | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [date] = useState(formatCicoDate());
  const [time, setTime] = useState(formatCicoTime());
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
      const [cico, location] = await Promise.all([
        fetchCicoSession(formatCicoDate()),
        getDeviceCoordinates(),
      ]);
      setSession(cico);
      setCoords(location);
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

      onComplete();
      onClose();
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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {isCheckOut ? t("Check Out") : t("Check In")}
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={styles.close}>{t("Sluiten")}</Text>
            </Pressable>
          </View>

          {step === "loading" || !session ? (
            <ActivityIndicator color={AppColors.primary} style={{ marginVertical: 24 }} />
          ) : (
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
              {step === "summary" ? (
                <>
                  <Text style={styles.label}>{t("Date")}</Text>
                  <Text style={styles.value}>{date}</Text>
                  <Text style={styles.label}>{t("Time")}</Text>
                  {session.canEditDateTime ? (
                    <TextInput style={styles.input} value={time} onChangeText={setTime} />
                  ) : (
                    <Text style={styles.value}>{time}</Text>
                  )}

                  <Text style={styles.meta}>
                    {startType || "-"} → {endType || "-"}
                  </Text>
                  {coords ? (
                    <Text style={styles.gps}>
                      GPS: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                    </Text>
                  ) : (
                    <Text style={styles.gps}>{t("Location unavailable")}</Text>
                  )}

                  {isCheckOut && isSimple ? (
                    <>
                      <Text style={styles.label}>{t("Breake")}</Text>
                      <View style={styles.rowWrap}>
                        {BREAK_OPTIONS.map((item) =>
                          renderOption(item, breakTime === item, () => setBreakTime(item))
                        )}
                      </View>
                      <Text style={styles.label}>{t("Description")}</Text>
                      <TextInput
                        style={[styles.input, styles.multiline]}
                        value={description}
                        onChangeText={setDescription}
                        multiline
                      />
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

                  <Text style={styles.label}>{t("Description")}</Text>
                  <TextInput
                    style={[styles.input, styles.multiline]}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                  />

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
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
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
  close: {
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
  meta: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 15,
    color: AppColors.black,
    marginTop: 12,
  },
  gps: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 12,
    color: AppColors.subtitle,
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
