import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export default function DashboardScreen() {
  const { user } = useAuth();
  const { colors, radius } = useTheme();
  const router = useRouter();
  const name = user?.memberProfile ? `${user.memberProfile.firstName} ${user.memberProfile.lastName}` : user?.email;

  const actions = [
    { icon: 'folder-outline', label: 'View Projects', route: '/(member)/projects' },
    { icon: 'newspaper-outline', label: 'News Feed', route: '/(member)/feed' },
    { icon: 'map-outline', label: 'Project Map', route: '/(member)/map' },
  ] as const;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      {/* Header card */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.card, borderRadius: radius.lg, padding: 20, marginBottom: 16,
        borderWidth: 1, borderColor: colors.border,
      }}>
        <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="person" size={32} color={colors.primary} />
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={{ fontSize: 13, color: colors.textMuted }}>Welcome back,</Text>
          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 6 }}>{name}</Text>
          {user?.memberProfile?.position && <Badge label={user.memberProfile.position} color={colors.primary} />}
        </View>
      </View>

      {/* Club card */}
      {user?.club && (
        <Card style={{ marginBottom: 8 }}>
          <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
          <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 8 }}>Your Club</Text>
          <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text, marginTop: 2 }}>{user.club.name}</Text>
          <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '600' }}>{user.club.clubCode}</Text>
        </Card>
      )}

      <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 8, marginBottom: 12 }}>Quick Actions</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {actions.map((action) => (
          <TouchableOpacity
            key={action.label}
            style={{
              backgroundColor: colors.card, borderRadius: radius.lg, padding: 20,
              alignItems: 'center', width: '47%',
              borderWidth: 1, borderColor: colors.border,
            }}
            onPress={() => router.push(action.route as any)}
            activeOpacity={0.7}
          >
            <Ionicons name={action.icon as any} size={28} color={colors.primary} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, marginTop: 10, textAlign: 'center' }}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}
