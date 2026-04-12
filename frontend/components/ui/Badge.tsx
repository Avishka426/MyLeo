import React from 'react';
import { View, Text } from 'react-native';
import { STATUS_COLORS } from '../../lib/theme';

interface BadgeProps {
  label: string;
  status?: string;
  color?: string;
}

export const Badge = ({ label, status, color }: BadgeProps) => {
  const bg = color || (status ? STATUS_COLORS[status] : '#6B7280');
  return (
    <View style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, alignSelf: 'flex-start', backgroundColor: bg + '22' }}>
      <Text style={{ fontSize: 12, fontWeight: '600', color: bg, textTransform: 'capitalize' }}>{label}</Text>
    </View>
  );
};
