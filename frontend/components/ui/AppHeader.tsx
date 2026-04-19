import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ROLES } from '../../lib/constants';

export function AppHeader() {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const initials = user?.memberProfile
    ? `${user.memberProfile.firstName[0]}${user.memberProfile.lastName[0]}`.toUpperCase()
    : user?.firstName && user?.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
      : user?.email?.[0]?.toUpperCase() || '?';

  const profileImageUrl = user?.profileImage || user?.memberProfile?.profileImage;

  const goToProfile = () => {
    if (user?.role === ROLES.MEMBER) router.push('/(member)/profile');
    else if (user?.role === ROLES.DISTRICT_MEMBER || user?.role === ROLES.DISTRICT_EXCO) router.push('/(district)/profile');
    else if (user?.role === ROLES.MULTIPLE_MEMBER || user?.role === ROLES.MULTIPLE_EXCO) router.push('/(multiple)/profile');
    else router.push('/(exco)/profile');
  };

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 16,
        paddingBottom: 10,
        paddingTop: insets.top,
        height: 52 + insets.top,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      {/* Brand */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
        <Ionicons name="shield-checkmark" size={22} color={colors.primary} />
        <Text style={{ fontSize: 22, fontWeight: '900', color: colors.text, letterSpacing: -0.3 }}>
          MyLeo
        </Text>
      </View>

      {/* Avatar */}
      <TouchableOpacity
        onPress={goToProfile}
        activeOpacity={0.7}
        style={{
          width: 36, height: 36, borderRadius: 18, overflow: 'hidden', borderWidth: 2, borderColor: isDark ? colors.surface + '88' : colors.surface + 'cc',
          backgroundColor: colors.primary,
          justifyContent: 'center', alignItems: 'center',
        }}
      >
        {profileImageUrl
          ? <Image source={{ uri: profileImageUrl }} style={{ width: 36, height: 36 }} />
          : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>{initials}</Text>}
      </TouchableOpacity>
    </View>
  );
}
