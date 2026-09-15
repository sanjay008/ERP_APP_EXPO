import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Colors } from '../constants/color'
import { FONTS } from '../constants/fontFamily'

const CashIcon = () => (
    <View style={styles.methodIconBox}>
        <Text style={styles.methodIconText}>💵</Text>
    </View>
)

const CardIcon = () => (
    <View style={styles.methodIconBox}>
        <Text style={styles.methodIconText}>💳</Text>
    </View>
)

const DefaultIcon = () => (
    <View style={styles.methodIconBox}>
        <Text style={styles.methodIconText}>🧾</Text>
    </View>
)

const getMethodIcon = (method) => {
    const m = (method || '').toLowerCase()
    if (m.includes('cash')) return <CashIcon />
    if (m.includes('card')) return <CardIcon />
    return <DefaultIcon />
}

const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }) + ' · ' + d.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
    })
}

const PaymentCard = ({ el, client_person_info }) => (
    <View style={styles.card}>
        <View style={styles.cardTop}>
            <View style={styles.leftRow}>
                <View style={styles.currencyBadge}>
                    <Text style={styles.currencyBadgeText}>{el?.currency}</Text>
                </View>
                <View>
                    <Text style={styles.amountText}>
                        {el?.currency}{' '}
                        {parseFloat(el?.amount || 0).toLocaleString('en', {
                            minimumFractionDigits: 2,
                        })}
                    </Text>
                    <Text style={styles.bookingText}>Booking #{el?.booking_id}</Text>
                </View>
            </View>
            <View style={styles.paidBadge}>
                <Text style={styles.paidBadgeText}>Paid</Text>
            </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment method</Text>
            <View style={styles.methodRow}>
                {getMethodIcon(el?.payment_method)}
                <Text style={styles.detailValue}>{el?.payment_method}</Text>
            </View>
        </View>

        <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Record ID</Text>
            <Text style={[styles.detailValue, styles.monoText]}>#{el?.id}</Text>
        </View>

        <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.dateText}>{formatDate(el?.created_at)}</Text>
        </View>
        <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Phone</Text>
            <Text style={styles.dateText}>
                {client_person_info?.mobiel
                    ? (String(client_person_info.mobiel).startsWith('+')
                        ? String(client_person_info.mobiel)
                        : `+${client_person_info?.country_code || ''}${client_person_info.mobiel}`)
                    : '—'}
            </Text>
        </View>

        <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email</Text>
            <Text style={styles.dateText}>
                {client_person_info?.email_adres || '—'}
            </Text>
        </View>
        <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Pay</Text>
            <Text style={styles.dateText}>
                {el?.user?.relaties?.display_name || '—'}
            </Text>
        </View>
    </View>
)

const TaxiPaymentDetailsCard = ({ item, client_person_info }) => {
    if (!item) return null

    return <PaymentCard el={item} client_person_info={client_person_info} />
}

export default TaxiPaymentDetailsCard

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.litegray,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 12,
    },
    cardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    leftRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    currencyBadge: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: Colors.primaryopacity,
        alignItems: 'center',
        justifyContent: 'center',
    },
    currencyBadgeText: {
        fontSize: 11,
        fontFamily: FONTS.LexendBold,
        color: Colors.primary,
        letterSpacing: 0.3,
    },
    amountText: {
        fontSize: 15,
        fontFamily: FONTS.LexendBold,
        color: Colors.black,
        letterSpacing: 0.2,
    },
    bookingText: {
        fontSize: 12,
        fontFamily: FONTS.LexendRegular,
        color: Colors.textgray,
        marginTop: 1,
    },
    paidBadge: {
        backgroundColor: '#EAF6EF',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderWidth: 0.5,
        borderColor: '#B2DFC5',
    },
    paidBadgeText: {
        fontSize: 11,
        fontFamily: FONTS.LexendSemiBold,
        color: '#1B8A4A',
        letterSpacing: 0.3,
    },
    divider: {
        height: 0.5,
        backgroundColor: Colors.litegray,
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    detailLabel: {
        fontSize: 12,
        fontFamily: FONTS.LexendRegular,
        color: Colors.textgray,
    },
    detailValue: {
        fontSize: 13,
        fontFamily: FONTS.LexendMedium,
        color: Colors.black,
    },
    monoText: {
        fontFamily: FONTS.LexendMedium,
        color: Colors.textgray,
    },
    dateText: {
        fontSize: 12,
        fontFamily: FONTS.LexendRegular,
        color: Colors.textgray,
    },
    methodRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    methodIconBox: {
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    methodIconText: {
        fontSize: 14,
    },
})