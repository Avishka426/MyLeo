import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../../components/ui/AppHeader';
import { useTheme } from '../../context/ThemeContext';

export default function MemberLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      initialRouteName="feed"
      screenOptions={{
        header: () => <AppHeader />,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          title: 'News',
          tabBarIcon: ({ color, size }) => <Ionicons name="newspaper-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="projects/index"
        options={{
          title: 'Projects',
          tabBarIcon: ({ color, size }) => <Ionicons name="folder-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, size }) => <Ionicons name="map-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="help"
        options={{
          title: 'Help',
          tabBarIcon: ({ color, size }) => <Ionicons name="hand-left-outline" size={size} color={color} />,
        }}
      />

      {/* Hidden screens */}
      <Tabs.Screen name="dashboard"        options={{ href: null }} />
      <Tabs.Screen name="projects/[id]"    options={{ href: null }} />
      <Tabs.Screen name="projects/create"  options={{ href: null }} />
      <Tabs.Screen name="profile"          options={{ href: null }} />
    </Tabs>
  );
}
