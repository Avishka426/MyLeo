import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../lib/constants';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const name = user?.memberProfile ? `${user.memberProfile.firstName} ${user.memberProfile.lastName}` : user?.email;

  const actions = [
    { icon: 'folder-outline', label: 'View Projects', route: '/(member)/projects' },
    { icon: 'newspaper-outline', label: 'News Feed', route: '/(member)/feed' },
    { icon: 'map-outline', label: 'Project Map', route: '/(member)/map' },
  ] as const;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={32} color={COLORS.primary} />
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{name}</Text>
          {user?.memberProfile?.position && (
            <Badge label={user.memberProfile.position} color={COLORS.primary} />
          )}
        </View>
      </View>

      {user?.club && (
        <Card style={styles.clubCard}>
          <Ionicons name="shield-checkmark" size={20} color={COLORS.primary} />
          <Text style={styles.clubLabel}>Your Club</Text>
          <Text style={styles.clubName}>{user.club.name}</Text>
          <Text style={styles.clubCode}>{user.club.clubCode}</Text>
        </Card>
      )}

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.grid}>
        {actions.map((action) => (
          <TouchableOpacity key={action.label} style={styles.actionCard} onPress={() => router.push(action.route as any)}>
            <Ionicons name={action.icon as any} size={28} color={COLORS.primary} />
            <Text style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  avatar: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: '#E8F0FB',
    justifyContent: 'center', alignItems: 'center',
  },
  greeting: { fontSize: 13, color: COLORS.textMuted },
  name: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 6 },
  clubCard: { marginBottom: 8 },
  clubLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 8 },
  clubName: { fontSize: 17, fontWeight: '700', color: COLORS.text, marginTop: 2 },
  clubCode: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginTop: 8, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionCard: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 20,
    alignItems: 'center', width: '47%',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  actionLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginTop: 10, textAlign: 'center' },
});
