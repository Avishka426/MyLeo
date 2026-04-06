import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../../components/ui/AppHeader';
import { COLORS } from '../../lib/constants';

export default function ExcoLayout() {
  return (
    <Tabs
      initialRouteName="news/index"
      screenOptions={{
        header: () => <AppHeader />,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: { backgroundColor: COLORS.surface, borderTopColor: COLORS.border },
      }}
    >
      <Tabs.Screen
        name="news/index"
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
        name="club-account"
        options={{
          title: 'Club',
          tabBarIcon: ({ color, size }) => <Ionicons name="shield-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="members/index"
        options={{
          title: 'Members',
          href: null,
          tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen name="members/add" options={{ href: null }} />
      <Tabs.Screen name="members/[id]" options={{ href: null }} />
      <Tabs.Screen name="projects/create" options={{ href: null }} />
      <Tabs.Screen name="projects/[id]" options={{ href: null }} />
      <Tabs.Screen name="news/create" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null, title: 'Profile' }} />
    </Tabs>
  );
}
