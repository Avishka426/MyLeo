import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { ChatProvider } from '../context/ChatContext';
import { ChatModal } from '../components/ui/ChatModal';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ChatProvider>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }} />
          <ChatModal />
        </ChatProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
