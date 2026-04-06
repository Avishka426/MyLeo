import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Switch, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MapView, { Marker, MapPressEvent } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../lib/api';
import { COLORS, PROJECT_STATUSES } from '../../../lib/constants';
import { Badge } from '../../../components/ui/Badge';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';

interface Project {
  _id: string;
  title: string;
  category: string;
  description: string;
  status: string;
  outcomes?: string;
  isMapVisible: boolean;
  location?: { coordinates: [number, number]; address?: string; placeName?: string };
}

interface Coords { latitude: number; longitude: number }

export default function MemberProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [form, setForm] = useState({ title: '', description: '', status: 'upcoming', outcomes: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [markerCoords, setMarkerCoords] = useState<Coords | null>(null);
  const [placeName, setPlaceName] = useState('');
  const [address, setAddress] = useState('');
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/projects/${id}`);
        const p: Project = res.data.data;
        setProject(p);
        setForm({ title: p.title, description: p.description, status: p.status, outcomes: p.outcomes || '' });
        setIsMapVisible(p.isMapVisible);
        setPlaceName(p.location?.placeName || '');
        setAddress(p.location?.address || '');
        if (p.location?.coordinates?.length === 2) {
          setMarkerCoords({ latitude: p.location.coordinates[1], longitude: p.location.coordinates[0] });
        }
      } catch { setError('Failed to load project.'); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await api.put(`/projects/${id}`, form);
      Alert.alert('Saved', 'Project updated.');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to save.');
    } finally { setSaving(false); }
  };

  const handleSaveLocation = async () => {
    if (!markerCoords) { Alert.alert('Tap the map', 'Tap on the map to set the project location first.'); return; }
    setSavingLocation(true);
    try {
      await api.put(`/projects/${id}/location`, {
        longitude: markerCoords.longitude, latitude: markerCoords.latitude,
        placeName, address, isMapVisible,
      });
      Alert.alert('Location Saved', 'Project location updated on the map.');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to save location.');
    } finally { setSavingLocation(false); }
  };

  if (loading) return <LoadingSpinner />;
  if (error || !project) return <Text style={styles.error}>{error || 'Not found.'}</Text>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.titleRow}>
        <Text style={styles.heading}>{project.title}</Text>
        <Badge label={project.status} status={project.status} />
      </View>

      <Text style={styles.sectionTitle}>Edit Details</Text>

      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input} value={form.title}
        onChangeText={(v) => setForm({ ...form, title: v })}
        placeholderTextColor={COLORS.textMuted}
      />

      <Text style={styles.label}>Status</Text>
      <View style={styles.statusRow}>
        {PROJECT_STATUSES.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.statusBtn, form.status === s && styles.statusActive]}
            onPress={() => setForm({ ...form, status: s })}
          >
            <Text style={[styles.statusText, form.status === s && styles.statusTextActive]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textarea]} value={form.description}
        onChangeText={(v) => setForm({ ...form, description: v })}
        multiline numberOfLines={4} textAlignVertical="top" placeholderTextColor={COLORS.textMuted}
      />

      <Text style={styles.label}>Outcomes</Text>
      <TextInput
        style={[styles.input, styles.textarea]} value={form.outcomes}
        onChangeText={(v) => setForm({ ...form, outcomes: v })}
        multiline numberOfLines={3} textAlignVertical="top" placeholderTextColor={COLORS.textMuted}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity style={[styles.btn, saving && styles.disabled]} onPress={handleSave} disabled={saving}>
        <Text style={styles.btnText}>{saving ? 'Saving…' : 'Save Project'}</Text>
      </TouchableOpacity>

      <View style={styles.divider} />
      <Text style={styles.sectionTitle}>Map Location</Text>
      <Text style={styles.hint}>Tap on the map to set the project location pin.</Text>

      <MapView
        style={styles.map}
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

      <Text style={styles.label}>Place Name</Text>
      <TextInput
        style={styles.input} value={placeName} onChangeText={setPlaceName}
        placeholder="e.g. Colombo City Hall" placeholderTextColor={COLORS.textMuted}
      />

      <Text style={styles.label}>Address</Text>
      <TextInput
        style={styles.input} value={address} onChangeText={setAddress}
        placeholder="Street address" placeholderTextColor={COLORS.textMuted}
      />

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Show on Public Map</Text>
        <Switch value={isMapVisible} onValueChange={setIsMapVisible} trackColor={{ true: COLORS.primary }} />
      </View>

      <TouchableOpacity
        style={[styles.btn, styles.locationBtn, savingLocation && styles.disabled]}
        onPress={handleSaveLocation}
        disabled={savingLocation}
      >
        <Ionicons name="location-outline" size={18} color="#fff" />
        <Text style={[styles.btnText, { marginLeft: 8 }]}>{savingLocation ? 'Saving…' : 'Save Location'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  heading: { fontSize: 20, fontWeight: '800', color: COLORS.text, flex: 1, marginRight: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '600', color: COLORS.text, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: COLORS.text,
  },
  textarea: { height: 90, paddingTop: 12 },
  statusRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  statusBtn: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface,
  },
  statusActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  statusText: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600' },
  statusTextActive: { color: '#fff' },
  btn: {
    flexDirection: 'row', backgroundColor: COLORS.primary, borderRadius: 12,
    padding: 16, alignItems: 'center', justifyContent: 'center', marginTop: 16,
  },
  locationBtn: { backgroundColor: '#1a6b3a' },
  disabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 24 },
  hint: { fontSize: 13, color: COLORS.textMuted, marginBottom: 12 },
  map: { width: '100%', height: 260, borderRadius: 12, marginBottom: 4 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  switchLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  errorText: { color: COLORS.error, fontSize: 13, marginTop: 8 },
  error: { textAlign: 'center', color: COLORS.error, marginTop: 60 },
});
