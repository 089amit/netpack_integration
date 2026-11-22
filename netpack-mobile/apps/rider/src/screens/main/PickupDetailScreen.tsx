import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { NetPackApi, PickupTask, COLORS, STATUS_CONFIG } from '@netpack/shared';
import { Ionicons } from '@expo/vector-icons';

export const PickupDetailScreen = ({ route, navigation }: any) => {
  const [pickup, setPickup] = useState<PickupTask>(route.params?.pickup);
  const [isUpdating, setIsUpdating] = useState(false);

  if (!pickup) {
    return (
      <View style={styles.centerContainer}>
        <Text>Task not found.</Text>
      </View>
    );
  }

  const statusCfg = STATUS_CONFIG[pickup.status] || STATUS_CONFIG.PENDING;

  const handleOpenMap = (address: string) => {
    const encoded = encodeURIComponent(address.trim());
    const url = Platform.select({
      ios: `maps://app?daddr=${encoded}`,
      android: `google.navigation:q=${encoded}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${encoded}`,
    });
    Linking.openURL(url!).catch(() => {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encoded}`);
    });
  };

  const handleToggleStop = async (stopId: number, currentStatus?: boolean) => {
    setIsUpdating(true);
    try {
      await NetPackApi.updateStopStatus(pickup.id, stopId, !currentStatus);
      setPickup((prev) => ({
        ...prev,
        stops: prev.stops.map((s) => (s.id === stopId ? { ...s, isPickedUp: !currentStatus } : s)),
      }));
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not update stop status.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarkAllPickedUp = async () => {
    Alert.alert(
      'Confirm Pickup Collection',
      `Mark consignment ${pickup.trackingNumber} as fully picked up from shipper?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Picked Up',
          onPress: async () => {
            setIsUpdating(true);
            try {
              await NetPackApi.updatePickupStatus(pickup.id, 'PICKED_UP', 'Cargo received by pickup rider');
              setPickup((prev) => ({ ...prev, status: 'PICKED_UP' }));
              Alert.alert('Success', 'Consignment status updated to Picked Up.');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Could not update pickup status.');
            } finally {
              setIsUpdating(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pickup Task #{pickup.id}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Status Card */}
        <View style={styles.card}>
          <View style={styles.statusRow}>
            <View>
              <Text style={styles.trackingNum}>{pickup.trackingNumber}</Text>
              <Text style={styles.subText}>Status: {statusCfg.label}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: statusCfg.bg }]}>
              <Text style={[styles.badgeText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.weighActionBtn}
              onPress={() => navigation.navigate('VerifyCargo', { pickup })}
            >
              <Ionicons name="scale-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.weighActionText}>Weigh & Capture Proof</Text>
            </TouchableOpacity>

            {pickup.status !== 'PICKED_UP' && (
              <TouchableOpacity
                style={styles.collectActionBtn}
                onPress={handleMarkAllPickedUp}
                disabled={isUpdating}
              >
                <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.collectActionText}>Mark Picked Up</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Shipper & Location Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>PICKUP LOCATION</Text>
          <Text style={styles.shipperName}>{pickup.senderName}</Text>
          <Text style={styles.addressText}>{pickup.senderAddress || pickup.senderCity || 'Kathmandu'}</Text>

          <View style={styles.locationBtnsRow}>
            <TouchableOpacity
              style={styles.mapBtn}
              onPress={() => handleOpenMap(pickup.senderAddress || pickup.senderCity || 'Kathmandu')}
            >
              <Ionicons name="navigate" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.mapBtnText}>Navigate (GPS)</Text>
            </TouchableOpacity>

            {pickup.senderPhone ? (
              <TouchableOpacity
                style={styles.callBtn}
                onPress={() => Linking.openURL(`tel:${pickup.senderPhone}`)}
              >
                <Ionicons name="call" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.callBtnText}>Call Shipper</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {pickup.pickupNotes ? (
            <View style={styles.notesBox}>
              <Text style={styles.notesLabel}>Special Instructions:</Text>
              <Text style={styles.notesContent}>{pickup.pickupNotes}</Text>
            </View>
          ) : null}
        </View>

        {/* Multi-Stop Pickups Checklist */}
        {pickup.stops && pickup.stops.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>COLLECTION STOPS CHECKLIST ({pickup.stops.length})</Text>
            {pickup.stops.map((stop, idx) => (
              <TouchableOpacity
                key={stop.id || idx}
                style={[styles.stopItem, stop.isPickedUp && styles.stopItemDone]}
                onPress={() => handleToggleStop(stop.id, stop.isPickedUp)}
                disabled={isUpdating}
              >
                <Ionicons
                  name={stop.isPickedUp ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={stop.isPickedUp ? '#059669' : COLORS.textMuted}
                />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.stopLoc, stop.isPickedUp && styles.stopLocDone]}>
                    Stop {idx + 1}: {stop.location}
                  </Text>
                  {stop.phoneNumber ? (
                    <Text style={styles.stopPhone}>Contact: {stop.phoneNumber}</Text>
                  ) : null}
                </View>
              </TouchableOpacity>
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
    marginBottom: 16,
  },
  trackingNum: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  subText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionRow: {
    gap: 10,
  },
  weighActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    height: 44,
    borderRadius: 10,
  },
  weighActionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  collectActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    height: 44,
    borderRadius: 10,
  },
  collectActionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  shipperName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  addressText: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
    lineHeight: 20,
  },
  locationBtnsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  mapBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    height: 40,
    borderRadius: 10,
  },
  mapBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    height: 40,
    borderRadius: 10,
  },
  callBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  notesBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  notesContent: {
    fontSize: 13,
    color: '#78350F',
    marginTop: 2,
  },
  stopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  stopItemDone: {
    opacity: 0.6,
  },
  stopLoc: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  stopLocDone: {
    textDecorationLine: 'line-through',
    color: COLORS.muted,
  },
  stopPhone: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
