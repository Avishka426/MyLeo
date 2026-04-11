import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, Switch, Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import MapView, { Marker, MapPressEvent } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../lib/api';
import { useTheme } from '../../../context/ThemeContext';
import { PROJECT_STATUSES } from '../../../lib/constants';
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
  const { colors, radius } = useTheme();
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
    setSaving(true); setError('');
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
      await api.put(`/projects/${id}/location`, { longitude: markerCoords.longitude, latitude: markerCoords.latitude, placeName, address, isMapVisible });
      Alert.alert('Location Saved', 'Project location updated on the map.');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to save location.');
    } finally { setSavingLocation(false); }
  };

  if (loading) return <LoadingSpinner />;
  if (error || !project) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <Text style={{ color: colors.error, fontSize: 14 }}>{error || 'Not found.'}</Text>
    </View>
  );

  const inputStyle = {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.text,
  };
  const labelStyle = { fontSize: 12, fontWeight: '600' as const, color: colors.textSecondary, marginBottom: 6, marginTop: 12 };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text, flex: 1, marginRight: 8 }}>{project.title}</Text>
        <Badge label={project.status} status={project.status} />
      </View>

      <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 12 }}>Edit Details</Text>

      <Text style={labelStyle}>Title</Text>
      <TextInput style={inputStyle} value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} placeholderTextColor={colors.textMuted} />

      <Text style={labelStyle}>Status</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
        {PROJECT_STATUSES.map((s) => (
          <TouchableOpacity
            key={s}
            style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.full, borderWidth: 1, borderColor: form.status === s ? colors.primary : colors.border, backgroundColor: form.status === s ? colors.primary : colors.card }}
            onPress={() => setForm({ ...form, status: s })}
          >
            <Text style={{ fontSize: 13, color: form.status === s ? '#fff' : colors.textMuted, fontWeight: '600' }}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={labelStyle}>Description</Text>
      <TextInput style={[inputStyle, { height: 90, paddingTop: 12, textAlignVertical: 'top' }]} value={form.description} onChangeText={(v) => setForm({ ...form, description: v })} multiline numberOfLines={4} placeholderTextColor={colors.textMuted} />

      <Text style={labelStyle}>Outcomes</Text>
      <TextInput style={[inputStyle, { height: 80, paddingTop: 12, textAlignVertical: 'top' }]} value={form.outcomes} onChangeText={(v) => setForm({ ...form, outcomes: v })} multiline numberOfLines={3} placeholderTextColor={colors.textMuted} />

      {error ? <Text style={{ color: colors.error, fontSize: 13, marginTop: 8 }}>{error}</Text> : null}

      <TouchableOpacity
        style={{ flexDirection: 'row', backgroundColor: colors.primary, borderRadius: radius.md, padding: 16, alignItems: 'center', justifyContent: 'center', marginTop: 16, opacity: saving ? 0.6 : 1 }}
        onPress={handleSave} disabled={saving}
      >
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{saving ? 'Saving…' : 'Save Project'}</Text>
      </TouchableOpacity>

      <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 24 }} />
      <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 12 }}>Map Location</Text>
      <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: 12 }}>Tap on the map to set the project location pin.</Text>

      <MapView
        style={{ width: '100%', height: 260, borderRadius: 12, marginBottom: 4 }}
        initialRegion={markerCoords ? { ...markerCoords, latitudeDelta: 0.05, longitudeDelta: 0.05 } : { latitude: 7.8731, longitude: 80.7718, latitudeDelta: 4, longitudeDelta: 4 }}
        onPress={(e: MapPressEvent) => setMarkerCoords(e.nativeEvent.coordinate)}
      >
        {markerCoords && <Marker coordinate={markerCoords} draggable onDragEnd={(e) => setMarkerCoords(e.nativeEvent.coordinate)} />}
      </MapView>

      <Text style={labelStyle}>Place Name</Text>
      <TextInput style={inputStyle} value={placeName} onChangeText={setPlaceName} placeholder="e.g. Colombo City Hall" placeholderTextColor={colors.textMuted} />

      <Text style={labelStyle}>Address</Text>
      <TextInput style={inputStyle} value={address} onChangeText={setAddress} placeholder="Street address" placeholderTextColor={colors.textMuted} />

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>Show on Public Map</Text>
        <Switch value={isMapVisible} onValueChange={setIsMapVisible} trackColor={{ true: colors.primary }} />
      </View>

      <TouchableOpacity
        style={{ flexDirection: 'row', backgroundColor: colors.success, borderRadius: radius.md, padding: 16, alignItems: 'center', justifyContent: 'center', marginTop: 16, opacity: savingLocation ? 0.6 : 1 }}
        onPress={handleSaveLocation} disabled={savingLocation}
      >
        <Ionicons name="location-outline" size={18} color="#fff" />
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15, marginLeft: 8 }}>{savingLocation ? 'Saving…' : 'Save Location'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
