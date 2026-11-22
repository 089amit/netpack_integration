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
import { useAuth } from '../../context/AuthContext';
import { NetPackApi, COLORS, getApiBaseUrl, setApiBaseUrl } from '@netpack/shared';
import { Ionicons } from '@expo/vector-icons';

export const ProfileScreen = () => {
  const { customer, logout, refreshProfile } = useAuth();

  const [name, setName] = useState(customer?.name || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [address1, setAddress1] = useState(customer?.address1 || '');
  const [city, setCity] = useState(customer?.city || 'Kathmandu');
  const [apiUrl, setApiUrl] = useState(getApiBaseUrl());

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await NetPackApi.updateCustomerProfile({
        name: name.trim(),
        phone: phone.trim(),
        address1: address1.trim(),
        city: city.trim(),
      });
      await refreshProfile();
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateServerUrl = () => {
    if (!apiUrl.trim() || !apiUrl.startsWith('http')) {
      Alert.alert('Invalid URL', 'Please enter a valid HTTP/HTTPS API URL.');
      return;
    }
    setApiBaseUrl(apiUrl.trim());
    Alert.alert('Server Updated', `Active API endpoint set to:\n${apiUrl.trim()}`);
  };

  const handleLogout = () => {
    Alert.alert('Confirm Logout', 'Are you sure you want to sign out of NetPack?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Account & Profile</Text>
        <Text style={styles.headerSub}>Manage Organization & Delivery Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Header Card */}
        <View style={styles.card}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(customer?.name || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.userName}>{customer?.name || 'Customer'}</Text>
              <Text style={styles.userEmail}>{customer?.email}</Text>
              {customer?.organizationName ? (
                <View style={styles.orgBadge}>
                  <Ionicons name="business-outline" size={12} color={COLORS.accent} />
                  <Text style={styles.orgText}>{customer.organizationName}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* Profile Details Form */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionTitle}>SHIPPER PROFILE</Text>
            <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
              <Text style={styles.editBtnText}>{isEditing ? 'Cancel' : 'Edit'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.readOnlyInput]}
            value={name}
            onChangeText={setName}
            editable={isEditing}
          />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.readOnlyInput]}
            value={phone}
            onChangeText={setPhone}
            editable={isEditing}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Pickup Address</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.readOnlyInput]}
            value={address1}
            onChangeText={setAddress1}
            editable={isEditing}
          />

          <Text style={styles.label}>City</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.readOnlyInput]}
            value={city}
            onChangeText={setCity}
            editable={isEditing}
          />

          {isEditing && (
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSaveProfile}
              disabled={isSaving}
            >
              <Text style={styles.saveBtnText}>{isSaving ? 'Saving...' : 'Save Changes'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Server Endpoint Config (Helpful for testing localhost vs VPS) */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>BACKEND SERVER SETTINGS</Text>
          <Text style={styles.helperText}>
            Connect to production or your local NetPack Python backend server:
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

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.danger} style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Sign Out</Text>
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
    backgroundColor: COLORS.accent,
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
  orgBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
    gap: 4,
  },
  orgText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accent,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.accent,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 10,
    lineHeight: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
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
  readOnlyInput: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    color: COLORS.textMuted,
  },
  saveBtn: {
    backgroundColor: COLORS.accent,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
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
