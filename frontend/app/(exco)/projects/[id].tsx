import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, Switch, Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import WebView from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../lib/api';
import { buildLocationPickerHTML } from '../../../lib/mapHtml';
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

export default function EditProjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, radius } = useTheme();
  const webViewRef = useRef<WebView>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [form, setForm] = useState({ title: '', description: '', status: 'upcoming', outcomes: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [markerCoords, setMarkerCoords] = useState<Coords | null>(null);
  const [tempCoords, setTempCoords] = useState<Coords | null>(null);
  const [placeName, setPlaceName] = useState('');
  const [address, setAddress] = useState('');
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [mapKey, setMapKey] = useState(0);
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

  const openMapModal = () => {
    setTempCoords(markerCoords);
    setMapKey((k) => k + 1);
    setMapModalVisible(true);
  };

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
    if (!markerCoords) { Alert.alert('No location', 'Open the map and drop a pin first.'); return; }
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
    <>
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text, flex: 1, marginRight: 8 }}>{project.title}</Text>
          <Badge label={project.status} status={project.status} />
        </View>

        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 12 }}>Edit Details</Text>

        <Text style={labelStyle}>Title</Text>
        <TextInput style={inputStyle} value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} placeholderTextColor={colors.textMuted} />

        <Text style={labelStyle}>Status</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
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

        {/* Location picker button */}
        <TouchableOpacity
          onPress={openMapModal}
          style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            borderWidth: 1.5, borderColor: colors.primary, borderRadius: radius.md,
            paddingVertical: 14, backgroundColor: colors.primary + '10', marginBottom: 12,
          }}
        >
          <Ionicons name="map-outline" size={18} color={colors.primary} />
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.primary }}>
            {markerCoords ? 'Edit Location on Map' : 'Set Location on Map'}
          </Text>
        </TouchableOpacity>

        {markerCoords && (
          <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 12, textAlign: 'center' }}>
            📍 {markerCoords.latitude.toFixed(5)}, {markerCoords.longitude.toFixed(5)}
          </Text>
        )}

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

      {/* Full-screen map modal */}
      <Modal visible={mapModalVisible} animationType="slide" statusBarTranslucent>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <TouchableOpacity onPress={() => setMapModalVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>Set Location</Text>
            <Text style={{ fontSize: 13, color: colors.textMuted }}>Tap to pin</Text>
          </View>

          {/* Map */}
          <WebView
            key={mapKey}
            ref={webViewRef}
            source={{ html: buildLocationPickerHTML(tempCoords?.latitude ?? null, tempCoords?.longitude ?? null) }}
            style={{ flex: 1 }}
            onMessage={(event) => {
              try {
                const { lat, lng } = JSON.parse(event.nativeEvent.data);
                setTempCoords({ latitude: lat, longitude: lng });
              } catch {}
            }}
            javaScriptEnabled
            originWhitelist={['*']}
            mixedContentMode="always"
          />

          {/* Bottom bar */}
          <View style={{ backgroundColor: colors.card, padding: 16, borderTopWidth: 1, borderTopColor: colors.border }}>
            {tempCoords && (
              <Text style={{ fontSize: 12, color: colors.textMuted, textAlign: 'center', marginBottom: 12 }}>
                📍 {tempCoords.latitude.toFixed(5)}, {tempCoords.longitude.toFixed(5)}
              </Text>
            )}
            <TouchableOpacity
              onPress={() => {
                if (tempCoords) setMarkerCoords(tempCoords);
                setMapModalVisible(false);
              }}
              style={{
                backgroundColor: tempCoords ? colors.primary : colors.border,
                borderRadius: radius.md, paddingVertical: 16,
                alignItems: 'center', justifyContent: 'center',
              }}
              disabled={!tempCoords}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
                {tempCoords ? 'Save Location' : 'Tap the map to place a pin'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}
