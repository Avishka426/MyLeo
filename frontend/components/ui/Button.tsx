import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ label, onPress, variant = 'primary', loading, disabled, style, size = 'md' }: ButtonProps) {
  const { colors, radius } = useTheme();

  const bg: Record<string, string> = {
    primary: colors.primary,
    secondary: colors.border,
    danger: colors.error,
    ghost: 'transparent',
  };

  const fg: Record<string, string> = {
    primary: colors.onPrimary,
    secondary: colors.text,
    danger: '#fff',
    ghost: colors.primary,
  };

  const padding = size === 'sm' ? 8 : size === 'lg' ? 16 : 12;
  const fontSize = size === 'sm' ? 13 : size === 'lg' ? 16 : 15;

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[
        {
          backgroundColor: bg[variant],
          borderRadius: radius.md,
          paddingVertical: padding,
          paddingHorizontal: padding * 2,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 6,
          borderWidth: variant === 'ghost' ? 1 : 0,
          borderColor: variant === 'ghost' ? colors.primary : undefined,
          opacity: isDisabled ? 0.6 : 1,
        },
        style,
      ]}
    >
      {loading && <ActivityIndicator size="small" color={fg[variant]} />}
      <Text style={{ color: fg[variant], fontWeight: '700', fontSize }}>{label}</Text>
    </TouchableOpacity>
  );
}
