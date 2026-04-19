import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../lib/api';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { ROLES } from '../../lib/constants';

interface ClubSummaryItem {
  club: { _id: string; name: string; clubCode: string; status: string };
  projects: { total: number; byStatus: Record<string, number> };
}

interface DistrictSummaryData {
  district: { _id: string; name: string; code: string };
  summary: { totalClubs: number; totalProjects: number; projectsByStatus: Record<string, number> };
  clubs: ClubSummaryItem[];
}

const STATUSES = ['upcoming', 'ongoing', 'completed'] as const;

export default function DistrictSummaryScreen() {
  const { user } = useAuth();
  const { colors, radius } = useTheme();
  const [data, setData] = useState<DistrictSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const districtId = (user?.district as any)?._id ?? (user?.district as any);

  const fetchSummary = useCallback(async () => {
    if (!districtId) { setLoading(false); return; }
    try {
      setError('');
      const res = await api.get(`/districts/${districtId}/summary`);
      setData(res.data.data);
    } catch {
      setError('Failed to load district summary.');
    } finally {
      setLoading(false);
    }
  }, [districtId]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);
  const onRefresh = async () => { setRefreshing(true); await fetchSummary(); setRefreshing(false); };

  if (user?.role === ROLES.DISTRICT_MEMBER) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <EmptyState icon="lock-closed-outline" title="Exco Access Only" subtitle="District summary is restricted to district exco members." />
      </View>
    );
  }

  if (loading) return <LoadingSpinner />;

  if (error || !data) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ color: colors.error, textAlign: 'center' }}>{error || 'No district assigned to your account.'}</Text>
      </View>
    );
  }

  const statusColors: Record<string, string> = {
    upcoming: colors.info,
    ongoing: colors.warning,
    completed: colors.success,
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Hero */}
      <View style={{ backgroundColor: colors.primary, borderRadius: radius.xl, padding: 20, marginBottom: 16 }}>
        <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 }}>Your District</Text>
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#fff', marginTop: 4 }}>{data.district.name}</Text>
        <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, marginTop: 8 }}>
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{data.district.code}</Text>
        </View>
      </View>

      {/* Stat cards */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Clubs', value: data.summary.totalClubs, icon: 'shield-checkmark-outline' },
          { label: 'Projects', value: data.summary.totalProjects, icon: 'folder-outline' },
        ].map((stat) => (
          <View key={stat.label} style={{
            flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, padding: 16,
            alignItems: 'center', borderWidth: 1, borderColor: colors.border,
          }}>
            <Ionicons name={stat.icon as any} size={22} color={colors.primary} />
            <Text style={{ fontSize: 28, fontWeight: '800', color: colors.text, marginTop: 6 }}>{stat.value}</Text>
            <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Projects by status */}
      <View style={{ backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 12 }}>Projects by Status</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {STATUSES.map((s) => (
            <View key={s} style={{
              flex: 1, alignItems: 'center',
              backgroundColor: statusColors[s] + '18',
              borderRadius: radius.md, padding: 12,
            }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: statusColors[s] }}>
                {data.summary.projectsByStatus[s] || 0}
              </Text>
              <Text style={{ fontSize: 10, color: colors.textMuted, textTransform: 'capitalize', marginTop: 2 }}>{s}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Clubs */}
      <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 10 }}>
        Clubs ({data.clubs.length})
      </Text>

      {data.clubs.length === 0
        ? <EmptyState icon="shield-outline" title="No clubs" subtitle="No clubs found in this district." />
        : data.clubs.map(({ club, projects }) => (
          <View key={club._id} style={{
            backgroundColor: colors.card, borderRadius: radius.lg, padding: 14,
            marginBottom: 10, borderWidth: 1, borderColor: colors.border,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>{club.name}</Text>
                <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '600' }}>{club.clubCode}</Text>
              </View>
              <View style={{
                backgroundColor: club.status === 'active' ? colors.success + '20' : colors.error + '20',
                borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
              }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: club.status === 'active' ? colors.success : colors.error, textTransform: 'capitalize' }}>
                  {club.status}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 6 }}>
              <View style={{ flex: 1, alignItems: 'center', backgroundColor: colors.background, borderRadius: radius.sm, paddingVertical: 8 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>{projects.total}</Text>
                <Text style={{ fontSize: 10, color: colors.textMuted }}>Total</Text>
              </View>
              {STATUSES.map((s) => (
                <View key={s} style={{
                  flex: 1, alignItems: 'center',
                  backgroundColor: statusColors[s] + '12',
                  borderRadius: radius.sm, paddingVertical: 8,
                }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: statusColors[s] }}>
                    {projects.byStatus[s] || 0}
                  </Text>
                  <Text style={{ fontSize: 10, color: colors.textMuted, textTransform: 'capitalize' }}>
                    {s.slice(0, 5)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))
      }
    </ScrollView>
  );
}
