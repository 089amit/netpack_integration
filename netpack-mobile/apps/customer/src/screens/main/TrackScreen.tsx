import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Share,
  Alert,
  Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { NetPackApi, TrackingResponse, COLORS, STATUS_CONFIG } from '@netpack/shared';
import { Ionicons } from '@expo/vector-icons';

export const TrackScreen = ({ route }: any) => {
  const initialTracking = route?.params?.trackingNumber || '';
  const [searchInput, setSearchInput] = useState(initialTracking);
  const [trackingData, setTrackingData] = useState<TrackingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expandedBoxes, setExpandedBoxes] = useState(true);

  useEffect(() => {
    if (initialTracking) {
      setSearchInput(initialTracking);
      fetchTracking(initialTracking);
    }
  }, [initialTracking]);

  const fetchTracking = async (numberToTrack: string) => {
    const cleanNum = numberToTrack.trim();
    if (!cleanNum) {
      Alert.alert('Required', 'Please enter a tracking number or HAWB.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await NetPackApi.trackCargo(cleanNum);
      if (data && data.found) {
        setTrackingData(data);
      } else {
        setTrackingData(null);
        setErrorMessage(data?.message || 'Consignment not found. Please verify the tracking number.');
      }
    } catch (err: any) {
      setTrackingData(null);
      setErrorMessage(err.message || 'Unable to retrieve tracking details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', `${label} copied to clipboard.`);
  };

  const handleShare = async () => {
    if (!trackingData) return;
    try {
      await Share.share({
        title: `NetPack Consignment ${trackingData.trackingNumber}`,
        message: `Track NetPack Cargo (${trackingData.trackingNumber}): https://netpackintegration.vercel.app/track/${encodeURIComponent(trackingData.trackingNumber)}\nStatus: ${trackingData.status}`,
      });
    } catch (err) {
      console.log('Share error:', err);
    }
  };

  const calculateProgress = (status: string): number => {
    const stageMap: Record<string, number> = {
      ENQUIRY_GENERATED: 10,
      ASSIGNED_FOR_PICKUP: 20,
      PICKED_UP: 30,
      PACKED: 40,
      WT_DIMENSION_VERIFIED: 50,
      SHIPMENT_CREATED: 60,
      IN_TRANSIT: 75,
      ARRIVED_AT_HUB: 85,
      OUT_FOR_DELIVERY: 92,
      DELIVERED: 100,
    };
    return stageMap[status] || 50;
  };

  const statusConfig = trackingData ? STATUS_CONFIG[trackingData.status] || STATUS_CONFIG.PENDING : STATUS_CONFIG.PENDING;

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.topHeader}>
        <Text style={styles.appTitle}>Consignment Tracking</Text>
        <Text style={styles.appSub}>Live Cargo Milestones & Scans</Text>

        {/* Search Input Box */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={COLORS.muted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="e.g. NP-2026-002, 8549445402"
            placeholderTextColor={COLORS.muted}
            value={searchInput}
            onChangeText={setSearchInput}
            onSubmitEditing={() => fetchTracking(searchInput)}
            returnKeyType="search"
            autoCapitalize="characters"
          />
          {searchInput.length > 0 && (
            <TouchableOpacity onPress={() => setSearchInput('')} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={18} color={COLORS.muted} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.trackActionBtn}
            onPress={() => fetchTracking(searchInput)}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.trackActionText}>Track</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Error Notification */}
        {errorMessage && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={24} color={COLORS.danger} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.errorTitle}>Shipment Not Found</Text>
              <Text style={styles.errorDesc}>{errorMessage}</Text>
            </View>
          </View>
        )}

        {/* Tracking Data Content */}
        {trackingData && (
          <View style={styles.resultsContainer}>
            {/* Status & Identity Card */}
            <View style={styles.statusCard}>
              <View style={styles.trackingHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.trackingLabel}>Tracking Number</Text>
                  <View style={styles.numberWithCopy}>
                    <Text style={styles.trackingNumber}>{trackingData.trackingNumber}</Text>
                    <TouchableOpacity onPress={() => handleCopy(trackingData.trackingNumber, 'Tracking Number')}>
                      <Ionicons name="copy-outline" size={18} color={COLORS.accent} style={{ marginLeft: 8 }} />
                    </TouchableOpacity>
                  </View>
                  {trackingData.hawbNumber && trackingData.hawbNumber !== trackingData.trackingNumber && (
                    <Text style={styles.hawbSub}>HAWB: {trackingData.hawbNumber}</Text>
                  )}
                </View>

                {/* Status Badge */}
                <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                  <Text style={[styles.statusText, { color: statusConfig.color }]}>
                    {statusConfig.label}
                  </Text>
                </View>
              </View>

              {/* Origin -> Destination Line */}
              <View style={styles.routeContainer}>
                <View style={styles.routeNode}>
                  <Ionicons name="location-outline" size={18} color={COLORS.accent} />
                  <Text style={styles.routeText}>{trackingData.origin || 'Kathmandu, Nepal'}</Text>
                </View>
                <View style={styles.routeLine} />
                <View style={styles.routeNode}>
                  <Ionicons name="navigate-outline" size={18} color={COLORS.success} />
                  <Text style={styles.routeText}>{trackingData.destination || 'International'}</Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${calculateProgress(trackingData.status)}%` }]} />
              </View>
              <Text style={styles.progressPercent}>{calculateProgress(trackingData.status)}% Completed</Text>

              {/* Action Buttons: Share & View Label */}
              <View style={styles.cardActionsRow}>
                <TouchableOpacity style={styles.actionBtnOutline} onPress={handleShare}>
                  <Ionicons name="share-social-outline" size={16} color={COLORS.text} style={{ marginRight: 6 }} />
                  <Text style={styles.actionBtnText}>Share Status</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Forwarding & Cargo Summary Grid */}
            <View style={styles.infoGrid}>
              {/* Courier Forwarding Card */}
              <View style={styles.gridCard}>
                <Text style={styles.gridCardTitle}>COURIER FORWARDING</Text>
                <Text style={styles.carrierName}>
                  {trackingData.forwardingCompany || 'Carrier Dispatched'}
                </Text>
                {trackingData.forwardingNumber ? (
                  <View style={styles.fwdNumberRow}>
                    <Text style={styles.fwdNumber}>{trackingData.forwardingNumber}</Text>
                    <TouchableOpacity onPress={() => handleCopy(trackingData.forwardingNumber!, 'Forwarding Number')}>
                      <Ionicons name="copy-outline" size={16} color={COLORS.accent} style={{ marginLeft: 6 }} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text style={styles.noFwdText}>Pending airline/hub dispatch</Text>
                )}

                {trackingData.carrierTrackingUrl && (
                  <TouchableOpacity
                    style={styles.externalLinkBtn}
                    onPress={() => Linking.openURL(trackingData.carrierTrackingUrl!)}
                  >
                    <Text style={styles.externalLinkText}>Open Carrier Tracking</Text>
                    <Ionicons name="open-outline" size={14} color={COLORS.accent} style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Verified Cargo Card */}
              <View style={styles.gridCard}>
                <Text style={styles.gridCardTitle}>VERIFIED CARGO</Text>
                <Text style={styles.cargoWeight}>
                  {trackingData.chargeableWeight || trackingData.weight || 10} kg
                </Text>
                <Text style={styles.cargoPieceCount}>
                  {trackingData.pieces || 1} {trackingData.pieces === 1 ? 'Box' : 'Boxes'} Verified
                </Text>
                <Text style={styles.cargoSubText}>
                  Sender: {trackingData.senderName}
                </Text>
              </View>
            </View>

            {/* Boxes & Packing List Accordion */}
            {trackingData.boxes && trackingData.boxes.length > 0 && (
              <View style={styles.accordionCard}>
                <TouchableOpacity
                  style={styles.accordionHeader}
                  onPress={() => setExpandedBoxes(!expandedBoxes)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="cube-outline" size={20} color={COLORS.accent} style={{ marginRight: 8 }} />
                    <Text style={styles.accordionTitle}>
                      Package Specifications ({trackingData.boxes.length} {trackingData.boxes.length === 1 ? 'Box' : 'Boxes'})
                    </Text>
                  </View>
                  <Ionicons name={expandedBoxes ? 'chevron-up' : 'chevron-down'} size={20} color={COLORS.textMuted} />
                </TouchableOpacity>

                {expandedBoxes && (
                  <View style={styles.accordionContent}>
                    {trackingData.boxes.map((box, idx) => (
                      <View key={idx} style={styles.boxRow}>
                        <View style={styles.boxBadge}>
                          <Text style={styles.boxBadgeText}>Box {box.boxNumber || idx + 1}</Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={styles.boxDims}>
                            {box.dimensions || `${box.length || 30} x ${box.breadth || 20} x ${box.height || 20} cm`}
                          </Text>
                          <Text style={styles.boxWeights}>
                            Actual: {box.actualWeight || box.weight} kg | CW: {box.chargeableWeight || box.weight} kg
                          </Text>
                          {box.items && box.items.length > 0 && (
                            <Text style={styles.boxItemDesc}>
                              Contents: {box.items.map((i) => `${i.item} (x${i.pieces})`).join(', ')}
                            </Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Consignment Journey / Timeline Checkpoints */}
            <View style={styles.timelineCard}>
              <View style={styles.timelineHeaderRow}>
                <Text style={styles.timelineTitle}>
                  Consignment Journey ({trackingData.checkpoints?.length || 0})
                </Text>
                <Text style={styles.timelineSub}>Newest First</Text>
              </View>

              {(!trackingData.checkpoints || trackingData.checkpoints.length === 0) ? (
                <View style={styles.emptyCheckpoints}>
                  <Ionicons name="time-outline" size={32} color={COLORS.muted} />
                  <Text style={styles.emptyCheckpointsText}>No transit checkpoints recorded yet.</Text>
                </View>
              ) : (
                <View style={styles.timelineList}>
                  {trackingData.checkpoints.map((cp, idx) => {
                    const isDelivered = cp.status === 'DELIVERED';
                    const isNote = cp.source === 'OPERATIONS_NOTE' || cp.source === 'MANUAL_NOTE';
                    const formattedDate = cp.timestamp
                      ? new Date(cp.timestamp).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '';

                    return (
                      <View key={idx} style={styles.timelineItem}>
                        {/* Dot indicator and vertical connecting line */}
                        <View style={styles.nodeColumn}>
                          <View
                            style={[
                              styles.timelineDot,
                              isDelivered && styles.deliveredDot,
                              isNote && styles.noteDot,
                            ]}
                          >
                            <Ionicons
                              name={isDelivered ? 'checkmark' : isNote ? 'document-text' : 'ellipse'}
                              size={isDelivered || isNote ? 12 : 8}
                              color="#FFFFFF"
                            />
                          </View>
                          {idx < trackingData.checkpoints.length - 1 && <View style={styles.verticalLine} />}
                        </View>

                        {/* Content column */}
                        <View style={styles.timelineDetails}>
                          <View style={styles.activityRow}>
                            <Text style={styles.timelineActivity}>{cp.activity}</Text>
                            {isNote && (
                              <View style={styles.noteBadge}>
                                <Text style={styles.noteBadgeText}>Operations Note</Text>
                              </View>
                            )}
                          </View>

                          <View style={styles.metaRow}>
                            {cp.location ? (
                              <Text style={styles.timelineLocation}>
                                <Ionicons name="location-outline" size={12} color={COLORS.textMuted} /> {cp.location}
                              </Text>
                            ) : null}
                            <Text style={styles.timelineTime}>{formattedDate}</Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
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
  topHeader: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  appSub: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    marginTop: 16,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  clearBtn: {
    padding: 6,
  },
  trackActionBtn: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    marginLeft: 6,
  },
  trackActionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  errorCard: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.danger,
  },
  errorDesc: {
    fontSize: 13,
    color: '#7F1D1D',
    marginTop: 2,
    lineHeight: 18,
  },
  resultsContainer: {
    marginTop: 10,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 16,
  },
  trackingHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  trackingLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  numberWithCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  trackingNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  hawbSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 14,
    paddingHorizontal: 8,
  },
  routeNode: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '42%',
  },
  routeText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 6,
  },
  routeLine: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.border,
    marginHorizontal: 10,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 4,
  },
  progressPercent: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'right',
    marginTop: 4,
    fontWeight: '600',
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  gridCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  gridCardTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  carrierName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  fwdNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  fwdNumber: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: '700',
  },
  noFwdText: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  },
  externalLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  externalLinkText: {
    fontSize: 11,
    color: COLORS.accent,
    fontWeight: '700',
  },
  cargoWeight: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  cargoPieceCount: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: '700',
    marginTop: 2,
  },
  cargoSubText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  accordionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  accordionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  accordionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  boxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  boxBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  boxBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accent,
  },
  boxDims: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  boxWeights: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  boxItemDesc: {
    fontSize: 11,
    color: COLORS.accentHover,
    marginTop: 2,
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  timelineHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  timelineSub: {
    fontSize: 11,
    color: COLORS.muted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  emptyCheckpoints: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyCheckpointsText: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 8,
  },
  timelineList: {
    paddingLeft: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  nodeColumn: {
    alignItems: 'center',
    width: 28,
  },
  timelineDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliveredDot: {
    backgroundColor: COLORS.success,
  },
  noteDot: {
    backgroundColor: '#2563EB',
  },
  verticalLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginTop: 4,
    marginBottom: -4,
  },
  timelineDetails: {
    flex: 1,
    marginLeft: 10,
    paddingBottom: 4,
  },
  activityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  timelineActivity: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 18,
  },
  noteBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  noteBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  timelineLocation: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  timelineTime: {
    fontSize: 11,
    color: COLORS.muted,
  },
});
