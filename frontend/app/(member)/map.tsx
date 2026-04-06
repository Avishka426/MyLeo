import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { COLORS, STATUS_COLORS } from '../../lib/constants';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

interface MapProject {
  id: string;
  title: string;
  category: string;
  status: string;
  club: { name: string; clubCode: string };
  location: { coordinates: [number, number]; address?: string; placeName?: string };
}

const { width, height } = Dimensions.get('window');

export default function MapScreen() {
  const [projects, setProjects] = useState<MapProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<MapProject | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setError('');
      const res = await api.get('/map/projects');
      setProjects(res.data.data);
    } catch {
      setError('Failed to load map data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchProjects}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <MapView
            style={styles.map}
            initialRegion={{ latitude: 7.8731, longitude: 80.7718, latitudeDelta: 4, longitudeDelta: 4 }}
            onPress={() => setSelected(null)}
          >
            {projects.map((p) => (
              <Marker
                key={p.id}
                coordinate={{ latitude: p.location.coordinates[1], longitude: p.location.coordinates[0] }}
                pinColor={STATUS_COLORS[p.status] || COLORS.primary}
                onPress={(e) => { e.stopPropagation(); setSelected(p); }}
              />
            ))}
          </MapView>

          <View style={styles.badge}>
            <Ionicons name="location" size={14} color={COLORS.primary} />
            <Text style={styles.badgeText}> {projects.length} project{projects.length !== 1 ? 's' : ''} on map</Text>
          </View>

          {selected && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle} numberOfLines={2}>{selected.title}</Text>
                <TouchableOpacity onPress={() => setSelected(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close" size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
              <Text style={styles.cardClub}>{selected.club?.name}</Text>
              <View style={styles.cardRow}>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{selected.category}</Text>
                </View>
                <View style={[styles.tag, { backgroundColor: (STATUS_COLORS[selected.status] || COLORS.primary) + '20' }]}>
                  <Text style={[styles.tagText, { color: STATUS_COLORS[selected.status] || COLORS.primary }]}>
                    {selected.status.toUpperCase()}
                  </Text>
                </View>
              </View>
              {selected.location.placeName ? (
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={13} color={COLORS.textMuted} />
                  <Text style={styles.locationText}>{selected.location.placeName}</Text>
                </View>
              ) : null}
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width, height },
  badge: {
    position: 'absolute', top: 12, right: 12, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  badgeText: { fontSize: 12, color: COLORS.text, fontWeight: '600' },

  // Bottom card
  card: {
    position: 'absolute', bottom: 24, left: 16, right: 16,
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, flex: 1, marginRight: 8 },
  cardClub: { fontSize: 12, color: COLORS.primary, fontWeight: '600', marginBottom: 10 },
  cardRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  tag: { backgroundColor: COLORS.background, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 12, color: COLORS.textMuted, flex: 1 },

  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: COLORS.background },
  errorText: { color: COLORS.error, marginTop: 12, fontSize: 15, textAlign: 'center' },
  retryBtn: { marginTop: 20, backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  retryText: { color: '#fff', fontWeight: '700' },
});
