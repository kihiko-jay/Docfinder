import { onCall } from "firebase-functions/v2/https";
import { db } from "./firebase.js";
import { decryptText } from "./utils/encryption.js";
import { requireField } from "./utils/validation.js";

export const getContact = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new Error("Unauthenticated");
  }

  const documentId = requireField(request.data?.documentId, "documentId");

  const unlockQuery = await db
    .collection("unlocked_contacts")
    .where("userId", "==", request.auth.uid)
    .where("documentId", "==", documentId)
    .limit(1)
    .get();

  if (unlockQuery.empty) {
    throw new Error("Not authorized");
  }

  const docSnap = await db.collection("documents").doc(documentId).get();
  if (!docSnap.exists) {
    throw new Error("Document not found");
  }

  const data = docSnap.data();
  const encryptedPhone = data?.finderPhoneEncrypted;
  if (!encryptedPhone) {
    throw new Error("Contact info unavailable");
  }

  const finderPhone = decryptText(encryptedPhone);
  return { finderPhone };
});
