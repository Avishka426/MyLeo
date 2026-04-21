import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Dimensions, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { useTheme } from '../../context/ThemeContext';
import { STATUS_COLORS } from '../../lib/theme';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { PROJECT_STATUSES } from '../../lib/constants';
import DropDownPicker from 'react-native-dropdown-picker';

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
  const { colors, radius } = useTheme();
  const items = PROJECT_STATUSES.map((status) => ({
  label: status.charAt(0).toUpperCase() + status.slice(1),
  value: status,
}));
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);


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
  console.log(value);
  

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  if (loading) return <LoadingSpinner />;

  if (error) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: colors.background }}>
      <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
      <Text style={{ color: colors.error, marginTop: 12, fontSize: 15, textAlign: 'center' }}>{error}</Text>
      <TouchableOpacity
        style={{ marginTop: 20, backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: radius.md }}
        onPress={fetchProjects}
      >
        <Text style={{ color: '#fff', fontWeight: '700' }}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ width, height }}
        initialRegion={{ latitude: 7.8731, longitude: 80.7718, latitudeDelta: 4, longitudeDelta: 4 }}
        onPress={() => setSelected(null)}
      >
        {projects.map((p) => (
          <Marker
            key={p.id}
            coordinate={{ latitude: p.location.coordinates[1], longitude: p.location.coordinates[0] }}
            pinColor={STATUS_COLORS[p.status] || colors.primary}
            onPress={(e) => { e.stopPropagation(); setSelected(p); }}
          />
        ))}
      </MapView>

      {/* Project count badge */}
      <View style={{
        position: 'absolute', top: 12, right: 12,
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.card, paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: radius.full, borderWidth: 1, borderColor: colors.border,
        shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
      }}>
        <Ionicons name="location" size={14} color={colors.primary} />
        <Text style={{ fontSize: 12, color: colors.text, fontWeight: '600', marginLeft: 4 }}>
          {projects.length} project{projects.length !== 1 ? 's' : ''}
        </Text>
      </View>

    {/* <View style={{
        position: 'absolute', top:50, right: 12,
        // flexDirection: 'row', alignItems: 'center',
        // backgroundColor: colors.card, paddingHorizontal: 12, paddingVertical: 6,
        // borderRadius: radius.full, borderWidth: 1, borderColor: colors.border,
        // shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
      }}>

        <DropDownPicker
          open={open}
          value={value}
          items={items}
          setOpen={setOpen}
          setValue={setValue}
          setItems={() => {}}
          placeholder="Select project status"
          style={{
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: 20,
            width: 165,
          }}
          dropDownContainerStyle={{
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: 12,
            width: 165,
          }}
          textStyle={{
            color: colors.text,
            fontWeight: '600',
            fontSize: 12,
          }}
        />
      </View> */}

      {/* Selected project card */}
      {selected && (
        <View style={{
          position: 'absolute', bottom: 24, left: 16, right: 16,
          backgroundColor: colors.card, borderRadius: radius.xl, padding: 16,
          borderWidth: 1, borderColor: colors.border,
          shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, flex: 1, marginRight: 8 }} numberOfLines={2}>
              {selected.title}
            </Text>
            <TouchableOpacity onPress={() => setSelected(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '600', marginBottom: 10 }}>
            {selected.club?.name}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
            <View style={{ backgroundColor: colors.background, borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textMuted }}>{selected.category}</Text>
            </View>
            <View style={{ backgroundColor: (STATUS_COLORS[selected.status] || colors.primary) + '20', borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: STATUS_COLORS[selected.status] || colors.primary }}>
                {selected.status.toUpperCase()}
              </Text>
            </View>
          </View>
          {selected.location.placeName && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="location-outline" size={13} color={colors.textMuted} />
              <Text style={{ fontSize: 12, color: colors.textMuted, flex: 1 }}>{selected.location.placeName}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
