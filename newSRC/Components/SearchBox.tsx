import React from 'react';
import {
    View,
    TextInput,
    StyleSheet,
    StyleProp,
    ViewStyle,
    TextStyle,
    TouchableOpacity,
    TextInputProps,
} from 'react-native';
import { Colors } from '../utils/colors';
import FallBackImage from './FallBackImage';
import { Images } from '../utils/Images';
import { FONTS } from '../utils/FONTS';
import SimpleBox from './SimpleBox';

type SearchBoxProps = Omit<TextInputProps, 'style'> & {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    containerStyle?: StyleProp<ViewStyle>;
    inputStyle?: StyleProp<TextStyle>;
    onClear?: () => void;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    editable?: boolean;
    onPress?: () => void;
};

const SearchBox: React.FC<SearchBoxProps> = ({
    value,
    onChangeText,
    placeholder = 'Search...',
    containerStyle,
    inputStyle,
    onClear,
    leftIcon,
    rightIcon,
    editable = true,
    onPress,
    ...rest
}) => {
    return (
        <TouchableOpacity
            activeOpacity={editable ? 1 : 0.7}
            onPress={!editable ? onPress : undefined}
            style={[styles.container, containerStyle]}
        >
            <View style={styles.iconWrapper}>
                <FallBackImage
                    source={Images.SearchIcon}
                    style={{ width: 20, height: 20, tintColor: Colors.placeholder }}
                />
            </View>

            <TextInput
                style={[styles.input, inputStyle]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={Colors.placeholder}
                returnKeyType="search"
                editable={editable}
                {...rest}
            />

            {value?.length > 0 && (
                <SimpleBox
                    Icon={Images.CloseIcon}
                    onPress={onClear}

                />
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        paddingHorizontal: 14,
        minHeight: 48,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: "#EEEEEE",
    },
    iconWrapper: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 14,
        color: Colors.black,
        fontFamily: FONTS.LexendRegular,
        paddingVertical: 0,
        height: 48,
    },
});

export default React.memo(SearchBox);