# Glimmer Quest - iOS Build Guide

## Prerequisites
- Mac computer with macOS 12+ (Monterey or later)
- Xcode 14+ installed from Mac App Store
- Apple Developer Account ($99/year for App Store distribution)
- CocoaPods installed (`sudo gem install cocoapods`)

## Quick Start

### 1. Download the Code
Use "Save to GitHub" in Emergent, then clone the repo to your Mac:
```bash
git clone https://github.com/YOUR_USERNAME/glimmer-quest.git
cd glimmer-quest/frontend
```

### 2. Install Dependencies
```bash
# Install Node.js dependencies
yarn install

# Build the web app
yarn build

# Sync to iOS
npx cap sync ios
```

### 3. Install CocoaPods Dependencies
```bash
cd ios/App
pod install
cd ../..
```

### 4. Open in Xcode
```bash
npx cap open ios
```
This opens the project in Xcode.

### 5. Configure Signing
1. In Xcode, select the "App" project in the navigator
2. Select the "App" target
3. Go to "Signing & Capabilities" tab
4. Select your Team (Apple Developer account)
5. Xcode will automatically manage provisioning profiles

### 6. Add App Icons
Replace the placeholder icons in:
`ios/App/App/Assets.xcassets/AppIcon.appiconset/`

Required sizes for iOS:
- 20x20 (2x, 3x) - Notification
- 29x29 (2x, 3x) - Settings
- 40x40 (2x, 3x) - Spotlight
- 60x60 (2x, 3x) - App Icon
- 76x76 (1x, 2x) - iPad
- 83.5x83.5 (2x) - iPad Pro
- 1024x1024 - App Store

**Tip**: Use https://appicon.co to generate all sizes from one 1024x1024 image.

### 7. Test on Simulator
1. Select a simulator (e.g., "iPhone 15 Pro")
2. Click the Play button (▶) or press Cmd+R
3. App will build and launch in simulator

### 8. Test on Physical Device
1. Connect iPhone via USB
2. Select your device in the device dropdown
3. Trust the developer on your iPhone (Settings > General > Device Management)
4. Click Play to build and install

## App Store Submission

### 1. Create App in App Store Connect
1. Go to https://appstoreconnect.apple.com
2. My Apps > + > New App
3. Fill in:
   - Platform: iOS
   - Name: Glimmer Quest
   - Bundle ID: com.glimmerquest.game
   - SKU: glimmerquest001
   - Primary Language: English

### 2. Archive the App
1. In Xcode, select "Any iOS Device" as target
2. Product > Archive
3. Wait for archive to complete

### 3. Upload to App Store
1. In Organizer window, select your archive
2. Click "Distribute App"
3. Select "App Store Connect"
4. Follow prompts to upload

### 4. Submit for Review
1. In App Store Connect, go to your app
2. Fill in all metadata:
   - Description
   - Keywords
   - Screenshots (6.5" and 5.5" required)
   - Privacy Policy URL
   - Support URL
3. Select the uploaded build
4. Submit for Review

## Common Issues

### "Signing Requires a Development Team"
- Sign in to Xcode with your Apple ID (Xcode > Preferences > Accounts)
- Select your team in Signing & Capabilities

### "Could not find 'pod'"
```bash
sudo gem install cocoapods
cd ios/App && pod install
```

### Build Fails with Module Errors
```bash
# Clean and rebuild
cd ios/App
pod deintegrate
pod install
cd ../..
npx cap sync ios
```

### Capacitor Plugin Issues
```bash
npx cap update ios
```

## Project Structure
```
ios/
├── App/
│   ├── App/
│   │   ├── AppDelegate.swift      # App entry point
│   │   ├── Info.plist             # App configuration
│   │   ├── Assets.xcassets/       # Icons & images
│   │   └── public/                # Web assets (auto-synced)
│   ├── App.xcodeproj/             # Xcode project
│   └── Podfile                    # CocoaPods dependencies
```

## AdMob Setup for iOS

1. Create AdMob account at https://admob.google.com
2. Add iOS app in AdMob
3. Get your App ID (ca-app-pub-XXXXXXXX~XXXXXXXXXX)
4. Add to Info.plist:
```xml
<key>GADApplicationIdentifier</key>
<string>ca-app-pub-XXXXXXXX~XXXXXXXXXX</string>
<key>SKAdNetworkItems</key>
<array>
  <dict>
    <key>SKAdNetworkIdentifier</key>
    <string>cstr6suwn9.skadnetwork</string>
  </dict>
</array>
```

## Version Bumping
Before each App Store submission, update in Info.plist:
- `CFBundleShortVersionString`: User-visible version (1.0.0, 1.1.0, etc.)
- `CFBundleVersion`: Build number (1, 2, 3, etc.)

---

**Need Help?** 
- Capacitor Docs: https://capacitorjs.com/docs/ios
- Apple Developer Docs: https://developer.apple.com/documentation/
