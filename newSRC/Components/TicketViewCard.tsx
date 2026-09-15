import React, { memo, useMemo } from 'react';
import { View, Text, Image, StyleSheet, ImageSourcePropType, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import Svg, { Line } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../utils/colors';
import { Images } from '../utils/Images';
import { LIST_UI } from '../utils/connectionTheme';
import { LIST_CARD_SHADOW, listScreenStyles } from '../utils/listScreenStyles';


interface ActionRelatieData {
    display_name?: string;
}

interface TicketStatusData {
    status_name?: string;
    color?: string;
}

interface TicketViewCardProps {
    id?: string | number;
    ticket_title?: string;
    project_name?: string;
    date?: string;
    action_relatie_data?: ActionRelatieData;
    ticket_status_data?: TicketStatusData;
}

interface MainProps {
    ItemData: TicketViewCardProps;
    onPress: () => void;
}

interface RowProps {
    icon: ImageSourcePropType;
    text?: string;
    isLast?: boolean;
}

const DEFAULT_COLOR = '#FF9142';

const hexToRgba = (hex: string, alpha: number): string => {
    let normalized = hex.trim().replace('#', '');
    if (normalized.length === 3) {
        normalized = normalized
            .split('')
            .map(c => c + c)
            .join('');
    }
    if (normalized.length !== 6) {
        normalized = DEFAULT_COLOR.replace('#', '');
    }
    const r = parseInt(normalized.substring(0, 2), 16);
    const g = parseInt(normalized.substring(2, 4), 16);
    const b = parseInt(normalized.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const Row = memo(({ icon, text, isLast }: RowProps) => (
    <View style={[styles.row, isLast && styles.rowLast]}>
        <View style={styles.iconWrap}>
            <Image source={icon} style={styles.iconImage} resizeMode="contain" />
        </View>
        <Text style={styles.rowText} numberOfLines={1}>
            {text || '-'}
        </Text>
    </View>
));

Row.displayName = 'Row';

const DashedDivider = memo(() => (
    <Svg height={1} width="100%">
        <Line
            x1="0"
            y1="0.5"
            x2="100%"
            y2="0.5"
            stroke="#E2E2E2"
            strokeWidth={1}
            strokeDasharray="4,4"
        />
    </Svg>
));

DashedDivider.displayName = 'DashedDivider';

function TicketViewCard({ ItemData, onPress=()=>{}}: MainProps) {
    const { t } = useTranslation();
    const {
        id,
        ticket_title,
        project_name,
        date,
        action_relatie_data,
        ticket_status_data,
    } = ItemData ?? {};

    const statusColor = ticket_status_data?.color || DEFAULT_COLOR;

    const gradientColors = useMemo(
        () => [
            statusColor,
            statusColor,
            hexToRgba(statusColor, 0.3),
            hexToRgba(statusColor, 0.05),
        ],
        [statusColor],
    );

    const gradientLocations = useMemo(() => [0, 0.18, 0.6, 1], []);

    const topSectionStyle = useMemo(
        () => [
            styles.topSection,
            {
                backgroundColor: hexToRgba(statusColor, 0.15),
                borderBottomColor: statusColor,
            },
        ],
        [statusColor],
    );

    const badgeStyle = useMemo(
        () => [styles.newBadge, { backgroundColor: statusColor }],
        [statusColor],
    );

    return (
        <Pressable onPress={onPress}>
            <LinearGradient
                colors={gradientColors}
                locations={gradientLocations}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.outerBorder}
            >
                <View style={styles.innerContainer}>
                    <View style={topSectionStyle}>
                        <View style={styles.idBadge}>
                            <Text
                                style={styles.idText}
                                numberOfLines={1}
                                adjustsFontSizeToFit
                                minimumFontScale={0.65}
                            >
                                {id ?? ''}
                            </Text>
                        </View>

                        <Text style={styles.nameText} numberOfLines={1}>
                            {ticket_title ? t(ticket_title) : ''}
                        </Text>

                        <View style={badgeStyle}>
                            <Text style={styles.newBadgeText} numberOfLines={1}>
                                {ticket_status_data?.status_name ? t(ticket_status_data.status_name) : ''}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.bottomSection}>
                        <Row icon={Images.userVector} text={action_relatie_data?.display_name ? t(action_relatie_data.display_name) : undefined} />
                        <DashedDivider />
                        <Row icon={Images.BagVector} text={project_name ? t(project_name) : undefined} />
                        <DashedDivider />
                        <Row icon={Images.CalendarVector} text={date} isLast />
                    </View>
                </View>
            </LinearGradient>
        </Pressable>
    );
}

export default memo(TicketViewCard);

const styles = StyleSheet.create({
    outerBorder: {
        padding: 1,
        borderRadius: LIST_UI.cardRadius,
        overflow: 'hidden',
        width: '100%',
        marginBottom: LIST_UI.cardGap,
        ...LIST_CARD_SHADOW,
    },
    innerContainer: {
        backgroundColor: Colors.white,
        borderRadius: LIST_UI.cardRadius,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: LIST_UI.cardBorder,
    },
    topSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: LIST_UI.cardPadding,
        paddingVertical: LIST_UI.cardPadding,
        borderBottomWidth: 1,
        borderBottomColor: LIST_UI.cardBorder,
    },
    idBadge: {
        ...listScreenStyles.idBox,
        marginRight: LIST_UI.iconTextGap,
    },
    idText: listScreenStyles.idText,
    nameText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '700',
        color: Colors.black,
    },
    newBadge: {
        ...listScreenStyles.statusBadge,
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    newBadgeText: {
        color: Colors.white,
        fontWeight: '700',
        fontSize: 13,
    },
    bottomSection: {
        backgroundColor: Colors.white,
        paddingHorizontal: LIST_UI.cardPadding,
        paddingTop: LIST_UI.cardPadding,
        paddingBottom: 6,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    rowLast: {
        paddingBottom: 8,
    },
    iconWrap: {
        width: 26,
        alignItems: 'center',
        marginRight: 10,
    },
    iconImage: {
        width: 18,
        height: 18,
    },
    rowText: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.black,
        flexShrink: 1,
    },
});