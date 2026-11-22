import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { EnquiryBooking, COLORS, STATUS_CONFIG } from '@netpack/shared';
import { Ionicons } from '@expo/vector-icons';

export const BookingDetailScreen = ({ route, navigation }: any) => {
  const booking: EnquiryBooking = route.params?.booking;

  if (!booking) {
    return (
      <View style={styles.centerContainer}>
        <Text>Booking details not found.</Text>
      </View>
    );
  }

  const statusCfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Consignment Details</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Status Card */}
        <View style={styles.card}>
          <View style={styles.statusRow}>
            <View>
              <Text style={styles.trackingNum}>{booking.trackingNumber}</Text>
              <Text style={styles.dateText}>
                Booked on {new Date(booking.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: statusCfg.bg }]}>
              <Text style={[styles.badgeText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.trackActionBtn}
            onPress={() => navigation.navigate('Track', { trackingNumber: booking.trackingNumber })}
          >
            <Ionicons name="navigate-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.trackActionText}>View Live Cargo Scans</Text>
          </TouchableOpacity>
        </View>

        {/* Sender Details */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>SHIP FROM (SENDER)</Text>
          <Text style={styles.nameText}>{booking.senderName}</Text>
          {booking.senderPhone ? (
            <Text style={styles.subText}>Phone: {booking.senderPhone}</Text>
          ) : null}
          {booking.senderEmail ? (
            <Text style={styles.subText}>Email: {booking.senderEmail}</Text>
          ) : null}
          <Text style={styles.subText}>Origin: Kathmandu, Nepal</Text>
        </View>

        {/* Consignee / Receiver Details */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>SHIP TO (CONSIGNEE)</Text>
          <Text style={styles.nameText}>{booking.receiverName}</Text>
          <Text style={styles.subText}>Phone: {booking.receiverPhone}</Text>
          {booking.receiverEmail ? (
            <Text style={styles.subText}>Email: {booking.receiverEmail}</Text>
          ) : null}
          <Text style={styles.subText}>
            Address: {booking.receiverAddressLine1 || ''}, {booking.receiverCity || ''},{' '}
            {booking.receiverCountry || ''}
          </Text>
        </View>

        {/* Cargo Summary */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>CARGO SPECIFICATIONS</Text>
          <View style={styles.specsRow}>
            <View style={styles.specBox}>
              <Text style={styles.specVal}>{booking.noOfBox || 1}</Text>
              <Text style={styles.specLbl}>Boxes</Text>
            </View>
            <View style={styles.specBox}>
              <Text style={styles.specVal}>{booking.weight || 0} kg</Text>
              <Text style={styles.specLbl}>Actual Weight</Text>
            </View>
            <View style={styles.specBox}>
              <Text style={styles.specVal}>{booking.chargeableWeight || booking.weight || 0} kg</Text>
              <Text style={styles.specLbl}>Chargeable</Text>
            </View>
          </View>
        </View>

        {/* Items List */}
        {booking.items && booking.items.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>ITEMIZED CONTENTS</Text>
            {booking.items.map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                <Text style={styles.itemDesc}>{item.description}</Text>
                <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  trackingNum: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  trackActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    height: 44,
    borderRadius: 10,
  },
  trackActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  nameText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  subText: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  specsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  specBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  specVal: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  specLbl: {
    fontSize: 10,
    color: COLORS.muted,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  itemDesc: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  itemQty: {
    fontSize: 13,
    color: COLORS.accent,
    fontWeight: '700',
  },
});
