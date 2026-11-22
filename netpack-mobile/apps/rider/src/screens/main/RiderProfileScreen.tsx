import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { useRiderAuth } from '../../context/RiderAuthContext';
import { COLORS, getApiBaseUrl, setApiBaseUrl } from '@netpack/shared';
import { Ionicons } from '@expo/vector-icons';

export const RiderProfileScreen = () => {
  const { rider, logout } = useRiderAuth();
  const [apiUrl, setApiUrl] = useState(getApiBaseUrl());

  const handleUpdateServerUrl = () => {
    if (!apiUrl.trim() || !apiUrl.startsWith('http')) {
      Alert.alert('Invalid URL', 'Please enter a valid HTTP/HTTPS API URL.');
      return;
    }
    setApiBaseUrl(apiUrl.trim());
    Alert.alert('Server Updated', `Active API endpoint set to:\n${apiUrl.trim()}`);
  };

  const handleLogout = () => {
    Alert.alert('End Shift / Sign Out', 'Are you sure you want to clock out and sign out of NetPack Rider?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clock Out & Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rider Profile & Duty</Text>
        <Text style={styles.headerSub}>Field Operations & Vehicle Dispatch</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Rider Info Card */}
        <View style={styles.card}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(rider?.name || 'R').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.userName}>{rider?.name || 'Rider'}</Text>
              <Text style={styles.userEmail}>{rider?.email}</Text>
              <View style={styles.roleBadge}>
                <Ionicons name="shield-checkmark-outline" size={12} color="#059669" />
                <Text style={styles.roleText}>{rider?.role || 'PICKUP RIDER'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Server Endpoint Config */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>DISPATCH SERVER CONNECTION</Text>
          <Text style={styles.helperText}>
            Current API gateway for live cargo scanning and weighing uploads:
          </Text>
          <TextInput
            style={styles.input}
            value={apiUrl}
            onChangeText={setApiUrl}
            placeholder="https://..."
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.applyBtn} onPress={handleUpdateServerUrl}>
            <Text style={styles.applyBtnText}>Apply Server URL</Text>
          </TouchableOpacity>
        </View>

        {/* End Shift / Sign Out */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.danger} style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Clock Out & Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  headerSub: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  userEmail: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
    gap: 4,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
    marginBottom: 10,
    lineHeight: 16,
  },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 12,
    backgroundColor: '#F8FAFC',
  },
  applyBtn: {
    backgroundColor: COLORS.primary,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    height: 48,
    borderRadius: 12,
    marginTop: 8,
  },
  logoutText: {
    color: COLORS.danger,
    fontSize: 15,
    fontWeight: '700',
  },
});
