import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { STATUS_COLORS } from '../../lib/constants';

interface BadgeProps {
  label: string;
  status?: string;
  color?: string;
}

export const Badge = ({ label, status, color }: BadgeProps) => {
  const bg = color || (status ? STATUS_COLORS[status] : '#6B7280');
  return (
    <View style={[styles.badge, { backgroundColor: bg + '22' }]}>
      <Text style={[styles.label, { color: bg }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
