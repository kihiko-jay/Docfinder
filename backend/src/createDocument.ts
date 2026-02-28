import { onCall } from "firebase-functions/v2/https";
import { db } from "./firebase.js";
import { encryptText } from "./utils/encryption.js";
import { requireField } from "./utils/validation.js";

export const createDocument = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new Error("Unauthenticated");
  }

  const data = request.data || {};
  const id = requireField(data.id, "id");
  const name = requireField(data.name, "name");
  const type = requireField(data.type, "type");
  const documentNumber = requireField(data.documentNumber, "documentNumber");
  const finderName = requireField(data.finderName, "finderName");
  const finderPhone = requireField(data.finderPhone, "finderPhone");
  const locationFound = requireField(data.locationFound, "locationFound");
  const createdAt = requireField(data.createdAt, "createdAt");
  const privacy = requireField(data.privacy, "privacy");

  const imageUrl = data.imageUrl || null;
  const lat = data.lat || null;
  const lng = data.lng || null;

  const finderPhoneEncrypted = encryptText(finderPhone);
  const finderPhoneLast4 = finderPhone.toString().slice(-4);

  await db.collection("documents").doc(id).set({
    id,
    name,
    type,
    documentNumber,
    finderName,
    finderPhoneEncrypted,
    finderPhoneLast4,
    locationFound,
    lat,
    lng,
    imageUrl,
    createdAt,
    privacy,
    status: "active",
    reporterId: request.auth.uid,
  });

  return { id };
});
