import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../lib/api';
import { COLORS } from '../../../lib/constants';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';

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

function getAvatarColor(position: string) {
  return POSITION_COLORS[position] || COLORS.primary;
}

export default function MemberListScreen() {
  const [members, setMembers] = useState<Member[]>([]);
  const [filtered, setFiltered] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const router = useRouter();

  const fetchMembers = useCallback(async () => {
    try {
      const res = await api.get('/members');
      setMembers(res.data.data);
      setFiltered(res.data.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      members.filter((m) =>
        `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) ||
        m.position.toLowerCase().includes(q) ||
        m.user?.email?.toLowerCase().includes(q)
      )
    );
  }, [search, members]);

  const onRefresh = async () => { setRefreshing(true); await fetchMembers(); setRefreshing(false); };

  const activeCount = members.filter((m) => m.isActive).length;

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{members.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: COLORS.success }]}>{activeCount}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: COLORS.error }]}>{members.length - activeCount}</Text>
          <Text style={styles.statLabel}>Inactive</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={16} color={COLORS.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, position…"
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push({ pathname: '/(exco)/members/[id]', params: { id: item._id } })}
            activeOpacity={0.7}
          >
            {/* Avatar */}
            <View style={[styles.avatar, { backgroundColor: getAvatarColor(item.position) }]}>
              <Text style={styles.avatarText}>{getInitials(item.firstName, item.lastName)}</Text>
            </View>

            {/* Info */}
            <View style={styles.info}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{item.firstName} {item.lastName}</Text>
                {!item.isActive && (
                  <View style={styles.inactiveBadge}>
                    <Text style={styles.inactiveBadgeText}>Inactive</Text>
                  </View>
                )}
              </View>
              <Text style={styles.position}>{item.position}</Text>
              <Text style={styles.email} numberOfLines={1}>{item.user?.email}</Text>
            </View>

            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color={COLORS.border} />
            <Text style={styles.empty}>{search ? 'No members match your search.' : 'No members yet.'}</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/(exco)/members/add')}>
        <Ionicons name="person-add" size={22} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  statsBar: {
    flexDirection: 'row', backgroundColor: COLORS.surface,
    marginHorizontal: 16, marginTop: 16, borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '800', color: COLORS.primary },
  statLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: COLORS.border },

  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface, marginHorizontal: 16, marginTop: 12,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: COLORS.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text },

  list: { padding: 16, paddingBottom: 100 },

  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 14,
    marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 16 },

  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  name: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  inactiveBadge: {
    backgroundColor: COLORS.error + '18', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 1,
  },
  inactiveBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.error },
  position: { fontSize: 12, color: COLORS.primary, fontWeight: '600', marginBottom: 2 },
  email: { fontSize: 11, color: COLORS.textMuted },

  emptyContainer: { alignItems: 'center', marginTop: 60, gap: 12 },
  empty: { color: COLORS.textMuted, fontSize: 14 },

  fab: {
    position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
});
