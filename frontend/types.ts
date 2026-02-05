
export enum DocumentType {
  NATIONAL_ID = 'National ID',
  PASSPORT = 'Passport',
  DRIVING_LICENSE = 'Driving License',
  BIRTH_CERTIFICATE = 'Birth Certificate',
  SCHOOL_LEAVING_CERTIFICATE = 'School Leaving Certificate',
  OTHER = 'Other'
}

export interface PrivacyPreferences {
  numberDisplay: 'hidden' | 'partial';
  imageDisplay: 'hidden' | 'blurred';
}

export interface LostDocument {
  id: string;
  name: string;
  type: DocumentType;
  documentNumber: string; // The full number is stored for search matching
  finderName: string;
  finderPhone?: string;
  finderPhoneEncrypted?: string;
  finderPhoneLast4?: string;
  locationFound: string;
  lat?: number;
  lng?: number;
  imageUrl?: string;
  createdAt: number;
  privacy: PrivacyPreferences;
  status?: 'active' | 'claimed' | 'removed';
}

export interface ExtractionResult {
  name: string;
  type: DocumentType;
  documentNumber: string;
}

export interface DocumentAlert {
  id: string;
  documentNumber: string;
  type: DocumentType | 'All';
  label: string;
  userId?: string;
  createdAt: number;
  isMatched?: boolean;
}

export interface Feedback {
  docId: string;
  rating: number;
  isHelpful: boolean;
  comment?: string;
  timestamp: number;
}
