import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import AuthButton from "../../Components/Auth/AuthButton";
import AuthInput from "../../Components/Auth/AuthInput";
import AuthSelect from "../../Components/Auth/AuthSelect";
import SelectionSheet from "../../Components/Auth/SelectionSheet";
import { GooglePlacesField } from "../../Components/GooglePlacesInput";
import ScreenHeader from "../../Components/ScreenHeader";
import {
  createTaxiBooking,
  fetchRelatieAddresses,
  fetchTripSetup,
  getTripDetailLabel,
  getTripTypeLabel,
  getVehicleCategoryLabel,
  type AddressOption,
  type TourOption,
  type TripDetailOption,
  type TripTypeOption,
  type VehicleCategoryOption,
} from "../../services/bookingService";
import { getApiErrorMessage } from "../../utils/validation";
import { useScreenInsets } from "../../utils/screenInsets";
import { AppColors } from "../../utils/theme";
import { FONTS } from "../../utils/FONTS";
import { LIST_UI } from "../../utils/connectionTheme";
import { listScreenStyles } from "../../utils/listScreenStyles";

const TOTAL_STEPS = 5;

function formatIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTime(date: Date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export default function CreateBookingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { top, scrollPadding } = useScreenInsets();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [tripTypes, setTripTypes] = useState<TripTypeOption[]>([]);
  const [tripDetails, setTripDetails] = useState<TripDetailOption[]>([]);
  const [categories, setCategories] = useState<VehicleCategoryOption[]>([]);
  const [currencies, setCurrencies] = useState<Array<{ code?: string; symbol?: string }>>([]);
  const [addresses, setAddresses] = useState<AddressOption[]>([]);
  const [tours, setTours] = useState<TourOption[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);

  const [tripTypeId, setTripTypeId] = useState("");
  const [tripDetailId, setTripDetailId] = useState("");
  const [vehicleCategoryId, setVehicleCategoryId] = useState("");
  const [currencyCode, setCurrencyCode] = useState("SRD");
  const [tourId, setTourId] = useState("");
  const [tourPrice, setTourPrice] = useState("0");
  const [pickupAddress, setPickupAddress] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [extraStops, setExtraStops] = useState<string[]>([]);
  const [useCustomPickup, setUseCustomPickup] = useState(false);
  const [useCustomDrop, setUseCustomDrop] = useState(false);
  const [pickupTime, setPickupTime] = useState(formatTime(new Date()));
  const [dropTime, setDropTime] = useState("");
  const [totalPerson, setTotalPerson] = useState("1");
  const [totalSuitcase, setTotalSuitcase] = useState("0");
  const [totalTrolly, setTotalTrolly] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [comments, setComments] = useState("");
  const [vehiclePrice, setVehiclePrice] = useState("0");
  const [bookingDate, setBookingDate] = useState(new Date());
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [timePickerOpen, setTimePickerOpen] = useState<"pickup" | "drop" | null>(null);

  const [sheet, setSheet] = useState<
    | "tripType"
    | "tripDetail"
    | "vehicle"
    | "currency"
    | "payment"
    | "pickup"
    | "destination"
    | "tour"
    | null
  >(null);

  const selectedTripType = tripTypes.find((item) => String(item.id) === tripTypeId);
  const selectedTripDetail = tripDetails.find((item) => String(item.id) === tripDetailId);
  const selectedCategory = categories.find((item) => String(item.id) === vehicleCategoryId);
  const selectedTour = tours.find((item) => String(item.id) === tourId);
  const calculatedPrice = Number(tourPrice || 0) + Number(vehiclePrice || 0);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    try {
      const setup = await fetchTripSetup({ currencyCode });
      setTripTypes(setup.tripTypes);
      setTripDetails(setup.tripDetails);
      setCategories(setup.categories);
      setCurrencies(setup.currencies);
      if (setup.currencies[0]?.code) setCurrencyCode(setup.currencies[0].code);
    } catch (error) {
      Alert.alert(getApiErrorMessage(error, t("Something went wrong")));
    } finally {
      setLoading(false);
    }
  }, [currencyCode, t]);

  useEffect(() => {
    loadInitial();
  }, []);

  const reloadForTripType = useCallback(async () => {
    if (!tripTypeId) return;
    try {
      const setup = await fetchTripSetup({ tripTypeId, currencyCode, vehicleCategoryId });
      setTripDetails(setup.tripDetails);
      setCategories(setup.categories);
      const addressData = await fetchRelatieAddresses({ currencyCode });
      setAddresses(addressData.addresses);
      setTours(addressData.tours);
      setPaymentMethods(addressData.paymentMethods);
      if (addressData.paymentMethods[0]) setPaymentMethod(addressData.paymentMethods[0]);
      if (addressData.tourPrice?.price != null) setTourPrice(String(addressData.tourPrice.price));
    } catch (error) {
      Alert.alert(getApiErrorMessage(error, t("Something went wrong")));
    }
  }, [tripTypeId, currencyCode, vehicleCategoryId, t]);

  useEffect(() => {
    if (tripTypeId) reloadForTripType();
  }, [tripTypeId, reloadForTripType]);

  useEffect(() => {
    if (!vehicleCategoryId) return;
    const category = categories.find((item) => String(item.id) === vehicleCategoryId);
    setVehiclePrice(String(category?.matched_price ?? 0));
  }, [vehicleCategoryId, categories]);

  const canNext = useMemo(() => {
    if (step === 1) return Boolean(tripTypeId && tripDetailId);
    if (step === 2) return Boolean(pickupAddress.trim() && destinationAddress.trim());
    if (step === 3) return Boolean(pickupTime && totalPerson.trim());
    if (step === 4) return Boolean(vehicleCategoryId && paymentMethod.trim());
    return true;
  }, [
    step,
    tripTypeId,
    tripDetailId,
    pickupAddress,
    destinationAddress,
    pickupTime,
    totalPerson,
    vehicleCategoryId,
    paymentMethod,
  ]);

  const handleSubmit = async () => {
    if (!tripTypeId || !tripDetailId || !pickupAddress || !destinationAddress || !paymentMethod) {
      Alert.alert(t("Please fill all required fields"));
      return;
    }

    setSubmitting(true);
    try {
      await createTaxiBooking({
        tripTypeId,
        tripDetailsId: tripDetailId,
        startingAddress: pickupAddress.trim(),
        destinationAddress: destinationAddress.trim(),
        fromDate: formatIsoDate(bookingDate),
        pickupTime,
        dropTime,
        totalPerson,
        totalSuitcase,
        totalTrolly,
        currencyCode,
        comments,
        paymentMethod,
        tourId,
        tourPrice,
        vehicleCategoryId,
        vehiclePrice,
        extraStopAddresses: extraStops,
        pickupSwitch: useCustomPickup ? 1 : 0,
        dropSwitch: useCustomDrop ? 1 : 0,
      });
      Alert.alert(t("Success"), t("Your booking is succesfully added we will contact you."));
      router.back();
    } catch (error) {
      Alert.alert(getApiErrorMessage(error, t("Something went wrong")));
    } finally {
      setSubmitting(false);
    }
  };

  const addExtraStop = () => setExtraStops((prev) => [...prev, ""]);
  const updateExtraStop = (index: number, value: string) => {
    setExtraStops((prev) => prev.map((item, idx) => (idx === index ? value : item)));
  };
  const removeExtraStop = (index: number) => {
    setExtraStops((prev) => prev.filter((_, idx) => idx !== index));
  };

  return (
    <View style={[listScreenStyles.container, { paddingTop: top }]}>
      <ScreenHeader title={t("Create Booking")} onBack={() => router.back()} />

      <KeyboardAwareScrollView
        contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.stepLabel}>
          {t("Step")} {step}/{TOTAL_STEPS}
        </Text>

        {step === 1 ? (
          <>
            <AuthSelect
              label={t("Trip Type")}
              value={getTripTypeLabel(selectedTripType)}
              placeholder={t("Select")}
              onPress={() => setSheet("tripType")}
            />
            <AuthSelect
              label={t("Trip Details")}
              value={getTripDetailLabel(selectedTripDetail)}
              placeholder={t("Select")}
              onPress={() => setSheet("tripDetail")}
            />
            <AuthSelect
              label={t("Currency")}
              value={currencyCode}
              placeholder={t("Select")}
              onPress={() => setSheet("currency")}
            />
            {tours.length > 0 ? (
              <AuthSelect
                label={t("Tour")}
                value={selectedTour?.tour_name || t("Optional")}
                placeholder={t("Select")}
                onPress={() => setSheet("tour")}
              />
            ) : null}
          </>
        ) : null}

        {step === 2 ? (
          <>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>{t("Use custom pickup address")}</Text>
              <Switch value={useCustomPickup} onValueChange={setUseCustomPickup} />
            </View>
            {!useCustomPickup ? (
              <AuthSelect
                label={t("Pickup")}
                value={pickupAddress}
                placeholder={t("Select saved address")}
                onPress={() => setSheet("pickup")}
              />
            ) : null}
            <GooglePlacesField
              label={t("Pickup Address")}
              required
              value={pickupAddress}
              onChangeText={setPickupAddress}
              placeholder={t("Enter pickup address")}
            />

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>{t("Use custom destination address")}</Text>
              <Switch value={useCustomDrop} onValueChange={setUseCustomDrop} />
            </View>
            {!useCustomDrop ? (
              <AuthSelect
                label={t("Destination")}
                value={destinationAddress}
                placeholder={t("Select saved address")}
                onPress={() => setSheet("destination")}
              />
            ) : null}
            <GooglePlacesField
              label={t("Destination Address")}
              required
              value={destinationAddress}
              onChangeText={setDestinationAddress}
              placeholder={t("Enter destination address")}
            />

            {extraStops.map((stop, index) => (
              <View key={`stop-${index}`} style={styles.extraStopRow}>
                <View style={styles.extraStopInput}>
                  <GooglePlacesField
                    label={`${t("Extra Stop")} ${index + 1}`}
                    value={stop}
                    onChangeText={(value) => updateExtraStop(index, value)}
                    placeholder={t("Enter stop address")}
                    containerStyle={{ marginBottom: 0 }}
                  />
                </View>
                <Pressable onPress={() => removeExtraStop(index)} style={styles.removeStopBtn}>
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </Pressable>
              </View>
            ))}
            <Pressable onPress={addExtraStop} style={styles.addStopBtn}>
              <Ionicons name="add-circle-outline" size={18} color={AppColors.primary} />
              <Text style={styles.addStopText}>{t("Add extra stop")}</Text>
            </Pressable>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <Pressable style={styles.dateField} onPress={() => setDatePickerOpen(true)}>
              <Text style={styles.fieldLabel}>{t("Date")}</Text>
              <Text style={styles.fieldValue}>{formatIsoDate(bookingDate)}</Text>
            </Pressable>
            <Pressable style={styles.dateField} onPress={() => setTimePickerOpen("pickup")}>
              <Text style={styles.fieldLabel}>{t("Pickup Time")}</Text>
              <Text style={styles.fieldValue}>{pickupTime}</Text>
            </Pressable>
            <Pressable style={styles.dateField} onPress={() => setTimePickerOpen("drop")}>
              <Text style={styles.fieldLabel}>{t("Drop Time")}</Text>
              <Text style={styles.fieldValue}>{dropTime || t("Optional")}</Text>
            </Pressable>
            <AuthInput label={t("Persons")} value={totalPerson} onChangeText={setTotalPerson} keyboardType="number-pad" />
            <AuthInput label={t("Suitcase")} value={totalSuitcase} onChangeText={setTotalSuitcase} keyboardType="number-pad" />
            <AuthInput label={t("Trolly")} value={totalTrolly} onChangeText={setTotalTrolly} keyboardType="number-pad" />
          </>
        ) : null}

        {step === 4 ? (
          <>
            <AuthSelect
              label={t("Vehicle Category")}
              value={getVehicleCategoryLabel(selectedCategory)}
              placeholder={t("Select")}
              onPress={() => setSheet("vehicle")}
            />
            {selectedCategory ? (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLine}>
                  {t("Max persons")}: {selectedCategory.max_person ?? "-"}
                </Text>
                <Text style={styles.summaryLine}>
                  {t("Vehicle price")}: {currencyCode} {vehiclePrice}
                </Text>
              </View>
            ) : null}
            <AuthSelect
              label={t("Payment Method")}
              value={paymentMethod}
              placeholder={t("Select")}
              onPress={() => setSheet("payment")}
            />
            <AuthInput label={t("Comment")} value={comments} onChangeText={setComments} multiline />
          </>
        ) : null}

        {step === 5 ? (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>{t("Booking Summary")}</Text>
            <Text style={styles.summaryLine}>{getTripTypeLabel(selectedTripType)} / {getTripDetailLabel(selectedTripDetail)}</Text>
            <Text style={styles.summaryLine}>{t("Pickup")}: {pickupAddress}</Text>
            <Text style={styles.summaryLine}>{t("Destination")}: {destinationAddress}</Text>
            {extraStops.filter(Boolean).map((stop, index) => (
              <Text key={`summary-stop-${index}`} style={styles.summaryLine}>
                {t("Extra Stop")} {index + 1}: {stop}
              </Text>
            ))}
            <Text style={styles.summaryLine}>{formatIsoDate(bookingDate)} · {pickupTime}{dropTime ? ` → ${dropTime}` : ""}</Text>
            <Text style={styles.summaryLine}>{t("Persons")}: {totalPerson}</Text>
            <Text style={styles.summaryLine}>{getVehicleCategoryLabel(selectedCategory)}</Text>
            <Text style={styles.summaryLine}>{t("Payment")}: {paymentMethod}</Text>
            <Text style={styles.summaryTotal}>
              {t("Total")}: {currencyCode} {calculatedPrice.toFixed(2)}
            </Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          {step > 1 ? <AuthButton title={t("Back")} onPress={() => setStep((prev) => prev - 1)} /> : null}
          {step < TOTAL_STEPS ? (
            <AuthButton title={t("Next")} onPress={() => canNext && setStep((prev) => prev + 1)} disabled={!canNext || loading} />
          ) : (
            <AuthButton title={t("Save")} onPress={handleSubmit} disabled={submitting} />
          )}
        </View>
      </KeyboardAwareScrollView>

      {datePickerOpen ? (
        <DateTimePicker
          value={bookingDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event: DateTimePickerEvent, date?: Date) => {
            if (Platform.OS === "android") setDatePickerOpen(false);
            if (event.type === "dismissed" || !date) return;
            setBookingDate(date);
          }}
        />
      ) : null}

      {timePickerOpen ? (
        <DateTimePicker
          value={new Date(`1970-01-01T${timePickerOpen === "pickup" ? pickupTime : dropTime || pickupTime}:00`)}
          mode="time"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event: DateTimePickerEvent, date?: Date) => {
            if (Platform.OS === "android") setTimePickerOpen(null);
            if (event.type === "dismissed" || !date) return;
            const value = formatTime(date);
            if (timePickerOpen === "pickup") setPickupTime(value);
            else setDropTime(value);
          }}
        />
      ) : null}

      <SelectionSheet
        visible={sheet === "tripType"}
        title={t("Trip Type")}
        options={tripTypes.map((item) => ({
          label: getTripTypeLabel(item) || "-",
          value: String(item.id),
        }))}
        onClose={() => setSheet(null)}
        onSelect={(option) => {
          setTripTypeId(option.value);
          setTripDetailId("");
          setSheet(null);
        }}
      />
      <SelectionSheet
        visible={sheet === "tripDetail"}
        title={t("Trip Details")}
        options={tripDetails.map((item) => ({
          label: getTripDetailLabel(item) || "-",
          value: String(item.id),
        }))}
        onClose={() => setSheet(null)}
        onSelect={(option) => {
          setTripDetailId(option.value);
          setSheet(null);
        }}
      />
      <SelectionSheet
        visible={sheet === "vehicle"}
        title={t("Vehicle Category")}
        options={categories.map((item) => {
          const title = getVehicleCategoryLabel(item);
          const price =
            item.matched_price != null && item.matched_price !== ""
              ? ` · ${currencyCode} ${item.matched_price}`
              : "";
          const persons =
            item.max_person != null && item.max_person !== ""
              ? ` · 👥 ${item.max_person}`
              : "";

          return {
            label: title ? `${title}${price}${persons}` : "-",
            value: String(item.id),
          };
        })}
        onClose={() => setSheet(null)}
        onSelect={(option) => {
          setVehicleCategoryId(option.value);
          setSheet(null);
        }}
      />
      <SelectionSheet
        visible={sheet === "currency"}
        title={t("Currency")}
        options={currencies.map((item) => ({ label: item.code || item.symbol || "-", value: item.code || "" }))}
        onClose={() => setSheet(null)}
        onSelect={(option) => {
          setCurrencyCode(option.value);
          setSheet(null);
        }}
      />
      <SelectionSheet
        visible={sheet === "payment"}
        title={t("Payment Method")}
        options={paymentMethods.map((item) => ({ label: item, value: item }))}
        onClose={() => setSheet(null)}
        onSelect={(option) => {
          setPaymentMethod(option.value);
          setSheet(null);
        }}
      />
      <SelectionSheet
        visible={sheet === "tour"}
        title={t("Tour")}
        options={[
          { label: t("None"), value: "" },
          ...tours.map((item) => ({ label: item.tour_name || "-", value: String(item.id) })),
        ]}
        onClose={() => setSheet(null)}
        onSelect={(option) => {
          setTourId(option.value);
          setSheet(null);
        }}
      />
      <SelectionSheet
        visible={sheet === "pickup"}
        title={t("Pickup")}
        options={addresses.map((item) => ({ label: item.destination_address || "-", value: item.destination_address || "" }))}
        onClose={() => setSheet(null)}
        onSelect={(option) => {
          setPickupAddress(option.value);
          setSheet(null);
        }}
      />
      <SelectionSheet
        visible={sheet === "destination"}
        title={t("Destination")}
        options={addresses.map((item) => ({ label: item.destination_address || "-", value: item.destination_address || "" }))}
        onClose={() => setSheet(null)}
        onSelect={(option) => {
          setDestinationAddress(option.value);
          setSheet(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: LIST_UI.screenPadding, paddingTop: 16 },
  stepLabel: { fontFamily: FONTS.LexendSemiBold, fontSize: 14, color: AppColors.primary, marginBottom: 12 },
  dateField: {
    borderWidth: 1,
    borderColor: LIST_UI.cardBorder,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: AppColors.white,
  },
  fieldLabel: { fontFamily: FONTS.LexendRegular, fontSize: 13, color: AppColors.subtitle, marginBottom: 4 },
  fieldValue: { fontFamily: FONTS.LexendMedium, fontSize: 15, color: AppColors.black },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  switchLabel: { flex: 1, fontFamily: FONTS.LexendRegular, fontSize: 13, color: AppColors.black, marginRight: 12 },
  extraStopRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  extraStopInput: { flex: 1 },
  removeStopBtn: { paddingTop: 28, paddingHorizontal: 4 },
  addStopBtn: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  addStopText: { fontFamily: FONTS.LexendMedium, fontSize: 14, color: AppColors.primary },
  summaryCard: {
    borderWidth: 1,
    borderColor: LIST_UI.cardBorder,
    borderRadius: 10,
    padding: 14,
    backgroundColor: AppColors.white,
    gap: 6,
    marginBottom: 12,
  },
  summaryTitle: { fontFamily: FONTS.LexendSemiBold, fontSize: 16, color: AppColors.black, marginBottom: 4 },
  summaryLine: { fontFamily: FONTS.LexendRegular, fontSize: 13, color: AppColors.black },
  summaryTotal: { fontFamily: FONTS.LexendBold, fontSize: 15, color: AppColors.primary, marginTop: 6 },
  actions: { gap: 12, marginTop: 8 },
});
