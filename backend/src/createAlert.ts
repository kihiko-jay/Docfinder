import { onCall } from "firebase-functions/v2/https";
import { db } from "./firebase.js";
import { requireField } from "./utils/validation.js";

export const createAlert = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new Error("Unauthenticated");
  }

  const data = request.data || {};
  const documentNumber = requireField(data.documentNumber, "documentNumber");
  const type = requireField(data.type, "type");
  const label = requireField(data.label, "label");
  const createdAt = requireField(data.createdAt, "createdAt");

  const alertRef = db.collection("alerts").doc();
  await alertRef.set({
    id: alertRef.id,
    documentNumber,
    type,
    label,
    createdAt,
    userId: request.auth.uid,
    isMatched: false,
  });

  return { id: alertRef.id };
});
