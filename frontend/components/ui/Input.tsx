import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  isPassword?: boolean;
}

export function Input({ label, error, isPassword, style, ...props }: InputProps) {
  const { colors, radius } = useTheme();
  const [show, setShow] = useState(false);

  return (
    <View style={{ marginBottom: 4 }}>
      {label && (
        <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, marginTop: 14 }}>
          {label}
        </Text>
      )}
      <View style={{ position: 'relative' }}>
        <TextInput
          {...props}
          secureTextEntry={isPassword && !show}
          placeholderTextColor={colors.textMuted}
          style={[
            {
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: error ? colors.error : colors.border,
              borderRadius: radius.md,
              paddingHorizontal: 14,
              paddingVertical: 13,
              fontSize: 15,
              color: colors.text,
              paddingRight: isPassword ? 48 : 14,
            },
            style,
          ]}
        />
        {isPassword && (
          <TouchableOpacity
            style={{ position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' }}
            onPress={() => setShow((v) => !v)}
          >
            <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text style={{ fontSize: 12, color: colors.error, marginTop: 4 }}>{error}</Text>
      )}
    </View>
  );
}
