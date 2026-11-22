# NetPack Logistics - Mobile Monorepo (React Native / Expo)

Cross-platform native mobile applications for **NetPack Logistics**:
1. **Customer App** (`apps/customer`): Live consignment tracking, booking requests, shipment history, and customer profile.
2. **Rider App** (`apps/rider`): Real-time field pickup queue, turn-by-turn navigation, high-speed camera barcode scanner, and scale weighing proof upload.
3. **Shared Core** (`packages/shared`): Unified API client, TypeScript definitions, status configurations, and brand design tokens.

---

## 📁 Monorepo Structure

```
netpack-mobile/
├── package.json                   # Monorepo workspace configuration
├── eas.json                       # 1-click cloud build setup (Android APK/AAB & iOS IPA)
├── README.md                      # Documentation & instructions
│
├── packages/
│   └── shared/                    # Shared library
│       ├── src/
│       │   ├── api.ts             # Complete NetPack Python API client
│       │   ├── constants.ts       # Theme colors, statuses, API URLs
│       │   ├── types.ts           # Customer, Rider, Tracking, and Cargo types
│       │   └── index.ts
│       └── package.json
│
└── apps/
    ├── customer/                  # NetPack Customer App
    │   ├── src/
    │   │   ├── context/           # Customer Authentication & Token Storage
    │   │   ├── navigation/        # Bottom Tabs & Stacks
    │   │   └── screens/
    │   │       ├── auth/          # Login (Password & 6-digit OTP code), Register
    │   │       └── main/          # Live Tracking, My Shipments, Booking, Profile
    │   ├── app.json               # Expo & iOS/Android configuration
    │   └── package.json
    │
    └── rider/                     # NetPack Rider App
        ├── src/
        │   ├── context/           # Rider Authentication & Session
        │   ├── navigation/        # Duty Tabs & Task Stacks
        │   └── screens/
        │       ├── auth/          # Rider Duty Login
        │       └── main/          # Pickup Queue, GPS Nav, Barcode Scanner, Weighing
        ├── app.json
        └── package.json
```

---

## 🚀 Quick Start (Running with Expo Go)

You can run both apps on your physical phone (iOS or Android) using the **Expo Go** app without setting up Android Studio or Xcode!

### Prerequisites
- Node.js (v18+)
- Install Expo CLI globally if not already installed:
  ```bash
  npm install -g expo-cli eas-cli
  ```

---

### 1. Run the Customer App

```bash
# 1. Navigate to customer app
cd "netpack-mobile/apps/customer"

# 2. Install dependencies
npm install

# 3. Start Expo development server
npx expo start
```
* **To open on Android**: Scan the QR code shown in terminal using the **Expo Go** app on your Android phone, or press `a` for Android Emulator.
* **To open on iPhone**: Scan the QR code using the **Camera app** on your iPhone, and tap the prompt to open in **Expo Go**, or press `i` for iOS Simulator.

---

### 2. Run the Rider App

```bash
# 1. Navigate to rider app
cd "netpack-mobile/apps/rider"

# 2. Install dependencies
npm install

# 3. Start Expo development server
npx expo start
```
* High-speed barcode scanning and scale photo capture work immediately through native iOS/Android camera hardware!

---

## 🌐 Connecting to Your Backend

Both apps automatically default to your cloud backend (`https://netpackintegration.vercel.app`).

### Testing with Localhost / Local Python Server:
If you are running the backend locally (`python -m uvicorn main:app --port 8000`):
1. In the mobile app, go to **Profile > Backend Server Settings**.
2. Update the URL to your computer's local Wi-Fi IP address (e.g. `http://192.168.1.50:8000`) or `http://10.0.2.2:8000` on Android Emulator.
3. Tap **Apply Server URL**.

---

## 📱 Building Standalone Apps for App Store & Google Play

Using **Expo Application Services (EAS)**, you can compile native release binaries directly in the cloud (no Mac required for iOS builds!):

### 1. Log in to Expo
```bash
npx eas login
```

### 2. Build Android APK / Play Store AAB
```bash
# To generate a testable Android APK (Direct install on any phone):
cd apps/customer  # (or apps/rider)
npx eas build -p android --profile preview

# To generate a production Google Play Store AAB:
npx eas build -p android --profile production
```

### 3. Build Apple App Store IPA
```bash
cd apps/customer  # (or apps/rider)
npx eas build -p ios --profile production
```

---

## 🔒 Security & Native Features
- **Token Security**: Tokens are saved in hardware-backed secure storage via `expo-secure-store`.
- **Barcode & QR Scanning**: Native Camera API (`expo-camera`) with real-time frame scanning.
- **GPS Navigation**: 1-click launch into native Google Maps or Apple Maps with turn-by-turn route directions.
- **Camera Weighing Proofs**: Multi-part scale photo upload directly synced to Python backend uploads directory.
