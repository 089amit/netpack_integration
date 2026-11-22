import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { NetPackApi, COLORS } from '@netpack/shared';
import { Ionicons } from '@expo/vector-icons';

export const CreateBookingScreen = ({ navigation }: any) => {
  const { customer } = useAuth();

  // Commodity & Cargo
  const [commodity, setCommodity] = useState('');
  const [approxWeight, setApproxWeight] = useState('');

  // Consignee / Receiver
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [receiverEmail, setReceiverEmail] = useState('');
  const [receiverCountry, setReceiverCountry] = useState('United States');
  const [receiverCity, setReceiverCity] = useState('');
  const [receiverAddress, setReceiverAddress] = useState('');

  // Pickup Request
  const [isPickupRequired, setIsPickupRequired] = useState(true);
  const [pickupAddress, setPickupAddress] = useState(customer?.address1 || '');
  const [pickupPhone, setPickupPhone] = useState(customer?.phone || '');
  const [pickupNote, setPickupNote] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!commodity.trim() || !approxWeight.trim()) {
      Alert.alert('Required', 'Please describe the commodity and enter approximate weight.');
      return;
    }
    const weightNum = parseFloat(approxWeight);
    if (isNaN(weightNum) || weightNum <= 0) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight in kilograms.');
      return;
    }
    if (!receiverName.trim() || !receiverPhone.trim() || !receiverCountry.trim() || !receiverAddress.trim()) {
      Alert.alert('Required', 'Please complete consignee name, phone, destination country, and street address.');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        commodity: commodity.trim(),
        approximateWeight: weightNum,
        senderName: customer?.name || 'Shipper',
        senderPhone: customer?.phone || undefined,
        senderEmail: customer?.email || undefined,
        senderAddress: pickupAddress.trim() || customer?.address1 || undefined,
        senderCity: customer?.city || 'Kathmandu',
        receiverName: receiverName.trim(),
        receiverPhone: receiverPhone.trim(),
        receiverEmail: receiverEmail.trim() || undefined,
        receiverCountry: receiverCountry.trim(),
        receiverCity: receiverCity.trim() || receiverCountry.trim(),
        receiverAddress: receiverAddress.trim(),
        isPickupRequired,
        pickupAddress: isPickupRequired ? (pickupAddress.trim() || undefined) : undefined,
        pickupPhone: isPickupRequired ? (pickupPhone.trim() || undefined) : undefined,
        pickupNote: isPickupRequired ? (pickupNote.trim() || undefined) : undefined,
      };

      const res = await NetPackApi.createBooking(payload);
      Alert.alert(
        'Booking Created!',
        `Your consignment enquiry has been registered with Tracking Number:\n\n${res.trackingNumber || 'Created'}\n\nOur operations team will coordinate pickup and verification.`,
        [
          {
            text: 'Track Shipment',
            onPress: () => {
              navigation.replace('Track', { trackingNumber: res.trackingNumber });
            },
          },
          {
            text: 'Done',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Booking Error', err.message || 'Could not submit shipment enquiry.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Shipment Booking</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Section 1: Cargo Details */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cube-outline" size={20} color={COLORS.accent} />
            <Text style={styles.sectionTitle}>1. CARGO SPECIFICATIONS</Text>
          </View>
          <Text style={styles.helperText}>
            NetPack handles precision weighing and export packaging at the central hub.
          </Text>

          <Text style={styles.label}>Commodity Description *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Woolen Felt Mix, Garments, Handicrafts, Documents"
            placeholderTextColor={COLORS.muted}
            value={commodity}
            onChangeText={setCommodity}
          />

          <Text style={styles.label}>Approximate Total Weight (kg) *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 21"
            placeholderTextColor={COLORS.muted}
            keyboardType="decimal-pad"
            value={approxWeight}
            onChangeText={setApproxWeight}
          />
        </View>

        {/* Section 2: Consignee Details */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="navigate-outline" size={20} color={COLORS.success} />
            <Text style={styles.sectionTitle}>2. CONSIGNEE / RECEIVER DETAILS</Text>
          </View>

          <Text style={styles.label}>Receiver / Company Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Recipient or Organization name"
            placeholderTextColor={COLORS.muted}
            value={receiverName}
            onChangeText={setReceiverName}
          />

          <Text style={styles.label}>Receiver Contact Phone *</Text>
          <TextInput
            style={styles.input}
            placeholder="+1 555-0199"
            placeholderTextColor={COLORS.muted}
            keyboardType="phone-pad"
            value={receiverPhone}
            onChangeText={setReceiverPhone}
          />

          <Text style={styles.label}>Receiver Email</Text>
          <TextInput
            style={styles.input}
            placeholder="consignee@example.com"
            placeholderTextColor={COLORS.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            value={receiverEmail}
            onChangeText={setReceiverEmail}
          />

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Destination Country *</Text>
              <TextInput
                style={styles.input}
                placeholder="United States"
                placeholderTextColor={COLORS.muted}
                value={receiverCountry}
                onChangeText={setReceiverCountry}
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Destination City</Text>
              <TextInput
                style={styles.input}
                placeholder="Minneapolis, New York"
                placeholderTextColor={COLORS.muted}
                value={receiverCity}
                onChangeText={setReceiverCity}
              />
            </View>
          </View>

          <Text style={styles.label}>Full Street / Delivery Address *</Text>
          <TextInput
            style={styles.input}
            placeholder="Street address, building, suite/unit"
            placeholderTextColor={COLORS.muted}
            value={receiverAddress}
            onChangeText={setReceiverAddress}
          />
        </View>

        {/* Section 3: Pickup Request */}
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>3. DISPATCH RIDER PICKUP</Text>
              <Text style={styles.helperText}>Request our pickup rider to collect from your premises.</Text>
            </View>
            <Switch
              value={isPickupRequired}
              onValueChange={setIsPickupRequired}
              trackColor={{ false: '#CBD5E1', true: COLORS.accent }}
            />
          </View>

          {isPickupRequired && (
            <View style={{ marginTop: 12 }}>
              <Text style={styles.label}>Pickup Address in Kathmandu</Text>
              <TextInput
                style={styles.input}
                placeholder="Shop / Warehouse / Home location"
                placeholderTextColor={COLORS.muted}
                value={pickupAddress}
                onChangeText={setPickupAddress}
              />

              <Text style={styles.label}>Pickup Contact Phone</Text>
              <TextInput
                style={styles.input}
                placeholder="+977 98..."
                placeholderTextColor={COLORS.muted}
                keyboardType="phone-pad"
                value={pickupPhone}
                onChangeText={setPickupPhone}
              />

              <Text style={styles.label}>Special Pickup Instructions</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Fragile goods, call before arriving"
                placeholderTextColor={COLORS.muted}
                value={pickupNote}
                onChangeText={setPickupNote}
              />
            </View>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, isLoading && styles.disabledBtn]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitBtnText}>Submit Shipment Booking</Text>
          )}
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
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 0.5,
    marginLeft: 6,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 12,
    backgroundColor: '#F8FAFC',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  submitBtn: {
    backgroundColor: COLORS.accent,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledBtn: {
    opacity: 0.65,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
