import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../lib/api';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { ROLES } from '../../lib/constants';

interface DistrictItem {
  district: { _id: string; name: string; code: string; status: string };
  summary: { totalClubs: number; totalProjects: number; projectsByStatus: Record<string, number> };
}

interface MDSummaryData {
  multipleDistrict: { _id: string; name: string; code: string };
  summary: {
    totalDistricts: number;
    totalClubs: number;
    totalProjects: number;
    projectsByStatus: Record<string, number>;
  };
  districts: DistrictItem[];
}

const STATUSES = ['upcoming', 'ongoing', 'completed'] as const;

export default function MultipleSummaryScreen() {
  const { user } = useAuth();
  const { colors, radius } = useTheme();
  const [data, setData] = useState<MDSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const mdId = (user?.multipleDistrict as any)?._id ?? (user?.multipleDistrict as any);

  const fetchSummary = useCallback(async () => {
    if (!mdId) { setLoading(false); return; }
    try {
      setError('');
      const res = await api.get(`/multiple-districts/${mdId}/summary`);
      setData(res.data.data);
    } catch {
      setError('Failed to load MD summary.');
    } finally {
      setLoading(false);
    }
  }, [mdId]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);
  const onRefresh = async () => { setRefreshing(true); await fetchSummary(); setRefreshing(false); };

  if (user?.role === ROLES.MULTIPLE_MEMBER) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <EmptyState icon="lock-closed-outline" title="Exco Access Only" subtitle="MD summary is restricted to multiple district exco members." />
      </View>
    );
  }

  if (loading) return <LoadingSpinner />;

  if (error || !data) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ color: colors.error, textAlign: 'center' }}>{error || 'No multiple district assigned to your account.'}</Text>
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
        <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 }}>
          Multiple District
        </Text>
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#fff', marginTop: 4 }}>{data.multipleDistrict.name}</Text>
        <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, marginTop: 8 }}>
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{data.multipleDistrict.code}</Text>
        </View>
      </View>

      {/* Stat cards */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        {[
          { label: 'Districts', value: data.summary.totalDistricts, icon: 'map-outline' },
          { label: 'Clubs', value: data.summary.totalClubs, icon: 'shield-checkmark-outline' },
          { label: 'Projects', value: data.summary.totalProjects, icon: 'folder-outline' },
        ].map((stat) => (
          <View key={stat.label} style={{
            flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, padding: 12,
            alignItems: 'center', borderWidth: 1, borderColor: colors.border,
          }}>
            <Ionicons name={stat.icon as any} size={20} color={colors.primary} />
            <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 4 }}>{stat.value}</Text>
            <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 1 }}>{stat.label}</Text>
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

      {/* Districts list */}
      <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 10 }}>
        Districts ({data.districts.length})
      </Text>

      {data.districts.length === 0
        ? <EmptyState icon="map-outline" title="No districts" subtitle="No districts found in this multiple district." />
        : data.districts.map(({ district, summary }) => (
          <View key={district._id} style={{
            backgroundColor: colors.card, borderRadius: radius.lg, padding: 14,
            marginBottom: 10, borderWidth: 1, borderColor: colors.border,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="map" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>{district.name}</Text>
                <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '600' }}>{district.code}</Text>
              </View>
              <View style={{
                backgroundColor: district.status === 'active' ? colors.success + '20' : colors.error + '20',
                borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
              }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: district.status === 'active' ? colors.success : colors.error, textTransform: 'capitalize' }}>
                  {district.status}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 6 }}>
              <View style={{ flex: 1, alignItems: 'center', backgroundColor: colors.background, borderRadius: radius.sm, paddingVertical: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>{summary.totalClubs}</Text>
                <Text style={{ fontSize: 10, color: colors.textMuted }}>Clubs</Text>
              </View>
              <View style={{ flex: 1, alignItems: 'center', backgroundColor: colors.background, borderRadius: radius.sm, paddingVertical: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>{summary.totalProjects}</Text>
                <Text style={{ fontSize: 10, color: colors.textMuted }}>Projects</Text>
              </View>
              {STATUSES.map((s) => (
                <View key={s} style={{
                  flex: 1, alignItems: 'center',
                  backgroundColor: statusColors[s] + '12',
                  borderRadius: radius.sm, paddingVertical: 8,
                }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: statusColors[s] }}>
                    {summary.projectsByStatus[s] || 0}
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
