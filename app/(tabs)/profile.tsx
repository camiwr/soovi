import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { isPhone, onlyDigits } from '../../lib/format';

export default function ProfileTab() {
    const { user, updateProfile, signOut } = useAuth();
    if (!user) return (
        <View style={s.loadingContainer}>
            <Text style={s.loadingText}>Carregando perfil...</Text>
        </View>
    );

    const [name, setName] = useState(user.name || '');
    const [phone, setPhone] = useState(user.phone || '');
    const [saving, setSaving] = useState(false);

    // Extrai as iniciais do nome para o avatar
    const getInitials = (fullName: string) => {
        return fullName
            .split(' ')
            .map(word => word.charAt(0).toUpperCase())
            .slice(0, 2)
            .join('');
    };

    async function handleSave() {
        if (phone && !isPhone(phone)) return Alert.alert('Validação', 'Telefone deve ter 10–11 dígitos.');
        try {
            setSaving(true);
            await updateProfile({ name: name.trim(), phone: phone ? onlyDigits(phone) : undefined });
            Alert.alert('✅ Sucesso', 'Seu perfil foi atualizado com sucesso!');
        } catch (e: any) {
            Alert.alert('❌ Erro', e?.message || 'Falha ao atualizar perfil');
        } finally {
            setSaving(false);
        }
    }

    async function handleSignOut() {
        // Apenas chama a função signOut. O redirecionamento já está embutido nela.
        await signOut();
    }

    return (
        <ScrollView style={s.container} contentContainerStyle={s.contentContainer}>
            {/* Header com Avatar */}
            <View style={s.header}>
                <View style={s.avatarContainer}>
                    <View style={s.avatar}>
                        <Text style={s.avatarText}>{getInitials(name || user.email || 'U')}</Text>
                    </View>
                    <View style={s.statusBadge}>
                        <Text style={s.statusText}>●</Text>
                    </View>
                </View>
                <Text style={s.userName}>{name || 'Usuário'}</Text>
                <Text style={s.userEmail}>{user.email}</Text>
            </View>

            {/* Informações Pessoais */}
            <View style={s.section}>
                <View style={s.sectionHeader}>
                    <Text style={s.sectionIcon}>👤</Text>
                    <Text style={s.sectionTitle}>Informações Pessoais</Text>
                </View>

                <View style={s.infoCard}>
                    <Text style={s.infoLabel}>E-mail</Text>
                    <Text style={s.infoValue}>{user.email}</Text>
                </View>

                {user.cpf && (
                    <View style={s.infoCard}>
                        <Text style={s.infoLabel}>CPF</Text>
                        <Text style={s.infoValue}>{user.cpf}</Text>
                    </View>
                )}

                <View style={s.inputGroup}>
                    <Text style={s.inputLabel}>Nome Completo</Text>
                    <TextInput
                        style={s.input}
                        placeholder="Digite seu nome completo"
                        value={name}
                        onChangeText={setName}
                        placeholderTextColor="#9CA3AF"
                    />
                </View>

                <View style={s.inputGroup}>
                    <Text style={s.inputLabel}>Telefone</Text>
                    <TextInput
                        style={s.input}
                        placeholder="(11) 99999-9999"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                        placeholderTextColor="#9CA3AF"
                    />
                </View>
            </View>

            {/* Ações */}
            <View style={s.section}>
                <View style={s.sectionHeader}>
                    <Text style={s.sectionIcon}>⚙️</Text>
                    <Text style={s.sectionTitle}>Ações</Text>
                </View>

                <TouchableOpacity
                    onPress={handleSave}
                    disabled={saving}
                    style={[s.primaryButton, saving && s.buttonDisabled]}
                >
                    <Text style={s.buttonIcon}>💾</Text>
                    <Text style={s.primaryButtonText}>
                        {saving ? 'Salvando...' : 'Salvar Alterações'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleSignOut} style={s.secondaryButton}>
                    <Text style={s.buttonIcon}>🚪</Text>
                    <Text style={s.secondaryButtonText}>Sair da Conta</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const s = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    contentContainer: {
        paddingBottom: 32,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8FAFC',
    },
    loadingText: {
        fontSize: 16,
        color: '#6B7280',
    },

    // Header com Avatar
    header: {
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: 32,
        paddingHorizontal: 24,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#3B82F6',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    avatarText: {
        fontSize: 36,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    statusBadge: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#10B981',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#FFFFFF',
    },
    statusText: {
        color: '#FFFFFF',
        fontSize: 8,
    },
    userName: {
        fontSize: 24,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 4,
        textAlign: 'center',
    },
    userEmail: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) as any,
    },

    // Seções
    section: {
        marginHorizontal: 16,
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    sectionIcon: {
        fontSize: 20,
        marginRight: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },

    // Cards de informação
    infoCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    infoLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) as any,
    },

    // Inputs
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderRadius: 16,
        paddingHorizontal: 20,
        paddingVertical: 16,
        fontSize: 16,
        color: '#111827',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },

    // Botões
    primaryButton: {
        backgroundColor: '#3B82F6',
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    secondaryButton: {
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#EF4444',
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonDisabled: {
        backgroundColor: '#9CA3AF',
        shadowOpacity: 0.1,
    },
    buttonIcon: {
        fontSize: 16,
        marginRight: 8,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    secondaryButtonText: {
        color: '#EF4444',
        fontSize: 16,
        fontWeight: '700',
    },
});