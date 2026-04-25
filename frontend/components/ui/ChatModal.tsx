import React, { useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useChatModal } from '../../context/ChatContext';
import { useTheme } from '../../context/ThemeContext';

const API_URL = 'https://leo-rag-system.onrender.com/api/v1/chat';

interface Citation {
  document_title: string;
  file_name: string;
  page_number: number;
  excerpt: string;
  relevance_score: number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
  citations?: Citation[];
}

const WELCOME: Message = {
  id: 'welcome',
  role: 'assistant',
  content: "Hi! I'm LeoLink AI. Ask me anything about Leo Club documentation, awards, procedures, or district guidelines.",
};

export function ChatModal() {
  const { isOpen, closeChat } = useChatModal();
  const { colors, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const flatRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [expandedCitations, setExpandedCitations] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isOpen) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      closeChat();
      return true;
    });
    return () => sub.remove();
  }, [isOpen]);

  const send = () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput('');

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    const asstId = (Date.now() + 1).toString();
    const asstMsg: Message = { id: asstId, role: 'assistant', content: '', streaming: true };

    setMessages(prev => {
      const next = [...prev, userMsg, asstMsg];
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
      return next;
    });
    setStreaming(true);

    const history = [...messages, userMsg]
      .filter(m => !m.streaming && m.id !== 'welcome')
      .slice(0, -1)
      .map(m => ({ role: m.role, content: m.content }));

    const xhr = new XMLHttpRequest();
    xhr.open('POST', API_URL, true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    let processed = 0;
    let buffer = '';
    let accumulated = '';

    xhr.onprogress = () => {
      const chunk = xhr.responseText.slice(processed);
      processed = xhr.responseText.length;
      buffer += chunk;

      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        try {
          const json = JSON.parse(trimmed.slice(6));
          if (json.type === 'token') {
            accumulated += json.content;
            const snapshot = accumulated;
            setMessages(prev => prev.map(m => m.id === asstId ? { ...m, content: snapshot } : m));
          } else if (json.type === 'done') {
            const citations: Citation[] = (json.citations ?? []).filter((c: Citation) => c.relevance_score > 0.05);
            setMessages(prev => prev.map(m =>
              m.id === asstId ? { ...m, content: accumulated, streaming: false, citations } : m
            ));
            setStreaming(false);
          }
        } catch {}
      }
    };

    xhr.onloadend = () => {
      setStreaming(false);
      setMessages(prev => prev.map(m => m.id === asstId && m.streaming ? { ...m, streaming: false } : m));
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    };

    xhr.onerror = () => {
      setStreaming(false);
      setMessages(prev => prev.map(m =>
        m.id === asstId ? { ...m, content: 'Something went wrong. Please try again.', streaming: false } : m
      ));
    };

    xhr.send(JSON.stringify({ content: text, history }));
  };

  const toggleCitations = (id: string) =>
    setExpandedCitations(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    const showCitations = expandedCitations.has(item.id);

    return (
      <View style={[styles.row, isUser ? styles.rowUser : styles.rowAsst]}>
        {!isUser && (
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Ionicons name="sparkles" size={14} color="#fff" />
          </View>
        )}
        <View style={[styles.bubble,
          isUser
            ? { backgroundColor: colors.primary, borderBottomRightRadius: 4 }
            : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderBottomLeftRadius: 4 }
        ]}>
          <Text style={[styles.msgText, { color: isUser ? '#fff' : colors.text }]}>
            {item.content}
            {item.streaming && !item.content && <Text style={{ color: colors.textMuted }}> ●●●</Text>}
          </Text>

          {!isUser && item.citations && item.citations.length > 0 && (
            <View style={{ marginTop: 8 }}>
              <TouchableOpacity onPress={() => toggleCitations(item.id)} style={styles.citationToggle}>
                <Ionicons name={showCitations ? 'chevron-up' : 'chevron-down'} size={12} color={colors.textMuted} />
                <Text style={[styles.citationToggleText, { color: colors.textMuted }]}>
                  {item.citations.length} source{item.citations.length > 1 ? 's' : ''}
                </Text>
              </TouchableOpacity>
              {showCitations && item.citations.map((c, i) => (
                <View key={i} style={[styles.citation, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={[styles.citationTitle, { color: colors.primary }]} numberOfLines={1}>
                    {c.file_name.replace('.pdf', '')}
                  </Text>
                  <Text style={[styles.citationMeta, { color: colors.textMuted }]}>Page {c.page_number}</Text>
                  <Text style={[styles.citationExcerpt, { color: colors.textSecondary }]} numberOfLines={3}>
                    {c.excerpt.trim()}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <Modal visible={isOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={closeChat}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border, paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={closeChat} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <View style={[styles.headerIcon, { backgroundColor: colors.primary }]}>
              <Ionicons name="sparkles" size={14} color="#fff" />
            </View>
            <View>
              <Text style={[styles.headerName, { color: colors.text }]}>LeoLink AI</Text>
              <Text style={[styles.headerSub, { color: colors.textMuted }]}>Leo Documentation Assistant</Text>
            </View>
          </View>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={m => m.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
        />

        {/* Input */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.inputRow, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: insets.bottom + 8 }]}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text, borderRadius: radius.full }]}
              placeholder="Ask about Leo documentation..."
              placeholderTextColor={colors.textMuted}
              value={input}
              onChangeText={setInput}
              multiline
              onSubmitEditing={send}
            />
            <Pressable
              onPress={send}
              disabled={!input.trim() || streaming}
              style={[styles.sendBtn, { backgroundColor: input.trim() && !streaming ? colors.primary : colors.border, borderRadius: radius.full }]}
            >
              <Ionicons name={streaming ? 'hourglass-outline' : 'send'} size={18} color="#fff" />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, gap: 12, borderBottomWidth: 1 },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  headerIcon: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  headerName: { fontSize: 15, fontWeight: '700' },
  headerSub: { fontSize: 11 },
  list: { padding: 16, gap: 12 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  rowUser: { justifyContent: 'flex-end' },
  rowAsst: { justifyContent: 'flex-start' },
  avatar: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', alignSelf: 'flex-end' },
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 16 },
  msgText: { fontSize: 14, lineHeight: 20 },
  citationToggle: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: 4 },
  citationToggleText: { fontSize: 11, fontWeight: '600' },
  citation: { marginTop: 6, padding: 8, borderRadius: 8, borderWidth: 1, gap: 2 },
  citationTitle: { fontSize: 11, fontWeight: '700' },
  citationMeta: { fontSize: 10 },
  citationExcerpt: { fontSize: 11, lineHeight: 16 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, gap: 8, borderTopWidth: 1 },
  input: { flex: 1, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, maxHeight: 100, borderWidth: 1 },
  sendBtn: { width: 42, height: 42, justifyContent: 'center', alignItems: 'center' },
});
