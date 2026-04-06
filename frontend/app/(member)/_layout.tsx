import { Stack } from 'expo-router';
import { AppHeader } from '../../components/ui/AppHeader';

export default function MemberLayout() {
  return (
    <Stack
      screenOptions={{
        header: () => <AppHeader />,
      }}
    >
      <Stack.Screen name="dashboard" options={{ headerBackVisible: false }} />
      <Stack.Screen name="projects/index" />
      <Stack.Screen name="projects/[id]" />
      <Stack.Screen name="projects/create" options={{ title: 'New Project' }} />
      <Stack.Screen name="profile" options={{ title: 'Profile' }} />
    </Stack>
  );
}
