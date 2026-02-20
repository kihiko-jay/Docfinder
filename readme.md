# 🇰🇪 Kenya Lost & Found ID System

A community-driven, AI-powered platform designed to simplify the process of recovering lost Identification Cards (ID), Passports, Driving Licenses, and other vital documents in Kenya.

## 🚀 How It Works

The system operates on community trust and advanced AI technology to reconnect document owners with finders safely and quickly.

### 1. For Finders (Reporting a Document)
- **AI Scanning:** Simply snap a photo of the found document. Our integrated **open-source OCR technology** automatically extracts the owner's name and document type while masking sensitive digits for privacy.
- **Privacy Controls:** Finders choose how the document appears publicly (e.g., blurring the photo or hiding the full document number).
- **Precise Location:** Use the interactive map to pin the exact location where the document was found.
- **Instant Reporting:** Once contact details are provided, the report is posted immediately to help the owner.

### 2. For Owners (Searching for Documents)
- **Instant Search:** Search by your name or document number.
- **Privacy-First Results:** You'll see partial document numbers (e.g., `•••• 5678`) to confirm it's yours without exposing your full identity.
- **Tiered Recovery Fee:** To view the finder's contact details, a small recovery fee is required:
  - **KES 100:** Identity Cards and Driving Licenses.
  - **KES 500:** Passports and School Leaving Certificates.
  This helps maintain the platform and verify legitimate recovery attempts.
- **Safe Recovery:** Once unlocked, view the finder's contact details and precise location on a map to arrange for a safe collection.

### 3. Community Features
- **No Sign-up Required:** We prioritize accessibility. No accounts or passwords are needed to help or be helped.
- **Social Sharing:** Easily share found document reports to WhatsApp or Twitter to help spread the word.

## 💾 Where is Data Saved?

Currently, for this version of the application:
- **Client-Side Storage:** All reported documents, active alerts, and user preferences are stored in your browser's **Local Storage** (`localStorage`). 
- **Payment History:** The record of which documents you have unlocked is also stored locally on your device. Clearing your browser cache may result in losing access to previously unlocked contacts.
- **Privacy:** Sensitive document photos are processed by AI in real-time and are not stored permanently on our servers.

## 🛡️ Privacy & Security
- **Data Masking:** Full document numbers are never displayed to the public. We only show the last 4 digits to the owner for verification.
- **Secure Payments:** We support **M-Pesa** and **Stripe**. We do not store your credit card details, M-Pesa PINs, or any sensitive financial information on our platform. All transactions are processed through secure, industry-standard gateways.
- **No Tracking:** We do not use third-party tracking cookies or sell user data to advertisers.
- **Finder Privacy:** Finder phone numbers are encrypted and hidden behind a paywall to prevent spam and ensure that only individuals genuinely looking for their documents can access contact info.

## 🛠️ Tech Stack
- **Frontend:** React 19, Vite, Tailwind CSS
- **Backend:** Firebase Functions (Node.js)
- **Database:** Cloud Firestore
- **Intelligence:** OpenCV WASM + Tesseract.js (Open-source OCR for Document Extraction)
- **Maps:** Leaflet.js & OpenStreetMap
- **Payments:** M-Pesa & Stripe Integration
- **Icons:** FontAwesome 6

## 📁 Project Structure

```
kenya-lost-&-found-id-system/
├── frontend/              # React frontend application
│   ├── src/              # Source files
│   ├── components/       # React components
│   ├── public/           # Static assets
│   ├── index.html        # Entry HTML
│   ├── package.json      # Frontend dependencies
│   └── vite.config.ts    # Vite configuration
├── backend/              # Firebase Cloud Functions
│   ├── src/             # Function source code
│   ├── package.json     # Backend dependencies
│   └── tsconfig.json    # TypeScript config
├── firebase.json        # Firebase configuration
├── firestore.rules      # Firestore security rules
├── storage.rules        # Storage security rules
└── package.json         # Root-level scripts
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18 or higher
- npm or yarn
- Firebase CLI (for deployment)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd kenya-lost-&-found-id-system
```

2. Install dependencies for both frontend and backend:
```bash
npm run install:all
```

3. Set up environment variables:
   - Copy `.env.example` to `.env` in the root directory (see `.env.example` for all required keys: Firebase `VITE_*`, Stripe, M-Pesa, and backend keys for local Functions).
   - Add your API keys and config values. The same `.env` is used by the frontend and by the backend when running the Functions emulator.

### Development

**Run frontend only:**
```bash
npm run dev
# or
npm run dev:frontend
```

**Run backend functions locally:**
```bash
npm run dev:backend
```

**Build for production:**
```bash
npm run build
```

### Deployment

**Deploy everything (functions + hosting):**
```bash
npm run deploy
```

**Deploy only functions:**
```bash
npm run deploy:functions
```

**Deploy only frontend:**
```bash
npm run deploy:frontend
```

---
*Developed to help Kenyans reduce the bureaucratic headache of document replacement through secure, community-supported recovery.*