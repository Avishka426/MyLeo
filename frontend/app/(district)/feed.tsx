import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ImageGridViewer } from '../../components/ImageGridViewer';
import { ROLES } from '../../lib/constants';

interface NewsPost {
  _id: string;
  title: string;
  content: string;
  images: string[];
  publishedAt: string;
  club: { name: string; clubCode: string };
}

interface EventPost {
  _id: string;
  title: string;
  description?: string;
  images: string[];
  eventDate: string;
  createdBy: { firstName?: string; lastName?: string; email: string };
}

function getCountdown(eventDate: string) {
  const diff = new Date(eventDate).getTime() - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  return { days, hours, minutes };
}

function CountdownBadge({ eventDate }: { eventDate: string }) {
  const { colors } = useTheme();
  const cd = getCountdown(eventDate);
  if (!cd) return null;
  const label = cd.days > 0 ? `${cd.days}d ${cd.hours}h left` : `${cd.hours}h ${cd.minutes}m left`;
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
      backgroundColor: colors.warning + '22', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
    }}>
      <Ionicons name="time-outline" size={12} color={colors.warning} />
      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.warning }}>{label}</Text>
    </View>
  );
}

type Tab = 'news' | 'events';

export default function DistrictFeedScreen() {
  const { user } = useAuth();
  const { colors, radius } = useTheme();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('events');
  const [news, setNews] = useState<NewsPost[]>([]);
  const [events, setEvents] = useState<EventPost[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const isExco = user?.role === ROLES.DISTRICT_EXCO;

  const fetchNews = useCallback(async () => { const r = await api.get('/news'); setNews(r.data.data); }, []);
  const fetchEvents = useCallback(async () => { const r = await api.get('/events'); setEvents(r.data.data); }, []);

  const fetchAll = useCallback(async () => {
    try { setError(''); await Promise.all([fetchNews(), fetchEvents()]); }
    catch { setError('Failed to load. Pull to refresh.'); }
  }, [fetchNews, fetchEvents]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  const onRefresh = async () => { setRefreshing(true); await fetchAll(); setRefreshing(false); };

  const handleDeleteEvent = (id: string) => {
    Alert.alert('Delete Event', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await api.delete(`/events/${id}`);
        setEvents((prev) => prev.filter((e) => e._id !== id));
      }},
    ]);
  };

  const renderNews = ({ item }: { item: NewsPost }) => (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 8 }}>
          <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
        </View>
        <Text style={{ fontSize: 13, color: colors.primary, fontWeight: '700', flex: 1 }}>{item.club?.name}</Text>
        <Text style={{ fontSize: 11, color: colors.textMuted }}>
          {new Date(item.publishedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
        </Text>
      </View>
      <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 6 }}>{item.title}</Text>
      <Text style={{ fontSize: 14, color: colors.textMuted, lineHeight: 20, marginBottom: 10 }} numberOfLines={3}>{item.content}</Text>
      <ImageGridViewer images={item.images ?? []} />
    </Card>
  );

  const renderEvent = ({ item }: { item: EventPost }) => {
    const name = item.createdBy?.firstName
      ? `${item.createdBy.firstName} ${item.createdBy.lastName}`
      : item.createdBy?.email;
    return (
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.accent + '33', justifyContent: 'center', alignItems: 'center', marginRight: 8 }}>
            <Ionicons name="calendar" size={14} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: colors.textMuted, fontWeight: '600' }}>{name}</Text>
            <Text style={{ fontSize: 11, color: colors.textMuted }}>
              {new Date(item.eventDate).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
          </View>
          {isExco && (
            <TouchableOpacity onPress={() => handleDeleteEvent(item._id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="trash-outline" size={18} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>
        <Text style={{ fontSize: 17, fontWeight: '800', color: colors.text, marginBottom: 6 }}>{item.title}</Text>
        {item.description ? (
          <Text style={{ fontSize: 14, color: colors.textMuted, lineHeight: 20, marginBottom: 10 }}>{item.description}</Text>
        ) : null}
        <ImageGridViewer images={item.images ?? []} />
        <View style={{ marginTop: 10 }}>
          <CountdownBadge eventDate={item.eventDate} />
        </View>
      </Card>
    );
  };

  const TabBtn = ({ label, value, icon }: { label: string; value: Tab; icon: any }) => (
    <TouchableOpacity
      style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, paddingVertical: 10, borderRadius: radius.md,
        backgroundColor: tab === value ? colors.primary : 'transparent' }}
      onPress={() => setTab(value)} activeOpacity={0.7}
    >
      <Ionicons name={icon} size={15} color={tab === value ? '#fff' : colors.textMuted} />
      <Text style={{ fontSize: 13, fontWeight: '700', color: tab === value ? '#fff' : colors.textMuted }}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: 'row', margin: 16, marginBottom: 8,
        backgroundColor: colors.card, borderRadius: radius.md, padding: 4,
        borderWidth: 1, borderColor: colors.border }}>
        <TabBtn label="Events" value="events" icon="calendar-outline" />
        <TabBtn label="News" value="news" icon="newspaper-outline" />
        
      </View>

      {error ? <Text style={{ color: colors.error, textAlign: 'center', paddingHorizontal: 16, fontSize: 13 }}>{error}</Text> : null}

      {tab === 'news' ? (
        <FlatList
          data={news} keyExtractor={(i) => i._id} renderItem={renderNews}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={<EmptyState icon="newspaper-outline" title="No news yet" subtitle="Check back soon." />}
        />
      ) : (
        <FlatList
          data={events} keyExtractor={(i) => i._id} renderItem={renderEvent}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={<EmptyState icon="calendar-outline" title="No upcoming events" subtitle="Events created by exco will appear here." />}
        />
      )}

      {isExco && tab === 'events' && (
        <TouchableOpacity
          style={{ position: 'absolute', bottom: 24, right: 20, width: 54, height: 54,
            borderRadius: 27, backgroundColor: colors.primary,
            justifyContent: 'center', alignItems: 'center',
            shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6,
            shadowOffset: { width: 0, height: 3 }, elevation: 6 }}
          onPress={() => router.push('/(district)/create-event' as any)}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}
