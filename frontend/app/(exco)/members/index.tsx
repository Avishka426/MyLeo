import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../lib/api';
import { useTheme } from '../../../context/ThemeContext';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';

interface Member {
  _id: string;
  firstName: string;
  lastName: string;
  position: string;
  phone?: string;
  isActive: boolean;
  user: { email: string };
}

const POSITION_COLORS: Record<string, string> = {
  President: '#1B4F8A',
  'Vice President': '#2874A6',
  Secretary: '#1A5276',
  'Assistant Secretary': '#2E86C1',
  Treasurer: '#117A65',
  'Assistant Treasurer': '#148F77',
  Member: '#6B7280',
};

function getInitials(first: string, last: string) {
  return `${first[0]}${last[0]}`.toUpperCase();
}

export default function MemberListScreen() {
  const [members, setMembers] = useState<Member[]>([]);
  const [filtered, setFiltered] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const { colors, radius } = useTheme();
  const router = useRouter();

  const fetchMembers = useCallback(async () => {
    try {
      const res = await api.get('/members');
      setMembers(res.data.data);
      setFiltered(res.data.data);
    } catch { }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(members.filter((m) =>
      `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) ||
      m.position.toLowerCase().includes(q) ||
      m.user?.email?.toLowerCase().includes(q)
    ));
  }, [search, members]);

  const onRefresh = async () => { setRefreshing(true); await fetchMembers(); setRefreshing(false); };
  const activeCount = members.filter((m) => m.isActive).length;

  if (loading) return <LoadingSpinner />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Stats bar */}
      <View style={{
        flexDirection: 'row',
        backgroundColor: colors.card, marginHorizontal: 16, marginTop: 16,
        borderRadius: radius.lg, padding: 16,
        borderWidth: 1, borderColor: colors.border,
      }}>
        {[
          { label: 'Total', value: members.length, color: colors.primary },
          { label: 'Active', value: activeCount, color: colors.success },
          { label: 'Inactive', value: members.length - activeCount, color: colors.error },
        ].map((stat, i) => (
          <React.Fragment key={stat.label}>
            {i > 0 && <View style={{ width: 1, backgroundColor: colors.border }} />}
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 22, fontWeight: '800', color: stat.color }}>{stat.value}</Text>
              <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>{stat.label}</Text>
            </View>
          </React.Fragment>
        ))}
      </View>

      {/* Search */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.card, marginHorizontal: 16, marginTop: 12,
        borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 10,
        borderWidth: 1, borderColor: colors.border,
      }}>
        <Ionicons name="search-outline" size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={{ flex: 1, fontSize: 14, color: colors.text }}
          placeholder="Search by name, position…"
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        renderItem={({ item }) => {
          const avatarColor = POSITION_COLORS[item.position] || colors.primary;
          return (
            <TouchableOpacity
              style={{
                flexDirection: 'row', alignItems: 'center',
                backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, marginBottom: 10,
                borderWidth: 1, borderColor: colors.border,
              }}
              onPress={() => router.push({ pathname: '/(exco)/members/[id]', params: { id: item._id } })}
              activeOpacity={0.7}
            >
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: avatarColor, justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>{getInitials(item.firstName, item.lastName)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>{item.firstName} {item.lastName}</Text>
                  {!item.isActive && (
                    <View style={{ backgroundColor: colors.error + '18', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: colors.error }}>Inactive</Text>
                    </View>
                  )}
                </View>
                <Text style={{ fontSize: 12, color: avatarColor, fontWeight: '600', marginBottom: 2 }}>{item.position}</Text>
                <Text style={{ fontSize: 11, color: colors.textMuted }} numberOfLines={1}>{item.user?.email}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title={search ? 'No matches found' : 'No members yet'}
            subtitle={search ? 'Try a different search term.' : 'Tap + to add your first member.'}
          />
        }
      />

      <TouchableOpacity
        style={{
          position: 'absolute', bottom: 24, right: 24,
          width: 56, height: 56, borderRadius: 28,
          backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
          shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, elevation: 6,
        }}
        onPress={() => router.push('/(exco)/members/add')}
      >
        <Ionicons name="person-add" size={22} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}
