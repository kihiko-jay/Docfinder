import { onCall } from "firebase-functions/v2/https";
import { db } from "./firebase.js";
import { requireField } from "./utils/validation.js";

export const createFeedback = onCall(async (request) => {
  if (!request.auth) {
    throw new Error("Unauthenticated");
  }

  const data = request.data || {};
  const docId = requireField(data.docId, "docId");
  const rating = requireField(data.rating, "rating");
  const isHelpful = requireField(data.isHelpful, "isHelpful");
  const timestamp = requireField(data.timestamp, "timestamp");

  await db.collection("feedback").add({
    docId,
    rating,
    isHelpful,
    timestamp,
    userId: request.auth.uid,
  });
});
