import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../../components/ui/AppHeader';
import { useTheme } from '../../context/ThemeContext';

export default function DistrictLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      initialRouteName="summary"
      screenOptions={{
        header: () => <AppHeader />,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen
        name="summary"
        options={{
          title: 'Summary',
          tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, size }) => <Ionicons name="newspaper-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="clubs/index"
        options={{
          title: 'Clubs',
          tabBarIcon: ({ color, size }) => <Ionicons name="shield-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Project Map',
          tabBarIcon: ({ color, size }) => <Ionicons name="map-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen name="clubs/[id]" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="create-event" options={{ href: null, headerShown: false }} />
      
    </Tabs>
  );
}
