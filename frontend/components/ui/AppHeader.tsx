import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { COLORS, ROLES } from '../../lib/constants';

export function AppHeader() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const initials = user?.memberProfile
    ? `${user.memberProfile.firstName[0]}${user.memberProfile.lastName[0]}`.toUpperCase()
    : user?.email?.[0]?.toUpperCase() || '?';

  const goToProfile = () => {
    if (user?.role === ROLES.MEMBER) {
      router.push('/(member)/profile');
    } else {
      router.push('/(exco)/profile');
    }
  };

  return (
    <View style={[styles.header, { paddingTop: insets.top, height: 56 + insets.top }]}>
      <View style={styles.left}>
        <Ionicons name="shield" size={20} color="#FFD700" />
        <Text style={styles.appName}>MyLeo</Text>
      </View>
      <TouchableOpacity style={styles.avatarBtn} onPress={goToProfile} activeOpacity={0.8}>
        <Text style={styles.avatarText}>{initials}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  appName: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  avatarBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
