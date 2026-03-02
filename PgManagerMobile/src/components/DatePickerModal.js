import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, Modal, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, SIZES } from '../constants/theme';

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

function daysInMonth(month, year) {
    return new Date(year, month, 0).getDate();
}

// A single stepper column: label + up/down arrows
const Stepper = ({ label, value, onIncrement, onDecrement }) => (
    <View style={styles.stepper}>
        <TouchableOpacity
            style={styles.stepBtn}
            onPress={onIncrement}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
            <Ionicons name="chevron-up" size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.stepValueBox}>
            <Text style={styles.stepValue}>{label}</Text>
        </View>
        <TouchableOpacity
            style={styles.stepBtn}
            onPress={onDecrement}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
            <Ionicons name="chevron-down" size={22} color={COLORS.primary} />
        </TouchableOpacity>
    </View>
);

const DatePickerModal = ({ visible, value, onConfirm, onCancel, title = 'Select Date' }) => {
    const today = new Date();

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

    const maxDay = daysInMonth(month, year);
    const safeDay = Math.min(day, maxDay);

    const changeDay = (delta) => {
        setDay(prev => {
            const max = daysInMonth(month, year);
            const next = prev + delta;
            if (next < 1) return max;
            if (next > max) return 1;
            return next;
        });
    };

    const changeMonth = (delta) => {
        setMonth(prev => {
            const next = prev + delta;
            if (next < 1) return 12;
            if (next > 12) return 1;
            return next;
        });
    };

    const changeYear = (delta) => {
        setYear(prev => {
            const next = prev + delta;
            if (next < 2020) return today.getFullYear() + 1;
            if (next > today.getFullYear() + 1) return 2020;
            return next;
        });
    };

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

                    <View style={styles.steppersRow}>
                        <View style={styles.stepperCol}>
                            <Text style={styles.stepperLabel}>Day</Text>
                            <Stepper
                                label={String(safeDay).padStart(2, '0')}
                                onIncrement={() => changeDay(1)}
                                onDecrement={() => changeDay(-1)}
                            />
                        </View>
                        <View style={styles.stepperCol}>
                            <Text style={styles.stepperLabel}>Month</Text>
                            <Stepper
                                label={MONTHS[month - 1].slice(0, 3)}
                                onIncrement={() => changeMonth(1)}
                                onDecrement={() => changeMonth(-1)}
                            />
                        </View>
                        <View style={styles.stepperCol}>
                            <Text style={styles.stepperLabel}>Year</Text>
                            <Stepper
                                label={String(year)}
                                onIncrement={() => changeYear(1)}
                                onDecrement={() => changeYear(-1)}
                            />
                        </View>
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
        marginBottom: 20,
    },
    steppersRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 24,
    },
    stepperCol: {
        alignItems: 'center',
        flex: 1,
    },
    stepperLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontWeight: '600',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    stepper: {
        alignItems: 'center',
        gap: 4,
    },
    stepBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary + '12',
        borderRadius: 10,
    },
    stepValueBox: {
        width: 64,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary + '18',
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: COLORS.primary + '40',
    },
    stepValue: {
        fontSize: 18,
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
