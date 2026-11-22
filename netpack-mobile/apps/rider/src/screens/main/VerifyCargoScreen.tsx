import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { NetPackApi, PickupTask, COLORS } from '@netpack/shared';
import { Ionicons } from '@expo/vector-icons';

export const VerifyCargoScreen = ({ route, navigation }: any) => {
  const pickup: PickupTask = route.params?.pickup;

  const [actualWeight, setActualWeight] = useState(pickup?.weight ? String(pickup.weight) : '');
  const [boxCount, setBoxCount] = useState(pickup?.noOfBox ? String(pickup.noOfBox) : '1');
  const [length, setLength] = useState('30');
  const [breadth, setBreadth] = useState('20');
  const [height, setHeight] = useState('20');
  const [notes, setNotes] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera permission is required to capture weighing scale proof photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handlePickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    const weightVal = parseFloat(actualWeight);
    if (isNaN(weightVal) || weightVal <= 0) {
      Alert.alert('Required', 'Please enter a valid verified weight in kg.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('weight', String(weightVal));
      formData.append('noOfBox', boxCount || '1');
      formData.append('length', length || '30');
      formData.append('breadth', breadth || '20');
      formData.append('height', height || '20');
      if (notes.trim()) {
        formData.append('notes', notes.trim());
      }

      if (imageUri) {
        const filename = imageUri.split('/').pop() || 'scale_proof.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        formData.append('file', {
          uri: imageUri,
          name: filename,
          type,
        } as any);
      }

      await NetPackApi.submitPickupAndWeigh(pickup.id, formData);
      Alert.alert(
        'Cargo Verified!',
        `Consignment ${pickup.trackingNumber} weight and dimensions verified successfully. Status is now updated to Weight & Dimensions Verified.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.popToTop(),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Verification Error', err.message || 'Could not submit verified weight.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Weigh & Verify Cargo</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Tracking Reference */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>CONSIGNMENT</Text>
          <Text style={styles.trackingNum}>{pickup?.trackingNumber || 'Active Parcel'}</Text>
          <Text style={styles.subText}>Shipper: {pickup?.senderName}</Text>
        </View>

        {/* Weight & Boxes */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>MEASURED WEIGHT & CARTONS</Text>

          <Text style={styles.label}>Verified Scale Weight (kg) *</Text>
          <TextInput
            style={[styles.input, styles.highlightInput]}
            placeholder="e.g. 21.0"
            placeholderTextColor={COLORS.muted}
            keyboardType="decimal-pad"
            value={actualWeight}
            onChangeText={setActualWeight}
          />

          <Text style={styles.label}>Total Verified Cartons / Boxes *</Text>
          <TextInput
            style={styles.input}
            placeholder="1"
            placeholderTextColor={COLORS.muted}
            keyboardType="number-pad"
            value={boxCount}
            onChangeText={setBoxCount}
          />

          <Text style={styles.label}>Standard Dimensions (L x B x H in cm)</Text>
          <View style={styles.dimRow}>
            <View style={styles.dimCol}>
              <Text style={styles.dimLbl}>Length</Text>
              <TextInput
                style={styles.input}
                placeholder="60"
                keyboardType="decimal-pad"
                value={length}
                onChangeText={setLength}
              />
            </View>
            <View style={styles.dimCol}>
              <Text style={styles.dimLbl}>Breadth</Text>
              <TextInput
                style={styles.input}
                placeholder="40"
                keyboardType="decimal-pad"
                value={breadth}
                onChangeText={setBreadth}
              />
            </View>
            <View style={styles.dimCol}>
              <Text style={styles.dimLbl}>Height</Text>
              <TextInput
                style={styles.input}
                placeholder="40"
                keyboardType="decimal-pad"
                value={height}
                onChangeText={setHeight}
              />
            </View>
          </View>
        </View>

        {/* Photo Proof Capture */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>SCALE WEIGHT PROOF PHOTO</Text>
          <Text style={styles.helperText}>
            Capture a clear photo of the weighing scale and carton label:
          </Text>

          {imageUri ? (
            <View style={styles.previewContainer}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
              <TouchableOpacity style={styles.retakeBtn} onPress={() => setImageUri(null)}>
                <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
                <Text style={styles.retakeText}>Remove / Retake</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.photoActionsRow}>
              <TouchableOpacity style={styles.photoBtnPrimary} onPress={handleTakePhoto}>
                <Ionicons name="camera" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.photoBtnText}>Capture Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.photoBtnSecondary} onPress={handlePickFromGallery}>
                <Ionicons name="images-outline" size={20} color={COLORS.text} style={{ marginRight: 6 }} />
                <Text style={styles.photoBtnSecondaryText}>Choose Gallery</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={[styles.label, { marginTop: 14 }]}>Operations Notes (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Verified by rider on electronic platform scale"
            placeholderTextColor={COLORS.muted}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, isSubmitting && styles.disabledBtn]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitBtnText}>Submit Verified Weight & Sync Hub</Text>
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
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  trackingNum: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  subText: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 12,
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
  highlightInput: {
    fontSize: 20,
    fontWeight: '800',
    color: '#059669',
    borderColor: '#059669',
  },
  dimRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dimCol: {
    flex: 1,
  },
  dimLbl: {
    fontSize: 11,
    color: COLORS.muted,
    marginBottom: 4,
  },
  photoActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  photoBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    height: 48,
    borderRadius: 12,
  },
  photoBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  photoBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  photoBtnSecondaryText: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 13,
  },
  previewContainer: {
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.danger,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
    gap: 4,
  },
  retakeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: '#059669',
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#059669',
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
    fontWeight: '800',
  },
});
