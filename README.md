# Coin Rush v2 — Android starter project

## What's included
- Mobile-friendly arcade game in `www/index.html`
- Local wallet, best score, daily mission, cosmetic shop and ship skins
- Capacitor project configuration for generating an Android Studio project
- Explicit demo-only reward button (not a real ad; no revenue is generated)

## What you need
- Node.js LTS and npm
- Android Studio with Android SDK
- A Google Play Console developer account to publish publicly (Google may charge a registration fee; confirm current terms before launch)
- For real monetization: a supported mobile ads SDK/account and Google Play Billing integration

## Build Android locally
1. Install Node.js LTS and Android Studio.
2. Extract this folder and open a terminal in this folder.
3. Run `npm install`.
4. Run `npx cap add android` (only once).
5. Run `npx cap sync android`.
6. Run `npx cap open android`.
7. In Android Studio, test on an emulator/device, then use Build > Generate Signed Bundle / APK to create a signed Android App Bundle (AAB) for Play Console.

If `android/` already exists, skip step 4 and run `npx cap sync android`.

## Monetization roadmap (not connected in this prototype)
1. **Ads:** Integrate Google Mobile Ads SDK through a maintained Capacitor-compatible plugin or native Android code. Use test ad unit IDs during development. Add banner/interstitial ads only where they do not interrupt play, and optional rewarded ads with a server/client verification strategy. Never grant rewarded items just because a button was tapped; wait for the SDK's earned-reward callback.
2. **In-app purchases:** Use Google Play Billing for non-consumable cosmetic packs or consumable coin packs. Validate purchases and handle refunds/revocations; do not ship a fake checkout.
3. **Privacy/compliance:** Publish a privacy policy, complete Play Console Data safety and ads declarations, use age-appropriate settings, and comply with consent requirements applicable to users/regions. Avoid collecting personal data unless needed.
4. **Release:** Test on real Android devices, provide screenshots/icon/store listing, complete Play Console testing requirements, and upload a signed AAB.

## Revenue reality check
$100/day is a target, not a guarantee. Example only: at $5 per 1,000 ad impressions, $100 requires about 20,000 ad impressions/day before fees and expenses. Actual ad rates and fill vary by country, format, retention, and season. Track daily active users, sessions/user, retention, impressions/user, ARPDAU, purchase conversion, and acquisition costs.

## Current prototype limitations
- Progress is saved in local browser/app storage and can be modified by a user.
- No account/cloud save, multiplayer, analytics, live leaderboard, real ads, or real purchase flow.
- The daily mission is device-local and is not cheat-resistant.
