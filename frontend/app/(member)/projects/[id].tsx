import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image,
  TouchableOpacity, TextInput, Switch, Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import MapView, { Marker, MapPressEvent } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../lib/api';
import { COLORS } from '../../../lib/constants';
import { Badge } from '../../../components/ui/Badge';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';

interface Project {
  _id: string;
  title: string;
  category: string;
  description: string;
  status: string;
  startDate?: string;
  endDate?: string;
  outcomes?: string;
  media: string[];
  isMapVisible: boolean;
  club: { name: string; clubCode: string };
  location?: { coordinates: [number, number]; address?: string; placeName?: string };
}

interface Coords { latitude: number; longitude: number }

export default function MemberProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Map location state
  const [markerCoords, setMarkerCoords] = useState<Coords | null>(null);
  const [placeName, setPlaceName] = useState('');
  const [address, setAddress] = useState('');
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const [locationExpanded, setLocationExpanded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/projects/${id}`);
        const p: Project = res.data.data;
        setProject(p);
        setIsMapVisible(p.isMapVisible);
        setPlaceName(p.location?.placeName || '');
        setAddress(p.location?.address || '');
        if (p.location?.coordinates?.length === 2) {
          setMarkerCoords({ latitude: p.location.coordinates[1], longitude: p.location.coordinates[0] });
        }
      } catch {
        setError('Failed to load project.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleSaveLocation = async () => {
    if (!markerCoords) {
      Alert.alert('Set Location', 'Tap on the map to place a pin first.');
      return;
    }
    setSavingLocation(true);
    try {
      await api.put(`/projects/${id}/location`, {
        longitude: markerCoords.longitude,
        latitude: markerCoords.latitude,
        placeName, address, isMapVisible,
      });
      Alert.alert('Saved', 'Project location updated on the map.');
      setLocationExpanded(false);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to save location.');
    } finally {
      setSavingLocation(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error || !project) return <Text style={styles.error}>{error || 'Project not found.'}</Text>;

  const hasLocation = project.location?.coordinates?.length === 2;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {project.media?.[0] && (
        <Image source={{ uri: project.media[0] }} style={styles.image} resizeMode="cover" />
      )}

      <Badge label={project.status} status={project.status} />
      <Text style={styles.title}>{project.title}</Text>
      <Text style={styles.club}>{project.club?.name} · {project.club?.clubCode}</Text>
      <Text style={styles.category}>{project.category}</Text>

      <View style={styles.dates}>
        {project.startDate && <Text style={styles.dateText}>Start: {new Date(project.startDate).toLocaleDateString()}</Text>}
        {project.endDate && <Text style={styles.dateText}>End: {new Date(project.endDate).toLocaleDateString()}</Text>}
      </View>

      <Text style={styles.sectionLabel}>Description</Text>
      <Text style={styles.body}>{project.description}</Text>

      {project.outcomes ? (
        <>
          <Text style={styles.sectionLabel}>Outcomes</Text>
          <Text style={styles.body}>{project.outcomes}</Text>
        </>
      ) : null}

      {/* ── Current map view ── */}
      {hasLocation && !locationExpanded && (
        <>
          <Text style={styles.sectionLabel}>Location</Text>
          {project.location!.placeName ? <Text style={styles.location}>{project.location!.placeName}</Text> : null}
          {project.location!.address ? <Text style={styles.locationSub}>{project.location!.address}</Text> : null}
          <MapView
            style={styles.map}
            region={{
              latitude: project.location!.coordinates[1],
              longitude: project.location!.coordinates[0],
              latitudeDelta: 0.02, longitudeDelta: 0.02,
            }}
            scrollEnabled={false}
          >
            <Marker coordinate={{ latitude: project.location!.coordinates[1], longitude: project.location!.coordinates[0] }} />
          </MapView>
        </>
      )}

      {/* ── Set / Edit Map Location ── */}
      <TouchableOpacity style={styles.locationToggle} onPress={() => setLocationExpanded((v) => !v)} activeOpacity={0.7}>
        <Ionicons name="location-outline" size={18} color={COLORS.primary} />
        <Text style={styles.locationToggleText}>
          {hasLocation ? 'Edit Map Location' : 'Set Map Location'}
        </Text>
        <Ionicons name={locationExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.textMuted} style={{ marginLeft: 'auto' }} />
      </TouchableOpacity>

      {locationExpanded && (
        <View style={styles.locationForm}>
          <Text style={styles.hint}>Tap on the map to place the project pin. Drag to adjust.</Text>
          <MapView
            style={styles.editMap}
            initialRegion={
              markerCoords
                ? { ...markerCoords, latitudeDelta: 0.05, longitudeDelta: 0.05 }
                : { latitude: 7.8731, longitude: 80.7718, latitudeDelta: 4, longitudeDelta: 4 }
            }
            onPress={(e: MapPressEvent) => setMarkerCoords(e.nativeEvent.coordinate)}
          >
            {markerCoords && (
              <Marker
                coordinate={markerCoords}
                draggable
                onDragEnd={(e) => setMarkerCoords(e.nativeEvent.coordinate)}
              />
            )}
          </MapView>

          <Text style={styles.fieldLabel}>Place Name</Text>
          <TextInput
            style={styles.input} value={placeName} onChangeText={setPlaceName}
            placeholder="e.g. Colombo City Hall" placeholderTextColor={COLORS.textMuted}
          />

          <Text style={styles.fieldLabel}>Address</Text>
          <TextInput
            style={styles.input} value={address} onChangeText={setAddress}
            placeholder="Street address" placeholderTextColor={COLORS.textMuted}
          />

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Show on Public Map</Text>
            <Switch value={isMapVisible} onValueChange={setIsMapVisible} trackColor={{ true: COLORS.primary }} />
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, savingLocation && { opacity: 0.6 }]}
            onPress={handleSaveLocation}
            disabled={savingLocation}
          >
            <Ionicons name="location-outline" size={18} color="#fff" />
            <Text style={styles.saveBtnText}>{savingLocation ? 'Saving…' : 'Save Location'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40 },
  image: { width: '100%', height: 200, borderRadius: 12, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginTop: 10, marginBottom: 4 },
  club: { fontSize: 13, color: COLORS.primary, fontWeight: '600', marginBottom: 4 },
  category: { fontSize: 13, color: COLORS.textMuted, marginBottom: 8 },
  dates: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  dateText: { fontSize: 12, color: COLORS.textMuted },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginTop: 16, marginBottom: 6 },
  body: { fontSize: 14, color: COLORS.textMuted, lineHeight: 22 },
  location: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  locationSub: { fontSize: 12, color: COLORS.textMuted, marginBottom: 8 },
  map: { width: '100%', height: 200, borderRadius: 12, marginTop: 8 },

  locationToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 14,
    marginTop: 20, borderWidth: 1, borderColor: COLORS.primary + '40',
  },
  locationToggleText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },

  locationForm: { marginTop: 12 },
  hint: { fontSize: 13, color: COLORS.textMuted, marginBottom: 10 },
  editMap: { width: '100%', height: 260, borderRadius: 12, marginBottom: 12 },

  fieldLabel: { fontSize: 12, fontWeight: '600', color: COLORS.text, marginBottom: 6, marginTop: 10 },
  input: {
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: COLORS.text,
  },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, marginBottom: 4 },
  switchLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#1a6b3a', borderRadius: 12, padding: 14, marginTop: 16,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  error: { textAlign: 'center', color: COLORS.error, marginTop: 60 },
});
