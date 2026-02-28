/**
 * Document extraction using open-source OCR (Tesseract.js) and image preprocessing (sharp).
 * Parses Kenyan ID/passport-style documents for: name, type, documentNumber.
 * Expected OCR patterns: "Name:", "Full name", "ID No.", "Passport No.", "Document type", etc.
 * Note: OpenCV WASM can be added later for advanced preprocessing (deskew, advanced denoising).
 */
import { onCall } from "firebase-functions/v2/https";
import { requireField } from "./utils/validation.js";
import sharp from "sharp";
import { createWorker } from "tesseract.js";

// Match frontend DocumentType enum values
const DOCUMENT_TYPES = [
  "National ID",
  "Passport",
  "Driving License",
  "Birth Certificate",
  "School Leaving Certificate",
  "Other",
] as const;
type DocumentTypeValue = (typeof DOCUMENT_TYPES)[number];

const TYPE_KEYWORDS: { keywords: string[]; type: DocumentTypeValue }[] = [
  { keywords: ["national id", "national id card", "identity card", "id number"], type: "National ID" },
  { keywords: ["passport", "passport no", "passport number"], type: "Passport" },
  { keywords: ["driving licence", "driving license", "dl no"], type: "Driving License" },
  { keywords: ["birth certificate", "birth cert"], type: "Birth Certificate" },
  { keywords: ["school leaving", "kcse", "leaving certificate", "secondary"], type: "School Leaving Certificate" },
];

function detectDocumentType(text: string): DocumentTypeValue {
  const lower = text.toLowerCase();
  for (const { keywords, type } of TYPE_KEYWORDS) {
    if (keywords.some((k) => lower.includes(k))) return type;
  }
  return "Other";
}

// Kenyan ID: often digits and letters; passport: alphanumeric. Match sequences that look like doc numbers.
const DOC_NUMBER_PATTERNS = [
  /\b(?:id|passport|document)\s*no\.?\s*:?\s*([A-Z0-9\s\-]{6,})\b/i,
  /\b([0-9]{6,})\s*(?:[\s\-]\s*[0-9])?\b/,
  /\b([A-Z]{1,2}[0-9]{6,}[A-Z0-9]*)\b/,
];

function extractDocumentNumber(text: string): string {
  for (const re of DOC_NUMBER_PATTERNS) {
    const m = text.match(re);
    if (m) {
      const candidate = (m[1] ?? m[0]).replace(/\s+/g, "").trim();
      if (candidate.length >= 5) return candidate;
    }
  }
  return "";
}

// Name: often after "Name", "Full name", "Surname", or the longest line that looks like a name (letters/spaces, no digits).
const NAME_LABELS = /(?:full\s+)?name|surname|first\s+name|second\s+name/i;
const NAME_AFTER_LABEL = new RegExp(`${NAME_LABELS.source}\\s*:?\\s*([A-Za-z\\s'-]+?)(?=\\n|$)`, "i");

function extractName(text: string): string {
  const byLabel = text.match(NAME_AFTER_LABEL);
  if (byLabel) {
    const name = byLabel[1].trim();
    if (name.length >= 2 && !/^\d+$/.test(name)) return name;
  }
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let best = "";
  for (const line of lines) {
    if (line.length < 3 || line.length > 80) continue;
    if (/^\d+$/.test(line) || /^[A-Z0-9\s\-]{10,}$/.test(line)) continue; // skip number-only or ID-like lines
    if (/^[A-Za-z\s'-]+$/.test(line) && line.length > best.length) best = line;
  }
  return best || "";
}

export const extractDocument = onCall({ cors: true }, async (request) => {
  const base64Image = requireField(request.data?.base64Image, "base64Image");
  const rawBase64 = base64Image.includes(",") ? base64Image.split(",")[1]! : base64Image;
  const inputBuffer = Buffer.from(rawBase64, "base64");

  // Preprocess with sharp: resize for consistent OCR, grayscale, normalize contrast
  const preprocessed = await sharp(inputBuffer)
    .resize({ width: 1200, withoutEnlargement: true })
    .grayscale()
    .normalize()
    .png()
    .toBuffer();

  const worker = await createWorker("eng");
  try {
    const { data } = await worker.recognize(preprocessed);
    const text = data.text || "";
    await worker.terminate();

    const name = extractName(text) || "Unknown";
    const type = detectDocumentType(text);
    const documentNumber = extractDocumentNumber(text) || "";

    return { name, type, documentNumber };
  } catch (err) {
    await worker.terminate();
    throw new Error("Document extraction failed. Please try a clearer photo.");
  }
});
