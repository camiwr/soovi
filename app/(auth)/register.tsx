import React, { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  Alert, StyleSheet, Text, TextInput, TouchableOpacity, View,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { onlyDigits, isEmail, isCpf, isPhone } from '../../lib/format';

import { Mail, Lock } from 'lucide-react-native';

export default function Register() {
  const { signUpWithCustom } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleRegister() {
    if (!name || !email || !password) return Alert.alert('Campos obrigatórios', 'Nome, e-mail e senha são obrigatórios.');
    if (!isEmail(email)) return Alert.alert('Validação', 'E-mail inválido.');
    if (cpf && !isCpf(cpf)) return Alert.alert('Validação', 'CPF deve ter 11 dígitos.');
    if (phone && !isPhone(phone)) return Alert.alert('Validação', 'Telefone deve ter 10–11 dígitos.');

    try {
      setIsLoading(true);
      await signUpWithCustom({
        name: name.trim(),
        email: email.trim(),
        password,
        cpf: onlyDigits(cpf),
        phone: onlyDigits(phone),
      });
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Falha no cadastro');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaProvider style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.appName}>soolu</Text>
            <Text style={styles.subtitle}>Crie sua conta</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Nome"
                  value={name}
                  onChangeText={setName}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Mail size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Lock size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Senha"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="CPF (só números)"
                  value={cpf}
                  onChangeText={setCpf}
                  keyboardType="number-pad"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Telefone (DDD+numero)"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <TouchableOpacity style={styles.loginButton} onPress={handleRegister} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.loginButtonText}>Cadastrar</Text>}
            </TouchableOpacity>

            <View style={styles.registerSection}>
              <Text style={styles.registerPrompt}>Já tem uma conta?</Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text style={styles.registerLink}>Entrar</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 },
  header: { alignItems: 'center', marginBottom: 48 },
  appName: { fontSize: 32, fontWeight: 'bold', color: '#3B82F6', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#6B7280' },
  form: { width: '100%' },
  inputContainer: { marginBottom: 16 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 4, borderWidth: 1, borderColor: '#E5E7EB',
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, paddingVertical: 16, fontSize: 16, color: '#1F2937' },
  loginButton: { backgroundColor: '#3B82F6', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8, marginBottom: 16 },
  loginButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  registerSection: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  registerPrompt: { color: '#6B7280', fontSize: 14, marginRight: 4 },
  registerLink: { color: '#3B82F6', fontSize: 14, fontWeight: '600' },
});
