import React, { useState, useCallback, useEffect } from 'react'
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Platform,
    Switch,
    ActivityIndicator,
} from 'react-native'
import Modal from 'react-native-modal'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { Dropdown } from 'react-native-element-dropdown'
import { useTranslation } from 'react-i18next'
import MyCountryPiker from './CountryPicker'
import { Colors } from '../constants/color'
import { FONTS } from '../constants/fontFamily'

const { width, height } = Dimensions.get('window')

const STEP_COUNT = 2

const StepIndicator = ({ currentStep, primaryColor }) => {
    const { t } = useTranslation()
    return (
        <View style={styles.stepIndicatorWrapper}>
            {Array.from({ length: STEP_COUNT }, (_, i) => {
                const stepNum = i + 1
                const isActive = stepNum === currentStep
                const isDone = stepNum < currentStep
                return (
                    <View key={stepNum} style={styles.stepItem}>
                        <View
                            style={[
                                styles.stepCircle,
                                isActive && [styles.stepCircleActive, { borderColor: primaryColor }],
                                isDone && { backgroundColor: primaryColor, borderColor: primaryColor },
                            ]}
                        >
                            {isDone ? (
                                <Text style={styles.stepCheckmark}>✓</Text>
                            ) : (
                                <Text style={[styles.stepNumber, isActive && { color: primaryColor }]}>
                                    {stepNum}
                                </Text>
                            )}
                        </View>
                        <Text style={[styles.stepLabel, isActive && [styles.stepLabelActive, { color: primaryColor }]]}>
                            {t(`step${stepNum}Label`, `Step ${stepNum}`)}
                        </Text>
                        {stepNum < STEP_COUNT && (
                            <View style={[styles.stepLine, isDone && { backgroundColor: primaryColor }]} />
                        )}
                    </View>
                )
            })}
        </View>
    )
}

const FloatingInput = ({
    label,
    value,
    onChangeText,
    keyboardType,
    error,
    editable = true,
    isPhone = false,
    phoneNumber,
    countryCode,
    onPhoneChange,
    onCountryChange,
}) => {
    const [focused, setFocused] = useState(false)
    const hasValue = isPhone
        ? !!(phoneNumber && phoneNumber.length > 0)
        : !!(value && value.length > 0)
    const showLabel = focused || hasValue

    return (
        <View style={styles.inputWrapper}>
            <View
                style={[
                    !isPhone && styles.inputContainer,
                    !isPhone && focused && editable && styles.inputContainerFocused,
                    !!error && styles.inputContainerError,
                    !isPhone && !editable && styles.inputContainerDisabled,
                    isPhone && styles.inputContainerPhone,
                ]}
            >
                {isPhone ? (
                    <>
                        <Text
                            style={[
                                styles.floatingLabel,
                                styles.floatingLabelUp,
                                !!error && styles.floatingLabelError,
                            ]}
                        >
                            {label}
                        </Text>
                        <View style={[styles.phonePickerWrapper, !editable && styles.phonePickerDisabled]}>
                            <MyCountryPiker
                                defaultCountry={countryCode || 'IN'}
                                favorites={['IN', 'NL', 'SR']}
                                key={countryCode}
                                onSelect={(country) => {
                                    onCountryChange && onCountryChange(country?.countrycode || country?.cca2 || '')
                                    onPhoneChange && onPhoneChange('')
                                }}
                                showFlag={true}
                                setValue={(val) => onPhoneChange && onPhoneChange(val?.replace(/\s+/g, '') || '')}
                                value={phoneNumber?.replace(' ', '')}
                                showCallingCode={true}
                                showPhoneInput={true}
                                disbled={!editable}
                                FontFamily={FONTS.LexendMedium}
                                ContainerStyle={{ backgroundColor: Colors.litegray1 }}
                                disabled={!editable}
                            />
                        </View>
                    </>
                ) : (
                    <>
                        <Text
                            style={[
                                styles.floatingLabel,
                                showLabel && styles.floatingLabelUp,
                                focused && editable && styles.floatingLabelFocused,
                                !!error && styles.floatingLabelError,
                            ]}
                        >
                            {label}
                        </Text>
                        <TextInput
                            style={[
                                styles.textInput,
                                showLabel && styles.textInputShifted,
                                !editable && styles.textInputDisabled,
                            ]}
                            value={value}
                            onChangeText={editable ? onChangeText : undefined}
                            onFocus={() => editable && setFocused(true)}
                            onBlur={() => setFocused(false)}
                            keyboardType={keyboardType || 'default'}
                            placeholderTextColor={Colors.textgray}
                            autoCapitalize="none"
                            editable={editable}
                            selectTextOnFocus={editable}
                        />
                    </>
                )}
            </View>
            {!!error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    )
}

const TaxiBookPaymentModal = ({
    visible,
    onClose,
    onUpdate,
    onSavePayment,
    modalTitle,
    step1Title,
    step2Title,
    relaties,
    payment_methodData,
    defaultCurrency,
    AllCurrencyData,
    nextLabel,
    backLabel,
    headerColor,
    isLoading = false,
}) => {
    const { t } = useTranslation()
    const primaryColor = headerColor || Colors.primary

    const [currentStep, setCurrentStep] = useState(1)
    const [isEditable, setIsEditable] = useState(false)
    const [errors, setErrors] = useState({})
    const [selectedPayment, setSelectedPayment] = useState(null)
    const [selectedCurrency, setSelectedCurrency] = useState(null)
    const [price, setPrice] = useState('')

    const [formData, setFormData] = useState({
        display_name: '',
        mobiel: '',
        email_adres: '',
        country_code: '',
        google_maps: '',
    })

    useEffect(() => {
        if (relaties) {
            setFormData({
                display_name: relaties.display_name || '',
                mobiel: relaties.mobiel || '',
                email_adres: relaties.email_adres || '',
                google_maps: relaties.google_maps || '',
                country_code: relaties.country_code || '',
            })
            if (relaties.price !== undefined && relaties.price !== null) {
                setPrice(String(relaties.price))
            }
        }
    }, [relaties])

    useEffect(() => {
        if (!visible) {
            setCurrentStep(1)
            setIsEditable(false)
            setErrors({})
            setSelectedPayment(payment_methodData[0])
            if(defaultCurrency){
                setSelectedCurrency(defaultCurrency);
            }else{
                setSelectedCurrency(null);
            }
            setPrice('')
        }
    }, [visible])

    const handleFormChange = useCallback((key, val) => {
        setFormData(prev => ({ ...prev, [key]: val }))
        setErrors(prev => ({ ...prev, [key]: null }))
    }, [])

    const validateStep1 = () => {
        if (!isEditable) return true
        const newErrors = {}
        if (!formData.display_name?.trim()) newErrors.display_name = t('fieldRequired', 'This field is required')
        if (!formData.mobiel?.trim()) newErrors.mobiel = t('fieldRequired', 'This field is required')
        if (!formData.email_adres?.trim()) newErrors.email_adres = t('fieldRequired', 'This field is required')
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const validateStep2 = () => {
        const newErrors = {}
        if (!selectedPayment) newErrors.payment = t('fieldRequired', 'This field is required')
        if (!selectedCurrency) newErrors.currency = t('fieldRequired', 'This field is required')
        const parsedPrice = parseFloat(price)
        if (!price?.trim() || isNaN(parsedPrice) || parsedPrice <= 0) {
            newErrors.price = t('priceRequired', 'Please enter a valid price greater than 0')
        }
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleNext = () => {
        if (!validateStep1()) return
        if (isEditable && onUpdate) {
            onUpdate({
                id: relaties?.id,
                display_name: formData.display_name,
                mobiel: formData.mobiel,
                email_adres: formData.email_adres,
                google_maps: formData.google_maps,
                country_code: formData.country_code,
            })
        }
        setCurrentStep(2)
    }

    const handleBack = () => {
        setCurrentStep(1)
        setErrors({})
    }

    const handleSavePayment = () => {
        if (isLoading) return
        if (!validateStep2()) return
        onSavePayment && onSavePayment({
            id: relaties?.id,
            display_name: formData.display_name,
            mobiel: formData.mobiel,
            email_adres: formData.email_adres,
            google_maps: formData.google_maps,
            country_code: formData.country_code,
            payment: selectedPayment,
            currency: selectedCurrency,
            price: parseFloat(price),
        })
    }

    const handleClose = () => {
        if (isLoading) return
        onClose && onClose()
    }

  const dropdownData = (payment_methodData || [])
  .filter(Boolean)
  .map((item) => {
    const key = String(item).toLowerCase().replace(/\s+/g, '_')

    return {
      label: t(key, String(item)),
      value: String(item),
    }
  })




    const step2IsValid = selectedPayment && selectedCurrency && price?.trim() && parseFloat(price) > 0

    return (
        <Modal
            isVisible={visible}
            onBackdropPress={handleClose}
            onBackButtonPress={handleClose}
            style={styles.modal}
            avoidKeyboard={false}
            propagateSwipe
            useNativeDriverForBackdrop
            animationIn="slideInUp"
            animationOut="slideOutDown"
            animationInTiming={340}
            animationOutTiming={260}
            backdropOpacity={0.45}
        >
            <View style={styles.sheet}>
                <View style={[styles.modalHeader, { backgroundColor: primaryColor }]}>
                    <View style={styles.headerDragBar} />
                    <Text style={styles.modalTitle}>
                        {modalTitle || t('paymentDetails', 'Payment Details')}
                    </Text>
                    <TouchableOpacity
                        style={styles.closeBtn}
                        onPress={handleClose}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Text style={styles.closeBtnText}>✕</Text>
                    </TouchableOpacity>
                </View>

                <StepIndicator currentStep={currentStep} primaryColor={primaryColor} />

                <KeyboardAwareScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    enableOnAndroid
                    enableAutomaticScroll
                    extraScrollHeight={Platform.OS === 'ios' ? 20 : 60}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                >
                    {currentStep === 1 && (
                        <View style={styles.stepContent}>
                            <View style={styles.step1Header}>
                                {!!step1Title && (
                                    <Text style={styles.stepHeading}>{step1Title}</Text>
                                )}
                                <View style={styles.editToggleRow}>
                                    <Text style={styles.editToggleLabel}>
                                        {t('editDetails', 'Edit Details')}
                                    </Text>
                                    <Switch
                                        value={isEditable}
                                        onValueChange={val => {
                                            setIsEditable(val)
                                            setErrors({})
                                        }}
                                        trackColor={{ false: Colors.Boxgray, true: primaryColor + '66' }}
                                        thumbColor={isEditable ? primaryColor : Colors.litegray1}
                                        ios_backgroundColor={Colors.Boxgray}
                                    />
                                </View>
                            </View>

                            <FloatingInput
                                label={t('fullName', 'Full Name')}
                                value={formData.display_name || ''}
                                onChangeText={val => handleFormChange('display_name', val)}
                                keyboardType="default"
                                error={errors.display_name}
                                editable={isEditable}
                            />

                            <FloatingInput
                                label={t('phoneNumber', 'Phone Number')}
                                isPhone={true}
                                phoneNumber={formData.mobiel || ''}
                                countryCode={formData.country_code || 'IN'}
                                onPhoneChange={val => handleFormChange('mobiel', val)}
                                onCountryChange={val => handleFormChange('country_code', val)}
                                error={errors.mobiel}
                                editable={isEditable}
                            />

                            <FloatingInput
                                label={t('email', 'Email')}
                                value={formData.email_adres || ''}
                                onChangeText={val => handleFormChange('email_adres', val)}
                                keyboardType="email-address"
                                error={errors.email_adres}
                                editable={isEditable}
                            />

                            <FloatingInput
                                label={t('address', 'Address')}
                                value={formData.google_maps || ''}
                                onChangeText={val => handleFormChange('google_maps', val)}
                                keyboardType="default"
                                error={errors.google_maps}
                                editable={isEditable}
                            />
                        </View>
                    )}

                    {currentStep === 2 && (
                        <View style={styles.stepContent}>
                            {!!step2Title && (
                                <Text style={styles.stepHeading}>{step2Title}</Text>
                            )}

                            <View style={styles.dropdownWrapper}>
                                <Dropdown
                                    style={[
                                        styles.dropdown,
                                        !!errors.payment && styles.dropdownError,
                                        !!selectedPayment && styles.dropdownSelected,
                                    ]}
                                    placeholderStyle={styles.dropdownPlaceholder}
                                    selectedTextStyle={styles.dropdownSelectedText}
                                    itemTextStyle={styles.dropdownItemText}
                                    disable={true}
                                    containerStyle={styles.dropdownContainer}
                                    activeColor={Colors.primaryopacity}
                                    dropdownPosition="top"
                                    data={dropdownData}
                                    labelField="label"
                                    valueField="value"
                                    placeholder={t('selectPaymentMethod', 'Select Payment Method')}
                                    value={selectedPayment}
                                    onChange={item => {
                                        setSelectedPayment(item.value)
                                        setErrors(prev => ({ ...prev, payment: null }))
                                    }}
                                    inputSearchStyle={styles.dropdownSearch}
                                />
                                {!!errors.payment && (
                                    <Text style={styles.errorText}>{errors.payment}</Text>
                                )}
                            </View>

                            <View style={styles.dropdownWrapper}>
                                <Dropdown
                                    style={[
                                        styles.dropdown,
                                        !!errors.currency && styles.dropdownError,
                                        !!selectedCurrency && styles.dropdownSelected,
                                    ]}
                                    placeholderStyle={styles.dropdownPlaceholder}
                                    selectedTextStyle={styles.dropdownSelectedText}
                                    itemTextStyle={styles.dropdownItemText}
                                    containerStyle={styles.dropdownContainer}
                                    activeColor={Colors.primaryopacity}
                                    dropdownPosition="top"
                                    data={AllCurrencyData}
                                    labelField="symbol"
                                    valueField="symbol"
                                    placeholder={t('selectCurrency', 'Select Currency')}
                                    value={selectedCurrency ? selectedCurrency : t("select Currency")}
                                    onChange={item => {
                                        setSelectedCurrency(item);
                                        setPrice('');
                                        setErrors(prev => ({ ...prev, currency: null }))
                                    }}
                                    inputSearchStyle={styles.dropdownSearch}
                                    search
                                    searchPlaceholder={t('searchCurrency', 'Search currency...')}
                                />
                                {!!errors.currency && (
                                    <Text style={styles.errorText}>{errors.currency}</Text>
                                )}
                            </View>

                            <FloatingInput
                                label={t('price', 'Price')}
                                value={price}
                                onChangeText={val => {
                                    setPrice(val)
                                    setErrors(prev => ({ ...prev, price: null }))
                                }}
                                keyboardType="decimal-pad"
                                error={errors.price}
                                editable={true}
                            />
                        </View>
                    )}

                    <View style={styles.actionRow}>
                        {currentStep === 2 && (
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={handleBack}
                                activeOpacity={0.75}
                                disabled={isLoading}
                            >
                                <Text style={styles.backButtonText}>
                                    {backLabel || t('back', 'Back')}
                                </Text>
                            </TouchableOpacity>
                        )}

                        {currentStep === 1 && (
                            <TouchableOpacity
                                style={[
                                    styles.primaryButton,
                                    { backgroundColor: isLoading ? Colors.Boxgray : primaryColor },
                                ]}
                                onPress={isLoading ? undefined : handleNext}
                                activeOpacity={isLoading ? 1 : 0.8}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator size="small" color={Colors.white} />
                                ) : (
                                    <Text style={styles.primaryButtonText}>
                                        {isEditable
                                            ? t('update', 'Update')
                                            : (nextLabel || t('next', 'Next'))}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        )}

                        {currentStep === 2 && (
                            <TouchableOpacity
                                style={[
                                    styles.primaryButton,
                                    styles.primaryButtonFlex,
                                    {
                                        backgroundColor: isLoading || !step2IsValid
                                            ? Colors.Boxgray
                                            : primaryColor,
                                    },
                                ]}
                                onPress={handleSavePayment}
                                activeOpacity={step2IsValid && !isLoading ? 0.8 : 1}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator size="small" color={Colors.white} />
                                ) : (
                                    <Text style={styles.primaryButtonText}>
                                        {t('savePayment', 'Save Payment')}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>
                </KeyboardAwareScrollView>
            </View>
        </Modal>
    )
}

export default TaxiBookPaymentModal

const styles = StyleSheet.create({
    modal: {
        justifyContent: 'flex-end',
        margin: 0,
    },
    sheet: {
        backgroundColor: Colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        minHeight: '45%',
        maxHeight: height * 0.88,
        overflow: 'hidden',
    },
    modalHeader: {
        paddingTop: 10,
        paddingBottom: 16,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerDragBar: {
        position: 'absolute',
        top: 8,
        alignSelf: 'center',
        width: 38,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.35)',
        left: width / 2 - 19,
    },
    modalTitle: {
        fontSize: 16,
        fontFamily: FONTS.LexendBold,
        color: Colors.white,
        letterSpacing: 0.3,
        flex: 1,
        marginTop: 6,
    },
    closeBtn: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 6,
    },
    closeBtnText: {
        color: Colors.white,
        fontSize: 13,
        fontFamily: FONTS.LexendSemiBold,
    },
    stepIndicatorWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        backgroundColor: Colors.litegray1,
        borderBottomWidth: 1,
        borderBottomColor: Colors.litegray,
    },
    stepItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stepCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: Colors.litegray,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: Colors.Boxgray,
    },
    stepCircleActive: {
        backgroundColor: Colors.primaryopacity,
    },
    stepNumber: {
        fontSize: 13,
        fontFamily: FONTS.LexendSemiBold,
        color: Colors.textgray,
    },
    stepCheckmark: {
        fontSize: 13,
        color: Colors.white,
        fontFamily: FONTS.LexendBold,
    },
    stepLabel: {
        fontSize: 11,
        color: Colors.textgray,
        fontFamily: FONTS.LexendMedium,
        marginLeft: 6,
    },
    stepLabelActive: {
        fontFamily: FONTS.LexendBold,
    },
    stepLine: {
        width: 36,
        height: 2,
        backgroundColor: Colors.Boxgray,
        marginHorizontal: 6,
        borderRadius: 1,
    },
    scrollView: {
        flexGrow: 0,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 32,
    },
    stepContent: {
        marginBottom: 8,
    },
    step1Header: {
        marginBottom: 16,
    },
    stepHeading: {
        fontSize: 15,
        fontFamily: FONTS.LexendBold,
        color: Colors.black,
        marginBottom: 10,
        letterSpacing: 0.2,
    },
    editToggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.litegray1,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: Colors.litegray,
    },
    editToggleLabel: {
        fontSize: 13,
        fontFamily: FONTS.LexendSemiBold,
        color: Colors.textgray,
    },
    inputWrapper: {
        marginBottom: 14,
    },
    inputContainer: {
        borderWidth: 1.2,
        borderColor: Colors.Boxgray,
        borderRadius: 12,
        backgroundColor: Colors.litegray1,
        paddingHorizontal: 14,
        paddingTop: 8,
        paddingBottom: 8,
        minHeight: 58,
        justifyContent: 'center',
    },
    inputContainerPhone: {
        paddingHorizontal: 0,
        paddingTop: 0,
        paddingBottom: 0,
        overflow: 'hidden',
    },
    inputContainerFocused: {
        borderColor: Colors.primary,
        backgroundColor: Colors.white,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 2,
    },
    inputContainerError: {
        borderColor: Colors.red,
        backgroundColor: Colors.diclinelite,
    },
    inputContainerDisabled: {
        backgroundColor: Colors.litegray2,
        borderColor: Colors.litegray,
    },
    floatingLabel: {
        position: 'absolute',
        left: 14,
        top: 18,
        fontSize: 14,
        color: Colors.textgray,
        fontFamily: FONTS.LexendRegular,
        zIndex: 1,
    },
    floatingLabelUp: {
        top: 8,
        fontSize: 10,
        fontFamily: FONTS.LexendSemiBold,
        letterSpacing: 0.4,
        color: Colors.gray,
    },
    floatingLabelFocused: {
        color: Colors.primary,
    },
    floatingLabelError: {
        color: Colors.red,
    },
    textInput: {
        fontSize: 14,
        color: Colors.black,
        fontFamily: FONTS.LexendMedium,
        paddingTop: 0,
        paddingBottom: 0,
        margin: 0,
        height: 36,
    },
    textInputShifted: {
        paddingTop: 14,
        height: 42,
    },
    textInputDisabled: {
        color: Colors.textgray,
    },
    phonePickerWrapper: {
        paddingTop: 20,
    },
    phonePickerDisabled: {
        opacity: 0.55,
        pointerEvents: 'none',
    },
    errorText: {
        fontSize: 11,
        color: Colors.red,
        marginTop: 4,
        marginLeft: 4,
        fontFamily: FONTS.LexendMedium,
    },
    requiredStar: {
        color: Colors.red,
    },
    dropdownWrapper: {
        marginBottom: 16,
    },
    dropdownLabel: {
        fontSize: 12,
        color: Colors.textgray,
        fontFamily: FONTS.LexendSemiBold,
        marginBottom: 6,
        letterSpacing: 0.3,
    },
    dropdown: {
        borderWidth: 1.2,
        borderColor: Colors.Boxgray,
        borderRadius: 4,
        paddingHorizontal: 14,
        paddingVertical: 12,
        backgroundColor: Colors.litegray1,
        minHeight: 52,
    },
    dropdownSelected: {
        borderColor: Colors.primary,
        backgroundColor: Colors.white,
    },
    dropdownError: {
        borderColor: Colors.red,
        backgroundColor: Colors.diclinelite,
    },
    dropdownPlaceholder: {
        fontSize: 14,
        color: Colors.textgray,
        fontFamily: FONTS.LexendRegular,
    },
    dropdownSelectedText: {
        fontSize: 14,
        color: Colors.black,
        fontFamily: FONTS.LexendMedium,
    },
    dropdownItemText: {
        fontSize: 14,
        color: Colors.black,
        fontFamily: FONTS.LexendRegular,
    },
    dropdownContainer: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.litegray,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 6,
        overflow: 'hidden',
    },
    dropdownSearch: {
        borderRadius: 8,
        borderColor: Colors.Boxgray,
        fontSize: 13,
        color: Colors.black,
        fontFamily: FONTS.LexendRegular,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 10,
    },
    backButton: {
        flex: 1,
        borderWidth: 1.5,
        borderColor: Colors.Boxgray,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.litegray1,
    },
    backButtonText: {
        fontSize: 15,
        fontFamily: FONTS.LexendSemiBold,
        color: Colors.textgray,
    },
    primaryButton: {
        flex: 2,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.22,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryButtonFlex: {
        flex: 2,
    },
    primaryButtonText: {
        fontSize: 15,
        fontFamily: FONTS.LexendBold,
        color: Colors.white,
        letterSpacing: 0.3,
    },
})