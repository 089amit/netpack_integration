import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Platform,
} from 'react-native';
import { useRiderAuth } from '../../context/RiderAuthContext';
import { NetPackApi, PickupTask, COLORS, STATUS_CONFIG } from '@netpack/shared';
import { Ionicons } from '@expo/vector-icons';

export const RiderHomeScreen = ({ navigation }: any) => {
  const { rider } = useRiderAuth();
  const [pickups, setPickups] = useState<PickupTask[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'ASSIGNED' | 'PICKED_UP'>('ASSIGNED');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchPickups = useCallback(async () => {
    try {
      const data = await NetPackApi.getRiderPickups();
      setPickups(data || []);
    } catch (err) {
      console.log('Error loading pickups:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPickups();
  }, [fetchPickups]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchPickups();
  };

  const filtered = pickups.filter((p) => {
    if (filter === 'ASSIGNED') return p.status === 'ASSIGNED_FOR_PICKUP' || p.status === 'STOP_COLLECTED';
    if (filter === 'PICKED_UP') return p.status === 'PICKED_UP' || p.status === 'WT_DIMENSION_VERIFIED' || p.status === 'PACKED';
    return true;
  });

  const assignedCount = pickups.filter((p) => p.status === 'ASSIGNED_FOR_PICKUP' || p.status === 'STOP_COLLECTED').length;
  const pickedUpCount = pickups.filter((p) => p.status === 'PICKED_UP' || p.status === 'WT_DIMENSION_VERIFIED').length;

  const handleCall = (phone?: string) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const renderPickupItem = ({ item }: { item: PickupTask }) => {
    const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.PENDING;
    const stopsCount = item.stops?.length || 0;
    const completedStops = item.stops?.filter((s) => s.isPickedUp).length || 0;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.trackingNum}>{item.trackingNumber}</Text>
            <Text style={styles.shipperName}>{item.senderName}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
            <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color={COLORS.accent} style={{ marginTop: 2 }} />
            <Text style={styles.addressText} numberOfLines={2}>
              {item.senderAddress || item.senderCity || 'Kathmandu, Nepal'}
            </Text>
          </View>

          {item.senderPhone ? (
            <View style={styles.phoneRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="call-outline" size={14} color={COLORS.textMuted} />
                <Text style={styles.phoneText}>{item.senderPhone}</Text>
              </View>
              <TouchableOpacity style={styles.callBtn} onPress={() => handleCall(item.senderPhone)}>
                <Ionicons name="call" size={12} color="#FFFFFF" />
                <Text style={styles.callBtnText}>Call Shipper</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {stopsCount > 0 && (
            <View style={styles.stopsBadgeRow}>
              <Ionicons name="git-branch-outline" size={13} color="#2563EB" />
              <Text style={styles.stopsBadgeText}>
                {completedStops}/{stopsCount} Stops Collected
              </Text>
            </View>
          )}

          <View style={styles.metaRow}>
            <Text style={styles.metaText}>
              <Ionicons name="cube-outline" size={12} color={COLORS.textMuted} /> {item.noOfBox || 1} Box(es)
            </Text>
            <Text style={styles.metaText}>
              <Ionicons name="scale-outline" size={12} color={COLORS.textMuted} /> ~{item.weight || 0} kg
            </Text>
            <Text style={styles.metaText}>
              Dest: {item.destinationCountry || 'International'}
            </Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.detailBtn}
            onPress={() => navigation.navigate('PickupDetail', { pickup: item })}
          >
            <Ionicons name="list-outline" size={15} color={COLORS.primary} style={{ marginRight: 4 }} />
            <Text style={styles.detailBtnText}>View Details & Stops</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.weighBtn}
            onPress={() => navigation.navigate('VerifyCargo', { pickup: item })}
          >
            <Ionicons name="scale" size={15} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.weighBtnText}>Weigh & Verify</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Rider Dashboard</Text>
            <Text style={styles.riderName}>{rider?.name || 'Field Officer'}</Text>
          </View>
          <TouchableOpacity
            style={styles.scanHeaderBtn}
            onPress={() => navigation.navigate('Scanner')}
          >
            <Ionicons name="barcode-outline" size={20} color="#FFFFFF" />
            <Text style={styles.scanHeaderText}>Scan</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Strip */}
        <View style={styles.statsStrip}>
          <View style={styles.statCol}>
            <Text style={styles.statNum}>{assignedCount}</Text>
            <Text style={styles.statLabel}>To Pick Up</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statNum}>{pickedUpCount}</Text>
            <Text style={styles.statLabel}>Collected</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statNum}>{pickups.length}</Text>
            <Text style={styles.statLabel}>Total Tasks</Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.tabRow}>
          {(['ASSIGNED', 'PICKED_UP', 'ALL'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, filter === t && styles.tabBtnActive]}
              onPress={() => setFilter(t)}
            >
              <Text style={[styles.tabText, filter === t && styles.tabTextActive]}>
                {t === 'ASSIGNED' ? 'To Pick Up' : t === 'PICKED_UP' ? 'Collected' : 'All Tasks'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Main List */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Fetching assigned pickups...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderPickupItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-done-circle-outline" size={54} color="#10B981" />
              <Text style={styles.emptyTitle}>All Caught Up!</Text>
              <Text style={styles.emptyDesc}>No pending pickups currently assigned in this queue.</Text>
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 12,
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  riderName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  scanHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  scanHeaderText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  statsStrip: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    paddingVertical: 12,
    marginBottom: 14,
    alignItems: 'center',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
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
    fontSize: 12,
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
  trackingNum: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  shipperName: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: '600',
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  addressText: {
    fontSize: 13,
    color: COLORS.text,
    marginLeft: 6,
    flex: 1,
    lineHeight: 18,
    fontWeight: '600',
  },
  phoneRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  phoneText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginLeft: 6,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  callBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  stopsBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginVertical: 6,
    gap: 4,
  },
  stopsBadgeText: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 6,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.muted,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    paddingTop: 12,
  },
  detailBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    height: 40,
    borderRadius: 10,
  },
  detailBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  weighBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    height: 40,
    borderRadius: 10,
  },
  weighBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
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
    marginTop: 4,
  },
});
