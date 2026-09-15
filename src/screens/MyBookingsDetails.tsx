import React, { useMemo, useCallback } from 'react'
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Dimensions,
    Image,
    TouchableOpacity,
    Linking,
    Platform,
    Alert,
} from 'react-native'
import { useRoute } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { Colors } from '../constants/color'
import { FONTS } from '../constants/fontFamily'
import { RFValue } from 'react-native-responsive-fontsize'
import BlueHeader from '../components/BlueHeader'

const { width } = Dimensions.get('window')

const getInitials = (name = '') => {
    const parts = name.trim().split(' ').filter(Boolean)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return '??'
}

const formatDate = (dateStr = '') => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const formatTime = (timeStr = '') => {
    if (!timeStr) return '-'
    const [h, m] = timeStr.split(':')
    const hour = parseInt(h, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const h12 = hour % 12 || 12
    return `${h12}:${m} ${ampm}`
}

const formatDateTime = (dtStr = '') => {
    if (!dtStr) return '-'
    const d = new Date(dtStr)
    return (
        d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
        '  ' +
        d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    )
}

const capitalize = (str = '') =>
    str ? str.charAt(0).toUpperCase() + str.slice(1) : '-'

const getPaymentStatusStyle = (status = '') => {
    switch (status.toLowerCase()) {
        case 'paid': return { bg: Colors.litegreen, text: Colors.orignalGreen }
        case 'expired': return { bg: Colors.diclinelite, text: '#A32D2D' }
        case 'pending': return { bg: Colors.invoicelite, text: '#856404' }
        case 'failed': return { bg: Colors.neworderlite, text: Colors.neworder }
        default: return { bg: Colors.litegray1, text: Colors.textgray }
    }
}

const safeOpenURL = async (url: string): Promise<boolean> => {
    try {
        const supported = await Linking.canOpenURL(url)
        if (supported) {
            await Linking.openURL(url)
            return true
        }
        return false
    } catch {
        return false
    }
}

const openWhatsApp = async (phoneRaw: string): Promise<void> => {
    if (!phoneRaw?.trim()) return
    const digitsOnly = phoneRaw.replace(/\D/g, '')
    if (!digitsOnly) return

    const opened = await safeOpenURL(`whatsapp://send?phone=${digitsOnly}`)
    if (!opened) {
        const webOpened = await safeOpenURL(`https://wa.me/${digitsOnly}`)
        if (!webOpened) {
            Alert.alert('WhatsApp Not Available', 'WhatsApp is not installed on your device.')
        }
    }
}

const openEmail = async (email: string): Promise<void> => {
    if (!email?.trim()) return
    const trimmed = email.trim()
    const opened = await safeOpenURL(`mailto:${trimmed}`)
    if (!opened) {
        Alert.alert('Email Not Available', 'No email app found on your device.')
    }
}

const openMaps = async (address: string): Promise<void> => {
    if (!address?.trim()) return
    const encoded = encodeURIComponent(address.trim())

    if (Platform.OS === 'ios') {
        const appleMapsOpened = await safeOpenURL(`maps:0,0?q=${encoded}`)
        if (!appleMapsOpened) {
            const googleOpened = await safeOpenURL(`comgooglemaps://?q=${encoded}`)
            if (!googleOpened) {
                await safeOpenURL(`https://maps.google.com/?q=${encoded}`)
            }
        }
    } else {
        const geoOpened = await safeOpenURL(`geo:0,0?q=${encoded}`)
        if (!geoOpened) {
            const googleOpened = await safeOpenURL(`https://maps.google.com/?q=${encoded}`)
            if (!googleOpened) {
                Alert.alert('Maps Not Available', 'No maps app could be opened on your device.')
            }
        }
    }
}

type InfoRowProps = {
    label: string
    value?: string
    valueColor?: string
    noDivider?: boolean
    onPress?: () => void
}

const InfoRow = ({
    label,
    value,
    valueColor,
    noDivider = false,
    onPress,
}: InfoRowProps) => {
    const isPressable = typeof onPress === 'function' && !!value && value !== '-'
    return (
        <View>
            <TouchableOpacity
                style={styles.infoRow}
                onPress={isPressable ? onPress : undefined}
                disabled={!isPressable}
                activeOpacity={isPressable ? 0.55 : 1}
            >
                <Text style={styles.infoLabel}>{label}</Text>
                <Text
                    style={[
                        styles.infoValue,
                        valueColor ? { color: valueColor } : {},
                        isPressable ? styles.pressableValue : {},
                    ]}
                    numberOfLines={2}
                >
                    {value || '-'}
                </Text>
            </TouchableOpacity>
            {!noDivider && <View style={styles.divider} />}
        </View>
    )
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {children}
    </View>
)

const StatCard = ({
    label,
    value,
    primary,
    children,
}: {
    label: string
    value?: string
    primary?: boolean
    children?: React.ReactNode
}) => (
    <View style={styles.statCard}>
        <Text style={styles.statLabel}>{label}</Text>
        {children ?? (
            <Text
                style={[styles.statValue, primary ? { color: Colors.primary } : {}]}
                numberOfLines={1}
            >
                {value}
            </Text>
        )}
    </View>
)

export default function MyBookingsDetails() {
    const { t } = useTranslation()
    const route = useRoute<any>()
    const item = route?.params?.item ?? {}
    const bgcolor = route?.params?.bgcolor ?? {}

    const booking = item?.booking_details ?? {}
    const order = item?.order_details ?? {}
    const relaties = item?.relaties_details ?? {}

    const cartData = useMemo(() => {
        try {
            const parsed = JSON.parse(order.cart_data || '[]')
            return Array.isArray(parsed) ? (parsed[0] ?? null) : null
        } catch {
            return null
        }
    }, [order.cart_data])

    const initials = getInitials(relaties.display_name)
    const paymentStyle = getPaymentStatusStyle(order.payment_status || '')
    const fullName = `${order.first_name || ''} ${order.last_name || ''}`.trim() || '-'

    const phone = (order.country_code && order.phone_number)
        ? `+${order.country_code} ${order.phone_number}`
        : ''

    const relatiePhone = (relaties.country_code && relaties.mobiel)
        ? `+${relaties.country_code} ${relaties.mobiel}`
        : '-'

    const handlePhone = useCallback(() => openWhatsApp(phone), [phone])
    const handleEmail = useCallback(() => openEmail(order?.email), [order?.email])
    const handleBilling = useCallback(() => openMaps(order?.full_address), [order?.full_address])
    const handleShipping = useCallback(() => openMaps(order?.shipping_address), [order?.shipping_address])

    const hasShipping =
        !!order.shipping_address &&
        order.shipping_address !== order.full_address

    return (
        <View style={styles.root}>
            <BlueHeader
                title={t("Booking Details")}
                bgcolor={bgcolor ? bgcolor : "#006400"} Righticon={undefined} onPressRight={undefined} onPressfilter={undefined} value={undefined} arrowOnPress={undefined} onChangeText={undefined} SearchBarInput={undefined} style={undefined} logoshow={undefined} sort={undefined} goback={undefined}            />

            <ScrollView
                style={styles.root}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
            >
                <View style={styles.card}>

                    <View style={[styles.header,{backgroundColor:bgcolor || Colors.primary}]}>
                        <View style={styles.avatarCircle}>
                            <Text style={styles.avatarText}>{initials}</Text>
                        </View>
                        <View style={styles.headerInfo}>
                            <Text style={styles.headerName} numberOfLines={1}>
                                {relaties?.display_name || '-'}
                            </Text>
                            <Text style={styles.headerSub} numberOfLines={1}>
                                {relaties?.email_adres || '-'}  ·  {relatiePhone}
                            </Text>
                        </View>
                        <View style={styles.roleBadge}>
                            <Text style={styles.roleBadgeText}>
                                {relaties?.soort_relatie || t('Staff')}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.statsGrid}>
                        <StatCard label={t('BookingDate')} value={formatDate(booking?.date)} primary />
                        <StatCard label={t('TimeSlot')} value={formatTime(booking?.time_slot)} />
                        <StatCard label={t('TotalAmount')} value={`€${order?.total_price || '0.00'}`} primary />
                        <StatCard label={t('Payment')}>
                            <View style={[styles.payBadge, { backgroundColor: paymentStyle.bg }]}>
                                <View style={[styles.payDot, { backgroundColor: paymentStyle.text }]} />
                                <Text style={[styles.payText, { color: paymentStyle.text }]}>
                                    {capitalize(order.payment_status)}
                                </Text>
                            </View>
                        </StatCard>
                    </View>

                    {cartData && (
                        <Section title={t('ServiceBooked')}>
                            <View style={styles.serviceRow}>
                                <View style={styles.serviceImgBox}>
                                    {cartData.cart_img ? (
                                        <Image
                                            source={{ uri: cartData?.cart_img }}
                                            style={styles.serviceImg}
                                            resizeMode="cover"
                                        />
                                    ) : (
                                        <View style={styles.serviceImgPlaceholder} />
                                    )}
                                </View>
                                <View style={styles.serviceInfo}>
                                    <Text style={styles.serviceName} numberOfLines={1}>
                                        {cartData?.product_name || '-'}
                                    </Text>
                                    <Text style={styles.serviceSub}>
                                        {t('Qty')}: {cartData?.qty || 1} {cartData?.qty_type || 'stuk'}
                                        {'  ·  '}
                                        {t('Branch')} #{cartData?.product_branch_id}
                                    </Text>
                                    <Text style={styles.serviceSub}>
                                        {formatDate(cartData?.product_service_date)}
                                        {'  ·  '}
                                        {cartData?.product_time_slot || '-'}
                                    </Text>
                                </View>
                                <Text style={styles.servicePrice}>
                                    {cartData?.currency || '€'}{cartData?.product_price}
                                </Text>
                            </View>
                        </Section>
                    )}

                    <Section title={t('CustomerDetails')}>
                        <InfoRow
                            label={t('Name')}
                            value={fullName}
                        />
                        <InfoRow
                            label={t('Email')}
                            value={order?.email}
                            valueColor={order?.email ? Colors.primary : undefined}
                            onPress={handleEmail}
                        />
                        <InfoRow
                            label={t('Phone')}
                            value={phone || '-'}
                            valueColor={phone ? Colors.primary : undefined}
                            onPress={phone ? handlePhone : undefined}
                            noDivider
                        />
                    </Section>

                    <Section title={t('Address')}>
                        <InfoRow
                            label={t('BillingAddress')}
                            value={order.full_address}
                            valueColor={order?.full_address ? Colors.primary : undefined}
                            onPress={handleBilling}
                            noDivider={!hasShipping}
                        />
                        {hasShipping && (
                            <InfoRow
                                label={t('ShippingAddress')}
                                value={order?.shipping_address}
                                valueColor={Colors.primary}
                                onPress={handleShipping}
                                noDivider
                            />
                        )}
                    </Section>

                    <Section title={t('OrderInfo')}>
                        <InfoRow label={t('BookingId')} value={`#${booking?.id}`} />
                        <InfoRow label={t('PaymentVia')} value={capitalize(order.payment_type)} />
                        <InfoRow
                            label={t('MollieId')}
                            value={order?.mollie_payment_id}
                            valueColor={Colors.primary}
                        />
                        <InfoRow
                            label={t('ShippingCost')}
                            value={`€${order?.shipping_cost || '0.00'}`}
                        />
                        <InfoRow
                            label={t('CreatedAt')}
                            value={formatDateTime(order?.created_at)}
                            noDivider
                        />
                    </Section>

                </View>
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: Colors.Boxgray,
    },
    content: {
        paddingHorizontal: 14,
        paddingVertical: 16,
        paddingBottom: 36,
    },
    card: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 0.5,
        borderColor: Colors.Boxgray,
        elevation: 3,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
    },
    header: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatarCircle: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.4)',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    avatarText: {
        fontSize: RFValue(13),
        fontFamily: FONTS.LexendSemiBold,
        color: Colors.white,
    },
    headerInfo: {
        flex: 1,
        minWidth: 0,
    },
    headerName: {
        fontSize: RFValue(14),
        fontFamily: FONTS.LexendSemiBold,
        color: Colors.white,
    },
    headerSub: {
        fontSize: RFValue(10),
        fontFamily: FONTS.LexendRegular,
        color: 'rgba(255,255,255,0.75)',
        marginTop: 2,
    },
    roleBadge: {
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
        flexShrink: 0,
    },
    roleBadgeText: {
        fontSize: RFValue(10),
        fontFamily: FONTS.LexendMedium,
        color: Colors.white,
        textTransform: 'capitalize',
    },
    statsGrid: {
        width:"100%",
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 12,
        gap: 8,
        borderBottomWidth: 0.5,
        borderBottomColor: Colors.Boxgray,
    },
    statCard: {
        width: "48%",
        backgroundColor: Colors.litegray1,
        borderRadius: 10,
        padding: 10,
        minHeight: 58,
        justifyContent: 'space-between',
    },
    statLabel: {
        fontSize: RFValue(9),
        fontFamily: FONTS.LexendRegular,
        color: Colors.textgray,
        marginBottom: 4,
    },
    statValue: {
        fontSize: RFValue(12),
        fontFamily: FONTS.LexendSemiBold,
        color: Colors.black,
    },
    payBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 20,
        paddingHorizontal: 8,
        paddingVertical: 3,
        alignSelf: 'flex-start',
        gap: 4,
    },
    payDot: {
        width: 5,
        height: 5,
        borderRadius: 3,
    },
    payText: {
        fontSize: RFValue(10),
        fontFamily: FONTS.LexendMedium,
    },
    section: {
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 6,
        borderTopWidth: 0.5,
        borderTopColor: Colors.Boxgray,
    },
    sectionTitle: {
        fontSize: RFValue(9),
        fontFamily: FONTS.LexendSemiBold,
        color: Colors.textgray,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 10,
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: Colors.Boxgray,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 9,
    },
    infoLabel: {
        fontSize: RFValue(11),
        fontFamily: FONTS.LexendRegular,
        color: Colors.textgray,
        flex: 1,
    },
    infoValue: {
        fontSize: RFValue(11),
        fontFamily: FONTS.LexendMedium,
        color: Colors.black,
        textAlign: 'right',
        maxWidth: width * 0.5,
    },
    pressableValue: {
        textDecorationLine: 'underline',
    },
    serviceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingBottom: 10,
    },
    serviceImgBox: {
        width: 48,
        height: 48,
        borderRadius: 10,
        backgroundColor: Colors.litegray1,
        overflow: 'hidden',
        flexShrink: 0,
    },
    serviceImg: {
        width: 48,
        height: 48,
    },
    serviceImgPlaceholder: {
        flex: 1,
        backgroundColor: Colors.litegray1,
    },
    serviceInfo: {
        flex: 1,
        minWidth: 0,
    },
    serviceName: {
        fontSize: RFValue(12),
        fontFamily: FONTS.LexendSemiBold,
        color: Colors.black,
    },
    serviceSub: {
        fontSize: RFValue(10),
        fontFamily: FONTS.LexendRegular,
        color: Colors.textgray,
        marginTop: 2,
    },
    servicePrice: {
        fontSize: RFValue(15),
        fontFamily: FONTS.LexendSemiBold,
        color: Colors.primary,
        flexShrink: 0,
    },
})