import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, Modal, TouchableOpacity,
    ScrollView, Dimensions
} from 'react-native';
import { COLORS, SHADOWS, SIZES } from '../constants/theme';

const ITEM_HEIGHT = 48;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

function daysInMonth(month, year) {
    return new Date(year, month, 0).getDate();
}

function range(start, end) {
    const arr = [];
    for (let i = start; i <= end; i++) arr.push(i);
    return arr;
}

// A single column scroll picker
const Column = ({ items, selectedIndex, onChange, formatItem }) => {
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ y: selectedIndex * ITEM_HEIGHT, animated: false });
        }
    }, [selectedIndex]);

    const handleScrollEnd = (e) => {
        const y = e.nativeEvent.contentOffset.y;
        const index = Math.round(y / ITEM_HEIGHT);
        const clamped = Math.max(0, Math.min(index, items.length - 1));
        onChange(clamped);
        // Snap
        scrollRef.current?.scrollTo({ y: clamped * ITEM_HEIGHT, animated: true });
    };

    return (
        <View style={styles.column}>
            {/* Selection highlight */}
            <View style={styles.selectionHighlight} pointerEvents="none" />
            <ScrollView
                ref={scrollRef}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                onMomentumScrollEnd={handleScrollEnd}
                onScrollEndDrag={handleScrollEnd}
                contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
            >
                {items.map((item, idx) => (
                    <View key={idx} style={styles.item}>
                        <Text style={[
                            styles.itemText,
                            idx === selectedIndex && styles.itemTextSelected
                        ]}>
                            {formatItem ? formatItem(item) : String(item).padStart(2, '0')}
                        </Text>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
};

const DatePickerModal = ({ visible, value, onConfirm, onCancel, title = 'Select Date' }) => {
    const today = new Date();

    // Parse initial value
    const initial = value ? new Date(value) : today;
    const [day, setDay] = useState(initial.getDate());
    const [month, setMonth] = useState(initial.getMonth() + 1); // 1-based
    const [year, setYear] = useState(initial.getFullYear());

    // Reset when modal opens
    useEffect(() => {
        if (visible) {
            const d = value ? new Date(value) : today;
            setDay(d.getDate());
            setMonth(d.getMonth() + 1);
            setYear(d.getFullYear());
        }
    }, [visible]);

    const years = range(2020, today.getFullYear() + 1);
    const months = range(1, 12);
    const maxDay = daysInMonth(month, year);
    const days = range(1, maxDay);

    // Clamp day if month/year changes
    const safeDay = Math.min(day, maxDay);

    const handleConfirm = () => {
        const d = new Date(year, month - 1, safeDay, 12, 0, 0);
        onConfirm(d.toISOString());
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
            <View style={styles.overlay}>
                <View style={styles.sheet}>
                    <Text style={styles.title}>{title}</Text>

                    {/* Preview */}
                    <Text style={styles.preview}>
                        {String(safeDay).padStart(2, '0')} {MONTHS[month - 1]} {year}
                    </Text>

                    <View style={styles.columnsRow}>
                        {/* Day */}
                        <Column
                            items={days}
                            selectedIndex={days.indexOf(safeDay)}
                            onChange={(i) => setDay(days[i])}
                        />
                        {/* Month */}
                        <Column
                            items={months}
                            selectedIndex={month - 1}
                            onChange={(i) => setMonth(months[i])}
                            formatItem={(m) => MONTHS[m - 1].slice(0, 3)}
                        />
                        {/* Year */}
                        <Column
                            items={years}
                            selectedIndex={years.indexOf(year)}
                            onChange={(i) => setYear(years[i])}
                            formatItem={(y) => String(y)}
                        />
                    </View>

                    <View style={styles.buttons}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
                            <Text style={styles.confirmText}>Confirm</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 20,
        paddingBottom: 36,
        paddingHorizontal: 20,
        ...SHADOWS.medium,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: 8,
    },
    preview: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.primary,
        textAlign: 'center',
        marginBottom: 16,
    },
    columnsRow: {
        flexDirection: 'row',
        height: PICKER_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    column: {
        flex: 1,
        height: PICKER_HEIGHT,
        overflow: 'hidden',
        position: 'relative',
    },
    selectionHighlight: {
        position: 'absolute',
        top: ITEM_HEIGHT * 2,
        left: 4,
        right: 4,
        height: ITEM_HEIGHT,
        backgroundColor: COLORS.primary + '18',
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: COLORS.primary + '40',
        zIndex: 1,
    },
    item: {
        height: ITEM_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemText: {
        fontSize: 17,
        color: COLORS.textSecondary,
    },
    itemTextSelected: {
        fontSize: 19,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    buttons: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelBtn: {
        flex: 1,
        padding: 15,
        borderRadius: SIZES.radius,
        backgroundColor: COLORS.light,
        alignItems: 'center',
    },
    cancelText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    confirmBtn: {
        flex: 1,
        padding: 15,
        borderRadius: SIZES.radius,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        ...SHADOWS.small,
    },
    confirmText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.white,
    },
});

export default DatePickerModal;
