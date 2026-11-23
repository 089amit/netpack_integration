import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { NetPackApi, EnquiryBooking, COLORS, STATUS_CONFIG } from '@netpack/shared';
import { Ionicons } from '@expo/vector-icons';

export const BookingsScreen = ({ navigation }: any) => {
  const [bookings, setBookings] = useState<EnquiryBooking[]>([]);
  const [filterTab, setFilterTab] = useState<'ALL' | 'ACTIVE' | 'DELIVERED'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchBookings = useCallback(async () => {
    try {
      const data = await NetPackApi.getMyShipments();
      setBookings(data || []);
    } catch (err) {
      console.log('Error fetching bookings:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchBookings();
  };

  const filteredBookings = bookings.filter((b) => {
    if (filterTab === 'ACTIVE') return b.status !== 'DELIVERED' && b.status !== 'CANCELLED';
    if (filterTab === 'DELIVERED') return b.status === 'DELIVERED';
    return true;
  });

  const renderBookingItem = ({ item }: { item: EnquiryBooking }) => {
    const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.PENDING;
    const dateFormatted = item.createdAt
      ? new Date(item.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : '';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('BookingDetail', { booking: item })}
      >
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.trackingNumber}>{item.trackingNumber || `Enquiry #${item.id}`}</Text>
            <Text style={styles.bookingDate}>{dateFormatted}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
            <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.routeRow}>
            <View style={styles.routeCol}>
              <Text style={styles.routeLabel}>FROM</Text>
              <Text style={styles.routeName}>{item.senderName || 'Kathmandu, Nepal'}</Text>
            </View>
            <Ionicons name="arrow-forward" size={16} color={COLORS.muted} style={{ marginHorizontal: 8 }} />
            <View style={styles.routeCol}>
              <Text style={styles.routeLabel}>TO</Text>
              <Text style={styles.routeName}>
                {item.receiverCountry || item.receiverCity || 'International'}
              </Text>
            </View>
          </View>

          <View style={styles.cargoSummaryRow}>
            <Text style={styles.cargoStat}>
              <Ionicons name="cube-outline" size={13} color={COLORS.accent} /> {item.noOfBox || 1} Box(es)
            </Text>
            <Text style={styles.cargoStat}>
              <Ionicons name="scale-outline" size={13} color={COLORS.accent} />{' '}
              {item.chargeableWeight || item.weight || 0} kg
            </Text>
            {item.estimatedRate ? (
              <Text style={styles.rateStat}>
                {item.currency || 'USD'} {item.estimatedRate.toFixed(2)}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.trackBtn}
            onPress={() => navigation.navigate('Track', { trackingNumber: item.trackingNumber })}
          >
            <Ionicons name="navigate-outline" size={14} color={COLORS.accent} style={{ marginRight: 4 }} />
            <Text style={styles.trackBtnText}>Live Tracking</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View>
            <Text style={styles.headerTitle}>My Shipments</Text>
            <Text style={styles.headerSub}>Active & Delivered Consignments</Text>
          </View>
          <TouchableOpacity
            style={styles.newBookingBtn}
            onPress={() => navigation.navigate('CreateBooking')}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.newBookingText}>New Booking</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <View style={styles.tabRow}>
          {(['ALL', 'ACTIVE', 'DELIVERED'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, filterTab === tab && styles.tabBtnActive]}
              onPress={() => setFilterTab(tab)}
            >
              <Text style={[styles.tabText, filterTab === tab && styles.tabTextActive]}>
                {tab === 'ALL' ? 'All' : tab === 'ACTIVE' ? 'In Progress' : 'Delivered'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>Loading shipments...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={(item: EnquiryBooking) => String(item.id)}
          renderItem={renderBookingItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={48} color={COLORS.muted} />
              <Text style={styles.emptyTitle}>No Shipments Found</Text>
              <Text style={styles.emptyDesc}>
                {filterTab === 'ACTIVE'
                  ? 'You have no active consignments in transit.'
                  : 'You have not created any consignments yet.'}
              </Text>
              <TouchableOpacity
                style={styles.emptyActionBtn}
                onPress={() => navigation.navigate('CreateBooking')}
              >
                <Text style={styles.emptyActionText}>Create First Shipment</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
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
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  newBookingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  newBookingText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 4,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.muted,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  trackingNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  bookingDate: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardBody: {
    paddingVertical: 12,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  routeCol: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.muted,
  },
  routeName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 2,
  },
  cargoSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 4,
  },
  cargoStat: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  rateStat: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accent,
    marginLeft: 'auto',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    paddingTop: 10,
  },
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trackBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.accent,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 18,
  },
  emptyActionBtn: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyActionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
