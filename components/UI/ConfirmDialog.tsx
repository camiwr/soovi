import React, { createContext, useContext, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type State = { visible: boolean; title: string; message?: string; onConfirm?: () => void; confirmText?: string; cancelText?: string; };
const Ctx = createContext<{ confirm: (opts: Omit<State, 'visible'>) => void }>({ confirm: () => {} });

export function useConfirm() { return useContext(Ctx); }

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [s, setS] = useState<State>({ visible: false, title: '' });

  function confirm(opts: Omit<State, 'visible'>) { setS({ ...opts, visible: true }); }
  function close() { setS({ visible: false, title: '' }); }

  return (
    <Ctx.Provider value={{ confirm }}>
      {children}
      <Modal visible={s.visible} transparent animationType="fade" onRequestClose={close}>
        <View style={styles.backdrop}>
          <View style={styles.box}>
            <Text style={styles.title}>{s.title}</Text>
            {!!s.message && <Text style={styles.msg}>{s.message}</Text>}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <TouchableOpacity style={[styles.btn, { backgroundColor: '#6B7280' }]} onPress={close}>
                <Text style={styles.btnText}>{s.cancelText ?? 'Cancelar'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: '#EF4444' }]}
                onPress={() => { const cb = s.onConfirm; close(); cb?.(); }}>
                <Text style={styles.btnText}>{s.confirmText ?? 'Confirmar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Ctx.Provider>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex:1, backgroundColor:'rgba(0,0,0,0.35)', alignItems:'center', justifyContent:'center', padding:24 },
  box: { backgroundColor:'#fff', borderRadius:16, padding:16, width:'100%' },
  title: { fontWeight:'800', fontSize:18, color:'#111827' },
  msg: { color:'#374151', marginTop:6 },
  btn: { flex:1, paddingVertical:12, borderRadius:12, alignItems:'center' },
  btnText: { color:'#fff', fontWeight:'700' },
});
