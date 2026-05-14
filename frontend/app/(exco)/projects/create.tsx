import React, { useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Alert, Switch, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import WebView from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../lib/api';
import { buildLocationPickerHTML } from '../../../lib/mapHtml';
import { useTheme } from '../../../context/ThemeContext';
import { PROJECT_STATUSES } from '../../../lib/constants';

const CATEGORIES = ['Community Service', 'Environment', 'Health', 'Education', 'Disaster Relief', 'Youth Development', 'Other'];

interface Coords { latitude: number; longitude: number }

export default function CreateProjectScreen() {
  const router = useRouter();
  const { colors, radius } = useTheme();
  const webViewRef = useRef<WebView>(null);
  const [form, setForm] = useState({ title: '', category: 'Community Service', description: '', status: 'upcoming', outcomes: '' });
  const [loading, setLoading] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [error, setError] = useState('');
  const [markerCoords, setMarkerCoords] = useState<Coords | null>(null);
  const [tempCoords, setTempCoords] = useState<Coords | null>(null);
  const [placeName, setPlaceName] = useState('');
  const [address, setAddress] = useState('');
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [mapKey, setMapKey] = useState(0);

  const openMapModal = () => {
    setTempCoords(markerCoords);
    setMapKey((k) => k + 1);
    setMapModalVisible(true);
  };

  const handleCreate = async () => {
    if (!form.title || !form.description) { setError('Title and description are required.'); return; }
    setLoading(true); setError('');
    try {
      const res = await api.post('/projects', form);
      const projectId = res.data.data._id;
      if (markerCoords) {
        await api.put(`/projects/${projectId}/location`, { longitude: markerCoords.longitude, latitude: markerCoords.latitude, placeName, address, isMapVisible });
      }
      Alert.alert('Created!', 'Project created successfully.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to create project.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.text,
  };
  const labelStyle = { fontSize: 13, fontWeight: '600' as const, color: colors.textSecondary, marginBottom: 6, marginTop: 14 };

  const PickerField = ({ label, value, options, visible, onToggle, onSelect }: any) => (
    <>
      <Text style={labelStyle}>{label}</Text>
      <TouchableOpacity style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', ...inputStyle }} onPress={onToggle}>
        <Text style={{ fontSize: 15, color: colors.text }}>{value}</Text>
        <Ionicons name={visible ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
      </TouchableOpacity>
      {visible && (
        <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, marginTop: 4 }}>
          {options.map((opt: string) => (
            <TouchableOpacity
              key={opt}
              style={{ paddingHorizontal: 14, paddingVertical: 11, backgroundColor: value === opt ? colors.primaryLight : undefined }}
              onPress={() => onSelect(opt)}
            >
              <Text style={{ fontSize: 14, color: value === opt ? colors.primary : colors.text, fontWeight: value === opt ? '700' : '400' }}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </>
  );

  return (
    <>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 16 }}>New Project</Text>
          {error ? <Text style={{ color: colors.error, fontSize: 13, marginBottom: 10 }}>{error}</Text> : null}

          <Text style={labelStyle}>Title *</Text>
          <TextInput style={inputStyle} value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} placeholder="Project title" placeholderTextColor={colors.textMuted} />

          <PickerField
            label="Category" value={form.category} options={CATEGORIES}
            visible={showCategoryPicker} onToggle={() => setShowCategoryPicker(!showCategoryPicker)}
            onSelect={(v: string) => { setForm({ ...form, category: v }); setShowCategoryPicker(false); }}
          />
          <PickerField
            label="Status" value={form.status} options={[...PROJECT_STATUSES]}
            visible={showStatusPicker} onToggle={() => setShowStatusPicker(!showStatusPicker)}
            onSelect={(v: string) => { setForm({ ...form, status: v }); setShowStatusPicker(false); }}
          />

          <Text style={labelStyle}>Description *</Text>
          <TextInput style={[inputStyle, { height: 100, paddingTop: 12, textAlignVertical: 'top' }]} value={form.description} onChangeText={(v) => setForm({ ...form, description: v })} placeholder="Describe the project…" multiline numberOfLines={5} placeholderTextColor={colors.textMuted} />

          <Text style={labelStyle}>Outcomes (optional)</Text>
          <TextInput style={[inputStyle, { height: 80, paddingTop: 12, textAlignVertical: 'top' }]} value={form.outcomes} onChangeText={(v) => setForm({ ...form, outcomes: v })} placeholder="Expected outcomes…" multiline numberOfLines={3} placeholderTextColor={colors.textMuted} />

          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 24 }} />
          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 12 }}>Map Location (optional)</Text>

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
            <>
              <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 12, textAlign: 'center' }}>
                📍 {markerCoords.latitude.toFixed(5)}, {markerCoords.longitude.toFixed(5)}
              </Text>

              <Text style={labelStyle}>Place Name</Text>
              <TextInput style={inputStyle} value={placeName} onChangeText={setPlaceName} placeholder="e.g. Colombo City Hall" placeholderTextColor={colors.textMuted} />

              <Text style={labelStyle}>Address</Text>
              <TextInput style={inputStyle} value={address} onChangeText={setAddress} placeholder="Street address" placeholderTextColor={colors.textMuted} />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>Show on Public Map</Text>
                <Switch value={isMapVisible} onValueChange={setIsMapVisible} trackColor={{ true: colors.primary }} />
              </View>

              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }} onPress={() => setMarkerCoords(null)}>
                <Ionicons name="close-circle-outline" size={16} color={colors.error} />
                <Text style={{ fontSize: 13, color: colors.error }}>Remove pin</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={{ backgroundColor: colors.primary, borderRadius: radius.md, padding: 16, alignItems: 'center', marginTop: 28, opacity: loading ? 0.6 : 1 }}
            onPress={handleCreate} disabled={loading}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{loading ? 'Creating…' : 'Create Project'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={mapModalVisible} animationType="slide" statusBarTranslucent>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <TouchableOpacity onPress={() => setMapModalVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>Set Location</Text>
            <Text style={{ fontSize: 13, color: colors.textMuted }}>Tap to pin</Text>
          </View>

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

          <View style={{ backgroundColor: colors.card, padding: 16, borderTopWidth: 1, borderTopColor: colors.border }}>
            {tempCoords && (
              <Text style={{ fontSize: 12, color: colors.textMuted, textAlign: 'center', marginBottom: 12 }}>
                📍 {tempCoords.latitude.toFixed(5)}, {tempCoords.longitude.toFixed(5)}
              </Text>
            )}
            <TouchableOpacity
              onPress={() => { if (tempCoords) setMarkerCoords(tempCoords); setMapModalVisible(false); }}
              style={{ backgroundColor: tempCoords ? colors.primary : colors.border, borderRadius: radius.md, paddingVertical: 16, alignItems: 'center' }}
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
