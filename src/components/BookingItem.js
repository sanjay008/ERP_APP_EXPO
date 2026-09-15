import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '../constants/color';
import { FONTS } from '../constants/fontFamily';
import BlueHeader from './BlueHeader';

const { width } = Dimensions.get('window');

const getInitials = (name = '') => {
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return '??';
};

const formatDate = (dateStr = '') => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatTime = (timeStr = '') => {
    if (!timeStr) return '-';
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
};

const getPaymentStatusStyle = (status = '') => {
    switch (status.toLowerCase()) {
        case 'paid': return { bg: Colors.litegreen, text: Colors.orignalGreen };
        case 'expired': return { bg: Colors.diclinelite, text: '#A32D2D' };
        case 'pending': return { bg: Colors.invoicelite, text: '#856404' };
        case 'failed': return { bg: Colors.neworderlite, text: Colors.neworder };
        default: return { bg: Colors.litegray1, text: Colors.textgray };
    }
};



const BookingCard = ({ item, onPress, bgcolor}) => {
    const { t } = useTranslation();

    const booking = item?.booking_details ?? {};
    const order = item?.order_details ?? {};
    const relaties = item?.relaties_details ?? {};

    let serviceName = '-';
    try {
        const parsed = JSON.parse(order.cart_data || '[]');
        if (Array.isArray(parsed) && parsed[0]?.product_name) {
            serviceName = parsed[0].product_name;
        }
    } catch (_) { }

    const initials = getInitials(relaties.display_name);
    const paymentStyle = getPaymentStatusStyle(order.payment_status || '');
    const statusLabel =
        (order.payment_status || '-').charAt(0).toUpperCase() +
        (order.payment_status || '').slice(1);

    return (
        <View>
           

            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => onPress(item)}
            >
                <View style={[styles.header,{backgroundColor: bgcolor || Colors.primary}]}>
                    <View style={styles.avatarCircle}>
                        <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                    <View style={styles.headerInfo}>
                        <Text style={styles.headerName} numberOfLines={1}>
                            {relaties.display_name || '-'}
                        </Text>
                        <Text style={styles.headerEmail} numberOfLines={1}>
                            {relaties.email_adres || '-'}
                        </Text>
                    </View>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                            {relaties.soort_relatie || t('Staff')}
                        </Text>
                    </View>
                </View>

                <View style={styles.body}>
                    <View style={styles.statsRow}>
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>{t('BookingDate')}</Text>
                            <Text style={styles.statValuePrimary}>{formatDate(booking.date)}</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>{t('TimeSlot')}</Text>
                            <Text style={styles.statValue}>{formatTime(booking.time_slot)}</Text>
                        </View>
                    </View>

                    <View style={styles.serviceRow}>
                        <View style={styles.serviceInfo}>
                            <Text style={styles.statLabel}>{t('ServiceBooked')}</Text>
                            <Text style={styles.serviceName} numberOfLines={1}>{serviceName}</Text>
                        </View>
                        <View style={styles.rightGroup}>
                            <View style={[styles.payBadge, { backgroundColor: paymentStyle.bg }]}>
                                <View style={[styles.payDot, { backgroundColor: paymentStyle.text }]} />
                                <Text style={[styles.payText, { color: paymentStyle.text }]}>{statusLabel}</Text>
                            </View>
                            <Text style={styles.amount}>€{order.total_price || '0.00'}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerIds} numberOfLines={1}>
                       {t("Booking Id")} #{booking.id}  
                    </Text>
                    <Text style={styles.viewDetails}>{t('ViewDetails')} →</Text>
                </View>
            </TouchableOpacity>
        </View>
    );
};

export default BookingCard;

const CARD_WIDTH = width - 28;

const styles = StyleSheet.create({
    card: {
        width: CARD_WIDTH,
        alignSelf: 'center',
        backgroundColor: Colors.white,
        borderRadius: 7,
        overflow: 'hidden',
        marginBottom: 12,
        borderWidth: 0.5,
        borderColor: Colors.Boxgray,
        elevation: 2,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
    },
    header: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 14,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    avatarCircle: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.4)',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    avatarText: {
        fontSize: 13,
        fontFamily: FONTS.LexendSemiBold,
        color: Colors.white,
    },
    headerInfo: {
        flex: 1,
        minWidth: 0,
    },
    headerName: {
        fontSize: 14,
        fontFamily: FONTS.LexendSemiBold,
        color: Colors.white,
    },
    headerEmail: {
        fontSize: 11,
        fontFamily: FONTS.LexendRegular,
        color: 'rgba(255,255,255,0.75)',
        marginTop: 1,
    },
    badge: {
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 3,
    },
    badgeText: {
        fontSize: 10,
        fontFamily: FONTS.LexendMedium,
        color: Colors.white,
        textTransform: 'capitalize',
    },
    body: {
        paddingHorizontal: 14,
        paddingTop: 12,
        paddingBottom: 10,
        gap: 8,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 8,
    },
    statCard: {
        flex: 1,
        backgroundColor: Colors.litegray1,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    statLabel: {
        fontSize: 10,
        fontFamily: FONTS.LexendRegular,
        color: Colors.textgray,
        marginBottom: 2,
    },
    statValue: {
        fontSize: 13,
        fontFamily: FONTS.LexendSemiBold,
        color: Colors.black,
    },
    statValuePrimary: {
        fontSize: 13,
        fontFamily: FONTS.LexendSemiBold,
        color: Colors.primary,
    },
    serviceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTopWidth: 0.5,
        borderTopColor: Colors.borderColor,
        paddingTop: 8,
        gap: 8,
    },
    serviceInfo: {
        flex: 1,
        minWidth: 0,
    },
    serviceName: {
        fontSize: 12,
        fontFamily: FONTS.LexendSemiBold,
        color: Colors.black,
    },
    rightGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexShrink: 0,
    },
    payBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 20,
        paddingHorizontal: 8,
        paddingVertical: 3,
        gap: 4,
    },
    payDot: {
        width: 5,
        height: 5,
        borderRadius: 3,
    },
    payText: {
        fontSize: 11,
        fontFamily: FONTS.LexendMedium,
    },
    amount: {
        fontSize: 15,
        fontFamily: FONTS.LexendSemiBold,
        color: Colors.primary,
    },
    footer: {
        borderTopWidth: 0.5,
        borderTopColor: Colors.borderColor,
        paddingHorizontal: 14,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    footerIds: {
        fontSize: 11,
        fontFamily: FONTS.LexendRegular,
        color: Colors.textgray,
        flex: 1,
    },
    viewDetails: {
        fontSize: 11,
        fontFamily: FONTS.LexendMedium,
        color: Colors.primary,
        flexShrink: 0,
    },
});