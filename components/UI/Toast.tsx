import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';
import { MessageService } from "../../services/messageService";

type ToastType = 'success' | 'error' | 'info';
type ToastState = { visible: boolean; title?: string; message?: string; type: ToastType };

const ToastCtx = createContext({
  show: (title: string, message?: string, type?: ToastType) => {},
  showFormattedMessage: (apiMessage: string) => {},
});

export function useToast() { return useContext(ToastCtx); }

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ToastState>({ visible: false, type: 'info' });
  const slide = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(slide, { toValue: -100, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setState(s => ({ ...s, visible: false })));
  }, [slide, opacity]);

  const show = useCallback((title: string, message?: string, type: ToastType = 'info') => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    setState({ visible: true, title, message, type });
    Animated.parallel([
      Animated.timing(slide, { toValue: 0, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    timer.current = setTimeout(hide, 2800);
  }, [hide, slide, opacity]);

  const showFormattedMessage = useCallback((apiMessage: string) => {
    const formattedMessage = MessageService.formatMessage(apiMessage);
    const mappedType: ToastType =
      formattedMessage.type === 'success' ? 'success' :
      formattedMessage.type === 'error' ? 'error' : 'info';
    show(formattedMessage.title || "", formattedMessage.content, mappedType);
  }, [show]);

  const bg =
    state.type === 'success' ? '#10B981' :
    state.type === 'error'   ? '#EF4444' : '#2563EB';

  return (
    <ToastCtx.Provider value={{ show, showFormattedMessage }}>
      {children}
      {state.visible && (
        <Animated.View
          pointerEvents="box-none"
          style={[styles.container, { opacity, transform: [{ translateY: slide }] }]}>
          <View style={[styles.toast, { backgroundColor: bg }]}>
            {!!state.title && <Text style={styles.title}>{state.title}</Text>}
            {!!state.message && <Text style={styles.message}>{state.message}</Text>}
          </View>
        </Animated.View>
      )}
    </ToastCtx.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute', top: Platform.select({ ios: 60, android: 30, default: 30 }), left: 16, right: 16,
    zIndex: 999, alignItems: 'center',
  },
  toast: {
    minWidth: 200, maxWidth: 600, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  title: { color: '#fff', fontWeight: '800', fontSize: 15 },
  message: { color: '#F8FAFC', marginTop: 2, fontSize: 13 },
});
