import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
}

export function EmptyState({ icon = 'file-tray-outline', title, subtitle }: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: 60, gap: 12 }}>
      <View style={{
        width: 72, height: 72, borderRadius: 36,
        backgroundColor: colors.border,
        justifyContent: 'center', alignItems: 'center',
      }}>
        <Ionicons name={icon} size={34} color={colors.textMuted} />
      </View>
      <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textSecondary }}>{title}</Text>
      {subtitle && (
        <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20, paddingHorizontal: 24 }}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}
